# plan.md — 진행 중 작업 SSOT

구조는 `index.md` 를 본다. 이 파일은 "지금 무엇이 되어 있고 다음에 뭘 하는가" 만 적는다.

최종 갱신: 2026-08-25

## 완료

- [x] 설계 확정 — 리포·스케줄러는 **기존 `pikaworks` 리포 + GitHub Actions** 로 결정.
      설계 초안의 별도 리포 + launchd 안은 폐기했다. 근거는 아래 "결정 기록" 참고
- [x] 기존 `data/ig_post_queue.json` 6건을 `pipeline/ideas/*.json` 으로 이관
- [x] `pipeline/history.md` 생성 (발행완료 2건 + 금지앵글)
- [x] `scripts/publish.py` — 집행 조건·멱등성·stale·백오프·알림·CI 가드
- [x] `scripts/ig.mjs` — HTML 템플릿 → PNG 렌더러 (`list` / `panel` / `statement`)
- [x] Pretendard Variable 을 `assets/fonts/` 에 고정 (렌더 재현성)
- [x] `.claude/settings.json` 권한
- [x] `sns-marketer` 스킬
- [x] `sns-designer` 스킬
- [x] `sns-researcher` 서브에이전트 (읽기 전용)
- [x] `/sns-queue` 커맨드
- [x] `ig-post.yml` 재작성 — 취소된 실행에서도 상태를 커밋하도록 `always()` 적용
- [x] `ig-preview.yml` — 발행 전날 프리뷰 + 빈 큐 경고
- [x] `ig-token.yml` — 토큰 갱신 크론

## 지금 막혀 있는 것

**큐가 비어 있다.** 이관된 4건이 `image_ok` 라 아직 발행일이 없다.
`/sns-queue` 를 돌려 배정하기 전까지는 크론이 돌아도 "대기 건 없음" 경고만 나간다.
다음 발행 슬롯은 **2026-08-27(목) 08:00 KST** 다.

```
/sns-queue
```

## 다음에 할 일

1. **`/sns-queue` 실행** — `image_ok` 4건에 발행일 배정 (위 참고)
2. **Secrets 확인** — `SLACK_WEBHOOK_URL` 과 `GH_PAT_SECRETS` 는 아직 없을 것이다.
   없어도 파이프라인은 돌지만 알림과 토큰 자동 갱신이 빠진다.
   특히 토큰은 만료되면 복구가 OAuth 재시작이라 이게 제일 급하다
3. **`ig-post.yml` 을 `workflow_dispatch` + `dry_run: true` 로 한 번 수동 실행** —
   실제 발행 전에 CI 경로 전체를 확인한다
4. **스킬 검증** — `sns-marketer` 로 아이디어 3개 뽑아 보고, 하나 승인해서
   `sns-designer` 까지 태워 본다. 나온 PNG 가 기존 6장과 같은 톤인지 눈으로 확인
5. 아직 안 정한 것 — 아래

## 아직 안 정한 것

- **발행 시각** — 현재 08:00 KST 를 그대로 이어받았다. 블로그(04/07/19 KST)와
  달리 SNS 는 노출 시간대가 다르므로 별도 판단이 필요하다.
  바꾸려면 `ig-post.yml` 크론과 `ig-preview.yml` 크론을 같이 옮긴다
- **이미지 파일명 해시** — 설계에서 "디렉터리 스캔 노출을 줄이려 파일명에 해시를
  섞는다" 고 했으나 현재는 `<id>.png` 그대로다. 이 리포는 어차피 공개이고
  `public/ig/` 는 인덱싱되지 않으므로 실익이 적다고 보고 넣지 않았다.
  필요하면 `ig.mjs` 의 `outPath` 한 줄만 고치면 된다

## 결정 기록

**별도 `pikaworks-sns` 리포 + launchd 안을 폐기한 이유** (2026-08-25)

- launchd 를 고른 근거는 "cron 은 기기가 꺼져 있으면 건너뛴다" 였는데,
  GitHub Actions 에서는 이 문제가 애초에 없다
- "Claude 는 6단계에 관여하지 않는다" 가 deny 규칙보다 강하게 보장된다 —
  토큰이 repo secrets 에 있어 세션에서 읽을 방법 자체가 없다
- 이미지는 어차피 공개 URL 이 필요해 이 리포로 push 해야 한다.
  리포를 나누면 두 리포를 오가는 커밋이 생긴다
- 발행기·큐·Pages 호스팅이 이미 이 리포에서 검증된 상태로 돌아가고 있었다
  (2026-08-24·25 실제 발행 2건 성공)

**이관 시 `image_ok` 를 쓴 것에 대해** — 불변 규칙 1은 "Claude 가 자기 산출물을
자기가 통과시키지 못하게" 하려는 것이다. 이관된 4건은 사람이 직접 쓴 캡션과
이미지로 이미 발행 큐에 들어가 있던 것이라 사람 게이트를 지난 상태로 보고 옮겼다.
동의하지 않으면 4건의 `status` 를 `design_done` 으로 내리면 된다.
