import React, { useEffect, useRef } from 'react';
import './TextRainBubbleDrop.css';
import sample3CsvPath from './sample3_words.csv';

const TextRainBubbleDrop = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const targetCenterWords = ['공간', '관객', '구성', '극장', '무용수', '안무', '예술', '움직임', '음악', '창작', '춤', '표현'];
    
    let clusters = []; 
    let freeBubbles = []; 
    let spawnQueue = []; 

    let animationFrameId;

    fetch(sample3CsvPath)
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split('\n').slice(1);
        const data = {};
        
        lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 3) {
            const w1 = parts[0].trim();
            const w2 = parts[1].trim();
            const freq = Number(parts[2].trim());
            
            if (targetCenterWords.includes(w1)) {
              if (!data[w1]) data[w1] = [];
              data[w1].push({ word: w2, freq });
            }
          }
        });

        const sortedW1 = Object.keys(data).sort();
        
        sortedW1.forEach(w1 => {
          data[w1].sort((a, b) => b.freq - a.freq);
          const topSatellites = data[w1].slice(0, 15);
          
          spawnQueue.push({
            centerWord: w1,
            satellites: topSatellites
          });
        });
      });

    let lastClusterSpawnTime = 0;
    let clustersSpawned = 0;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    
    const render = (timestamp) => {
      ctx.clearRect(0, 0, width, height);

      // 1. 군집 생성
      if (timestamp - lastClusterSpawnTime > 2000 && spawnQueue.length > 0) {
        const item = spawnQueue.shift();
        
        // 화면을 4개의 레인으로 나누어 고르게 떨어지도록 배치 (너무 높게 쌓이는 것 방지)
        const lane = clustersSpawned % 4;
        const laneWidth = width / 4;
        const startX = laneWidth * lane + laneWidth / 2 + (Math.random() - 0.5) * (laneWidth * 0.5);

        const newCluster = {
          x: startX,
          y: -50,
          radius: 35, // 초기 중심 버블 크기
          word: item.centerWord,
          satellites: [],
          pendingSatellites: item.satellites,
          lastSatSpawnTime: timestamp,
          landed: false,
          speedY: 0.6 + Math.random() * 0.4, // 매우 천천히 떨어짐
        };
        clusters.push(newCluster);
        clustersSpawned++;
        lastClusterSpawnTime = timestamp;
      }
      
      // 2. 군집 및 위성단어 업데이트
      clusters.forEach(cluster => {
        if (!cluster.landed) {
          cluster.y += cluster.speedY;
          
          // 바닥 및 다른 클러스터 충돌 체크
          let floorY = height - cluster.radius - 10;
          clusters.forEach(other => {
            if (other !== cluster && other.landed) {
              const dx = other.x - cluster.x;
              // x축으로 겹치는 경우에만 쌓임
              if (Math.abs(dx) < (cluster.radius + other.radius + 15)) {
                const catchY = other.y - (other.radius + cluster.radius) * 0.9; 
                if (catchY < floorY) floorY = catchY;
              }
            }
          });
          
          if (cluster.y >= floorY) {
            cluster.landed = true;
            cluster.y = floorY;
          }
        }

        // 대기 중인 연결어 스폰 (조금 빠르게 여러개가 붙도록 시간차 조절)
        if (cluster.pendingSatellites.length > 0 && timestamp - cluster.lastSatSpawnTime > 150) {
          const satItem = cluster.pendingSatellites.shift();
          
          freeBubbles.push({
            word: satItem.word,
            x: cluster.x + (Math.random() - 0.5) * 200,
            y: cluster.y - 120 - Math.random() * 50,
            radius: 20,
            targetCluster: cluster,
            speedY: 2.5 + Math.random(), // 중심단어보다 빠른 낙하
          });
          cluster.lastSatSpawnTime = timestamp;
        }
      });

      // 3. 자유 낙하 연결어 업데이트 (Homing)
      for (let i = freeBubbles.length - 1; i >= 0; i--) {
        const bubble = freeBubbles[i];
        const target = bubble.targetCluster;

        const dx = target.x - bubble.x;
        const dy = target.y - bubble.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
          bubble.x += (dx / dist) * 2.0; // 타겟을 향해 이동
        }
        bubble.y += bubble.speedY;

        // 타겟에 도달하여 달라붙음
        if (dist < target.radius + bubble.radius * 0.8) {
          const angle = Math.atan2(bubble.y - target.y, bubble.x - target.x);
          
          target.satellites.push({
            word: bubble.word,
            angle: angle,
            radius: bubble.radius
          });
          
          // 붙을 때마다 중심 버블 크기 비례해서 증가
          target.radius += 2.5;
          
          freeBubbles.splice(i, 1);
        }
      }

      // 4. 렌더링
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 군집 그리기 (연결어가 뒤에 그려지도록 위성 먼저 렌더링)
      clusters.forEach(cluster => {
        cluster.satellites.forEach(sat => {
          // 중심 버블의 표면 근처에 붙도록 거리 계산
          const dist = cluster.radius + sat.radius * 0.3;
          const sx = cluster.x + Math.cos(sat.angle) * dist;
          const sy = cluster.y + Math.sin(sat.angle) * dist;
          
          ctx.beginPath();
          ctx.arc(sx, sy, sat.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 241, 118, 0.7)'; // 연한 노란색
          ctx.fill();

          ctx.fillStyle = '#1976d2'; // 연한 파란 글씨
          ctx.font = '12px sans-serif';
          ctx.fillText(sat.word, sx, sy);
        });

        // 중심 단어 그리기
        ctx.beginPath();
        ctx.arc(cluster.x, cluster.y, cluster.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(253, 216, 53, 1.0)'; // 진한 노란색
        ctx.fill();

        ctx.fillStyle = '#0d47a1'; // 짙은 파란 글씨
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(cluster.word, cluster.x, cluster.y);
      });

      // 대기/자유낙하 중인 연결어 렌더링
      freeBubbles.forEach(bubble => {
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 241, 118, 0.7)'; 
        ctx.fill();

        ctx.fillStyle = '#1976d2';
        ctx.font = '12px sans-serif';
        ctx.fillText(bubble.word, bubble.x, bubble.y);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="text-rain-container">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default TextRainBubbleDrop;
