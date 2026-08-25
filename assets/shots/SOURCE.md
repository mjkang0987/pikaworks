# 서비스 스크린샷

인스타 카드에 넣을 실제 서비스 화면. 손으로 그린 목업이 아니라
저장소 코드를 그대로 돌려서 찍은 것이다.

| 파일 | 화면 | 뷰포트 |
|---|---|---|
| `pc-calendar.png` | 예약 캘린더 (월별) | 1440×900 @2x |
| `pc-customers.png` | 고객 명단 | 1440×900 @2x |
| `pc-revenue.png` | 매출 | 1440×900 @2x |
| `mobile-calendar.png` | 예약 캘린더 | 390×844 @2x |
| `mobile-customers.png` | 고객 명단 | 390×844 @2x |
| `mobile-revenue.png` | 매출 | 390×844 @2x |

## 개인정보

**실제 고객 데이터가 아니다.** 전부 `mjkang0987/tas` 의 시드
(`server/prisma/seed.mjs`)가 만든 가상 데이터다 — 담당자 제인·찰스·
마이클·브로콜리, 계정 `owner@example.com`. 매장명만 "피카 살롱" 으로
바꿨다. 운영 DB 는 건드리지 않았다.

## 촬영 조건 (2026-08-25, tas@99390ef)

운영 사이트는 이 환경의 프록시가 막아서 접속할 수 없다. 대신 컨테이너에서
직접 띄웠다.

1. `apt-get install postgresql` (16) → `initdb` → `createdb tas`
2. `tas/client` 에서 `pnpm install` → `prisma db push` → `prisma:seed`
3. 로그인: OAuth 키가 없으므로 `AUTH_SECRET` 으로 세션 쿠키를 직접 발급.
   `server/page-data/index.ts` 의 `getPageSession` 이 토큰 **안에서**
   `storeId`·`role` 을 읽으므로 `sub` 만으로는 안 되고 전체 클레임이 필요하다
4. 시드 예약이 2~4월이라 8월 달력이 비어서, 85일치를 현재 주 전후 30일로
   압축 이동했다. 그 과정에서 생긴 담당자 시간 충돌 2건은 다른 담당자로 옮겼다
5. 촬영 전 정리 — 온보딩 투어는 `localStorage['tas-tour-main-v1']` 를 첫 렌더
   전에 심어서 끄고, AD 플레이스홀더(dev 전용)와 Next 개발 배지는 DOM 에서 제거

다시 찍을 일이 생기면 위 순서를 그대로 반복하면 된다. 서비스 UI 가 바뀌면
스크린샷도 같이 갱신해야 한다 — 옛 화면을 광고에 쓰면 안 된다.
