---
description: image_ok 상태의 게시물에 캐던스에 맞춰 발행일을 배정한다 (5단계)
---

`status` 가 `image_ok` 인 아이디어에 발행일을 배정해 `scheduled` 로 올린다.
파이프라인 5단계이고, 사람 검수 두 번을 모두 통과한 건만 다룬다.

## 캐던스

| 요일 | 서비스 |
|---|---|
| 월 | clipnote |
| 화 | takeaseat |
| 목 | takeaseat |
| 금 | clipnote |

발행 시각은 08:00 KST 고정이다 (`.github/workflows/ig-post.yml`).
수·토·일은 발행하지 않는다.

## 절차

1. `pipeline/ideas/*.json` 을 전부 읽는다
2. `status == "scheduled"` 인 건들의 `scheduled_at` 을 모아 **이미 찬 날짜**를 만든다
3. `status == "image_ok"` 인 건을 서비스별로 나눈다
4. **오늘 다음날부터** 시작해 각 서비스의 요일 슬롯을 순서대로 훑으며,
   비어 있는 가장 이른 날짜를 하나씩 배정한다
   - 이미 찬 날짜는 건너뛴다
   - 한 날짜에 두 건을 배정하지 않는다
   - **오늘 날짜에는 배정하지 않는다.** 오늘 08:00 슬롯은 이미 지났거나 임박했다
5. 배정한 건의 `status` 를 `scheduled` 로, `scheduled_at` 을 `YYYY-MM-DD` 로 쓴다
6. 결과를 표로 보여준다 — 날짜 / 요일 / 서비스 / id / 앵글
7. 배정 후 각 서비스의 남은 대기 건수를 알려준다. **2건 이하면 경고한다** —
   `sns-marketer` 로 큐를 채울 때다

## 확인

배정이 끝나면 드라이런으로 실행기가 같은 결론을 내는지 본다:

```bash
python3 scripts/publish.py --dry-run --date <배정한 날짜>
```

대상이 방금 배정한 건으로 잡혀야 한다. 안 잡히면 `scheduled_at` 형식이나
`published_at` 잔여값을 확인한다.

## 하지 않는 것

- `image_ok` 가 아닌 건은 배정하지 않는다. `design_done` 은 아직 사람 검수 전이다
- `status` 를 `image_ok` 나 `approved` 로 **올리지 않는다.** 그 두 값은 사람만 쓴다
- `published`·`media_id`·`published_at` 은 건드리지 않는다. 발행기만 쓰는 필드다
- 실제 발행하지 않는다. `scripts/publish.py` 를 `--dry-run` 없이 실행하지 않는다
