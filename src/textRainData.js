// 무작위 한글 200자 생성 및 공통 유틸리티

// 한글 유니코드 범위: 가(0xAC00) ~ 힣(0xD7A3)
const HANGUL_START = 0xac00;
const HANGUL_COUNT = 11172;

/**
 * 무작위 한글 글자 하나를 반환합니다.
 */
export function getRandomHangul() {
  const code = HANGUL_START + Math.floor(Math.random() * HANGUL_COUNT);
  return String.fromCharCode(code);
}

/**
 * count개의 무작위 한글 글자 배열을 반환합니다.
 */
export function generateHangulPool(count = 200) {
  const pool = [];
  for (let i = 0; i < count; i++) {
    pool.push(getRandomHangul());
  }
  return pool;
}

/**
 * HSL 기반 알록달록한 색상을 반환합니다.
 */
export function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 65%)`;
}

/**
 * 떨어지는 글자 하나의 초기 상태를 생성합니다.
 */
export function createRaindrop(canvasWidth, pool) {
  const char = pool[Math.floor(Math.random() * pool.length)];
  return {
    char,
    x: Math.random() * canvasWidth,
    y: -30,
    speed: 1 + Math.random() * 3,
    size: 16 + Math.floor(Math.random() * 20),
    color: getRandomColor(),
    opacity: 0.7 + Math.random() * 0.3,
  };
}
