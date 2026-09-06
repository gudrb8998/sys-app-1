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
    
    let fadingOutBubbles = [];
    let detachedBubbles = []; 
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
      if (timestamp - lastClusterSpawnTime > 4000 && spawnQueue.length > 0) {
        const item = spawnQueue.shift();
        
        const lane = clustersSpawned % 3;
        const laneWidth = width / 3;
        const startX = laneWidth * lane + laneWidth / 2 + (Math.random() - 0.5) * (laneWidth * 0.5);

        const newCluster = {
          x: startX,
          y: -50,
          circles: [
            { 
              isCenter: true, 
              dx: 0, 
              dy: 0, 
              radius: 55, 
              word: item.centerWord,
              color: getRandomColor(),
              pulseSpeed: 0.002,
              pulsePhase: Math.random() * Math.PI * 2
            }
          ],
          pendingSatellites: item.satellites,
          lastSatSpawnTime: timestamp,
          landed: false,
          speedY: 0.6 + Math.random() * 0.1,
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
          
          // 바닥 충돌 체크
          const myBottomExt = cluster.circles.length > 0 ? Math.max(...cluster.circles.map(c => c.dy + c.radius)) : 0;
          const floorY = height - 10 - myBottomExt;
          
          if (cluster.y >= floorY) {
            if (!cluster.shedSatellites) {
              // 처음 닿는 순간: 위성들을 분리하고 단어1도 detachedBubble로 전환
              cluster.shedSatellites = true;
              const satellites = cluster.circles.filter(c => !c.isCenter);
              const center = cluster.circles.find(c => c.isCenter);

              // 위성들을 detachedBubble로 전환
              satellites.forEach(c => {
                detachedBubbles.push({
                  word: c.word,
                  color: c.color,
                  radius: c.radius,
                  x: cluster.x + c.dx,
                  y: cluster.y + c.dy,
                  vy: 0,
                  pulseSpeed: c.pulseSpeed,
                  pulsePhase: c.pulsePhase,
                  fadeIn: c.fadeIn
                });
              });

              // 단어1도 자연스럽게 떨어지도록 detachedBubble로 전환
              if (center) {
                detachedBubbles.push({
                  word: center.word,
                  color: center.color,
                  radius: center.radius,
                  x: cluster.x,
                  y: cluster.y,
                  vy: cluster.speedY, // 현재 낙하 속도 그대로 이어받음
                  pulseSpeed: center.pulseSpeed,
                  pulsePhase: center.pulsePhase,
                  fadeIn: 1,
                  isCenter: true,   // 단어1 구분 플래그 (렌더링 크기 구분용)
                });
              }

              // 군집 제거
              cluster.landed = true;
              cluster.circles = [];
            }
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
            speed: 1.5 + Math.random() * 0.7, // 위성 날아오는 속도
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

        // target 군집이 이미 해체(circles 비어있음)된 경우 즉시 detachedBubble로 전환
        if (target.shedSatellites && target.circles.length === 0) {
          detachedBubbles.push({
            word: bubble.word,
            color: bubble.color,
            radius: bubble.radius,
            x: bubble.x,
            y: bubble.y,
            vy: 0,
            pulseSpeed: bubble.pulseSpeed,
            pulsePhase: bubble.pulsePhase,
            fadeIn: 1.0
          });
          freeBubbles.splice(i, 1);
          continue;
        }

        // 화면 밖으로 벗어난 freeBubble 제거
        if (bubble.y > height + 100) {
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
          if (target.shedSatellites) {
            // 이미 군집이 바닥에 닿아 위성들을 모두 해체한 상태라면, 지각한 위성은 붙지 않고 즉시 바닥으로 떨어짐
            detachedBubbles.push({
              word: bubble.word,
              color: bubble.color,
              radius: bubble.radius,
              x: bubble.x,
              y: bubble.y,
              vy: 0,
              pulseSpeed: bubble.pulseSpeed,
              pulsePhase: bubble.pulsePhase,
              fadeIn: 1.0
            });
            freeBubbles.splice(i, 1);
            continue;
          }

          // 닿는 순간 그 자리에서 서서히 사라지도록 fadingOutBubbles에 추가
          // center circle이 없으면(cluster 해체된 경우) detachedBubble로 즉시 전환
          const centerCircle = target.circles.find(c => c.isCenter);
          if (!centerCircle) {
            detachedBubbles.push({
              word: bubble.word,
              color: bubble.color,
              radius: bubble.radius,
              x: bubble.x,
              y: bubble.y,
              vy: 0,
              pulseSpeed: bubble.pulseSpeed,
              pulsePhase: bubble.pulsePhase,
              fadeIn: 1.0
            });
            freeBubbles.splice(i, 1);
            continue;
          }

          fadingOutBubbles.push({
            word: bubble.word,
            color: bubble.color,
            radius: bubble.radius,
            x: bubble.x,
            y: bubble.y,
            opacity: 1.0,
            pulseSpeed: bubble.pulseSpeed,
            pulsePhase: bubble.pulsePhase
          });

          // 목표 빈자리로 순간이동하되 투명하게(fadeIn=0) 추가하여 서서히 나타나도록 설정
          const attachAngle = Math.random() * Math.PI * 2;
          const attachDist = centerCircle.radius + bubble.radius;
          
          target.circles.push({
            isCenter: false,
            word: bubble.word,
            color: bubble.color,
            radius: bubble.radius,
            dx: Math.cos(attachAngle) * attachDist,
            dy: Math.sin(attachAngle) * attachDist,
            fadeIn: 0.0,
            pulseSpeed: bubble.pulseSpeed,
            pulsePhase: bubble.pulsePhase
          });
          
          freeBubbles.splice(i, 1);
        }
      }

      // 3.5 분리된 단어2들 물리 (자연스럽게 바닥으로 떨어지기)
      detachedBubbles.forEach(b => {
         b.vy += 0.1; // 부드러운 중력
         b.y += b.vy;
         
         // 바닥 충돌 (튕기지 않고 그냥 멈춤)
         if (b.y > height - b.radius) {
            b.y = height - b.radius;
            b.vy = 0;
         }
      });
      


      // 4. 렌더링
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      clusters.forEach(cluster => {
        
        // 위성 먼저 렌더링
        cluster.circles.forEach(c => {
          if (c.isCenter) return;
          const sx = cluster.x + c.dx;
          const sy = cluster.y + c.dy;
          
          if (c.fadeIn !== undefined && c.fadeIn < 1.0) {
            c.fadeIn += 0.05;
            if (c.fadeIn > 1.0) c.fadeIn = 1.0;
          }
          const alphaMult = c.fadeIn !== undefined ? c.fadeIn : 1.0;
          
          const currentScale = 1.0 + Math.sin(timestamp * c.pulseSpeed + c.pulsePhase) * 0.1;
          const currentRadius = c.radius * currentScale;
          
          // Bubble Fill
          ctx.globalAlpha = 0.05 * alphaMult;
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(sx, sy, currentRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Bubble Stroke
          ctx.globalAlpha = 0.3 * alphaMult;
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Text
          ctx.globalAlpha = 1.0 * alphaMult;
          ctx.shadowBlur = 10;
          ctx.shadowColor = c.color;
          ctx.fillStyle = c.color;
          ctx.font = `${9 * currentScale}px "Malgun Gothic", sans-serif`;
          ctx.fillText(c.word, sx, sy);
          ctx.shadowBlur = 0;
        });

        // 중심 단어 렌더링
        const center = cluster.circles.find(c => c.isCenter);
        if (!center) return; // circles가 비어있으면 렌더링 skip
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
        ctx.font = `bold ${28 * currentScale}px "Malgun Gothic", sans-serif`;
        ctx.fillText(center.word, cluster.x + center.dx, cluster.y + center.dy);
        ctx.shadowBlur = 0;
      });


      // 4.5 분리된 단어2 렌더링
      detachedBubbles.forEach(b => {
        if (b.fadeIn !== undefined && b.fadeIn < 1.0) {
          b.fadeIn += 0.05;
          if (b.fadeIn > 1.0) b.fadeIn = 1.0;
        }
        const alphaMult = b.fadeIn !== undefined ? b.fadeIn : 1.0;
        
        const currentScale = 1.0 + Math.sin(timestamp * b.pulseSpeed + b.pulsePhase) * 0.1;
        const currentRadius = b.radius * currentScale;
        
        ctx.globalAlpha = 0.05 * alphaMult;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.3 * alphaMult;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.globalAlpha = 1.0 * alphaMult;
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        // 단어1(isCenter)은 큰 폰트, 단어2는 작은 폰트
        const fontSize = b.isCenter ? 28 : 9;
        ctx.font = `${fontSize * currentScale}px "Malgun Gothic", sans-serif`;
        ctx.fillText(b.word, b.x, b.y);
        ctx.shadowBlur = 0;
      });
      
      // 5. 서서히 사라지는 물방울 렌더링
      for (let i = fadingOutBubbles.length - 1; i >= 0; i--) {
        const b = fadingOutBubbles[i];
        b.opacity -= 0.05;
        if (b.opacity <= 0) {
          fadingOutBubbles.splice(i, 1);
          continue;
        }
        
        const currentScale = 1.0 + Math.sin(timestamp * b.pulseSpeed + b.pulsePhase) * 0.1;
        const currentRadius = b.radius * currentScale;
        
        ctx.globalAlpha = 0.05 * b.opacity;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.3 * b.opacity;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.globalAlpha = 1.0 * b.opacity;
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.font = `${9 * currentScale}px "Malgun Gothic", sans-serif`;
        ctx.fillText(b.word, b.x, b.y);
        ctx.shadowBlur = 0;
      }
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
