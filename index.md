# pikaworks SNS 자동화 파이프라인 — 구조와 현재 상태

이 문서가 구조의 SSOT 다. 진행 중인 작업은 `plan.md` 를 본다.

발행 채널은 인스타그램 `@pikaworks` 하나이고, 홍보 대상은 **ClipNote** 와
**Take a Seat** 두 서비스다.

## 1. 파이프라인

| # | 하는 일 | 주체 | 끝났을 때 status |
|---|---|---|---|
| 1 | 아이디어 생성 (history.md 먼저 읽고 중복 회피) | `sns-marketer` 스킬 | `proposed` |
| 2 | 아이디어 검수 | **사람** | `approved` |
| 3 | 이미지 제작 | `sns-designer` 스킬 → `scripts/ig.mjs` | `design_done` |
| 4 | 이미지 검수 | **사람** | `image_ok` |
| 5 | 캐던스에 맞춰 발행일 배정 | `/sns-queue` 커맨드 | `scheduled` |
| 6 | 발행 | **GitHub Actions + publish.py** | `published` / `failed` |

그 밖의 값: `stale` (배정일이 2일 이상 지나 발행하지 않고 넘긴 건).

### 불변 규칙

1. **`approved` 와 `image_ok` 는 사람만 쓴다.** 스킬·에이전트·스크립트가 이 두 값을
   쓰는 것을 금지한다. Claude 가 자기 산출물을 자기가 통과시키는 구조를 만들지 않는다.
   `scripts/ig.mjs` 도 `design_done` 까지만 올린다.
2. **6단계에 Claude 는 관여하지 않는다.** 발행은 결정론적 스크립트가 CI 에서 실행한다.
   토큰이 repo secrets 에 있어 Claude 세션에서는 **읽을 방법 자체가 없다.**
   `publish.py` 는 `GITHUB_ACTIONS=true` 가 아니면 실발행을 거부한다 (`_guard`).
3. **반려 시 사유를 `pipeline/history.md` 에 한 줄 남긴다.** 이게 없으면 같은 앵글이
   반복 제안된다.

## 2. 파일 구조

```
.claude/
  settings.json                 권한 (allow / deny)
  skills/sns-marketer/          아이디어·캡션 생성
  skills/sns-designer/          이미지 제작
  agents/sns-researcher.md      경쟁·해시태그 조사 전용, 읽기 전용
  commands/sns-queue.md         image_ok → 발행일 배정
pipeline/
  ideas/*.json                  건별 상태 파일
  history.md                    발행완료 / 반려 / 금지앵글
scripts/
  publish.py                    발행 실행기 (6단계)
  ig.mjs                        HTML 템플릿 → PNG 렌더러 (3단계)
assets/fonts/                   Pretendard Variable (렌더 재현성용, OFL)
public/ig/*.png                 발행용 이미지 → https://pikaworks.kr/ig/*.png
.github/workflows/
  ig-post.yml                   발행 크론
  ig-preview.yml                발행 전날 프리뷰 + 빈 큐 경고
  ig-token.yml                  토큰 갱신 크론
```

### `pipeline/ideas/*.json` 필드

| 필드 | 뜻 | 쓰는 주체 |
|---|---|---|
| `id` | 파일명과 동일한 식별자 | sns-marketer |
| `service` | `clipnote` \| `takeaseat` | sns-marketer |
| `status` | 위 표의 상태값 | 단계별 |
| `angle` | 아이디어 한 줄 | sns-marketer |
| `caption` | 발행 캡션 | sns-marketer |
| `design` | 렌더 스펙 (template + 카피) | sns-designer |
| `image_path` | 로컬 경로 | ig.mjs |
| `image_url` | 공개 URL — 발행에 쓰인다 | ig.mjs |
| `scheduled_at` | 배정된 발행일 `YYYY-MM-DD` | /sns-queue |
| `published_at` | 발행 성공 시각 — 중복 방지 키 | publish.py |
| `media_id` | 발행 성공 시 IG media id | publish.py |
| `permalink` | 게시물 링크 | publish.py |
| `container_id` | 실패 추적용 | publish.py |
| `note` | 자유 메모 | 아무나 |

## 3. 캐던스

| 요일 | 서비스 |
|---|---|
| 월 | ClipNote |
| 화 | Take a Seat |
| 목 | Take a Seat |
| 금 | ClipNote |

발행 시각 08:00 KST. 실제 대상은 크론이 아니라 `scheduled_at` 이 정한다 —
크론은 "오늘 배정된 게 있으면 올려라" 만 시킨다.

## 4. 발행 실행기

**집행 조건 (셋 다 충족해야 발행)**

- `status == "scheduled"`
- `scheduled_at` 날짜가 오늘(KST) 이하
- `published_at` 이 비어 있음

하나라도 어긋나면 스킵하고 로그만 남긴다.

