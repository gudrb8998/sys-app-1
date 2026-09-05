// src/reviewChannel.js
// BroadcastChannel + localStorage 기반 한 줄 비평 실시간 동기화 유틸

const CHANNEL_NAME = 'criticism_reviews';
const STORAGE_KEY = 'criticism_reviews';
const MAX_REVIEWS = 30;

const channel = new BroadcastChannel(CHANNEL_NAME);

/** 저장된 비평 목록 불러오기 */
export function loadStoredReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 비평 저장 및 전송 */
export function sendReview(text, type, color) {
  const review = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    type,
    color,
    timestamp: Date.now(),
  };

  // localStorage 저장 (최대 MAX_REVIEWS 유지)
  const existing = loadStoredReviews();
  const updated = [...existing, review].slice(-MAX_REVIEWS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // 다른 탭으로 브로드캐스트
  channel.postMessage({ type: 'NEW_REVIEW', review });

  return review;
}

/** 새 비평 수신 구독. 반환값은 unsubscribe 함수 */
export function subscribeReviews(onNewReview) {
  const handler = (event) => {
    if (event.data?.type === 'NEW_REVIEW') {
      onNewReview(event.data.review);
    }
  };
  channel.addEventListener('message', handler);
  return () => channel.removeEventListener('message', handler);
}

/** localStorage 초기화 */
export function clearReviews() {
  localStorage.removeItem(STORAGE_KEY);
}
