#!/usr/bin/env python3
"""인스타그램 발행 실행기 — 파이프라인 6단계.

Claude 는 이 스크립트에 관여하지 않는다. 실행은 GitHub Actions 가 하고,
토큰은 repo secrets 에 있어 Claude 세션에서는 읽을 수 없다.
로컬에서는 `--dry-run` 으로만 돌아간다 (아래 _guard 참고).

  python3 scripts/publish.py --dry-run              오늘 발행 대상 확인
  python3 scripts/publish.py --mode preview --dry-run  내일 발행 예정 확인
  python3 scripts/publish.py                        실제 발행 (CI 전용)

집행 조건 — 셋 다 만족해야 발행한다:
  1. status == 'scheduled'
  2. scheduled_at 날짜가 오늘(KST) 이하
  3. published_at 이 비어 있음
"""

import argparse
import glob
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
IDEAS = 'pipeline/ideas/*.json'
HISTORY = 'pipeline/history.md'
API = 'https://graph.instagram.com/v21.0'
IG_USER_ID = '27912529765074918'

# 요일별 슬롯 — 발행 대상을 고르는 데는 쓰지 않는다 (그건 scheduled_at 이 정한다).
# "오늘 ClipNote 슬롯인데 대기 건 없음" 알림 문구를 만드는 데만 쓴다.
CADENCE = {0: 'clipnote', 1: 'takeaseat', 3: 'takeaseat', 4: 'clipnote'}

# 배정일이 오늘보다 이만큼 이상 지나면 발행하지 않고 stale 처리한다.
STALE_AFTER_DAYS = 2

TOKEN = os.environ.get('IG_ACCESS_TOKEN', '')


# ── 출력 ──────────────────────────────────────────────────────────

def mask(s):
    return s.replace(TOKEN, '[TOKEN]') if TOKEN else s


def log(msg):
    print(mask(str(msg)), flush=True)


def summary(md):
    path = os.environ.get('GITHUB_STEP_SUMMARY')
    if path:
        with open(path, 'a', encoding='utf-8') as f:
            f.write(mask(md) + '\n')
    log(md)


