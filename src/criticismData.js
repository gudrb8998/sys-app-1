// src/criticismData.js
// 비평 유형 테스트 데이터 및 채점 로직

export const TYPES = {
  archive: {
    id: 'archive',
    name: '기록하는 비평',
    color: '#888888',
    description:
      '당신에게 비평은 사라지는 순간을 붙잡는 일입니다.\n당신은 공연에서 본 장면과 느낀 감각을 오래 남기는 것을 중요하게 생각합니다. 기록은 한 편의 공연을 개인의 기억에만 머물지 않게 하고, 시간이 흐른 뒤에도 다시 만날 수 있게 합니다.',
    keywords: ['기억', '보존', '아카이브'],
  },
  interpret: {
    id: 'interpret',
    name: '해석하는 비평',
    color: '#8B5CF6',
    description:
      '당신에게 비평은 보이는 것 너머를 들여다보는 일입니다.\n당신은 작품이 무엇을 말하는지, 왜 이런 움직임과 형식을 선택했는지 궁금해합니다. 익숙한 장면에서도 새로운 의미를 발견하고, 작품을 바라보는 또 하나의 관점을 제시합니다.',
    keywords: ['해석', '질문', '맥락', '관점'],
  },
  connect: {
    id: 'connect',
    name: '연결하는 비평',
    color: '#22C55E',
    description:
      '당신에게 비평은 작품과 사람, 서로 다른 생각을 이어주는 일입니다.\n당신은 비평을 한 사람의 완성된 판단보다 대화가 시작되는 계기로 생각합니다. 당신의 반응은 다른 사람의 생각을 불러오고, 작품과 관객 사이에 새로운 관계를 만듭니다.',
    keywords: ['연결', '대화', '반응', '공유'],
  },
  create: {
    id: 'create',
    name: '만들어 내는 비평',
    color: '#F97316',
    description:
      '당신에게 비평은 작품에서 출발해 새로운 것을 만들어 내는 일입니다.\n당신은 공연에서 받은 감각과 생각을 글, 이미지, 영상 또는 새로운 아이디어로 변화시킵니다. 비평은 작품을 설명하는 데 그치지 않고 또 다른 콘텐츠와 움직임을 만들어 내는 창작의 과정이 됩니다.',
    keywords: ['재구성', '창작', '확장', '생산'],
  },
};

export const QUESTIONS = [
  {
    id: 1,
    text: '인상적인 공연을 보고 극장을 나왔습니다. 가장 먼저 하고 싶은 일은 무엇인가요?',
    options: [
      { label: 'A', text: '기억이 흐려지기 전에 인상적인 장면과 느낌을 적어둔다.', type: 'archive' },
      { label: 'B', text: '작품이 왜 이런 움직임과 형식을 선택했는지 생각해본다.', type: 'interpret' },
      { label: 'C', text: '함께 본 사람에게 어떤 장면이 기억에 남았는지 물어본다.', type: 'connect' },
      { label: 'D', text: '공연에서 받은 영감으로 글이나 이미지, 영상을 만들어본다.', type: 'create' },
    ],
  },
  {
    id: 2,
    text: '공연에 관한 글을 하나만 읽는다면 어떤 글을 선택하겠어요?',
    options: [
      { label: 'A', text: '작품을 새로운 관점에서 바라보게 해주는 깊이 있는 글', type: 'interpret' },
      { label: 'B', text: '공연을 흥미로운 이미지나 영상으로 재구성한 콘텐츠', type: 'create' },
      { label: 'C', text: '공연의 장면과 분위기를 자세하게 남긴 글', type: 'archive' },
      { label: 'D', text: '여러 사람의 생각과 반응이 이어지는 글', type: 'connect' },
    ],
  },
  {
    id: 3,
    text: '시간이 많이 흐른 공연의 흔적을 발견했습니다. 무엇이 가장 궁금한가요?',
    options: [
      { label: 'A', text: '그 공연을 본 사람들은 어떤 이야기를 나누었을까?', type: 'connect' },
      { label: 'B', text: '당시 공연은 언제, 어디서, 누구에 의해 만들어졌을까?', type: 'archive' },
      { label: 'C', text: '이 자료를 지금의 방식으로 다시 보여준다면 어떤 모습일까?', type: 'create' },
      { label: 'D', text: '이 공연은 당시의 사회와 무용계에서 어떤 의미였을까?', type: 'interpret' },
    ],
  },
  {
    id: 4,
    text: '누군가 당신과 전혀 다른 공연 감상을 이야기한다면 어떻게 하겠어요?',
    options: [
      { label: 'A', text: '두 사람의 생각이 왜 달라졌는지 작품을 다시 들여다본다.', type: 'interpret' },
      { label: 'B', text: '서로의 생각을 나누며 이야기를 계속 이어간다.', type: 'connect' },
      { label: 'C', text: '당시 내가 보았던 장면과 느낌을 다시 확인한다.', type: 'archive' },
      { label: 'D', text: '서로 다른 생각을 활용해 새로운 콘텐츠나 아이디어를 만들어본다.', type: 'create' },
    ],
  },
  {
    id: 5,
    text: 'SNS가 비평에 가져온 가장 흥미로운 변화는 무엇이라고 생각하나요?',
    options: [
      { label: 'A', text: '글, 사진, 영상이 결합된 새로운 비평 콘텐츠가 만들어지는 것', type: 'create' },
      { label: 'B', text: '공연에 대한 반응과 정보가 빠르게 기록되는 것', type: 'archive' },
      { label: 'C', text: '작품을 바라보는 다양한 관점과 해석이 등장하는 것', type: 'interpret' },
      { label: 'D', text: '관객, 무용가, 비평가가 직접 반응하고 대화하는 것', type: 'connect' },
    ],
  },
  {
    id: 6,
    text: '당신이 생각하는 비평의 가장 중요한 역할은 무엇인가요?',
    options: [
      { label: 'A', text: '작품과 그 시대의 모습을 사라지지 않도록 남기는 것', type: 'archive' },
      { label: 'B', text: '작품이 지닌 의미를 발견하고 새로운 관점을 제시하는 것', type: 'interpret' },
      { label: 'C', text: '작품과 사람, 서로 다른 생각을 이어주는 것', type: 'connect' },
      { label: 'D', text: '작품에서 출발해 또 다른 글과 이미지, 생각을 만들어 내는 것', type: 'create' },
    ],
  },
];

/**
 * answers: ['archive', 'interpret', ...] — 질문 순서대로 6개
 * 반환: { primary, secondary, dominantColor }
 */
export function calcResult(answers) {
  const scores = { archive: 0, interpret: 0, connect: 0, create: 0 };
  answers.forEach((type) => {
    if (type) scores[type] += 1;
  });

  const maxScore = Math.max(...Object.values(scores));
  const topTypes = Object.keys(scores).filter((t) => scores[t] === maxScore);
  const tiebreaker = answers[5];

  if (topTypes.length === 1) {
    return {
      primary: TYPES[topTypes[0]],
      secondary: null,
      dominantColor: TYPES[topTypes[0]].color,
    };
  } else if (topTypes.length === 2) {
    const dominant = topTypes.includes(tiebreaker) ? tiebreaker : topTypes[0];
    return {
      primary: TYPES[topTypes[0]],
      secondary: TYPES[topTypes[1]],
      dominantColor: TYPES[dominant].color,
    };
  } else {
    const rep = TYPES[tiebreaker] || TYPES[topTypes[0]];
    return { primary: rep, secondary: null, dominantColor: rep.color };
  }
}
