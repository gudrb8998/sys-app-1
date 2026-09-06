import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BubbleSettingsPage = () => {
  const navigate = useNavigate();
  const [laneCount, setLaneCount] = useState(3);
  const [spawnInterval, setSpawnInterval] = useState(5000);

  useEffect(() => {
    const savedLaneCount = localStorage.getItem('bubbleLaneCount');
    const savedSpawnInterval = localStorage.getItem('bubbleSpawnInterval');
    
    if (savedLaneCount) setLaneCount(parseInt(savedLaneCount, 10));
    if (savedSpawnInterval) setSpawnInterval(parseInt(savedSpawnInterval, 10));
  }, []);

  const handleSave = () => {
    localStorage.setItem('bubbleLaneCount', laneCount);
    localStorage.setItem('bubbleSpawnInterval', spawnInterval);
    navigate('/text-rain-bubble');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Text Rain Bubble 설정</h1>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>
            레인 수 (화면 분할 수): {laneCount}개
          </label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={laneCount} 
            onChange={(e) => setLaneCount(parseInt(e.target.value, 10))}
            style={styles.slider}
          />
          <p style={styles.hint}>단어1이 떨어지는 가로 위치의 개수입니다. (기본: 3)</p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            스폰 간격: {(spawnInterval / 1000).toFixed(1)}초
          </label>
          <input 
            type="range" 
            min="500" 
            max="10000" 
            step="500"
            value={spawnInterval} 
            onChange={(e) => setSpawnInterval(parseInt(e.target.value, 10))}
            style={styles.slider}
          />
          <p style={styles.hint}>단어1이 새로 등장하는 간격입니다. (기본: 5.0초)</p>
        </div>

        <button style={styles.button} onClick={handleSave}>
          저장하고 적용하기
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#111',
    color: '#fff',
    fontFamily: '"Malgun Gothic", sans-serif',
  },
  card: {
    backgroundColor: '#222',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '500px',
  },
  title: {
    margin: '0 0 30px 0',
    fontSize: '24px',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: '30px',
  },
  label: {
    display: 'block',
    fontSize: '18px',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '14px',
    color: '#aaa',
    marginTop: '8px',
  },
  button: {
    width: '100%',
    padding: '15px',
    fontSize: '18px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  }
};

export default BubbleSettingsPage;
