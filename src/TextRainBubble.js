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
              radius: 22, 
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
          driftPhase: Math.random() * Math.PI * 2, // 좌우 흔들림 위상
          ripples: [] // 합체 시 팝 이펙트를 위한 배열
        };
        clusters.push(newCluster);
        clustersSpawned++;
        lastClusterSpawnTime = timestamp;
      }
      
      // 2. 군집 및 위성단어 업데이트
      clusters.forEach(cluster => {
        // 물리 엔진 (Circle Packing Relaxation)
        for (let iter = 0; iter < 3; iter++) {
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
          const myBottomExt = Math.max(...cluster.circles.map(c => c.dy + c.radius));
          let floorY = height - 10 - myBottomExt;
          
          clusters.forEach(other => {
            if (other !== cluster && other.landed) {
              const myLeft = cluster.x + Math.min(...cluster.circles.map(c => c.dx - c.radius));
              const myRight = cluster.x + Math.max(...cluster.circles.map(c => c.dx + c.radius));
              const otherLeft = other.x + Math.min(...other.circles.map(c => c.dx - c.radius));
              const otherRight = other.x + Math.max(...other.circles.map(c => c.dx + c.radius));
              
              if (myRight > otherLeft && myLeft < otherRight) {
                const otherTop = other.y + Math.min(...other.circles.map(c => c.dy - c.radius));
                const catchY = otherTop - myBottomExt - 5;
                if (catchY < floorY) floorY = catchY;
              }
            }
          });
          
          if (cluster.y >= floorY) {
            cluster.landed = true;
            cluster.y = floorY;
          }
        }

        // 대기 중인 연결어 스폰 (전체 단어가 나오므로 생성 주기를 50ms로 단축)
        if (cluster.pendingSatellites.length > 0 && timestamp - cluster.lastSatSpawnTime > 50) {
          const satItem = cluster.pendingSatellites.shift();
          const spawnAngle = Math.random() * Math.PI * 2;
          const spawnDist = 180 + Math.random() * 50;
          
          freeBubbles.push({
            word: satItem.word,
            color: getRandomColor(),
            x: cluster.x + Math.cos(spawnAngle) * spawnDist,
            y: cluster.y + Math.sin(spawnAngle) * spawnDist,
            radius: 12,
            targetCluster: cluster,
            speed: 2.0 + Math.random() * 1.0, // 목표지점 향한 절대 속도
            pulseSpeed: 0.003 + Math.random() * 0.002,
            pulsePhase: Math.random() * Math.PI * 2
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
          target.circles.push({
            isCenter: false,
            word: bubble.word,
            color: bubble.color,
            radius: bubble.radius,
            dx: bubble.x - target.x,
            dy: bubble.y - target.y,
            pulseSpeed: bubble.pulseSpeed,
            pulsePhase: bubble.pulsePhase
          });
          
          // Effect 4: 합체 시 Pop(물결) 이펙트 추가
          target.ripples.push({
            dx: bubble.x - target.x,
            dy: bubble.y - target.y,
            startTime: timestamp
          });
          
          freeBubbles.splice(i, 1);
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
        ctx.font = `bold ${13 * currentScale}px "Malgun Gothic", sans-serif`;
        ctx.fillText(center.word, cluster.x + center.dx, cluster.y + center.dy);
        ctx.shadowBlur = 0;
        
        // Effect 4: 합체 시 물결(Ripple) 이펙트 렌더링
        cluster.ripples = cluster.ripples.filter(r => timestamp - r.startTime < 400);
        cluster.ripples.forEach(r => {
          const progress = (timestamp - r.startTime) / 400; // 0 ~ 1
          const rx = cluster.x + r.dx;
          const ry = cluster.y + r.dy;
          
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.arc(rx, ry, 20 + progress * 20, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
          ctx.lineWidth = 3 * (1 - progress);
          ctx.stroke();
        });
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