def notify(text, level='info'):
    """Slack 알림. webhook 이 없으면 로그·요약으로만 남긴다."""
    icon = {'info': 'ℹ️', 'warn': '⚠️', 'error': '🚨'}[level]
    summary(f'{icon} {text}')
    hook = os.environ.get('SLACK_WEBHOOK_URL', '')
    if not hook:
        return
    body = json.dumps({'text': f'{icon} *[pikaworks SNS]* {mask(text)}'}).encode()
    req = urllib.request.Request(
        hook, data=body, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        urllib.request.urlopen(req, timeout=20).read()
    except Exception as e:                        # 알림 실패가 발행을 막지는 않는다
        log(f'slack 알림 실패 (무시): {type(e).__name__}')


# ── 상태 파일 ─────────────────────────────────────────────────────

def load_ideas():
    out = []
    for path in sorted(glob.glob(IDEAS)):
        with open(path, encoding='utf-8') as f:
            out.append((path, json.load(f)))
    return out


def save_idea(path, idea):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(idea, f, ensure_ascii=False, indent=2)
        f.write('\n')


def as_date(value):
    """'2026-08-27' 또는 '2026-08-27T08:00:00+09:00' → date. 못 읽으면 None."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value)).date()
    except ValueError:
        try:
            return datetime.strptime(str(value)[:10], '%Y-%m-%d').date()
        except ValueError:
            return None


def append_history(idea, today):
    """발행 완료 표 맨 위에 한 줄 추가하고 20건으로 자른다."""
    if not os.path.exists(HISTORY):
        return
    lines = open(HISTORY, encoding='utf-8').read().split('\n')
    try:
        head = lines.index('## 발행 완료 (최근 20건)')
    except ValueError:
        return
    # 표 헤더(| 날짜 |)와 구분선(|---|) 다음 줄이 첫 데이터 행이다
    start = next(i for i in range(head, len(lines)) if lines[i].startswith('|---')) + 1
    end = start
    while end < len(lines) and lines[end].startswith('|'):
        end += 1
    link = idea.get('permalink') or ''
    cell = f'[보기]({link})' if link else '—'
    row = f"| {today:%Y-%m-%d} | {idea['service']} | {idea.get('angle', '')} | {cell} |"
    rows = ([row] + lines[start:end])[:20]
    open(HISTORY, 'w', encoding='utf-8').write(
        '\n'.join(lines[:start] + rows + lines[end:]))


# ── Instagram API ────────────────────────────────────────────────

class IGError(Exception):
    def __init__(self, message, container_id=None):
        super().__init__(message)
        self.container_id = container_id


def call(method, path, params, _attempt=0):
    """레이트리밋(429 / IG code 4·17·32)만 지수 백오프로 재시도한다.

    그 밖의 실패는 재시도하지 않는다 — 실패한 요청도 쿼터를 소모하고,
    컨테이너가 이미 만들어졌는데 재시도하면 중복 발행 위험이 있다.
    """
    data = urllib.parse.urlencode(params).encode()
    url = f'{API}/{path}'
    req = urllib.request.Request(
        url if method == 'POST' else f'{url}?{data.decode()}',
        data=data if method == 'POST' else None, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8', 'replace')
        try:
            code = json.loads(raw).get('error', {}).get('code')
        except ValueError:
            code = None
        if (e.code == 429 or code in (4, 17, 32)) and _attempt < 4:
            wait = 2 ** _attempt * 30            # 30s · 60s · 120s · 240s
            log(f'레이트리밋 (HTTP {e.code} / code {code}) — {wait}s 후 재시도')
            time.sleep(wait)
            return call(method, path, params, _attempt + 1)
        raise IGError(f'Instagram API {e.code} — {mask(raw)[:400]}')


def images_of(idea):
    """발행할 이미지 URL 목록. 캐러셀이면 여러 장, 아니면 한 장."""
    urls = idea.get('image_urls') or ([idea['image_url']] if idea.get('image_url') else [])
    if not urls:
        raise IGError('image_urls 도 image_url 도 비어 있습니다')
    if len(urls) > 10:
        raise IGError(f'이미지가 {len(urls)}장입니다. 캐러셀은 10장까지.')
    return urls


def await_finished(cid, what):
    """컨테이너가 FINISHED 가 될 때까지 최대 2분 기다린다."""
    for _ in range(24):                            # 5s × 24
        state = call('GET', cid, {'fields': 'status_code', 'access_token': TOKEN})
        code = state.get('status_code')
        if code == 'FINISHED':
            return
        if code in ('ERROR', 'EXPIRED'):
            raise IGError(f'{what} 상태 {code}', cid)
        time.sleep(5)
    raise IGError(f'{what} 가 2분 안에 FINISHED 가 되지 않음', cid)


def build_container(idea):
    """발행 직전까지 만든다. 게시는 하지 않는다.

    캐러셀은 자식 컨테이너를 장마다 만든 뒤(is_carousel_item),
    그 id 들을 children 으로 묶은 부모 컨테이너를 만든다.
    캡션은 부모에만 붙는다 — 자식에 붙이면 무시된다.
    """
    urls = images_of(idea)

    if len(urls) == 1:
        cid = call('POST', f'{IG_USER_ID}/media', {
            'image_url': urls[0],
            'caption': idea['caption'],
            'access_token': TOKEN,
        })['id']
        log(f'컨테이너 생성됨: {cid}')
        await_finished(cid, '컨테이너')
        return cid

    children = []
    for i, url in enumerate(urls, 1):
        child = call('POST', f'{IG_USER_ID}/media', {
            'image_url': url,
            'is_carousel_item': 'true',
            'access_token': TOKEN,
        })['id']
        log(f'  자식 {i}/{len(urls)}: {child}')
        children.append(child)

    for i, child in enumerate(children, 1):
        await_finished(child, f'자식 컨테이너 {i}')

    cid = call('POST', f'{IG_USER_ID}/media', {
        'media_type': 'CAROUSEL',
        'children': ','.join(children),
        'caption': idea['caption'],
        'access_token': TOKEN,
    })['id']
    log(f'캐러셀 컨테이너 생성됨: {cid} ({len(urls)}장)')
    await_finished(cid, '캐러셀 컨테이너')
    return cid


def publish_one(idea):
    """컨테이너 → FINISHED 대기 → 발행. media_id, permalink, container_id 를 돌려준다."""
    cid = build_container(idea)
    try:
        published = call('POST', f'{IG_USER_ID}/media_publish',
                         {'creation_id': cid, 'access_token': TOKEN})
        media_id = published['id']
        info = call('GET', media_id, {'fields': 'permalink', 'access_token': TOKEN})
        return media_id, info.get('permalink', ''), cid
    except IGError as e:
        raise IGError(str(e), e.container_id or cid)


# ── 모드 ─────────────────────────────────────────────────────────

def slot_label(day):
    product = CADENCE.get(day.weekday())
    return product or '없음(발행 요일 아님)'


def mode_preview(today, dry):
    """발행 전날 프리뷰 + 빈 큐 알림. 마지막 안전장치."""
    tomorrow = today + timedelta(days=1)
    product = CADENCE.get(tomorrow.weekday())
    summary(f'### 프리뷰 {today:%Y-%m-%d} KST — 내일({tomorrow:%Y-%m-%d}) 슬롯: {slot_label(tomorrow)}')

    if product is None:
        summary('내일은 발행 요일이 아닙니다.')
        return 0

    targets = [i for _, i in load_ideas()
               if i.get('status') == 'scheduled'
               and not i.get('published_at')
               and as_date(i.get('scheduled_at')) == tomorrow]

    if not targets:
        notify(f'내일({tomorrow:%Y-%m-%d}) {product} 슬롯인데 대기 중인 발행 건이 없습니다. '
               f'`/sns-queue` 로 배정하거나 아이디어를 새로 만들어 주세요.', 'warn')
        return 0

    for idea in targets:
        head = idea['caption'].split('\n')[0]
        notify(f"내일 08:00 KST 발행 예정 — *{idea['id']}* ({idea['service']})\n"
               f"앵글: {idea.get('angle', '—')}\n"
               f"이미지: {len(idea.get('image_urls') or [1])}장 — {idea.get('image_url')}\n"
               f"캡션 첫 줄: {head}\n"
               f"취소하려면 상태 파일의 status 를 image_ok 로 되돌리세요.")
    return 0


def mode_verify(today, dry, wanted_id):
    """컨테이너 생성 → FINISHED 확인까지만 하고 발행하지 않는다.

    토큰이 살아 있는지, Meta 가 image_url 을 실제로 가져갈 수 있는지,
    캡션이 통과하는지를 게시물 없이 확인한다. 미사용 컨테이너는 24시간 뒤
    자동으로 만료되므로 뒷정리가 필요 없다.

    상태 파일은 건드리지 않는다 — 이 모드는 아무것도 기록하지 않는다.
    """
    summary(f'### 발행 리허설 {today:%Y-%m-%d} KST')

    ideas = load_ideas()
    if wanted_id:
        match = [(p, i) for p, i in ideas if i.get('id') == wanted_id]
        if not match:
            notify(f'`{wanted_id}` 를 찾을 수 없습니다.', 'error')
            return 1
        path, target = match[0]
    else:
        # id 를 안 주면 오늘 발행됐을 건을 그대로 고른다
        due = [(p, i) for p, i in ideas
               if i.get('status') == 'scheduled' and not i.get('published_at')
               and as_date(i.get('scheduled_at')) and as_date(i['scheduled_at']) <= today]
        if not due:
            notify('오늘 배정된 건이 없습니다. --id <아이디> 로 확인할 건을 직접 지정하세요.', 'warn')
            return 0
        path, target = min(due, key=lambda t: as_date(t[1]['scheduled_at']))

    summary(f"대상: `{target['id']}` ({target['service']}) — {target.get('angle', '')}")
    try:
        urls = images_of(target)
    except IGError as e:
        notify(f"`{target['id']}` — {e}", 'error')
        return 1
    kind = f'캐러셀 {len(urls)}장' if len(urls) > 1 else '단일 이미지'
    summary(f'{kind}')
    for u in urls:
        summary(f'  {u}')
    summary(f"캡션 {len(target['caption'])}자")

    if dry:
        summary('[dry-run] 인스타그램 API 를 호출하지 않고 종료. '
                '실제 확인은 --dry-run 없이 CI 에서 돌려야 합니다.')
        return 0

    try:
        cid = build_container(target)
    except IGError as e:
        notify(f"리허설 실패 — {e}\ncontainer_id: `{e.container_id}`\n"
               f'토큰·이미지 URL·캡션 중 하나에 문제가 있습니다. '
               f'게시물은 올라가지 않았습니다.', 'error')
        return 1

    notify(f"리허설 성공 — `{target['id']}` 는 발행 가능합니다 ({kind}).\n"
           f'토큰 유효, 이미지 URL 전부 접근 가능, 캡션 통과. '
           f'컨테이너 `{cid}` 는 발행하지 않았고 24시간 뒤 만료됩니다.\n'
           f'상태 파일은 바꾸지 않았습니다.')
    return 0


def mode_publish(today, dry, catchup=False):
    """catchup=True 는 같은 날 두 번째 실행이다.

    첫 실행이 이미 올렸으면 대기 건이 없는 게 정상이므로 경고하지 않는다.
    그 경우까지 알림을 보내면 매일 거짓 경보가 울려 진짜 경고가 묻힌다.
    """
    label = '따라잡기' if catchup else '발행'
    summary(f'### {label} {today:%Y-%m-%d} KST — 오늘 슬롯: {slot_label(today)}')

    ideas = load_ideas()
    target = target_path = None
    stale = []

    for path, idea in ideas:
        if idea.get('published_at') or idea.get('media_id'):
            continue                                # 멱등성 — 이미 나간 건
        if idea.get('status') != 'scheduled':
            continue
        due = as_date(idea.get('scheduled_at'))
        if due is None or due > today:
            continue
        if (today - due).days >= STALE_AFTER_DAYS:
            stale.append((path, idea, due))
            continue
        # 배정일이 지난 건은 자기 서비스의 슬롯에서만 올린다. 이게 없으면
        # 어제 발행이 실패했을 때 오늘(다른 서비스 슬롯)에 끼어들어
        # 월·금 ClipNote / 화·목 TakeASeat 캐던스가 깨진다.
        # 배정일이 정확히 오늘인 건은 /sns-queue 가 캐던스대로 잡아둔 것이므로 그대로 통과시킨다.
        if due < today and CADENCE.get(today.weekday()) != idea.get('service'):
            continue
        if target is None or due < as_date(target.get('scheduled_at')):
            target, target_path = idea, path

    for path, idea, due in stale:
        notify(f"*{idea['id']}* 배정일이 {(today - due).days}일 지나 stale 처리했습니다 "
               f"(배정 {due}). 발행하지 않았습니다.", 'warn')
        if not dry:
            idea['status'] = 'stale'
            save_idea(path, idea)

    if target is None:
        product = CADENCE.get(today.weekday())
        if product is None:
            summary('오늘은 발행 요일이 아닙니다. 종료.')
        elif catchup:
            summary(f'오늘 {product} 슬롯에 대기 건이 없습니다. '
                    f'앞선 실행이 이미 올렸다는 뜻입니다. 종료.')
        else:
            notify(f'오늘 {product} 슬롯인데 대기 중인 발행 건이 없습니다. '
                   f'파이프라인이 멈춘 건지 확인해 주세요.', 'warn')
        return 0

    summary(f"대상: `{target['id']}` ({target['service']}) — {target.get('angle', '')}")

    if dry:
        urls = target.get('image_urls') or [target.get('image_url')]
        kind = f'캐러셀 {len(urls)}장' if len(urls) > 1 else '단일 이미지'
        summary(f'[dry-run] {kind} — {urls[0]}')
        summary(f"[dry-run] 캡션 {len(target['caption'])}자")
        summary('[dry-run] 실제 발행하지 않고 종료.')
        return 0

    try:
        media_id, permalink, cid = publish_one(target)
    except IGError as e:
        target['status'] = 'failed'
        target['container_id'] = e.container_id
        save_idea(target_path, target)
        notify(f"*{target['id']}* 발행 실패 — {e}\n"
               f"container_id: `{e.container_id}`\n"
               f"자동 재시도하지 않습니다. 재실행 전에 인스타그램 계정에서 "
               f"실제로 올라갔는지 눈으로 확인하세요.", 'error')
        return 1

    # 발행 성공 — 즉시 기록한다. 이 두 필드가 중복 발행을 막는 유일한 장치다.
    target['status'] = 'published'
    target['media_id'] = media_id
    target['published_at'] = today.strftime('%Y-%m-%d')
    target['permalink'] = permalink
    target['container_id'] = cid
    save_idea(target_path, target)
    append_history(target, today)

    waiting = [i for _, i in load_ideas() if i.get('status') in ('image_ok', 'scheduled')
               and not i.get('published_at')]
    by = {}
    for i in waiting:
        by[i['service']] = by.get(i['service'], 0) + 1
    left = ' / '.join(f'{k} {v}건' for k, v in sorted(by.items())) or '없음'

    # 따라잡기 실행이 실제로 올렸다는 건 정시 실행이 안 돌았다는 뜻이다.
    # 결과만 보면 정상이라 이 사실이 알림에 남지 않으면 영영 모른다.
    late = ('\n⚠️ 정시(08:00) 실행이 아니라 따라잡기 실행이 올렸습니다. '
            'GitHub Actions 크론이 씹혔는지 확인해 주세요.' if catchup else '')
    notify(f"*{target['id']}* 발행 완료 — {permalink}\n남은 대기: {left}{late}")
    if len(waiting) <= 1:
        notify('콘텐츠 소진 임박 — 아이디어를 새로 만들어 주세요.', 'warn')

    gh_out = os.environ.get('GITHUB_OUTPUT')
    if gh_out:
        with open(gh_out, 'a') as f:
            f.write(f"result=published\npost_id={target['id']}\npermalink={permalink}\n")
    return 0


# ── 진입점 ───────────────────────────────────────────────────────

def _guard(dry):
    """실발행은 CI 에서만. 로컬·에이전트 세션에서 실수로 도는 것을 막는다.

    Bash 권한 규칙은 복합 명령(`cd x && python3 ...`)에서 빗나갈 수 있으므로
    스크립트 자신이 한 번 더 막는다.
    """
    if dry:
        return
    if os.environ.get('GITHUB_ACTIONS') != 'true':
        sys.exit('실발행은 GitHub Actions 에서만 가능합니다. 로컬에서는 --dry-run 을 쓰세요.')
    if not TOKEN:
        sys.exit('IG_ACCESS_TOKEN 이 비어 있습니다. repo Settings > Secrets 에 등록하세요.')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mode', choices=('publish', 'catchup', 'preview', 'verify'),
                    default='publish')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--date', help='오늘 날짜를 덮어쓴다 (테스트용, YYYY-MM-DD)')
    ap.add_argument('--id', dest='wanted_id',
                    help='verify 모드에서 확인할 아이디어 id (생략하면 오늘 배정된 건)')
    args = ap.parse_args()

    _guard(args.dry_run)
    today = as_date(args.date) if args.date else datetime.now(KST).date()
    if args.mode == 'verify':
        return mode_verify(today, args.dry_run, args.wanted_id)
    if args.mode == 'preview':
        return mode_preview(today, args.dry_run)
    return mode_publish(today, args.dry_run, catchup=args.mode == 'catchup')


if __name__ == '__main__':
    sys.exit(main())
