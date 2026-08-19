export const PRODUCTS = [
  {
    slug: 'clipnote',
    name: 'ClipNote',
    tagline: '붙여넣기 한 번, 클릭을 부르는 공유 카드',
    desc: '밋밋한 링크 대신 제목·대표 이미지가 담긴 카드와 짧은 링크로 공유합니다.',
    href: 'https://clipnote.co.kr',
    ctaLabel: 'ClipNote 사용해보기',
    shot: '/shots/clipnote.png',
    monogram: 'C',
    accent: '#6526d9',
    summary:
      '링크를 붙여넣으면 미리보기를 자동으로 불러와 제목·대표 이미지가 담긴 공유 카드와 짧은 링크를 만들어 줍니다. 카카오톡·SNS에 그대로 올려도 확 눈에 띕니다.',
    features: [
      {
        title: '붙여넣기 한 번',
        desc: 'URL을 넣으면 제목과 대표 이미지를 자동으로 불러옵니다. 제목을 비워두면 알아서 채워집니다.',
      },
      {
        title: '태그로 정리',
        desc: '쉼표로 최대 6개까지 태그를 달아두면 «내 클립»에서 같은 태그끼리 모아 볼 수 있습니다.',
      },
      {
        title: '로그인 없이 저장',
        desc: '가입 전이라면 이 브라우저에 바로 저장해두고, 필요할 때 공유하거나 복사하세요.',
      },
      {
        title: '공유 카드와 짧은 링크',
        desc: '로그인하면 예쁜 공유 카드와 짧은 링크가 만들어져, 어디에 올려도 클릭을 부릅니다.',
      },
    ],
  },
  {
    slug: 'takeaseat',
    name: 'Take a Seat',
    tagline: '예약·고객 관리 서비스',
    desc: '예약 캘린더부터 고객·담당자·매출까지, 매장 운영에 필요한 기능을 한 곳에서.',
    href: 'https://takeaseat.co.kr',
    ctaLabel: 'Take a Seat 시작하기',
    shot: '/shots/takeaseat.png',
    monogram: 'T',
    accent: '#ec4899',
    summary:
      '예약 캘린더, 고객 정보, 담당자 스케줄, 매출 집계까지 매장 운영에 필요한 기능을 한 곳에 모았습니다. 여러 도구를 오가지 않아도 하루 운영이 정리됩니다.',
    features: [
      {
        title: '예약 캘린더',
        desc: '일·주·월 보기로 예약을 한눈에 확인하고 관리합니다.',
      },
      {
        title: '고객 관리',
        desc: '방문 이력·메모·적립금까지 고객 정보를 통합 관리합니다.',
      },
      {
        title: '담당자·서비스',
        desc: '담당자별 스케줄과 시술·가격을 손쉽게 설정합니다.',
      },
      {
        title: '결제·매출',
        desc: '결제 내역과 매출을 기록하고 자동으로 집계합니다.',
      },
    ],
  },
  {
    slug: 'blog',
    name: 'blog',
    tagline: '경제·부동산·IT 인사이트',
    desc: '매일의 흐름을 읽고 정리한 글을 기록합니다.',
    href: 'https://blog.pikaworks.kr',
    ctaLabel: '블로그 방문하기',
    shot: '/shots/blog.png',
    monogram: 'B',
    accent: '#0ea5e9',
    summary:
      '금리와 환율, 부동산 시장, 그리고 도구를 만들며 얻은 IT 기록까지. 매일의 흐름을 읽고 남길 만한 것만 골라 정리합니다.',
    features: [
      {
        title: '경제',
        desc: '금리·환율·증시의 흐름을 그날의 맥락과 함께 정리합니다.',
      },
      {
        title: '부동산',
        desc: '정책과 시장 지표를 실제 판단에 쓸 수 있는 형태로 옮깁니다.',
      },
      {
        title: 'IT',
        desc: '도구를 직접 만들고 쓰면서 남긴 기록과 회고를 담습니다.',
      },
    ],
  },
];

export function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug);
}
