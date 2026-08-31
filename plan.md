# plan.md — 진행 중 작업 SSOT

구조는 `index.md` 를 본다. 이 파일은 "지금 무엇이 되어 있고 다음에 뭘 하는가" 만 적는다.

최종 갱신: 2026-08-26

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
- [x] `takeaseat-1`(8/27) · `clipnote-1`(8/28) 을 `main` 에 머지 — 발행기가 기본
      브랜치를 체크아웃하므로 이게 안 되면 배정일에 "대기 건 없음" 으로 조용히
      끝난다. PR #19 · #20 으로 머지됐고 Pages 배포도 `15dbbac` 에서 성공했다

## takeaseat-1 발행 준비 상태

| 항목 | 값 |
|---|---|
| status | `scheduled` |
| scheduled_at | 2026-08-27 |
| 이미지 | 5장 (커버·캘린더·고객·게스트·마감) — 이 건의 기록이지 규격이 아니다 |
| 캡션 | 1047자 (한국어 379 / 영어 620) |
| 해시태그 | 5개 — 인스타 상한 |
| 드라이런 | 통과 |

**verify 리허설은 사용자 지시로 건너뛴다.** 캐러셀 발행 경로를 실제로
태우는 것은 8/27 이 처음이다. 실패하면 Slack 알림이 오고, `--id takeaseat-1`
로 재시도할 수 있다.

## 다음에 할 일

1. [x] 8/27 `takeaseat-1` · 8/28 `clipnote-1` 자동 발행 완료.
   `pipeline/history.md` 발행 완료 표에도 자동으로 들어갔다
2. **큐 보충** — 대기 3건(`clipnote-3`, `takeaseat-3`, 그리고 `takeaseat-2` 는
   재작성 완료)이 캐러셀 이전 구성이라 다시 만들어야 한다.
   장수를 맞추는 작업이 아니다 — 내용이 몇 장을 필요로 하는지가 정한다
   (`sns-designer/SKILL.md` 2-1절)

## 아직 안 정한 것

- **게스트 카드 위치** — 지금은 4번(마감 직전)이다. 2번으로 올리면 진입 장벽
  제거가 먼저 오는데, 관심이 생기기 전에 장벽을 치우는 셈이라 지금 자리를
  택했다. 다음 TAS 건에서 반대 순서로 내서 비교해 보기로 했다
- **매출 화면** — 시드 예약이 `price = 0`, `paymentCompleted = false` 라
  총 매출 0원에 그래프가 바닥에 깔린 직선으로 나온다. 쓰려면 가격·결제
  데이터를 채우고 다시 찍어야 한다 (`assets/shots/SOURCE.md`)
- **발행 시각** — 08:00 KST 를 이어받았다. SNS 노출 시간대는 블로그와
  다르므로 별도 판단이 필요하다. 바꾸려면 `ig-post.yml` 크론을 옮긴다

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
