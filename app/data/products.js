export const PRODUCTS = [
  {
    slug: 'clipnote',
    name: 'ClipNote',
    tagline: '밋밋한 링크를 카드 한 장으로',
    desc: '제목·대표 이미지가 담긴 카드와 짧은 링크를 한 번에. 카카오톡·SNS에서 깔끔하게 보입니다.',
    href: 'https://clipnote.co.kr',
    ctaLabel: 'ClipNote 사용해보기',
    shot: '/shots/clipnote.png',
    monogram: 'C',
    accent: '#6526d9',
    summary:
      '링크를 붙여넣으면 제목·설명·대표 이미지를 자동으로 읽어와, 카카오톡·SNS에서 한눈에 들어오는 카드와 짧은 주소를 만들어 줍니다. 미리보기가 잘 잡히지 않는 네이버 카페·인스타그램 링크도 됩니다.',
    features: [
      {
        title: '붙여넣기 한 번',
        desc: 'URL을 넣으면 제목·설명·대표 이미지를 자동으로 불러옵니다. 제목을 비워두면 알아서 채워집니다.',
      },
      {
        title: '카드로 열리는 짧은 링크',
        desc: '링크를 만들면 공유 카드가 먼저 보인 뒤 원본으로 자연스럽게 넘어갑니다.',
      },
      {
        title: '원본 복사',
        desc: '카드를 거치지 않고 보내고 싶을 땐 제목과 원본 주소를 함께 복사합니다.',
      },
      {
        title: '태그로 정리',
        desc: '쉼표로 최대 6개까지. «내 클립»에서 태그별로 모아 보고, 자주 쓴 태그는 다음에 추천됩니다.',
      },
      {
        title: '로그인 없이도',
        desc: '이 브라우저에 저장해 «내 클립»에서 다시 볼 수 있습니다. 짧은 공유 링크만 로그인이 필요합니다.',
      },
      {
        title: '까다로운 링크도',
        desc: '네이버 카페 게시글, 인스타그램 릴·게시물 정보까지 전용 추출로 가져옵니다.',
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
      '예약 캘린더, 고객 정보, 담당자 스케줄, 매출 집계까지 매장 운영에 필요한 기능을 한 곳에 모았습니다. 가입 없이 게스트로 먼저 써보고, 로그인하면 그대로 이어서 쓸 수 있습니다.',
    features: [
      {
        title: '예약 캘린더',
        desc: '일·3일·주·월·연 보기로 예약을 한눈에 확인하고 관리합니다.',
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
      {
        title: '온라인 예약 페이지',
        desc: '고객이 직접 예약할 수 있는 공개 예약 페이지를 매장별로 제공합니다.',
      },
      {
        title: '가입 없이 체험',
        desc: '게스트 모드로 브라우저에 저장하며 먼저 써보고, 로그인하면 모든 기기에서 이어집니다.',
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