**멱등성** — 발행 성공 즉시 `media_id` 와 `published_at` 을 파일에 쓴다.
이 두 필드가 있으면 무조건 스킵한다. 네트워크 타임아웃으로 응답을 못 받았는데
실제로는 올라간 경우가 있으므로, **재실행 전에 계정을 눈으로 확인한다.**

**stale** — 배정일이 오늘보다 2일 이상 지난 건은 발행하지 않고 `stale` 처리 + 알림.
기기가 꺼져 있어도 도는 CI 라 실제로는 잘 발생하지 않지만, 큐를 손으로
되돌렸을 때의 안전장치다.

**2단계 발행** — 미디어 컨테이너 생성 → FINISHED 대기 → 게시. 컨테이너는 만들어졌는데
게시가 실패하는 중간 상태가 있으므로 실패 시 `container_id` 를 남긴다.

**재시도** — `failed` 는 자동 재시도하지 않는다. 레이트리밋(HTTP 429 / IG code 4·17·32)만
30s·60s·120s·240s 지수 백오프로 최대 4회 재시도한다.

**알림** (`SLACK_WEBHOOK_URL` secret. 없으면 Actions 요약에만 남는다)

- 발행 완료 / 실패
- 발행 전날 20:00 KST 프리뷰 — "내일 이 캡션 + 이 이미지가 올라갑니다"
- 빈 큐 — "오늘 ClipNote 슬롯인데 대기 건 없음". 없으면 파이프라인이 멈춘 건지
  큐가 빈 건지 구분할 수 없다
- 콘텐츠 소진 임박 (대기 1건 이하)

## 5. Instagram API 제약

**토큰** — 장기 토큰 60일. 발급 24시간 후 ~ 만료 전에만 갱신 가능하고, 갱신하면
그 시점부터 다시 60일. **만료되면 갱신 불가, OAuth 를 처음부터 다시 타야 한다.**
`ig-token.yml` 이 매일 03:00 KST 에 갱신한다.

자동 저장에는 `GH_PAT_SECRETS` (Secrets: write 권한의 fine-grained PAT) 가 필요하다.
없으면 갱신을 시도하지 않고 경고만 보낸다 — 저장 못 할 갱신은 새 토큰을 버리는 셈이라
오히려 위험하다.

**이미지 호스팅** — Meta 서버가 URL 을 직접 가져가므로 공개 URL 이어야 한다.
이 리포는 공개 + GitHub Pages(`pikaworks.kr`) 라 `public/ig/*.png` 가 그대로 쓰인다.
`main` 에 push → `deploy.yml` 이 배포 → `https://pikaworks.kr/ig/<id>.png`.

운영 규칙:
- **발행 후에도 이미지를 지우지 않는다** (Meta 측 처리 지연 대비, 최소 며칠 유지)
- 미승인 시안은 `public/ig/` 에 넣지 않는다. 시안은 `--out /tmp/...` 로 뽑는다

**기타** — 계정이 프로페셔널(비즈니스/크리에이터)이어야 한다.
레이트리밋은 계정당 시간당 200요청이고 성공·실패·잘못된 요청 모두 동일하게 소모한다.

## 6. 권한

`.claude/settings.json` 에 있다. 규칙은 deny → ask → allow 순으로 평가되며
deny 는 어떤 allow 로도 뚫리지 않고 예외를 둘 수 없다.

리포가 하나로 합쳐져 있어 `additionalDirectories` 는 필요 없다.
설계 단계에서 우려했던 "리포는 `~/Desktop/git`, 큐·토큰은 `~/sns`" 분리가
없어졌기 때문이다.

`Bash(python3 scripts/publish.py:*)` 는 **allow** 다. deny 로 걸면 드라이런까지
막히는데, deny 에는 예외를 둘 수 없다. 대신 실발행 차단은 스크립트 자신의
`_guard` 가 맡는다 — Bash 권한 규칙은 `cd x && python3 ...` 같은 복합 명령에서
빗나갈 수 있어 어차피 신뢰할 수 없다. `GITHUB_ACTIONS=` 를 앞에 붙여 CI 를
위장하는 우회는 deny 로 막았다.

`--dangerously-skip-permissions` 는 사용 금지.

### 권한 프롬프트가 반복될 때

1. `/permissions` 로 현재 규칙과 출처 파일 확인
2. 패턴 불일치 — `Bash(python3:*)` 로 걸어도 `cd x && python3 ...` 는 매치되지 않는다
3. 세션에서 누른 Allow 는 그 세션에만 남는다. 영구 설정은 이 파일에 적는다

## 7. 필요한 Secrets

| 이름 | 필수 | 쓰임 |
|---|---|---|
| `IG_ACCESS_TOKEN` | 예 | 발행·토큰 갱신 |
| `SLACK_WEBHOOK_URL` | 아니오 | 알림. 없으면 Actions 요약에만 남는다 |
| `GH_PAT_SECRETS` | 아니오 | 갱신된 토큰 자동 저장. 없으면 수동 갱신 경고만 |
