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
    let originalQueue = []; // 재시작용 원본 데이터 보관

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
        // 재시작을 위해 원본 데이터 보관
        originalQueue = sortedW1.map(w1 => ({
          centerWord: w1,
          satellites: [...data[w1]]
        }));
      });

    // 설정값 로드
    const savedLaneCount = parseInt(localStorage.getItem('bubbleLaneCount'), 10) || 2;
    const spawnInterval = parseInt(localStorage.getItem('bubbleSpawnInterval'), 10) || 10000;

    let lastClusterSpawnTime = 0;
    let clustersSpawned = 0;
    let allDoneFrames = 0; // 재시작 전 대기 프레임 카운터

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    
    const render = (timestamp) => {
      ctx.shadowBlur = 0; // 프레임 시작 시 그림자 초기화 (번쩍임 릭 방지)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);


      // 1. 군집 생성
      // 모든 군집이 처리 완료되고 spawnQueue가 비었으면 재시작
      const allDone =
        spawnQueue.length === 0 &&
        originalQueue.length > 0 &&
        clusters.length > 0 &&
        clusters.every(c => c.landed) &&
        freeBubbles.length === 0 &&
        fadingOutBubbles.length === 0 &&
        detachedBubbles.every(b => b.y >= height - b.radius - 5);

      if (allDone) {
        allDoneFrames++;
      } else {
        allDoneFrames = 0;
      }

      // 바닥에 모든 단어가 안착한 후 약 3초(180프레임) 유지 후 재시작
      if (allDoneFrames > 180) {
        spawnQueue = originalQueue.map(item => ({
          centerWord: item.centerWord,
          satellites: item.satellites.map(s => ({ ...s }))
        }));
        clusters.length = 0;
        detachedBubbles.length = 0;
        freeBubbles.length = 0;
        fadingOutBubbles.length = 0;
        clustersSpawned = 0;
        allDoneFrames = 0;
        // 즉시 첫 단어1이 등장하도록 설정값만큼 대기 차감
        lastClusterSpawnTime = timestamp - spawnInterval;
      }

      if (timestamp - lastClusterSpawnTime > spawnInterval && spawnQueue.length > 0) {
        const item = spawnQueue.shift();
        
        const lane = clustersSpawned % savedLaneCount;
        const laneWidth = width / savedLaneCount;
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
        


        // 물리 엔진 (Circle Packing Relaxation) - 3회로 최적화
        for (let iter = 0; iter < 3; iter++) {
          for (let i = 0; i < cluster.circles.length; i++) {
            for (let j = i + 1; j < cluster.circles.length; j++) {
              const c1 = cluster.circles[i];
              const c2 = cluster.circles[j];
              const dx = c2.dx - c1.dx;
              const dy = c2.dy - c1.dy;
              const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
              const minDist = c1.radius + c2.radius + 1.0;
              
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
          cluster.x += Math.sin(timestamp * 0.001 + cluster.driftPhase) * 0.3;
        }

        // 바닥 충돌 체크 (landed 여부와 무관하게 바닥 뚫림 방지)
        let myBottomExt = 0;
        for (let ci = 0; ci < cluster.circles.length; ci++) {
          const val = cluster.circles[ci].dy + cluster.circles[ci].radius;
          if (val > myBottomExt) myBottomExt = val;
        }
        const floorY = height - 10 - myBottomExt;
        
        if (cluster.y >= floorY) {
          cluster.y = floorY; // 더 이상 떨어지지 않고 고정 (바닥을 뚫는 경우 위로 밀어올림)
          cluster.landed = true;
        }

        

        // 대기 중인 연결어 스폰 (화면 상단에서 비처럼 떨어지도록 변경)
        if (cluster.pendingSatellites.length > 0 && timestamp - cluster.lastSatSpawnTime > 50) {
          // freeBubbles 최대 60개 상한 - 초과 시 spawn 대기
          if (freeBubbles.length >= 60) return;

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
          ctx.fillStyle = c.color;
          ctx.font = `${9 * currentScale}px "Malgun Gothic", sans-serif`;
          ctx.fillText(c.word, sx, sy);
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
        if (b.isCenter) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = b.color;
        } else {
          ctx.shadowBlur = 0;
        }
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
        ctx.fillStyle = b.color;
        ctx.font = `${9 * currentScale}px "Malgun Gothic", sans-serif`;
        ctx.fillText(b.word, b.x, b.y);
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
        ctx.fillStyle = bubble.color;
        ctx.font = `${9 * currentScale}px "Malgun Gothic", sans-serif`;
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
    <div className="text-rain-bubble-container">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default TextRainBubble;
