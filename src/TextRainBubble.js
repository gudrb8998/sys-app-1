import React, { useEffect, useRef } from 'react';
import './TextRainBubble.css';
import { getRandomColor } from './textRainData';
import sample3CsvPath from './sample3_words.csv';

const TextRainBubble = () => {
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
    let scatteredBubbles = []; 
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
          const topSatellites = data[w1]; // 전체 단어 모두 포함
          
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
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 1. 군집 생성
      if (timestamp - lastClusterSpawnTime > 2000 && spawnQueue.length > 0) {
        const item = spawnQueue.shift();
        
        const lane = clustersSpawned % 4;
        const laneWidth = width / 4;
        const startX = laneWidth * lane + laneWidth / 2 + (Math.random() - 0.5) * (laneWidth * 0.5);

        const newCluster = {
          x: startX,
          y: -50,
          circles: [
            { 
              isCenter: true, 
              dx: 0, 
              dy: 0, 
              radius: 35, 
              word: item.centerWord,
              color: getRandomColor(),
              pulseSpeed: 0.002,
              pulsePhase: Math.random() * Math.PI * 2
            }
          ],
          pendingSatellites: item.satellites,
          lastSatSpawnTime: timestamp,
          landed: false,
          speedY: 0.6 + Math.random() * 0.4,
          driftPhase: Math.random() * Math.PI * 2,
          satellitesSpawned: 0
        };
        clusters.push(newCluster);
        clustersSpawned++;
        lastClusterSpawnTime = timestamp;
      }
      
      // 2. 군집 및 위성단어 업데이트
      clusters.forEach(cluster => {
        // 물리 엔진 (Circle Packing Relaxation)
        for (let iter = 0; iter < 6; iter++) {
          for (let i = 0; i < cluster.circles.length; i++) {
            for (let j = i + 1; j < cluster.circles.length; j++) {
              const c1 = cluster.circles[i];
              const c2 = cluster.circles[j];
              const dx = c2.dx - c1.dx;
              const dy = c2.dy - c1.dy;
              const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
              const minDist = c1.radius + c2.radius + 1.0; // 1px 여백
              
              if (dist < minDist) {
                const pushDist = (minDist - dist) * 0.5;
                const nx = (dx / dist) * pushDist;
                const ny = (dy / dist) * pushDist;
                
                if (!c1.isCenter && !c2.isCenter) {
                  c1.dx -= nx; c1.dy -= ny;
                  c2.dx += nx; c2.dy += ny;
                } else if (c1.isCenter && !c2.isCenter) {
                  c2.dx += nx * 2; c2.dy += ny * 2;
                } else if (!c1.isCenter && c2.isCenter) {
                  c1.dx -= nx * 2; c1.dy -= ny * 2;
                }
              }
            }
          }
        }

        if (!cluster.landed) {
          cluster.y += cluster.speedY;
          // Effect 2: 좌우 흔들림 (Drift)
          cluster.x += Math.sin(timestamp * 0.001 + cluster.driftPhase) * 0.3;
          
          // 바닥 및 다른 클러스터 충돌 체크
          const myBottomExt = cluster.circles.length > 0 ? Math.max(...cluster.circles.map(c => c.dy + c.radius)) : 0;
          let floorY = height - 10 - myBottomExt;
          
          if (cluster.y >= floorY) {
            cluster.landed = true;
            cluster.burst = true;
            cluster.y = floorY;
            
            // 군집 해체 및 사방으로 흩어지기
            cluster.circles.forEach(c => {
               const globalX = cluster.x + c.dx;
               const globalY = cluster.y + c.dy;
               
               // 중심에서 바깥쪽으로 튕겨나가는 속도 부여
               const vx = c.dx === 0 ? (Math.random() - 0.5) * 4 : (c.dx * 0.1) + (Math.random() - 0.5) * 2;
               const vy = c.dy === 0 ? -Math.random() * 4 : (c.dy * 0.1) - Math.random() * 4;

               scatteredBubbles.push({
                  isCenter: c.isCenter,
                  word: c.word,
                  color: c.color,
                  radius: c.radius,
                  x: globalX,
                  y: globalY,
                  vx: vx,
                  vy: vy,
                  pulseSpeed: c.pulseSpeed,
                  pulsePhase: c.pulsePhase
               });
            });
            cluster.circles = []; // 껍데기만 남김
          }
        }

        // 대기 중인 연결어 스폰 (화면 상단에서 비처럼 떨어지도록 변경)
        if (cluster.pendingSatellites.length > 0 && timestamp - cluster.lastSatSpawnTime > 50) {
          const satItem = cluster.pendingSatellites.shift();
          
          freeBubbles.push({
            word: satItem.word,
            color: getRandomColor(),
            x: Math.random() * width, // 화면 전체 X 랜덤
            y: -50 - Math.random() * 100, // 화면 상단
            radius: Math.max(14, satItem.word.length * 6), // 글자 수에 비례하여 버블 크기 할당 (글씨 겹침 방지)
            targetCluster: cluster,
            targetAngle: cluster.satellitesSpawned * 2.39996, // 황금각(Golden Angle)을 사용하여 정확히 360도 고르게 분포
            speed: 2.5 + Math.random() * 1.5, // 중심단어보다 빠른 유도 미사일
            pulseSpeed: 0.003 + Math.random() * 0.002,
            pulsePhase: Math.random() * Math.PI * 2
          });
          cluster.satellitesSpawned++;
          cluster.lastSatSpawnTime = timestamp;
        }
      });

      // 3. 자유 낙하 연결어 업데이트 (Homing)
      for (let i = freeBubbles.length - 1; i >= 0; i--) {
        const bubble = freeBubbles[i];
        const target = bubble.targetCluster;


        
        if (target.burst || target.circles.length === 0) {
          scatteredBubbles.push({
            isCenter: false,
            word: bubble.word,
            color: bubble.color,
            radius: bubble.radius,
            x: bubble.x,
            y: bubble.y,
            vx: (Math.random() - 0.5) * 4,
            vy: bubble.speed,
            pulseSpeed: bubble.pulseSpeed,
            pulsePhase: bubble.pulsePhase
          });
          freeBubbles.splice(i, 1);
          continue;
        }
        
        const dx = target.x - bubble.x;
        const dy = target.y - bubble.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          bubble.x += (dx / dist) * bubble.speed;
          bubble.y += (dy / dist) * bubble.speed;
        }

        // 타겟 군집의 '아무 원'에나 닿았는지 체크
        let hit = false;
        for (const c of target.circles) {
          const globalCX = target.x + c.dx;
          const globalCY = target.y + c.dy;
          const hitDist = Math.hypot(globalCX - bubble.x, globalCY - bubble.y);
          if (hitDist < c.radius + bubble.radius) {
            hit = true;
            break;
          }
        }

        if (hit) {
          // 닿는 순간, 단어1(중심) 주변의 임의의 각도로 순간이동하여 부착 (이후 물리엔진이 빈자리로 쑤셔넣음)
          const attachAngle = Math.random() * Math.PI * 2;
          const attachDist = target.circles[0].radius + bubble.radius;
          
          target.circles.push({
            isCenter: false,
            word: bubble.word,
            color: bubble.color,
            radius: bubble.radius,
            dx: Math.cos(attachAngle) * attachDist,
            dy: Math.sin(attachAngle) * attachDist,
            pulseSpeed: bubble.pulseSpeed,
            pulsePhase: bubble.pulsePhase
          });
          
          freeBubbles.splice(i, 1);
        }
      }

            // 3.5 흩어진 물방울들 물리 (중력 및 상호 밀어내기)
      scatteredBubbles.forEach(b => {
         b.vy += 0.2; // 중력
         b.x += b.vx;
         b.y += b.vy;
         b.vx *= 0.98; // 마찰
         
         if (b.y > height - b.radius) {
            b.y = height - b.radius;
            b.vy *= -0.3; // 바닥 바운스
            b.vx *= 0.8;
         }
      });
      
      // 서로 밀어내어 바닥에 예쁘게 쌓이도록 (Relaxation 1 pass)
      for (let i = 0; i < scatteredBubbles.length; i++) {
        for (let j = i + 1; j < scatteredBubbles.length; j++) {
           const b1 = scatteredBubbles[i];
           const b2 = scatteredBubbles[j];
           const dx = b2.x - b1.x;
           const dy = b2.y - b1.y;
           const dist = Math.sqrt(dx*dx + dy*dy) || 0.1;
           const minDist = b1.radius + b2.radius;
           if (dist < minDist) {
              const overlap = minDist - dist;
              const nx = (dx/dist) * overlap * 0.5;
              const ny = (dy/dist) * overlap * 0.5;
              b1.x -= nx; b1.y -= ny;
              b2.x += nx; b2.y += ny;
           }
        }
      }

      // 4. 렌더링
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      clusters.forEach(cluster => {
        // 위성 먼저 렌더링
        cluster.circles.forEach(c => {
          if (c.isCenter) return;
          const sx = cluster.x + c.dx;
          const sy = cluster.y + c.dy;
          
          const currentScale = 1.0 + Math.sin(timestamp * c.pulseSpeed + c.pulsePhase) * 0.1;
          const currentRadius = c.radius * currentScale;
          
          // Bubble Fill
          ctx.globalAlpha = 0.05;
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(sx, sy, currentRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Bubble Stroke
          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Text
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 10;
          ctx.shadowColor = c.color;
          ctx.fillStyle = c.color;
          ctx.font = `${9 * currentScale}px "Malgun Gothic", sans-serif`;
          ctx.fillText(c.word, sx, sy);
          ctx.shadowBlur = 0;
        });

        // 중심 단어 렌더링
        const center = cluster.circles[0];
        const currentScale = 1.0 + Math.sin(timestamp * center.pulseSpeed + center.pulsePhase) * 0.05;
        const currentRadius = center.radius * currentScale;
        
        // Bubble Fill
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = center.color;
        ctx.beginPath();
        ctx.arc(cluster.x + center.dx, cluster.y + center.dy, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bubble Stroke
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = center.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Text
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = center.color;
        ctx.fillStyle = center.color;
        ctx.font = `bold ${20 * currentScale}px "Malgun Gothic", sans-serif`;
        ctx.fillText(center.word, cluster.x + center.dx, cluster.y + center.dy);
        ctx.shadowBlur = 0;
      });

      freeBubbles.forEach(bubble => {
        const currentScale = 1.0 + Math.sin(timestamp * bubble.pulseSpeed + bubble.pulsePhase) * 0.1;
        const currentRadius = bubble.radius * currentScale;
        
        // Bubble Fill
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = bubble.color;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bubble Stroke
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = bubble.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Text
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 10;
        ctx.shadowColor = bubble.color;
        ctx.fillStyle = bubble.color;
        ctx.font = `${9 * currentScale}px "Malgun Gothic", sans-serif`;
        ctx.fillText(bubble.word, bubble.x, bubble.y);
        ctx.shadowBlur = 0;
      });


      scatteredBubbles.forEach(b => {
        const currentScale = 1.0 + Math.sin(timestamp * b.pulseSpeed + b.pulsePhase) * (b.isCenter ? 0.05 : 0.1);
        const currentRadius = b.radius * currentScale;
        
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.isCenter ? 2 : 1.5;
        ctx.stroke();

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = b.isCenter ? 15 : 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.font = b.isCenter ? `bold ${20 * currentScale}px "Malgun Gothic", sans-serif` : `${9 * currentScale}px "Malgun Gothic", sans-serif`;
        ctx.fillText(b.word, b.x, b.y);
        ctx.shadowBlur = 0;
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
    <div className="text-rain-bubble-container">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default TextRainBubble;
