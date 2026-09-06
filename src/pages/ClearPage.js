// src/pages/ClearPage.js
import React, { useState } from 'react';
import { clearReviews, loadStoredReviews } from '../reviewChannel';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0d0d0d',
    color: '#f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    gap: '24px',
  },
  title: { fontSize: '1.2rem', color: '#888', marginBottom: '8px' },
  count: { fontSize: '2.5rem', fontWeight: 700 },
  btn: {
    background: '#e53e3e',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 40px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  done: { color: '#22C55E', fontSize: '1rem' },
};

export default function ClearPage() {
  const [count, setCount] = useState(loadStoredReviews().length);
  const [cleared, setCleared] = useState(false);

  function handleClear() {
    clearReviews();
    setCount(0);
    setCleared(true);
  }

  return (
    <div style={styles.page}>
      <p style={styles.title}>현재 저장된 한 줄 비평</p>
      <p style={styles.count}>{count}개</p>
      <button style={styles.btn} onClick={handleClear} disabled={count === 0}>
        모두 비우기
      </button>
      {cleared && <p style={styles.done}>✓ localStorage가 초기화되었습니다.</p>}
    </div>
  );
}
