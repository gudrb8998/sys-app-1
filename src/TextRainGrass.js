import React, { useRef, useEffect } from 'react';
import './TextRainGrass.css';
import { generateHangulPool, createRaindrop } from './textRainData';
import ngramCsvPath from './ngram.csv';

const getHueForGramSize = (size) => {
  switch (Number(size)) {
    case 2: return 210;
    case 3: return 120;
    case 4: return 60;
    default: return 0;
  }
};

const TextRainGrass = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const fontSize = 18;
    const lineHeight = fontSize + 4;
    ctx.font = `bold ${fontSize}px sans-serif`;

    let stackedWords = [];
    let fallingDrops = [];
    let sproutQueue = [];
    let isDataLoaded = false;



    const getFloorY = (dropX, dropW) => {
      let floorY = height;
      for (const sw of stackedWords) {
        if (dropX + dropW > sw.x && dropX < sw.x + sw.w) {
          if (sw.y < floorY) {
            floorY = sw.y;
          }
        }
      }
      return floorY;
    };

    // 1. 200단어 베이스 세팅 (랜덤 토양)
    const basePool = generateHangulPool();
    while (basePool.length > 0) {
      const drop = createRaindrop(width, basePool);
      if (!drop) break;
      const textWidth = ctx.measureText(drop.char).width;
      
      const floorY = getFloorY(drop.x, textWidth);
      const stopY = floorY - lineHeight;

      stackedWords.push({
        char: drop.char,
        x: drop.x,
        y: stopY,
        origX: drop.x,
        origY: stopY,
        origW: textWidth,
        origH: lineHeight,
        color: drop.color,
        hue: drop.color.match(/\d+/)[0],
        w: textWidth,
        h: lineHeight,
        scale: 1,
        isBase: true,
      });
    }

    // 2. 풀숲 실루엣 생성 (풀 그림자 더 크게)
    let grassBlades = [];
    for (let x = 0; x < width; x += 15) {
      const soilY = getFloorY(x, 10);
      grassBlades.push({
        x: x,
        y: soilY,
        origY: soilY,
        height: 100 + Math.random() * 150, // 풀 길이 증가 (100~250)
        origHeight: 0,
        controlX: (Math.random() - 0.5) * 60, // 곡선 폭도 조금 더 넓게
      });
    }
    // Set origHeight
    grassBlades.forEach(b => b.origHeight = b.height);

    const getGrassCatchY = (dropX) => {
      let catchY = height;
      for (const blade of grassBlades) {
        if (Math.abs(dropX - blade.x) < 15) {
          const tipY = blade.y - blade.height;
          if (tipY < catchY) catchY = tipY;
        }
      }
      return catchY;
    };

    let whiteProgress = 0;
    let grassProgress = 0;

    // 2. CSV 데이터 로드
    fetch(ngramCsvPath)
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split('\n').slice(1);
        const parsed = lines.map(line => {
          const [gramSize, word, freq] = line.split(',');
          return {
            gramSize: Number(gramSize),
            word: word ? word.replace(/_/g, ' ') : '',
            freq: Number(freq)
          };
        }).filter(item => item.word);
        
        parsed.sort((a, b) => b.freq - a.freq);
        const maxFreq = parsed[0]?.freq || 1;
        
        sproutQueue = parsed.map(item => {
          const hue = getHueForGramSize(item.gramSize);
          const freqRatio = item.freq / maxFreq; 
          const lightness = 40 + (50 * freqRatio);
          const opacity = 0.5 + (0.5 * freqRatio);
          
          return {
            char: item.word,
            color: `hsla(${hue}, 80%, ${lightness}%, ${opacity})`,
            speed: 1 + Math.random() * 1.5,
            targetScale: 1 + freqRatio * 0.5, // 빈도 높은 단어 커지는 비율 절반으로 감소 (최대 1.5배)
          };
        });

        isDataLoaded = true;
      });

    let lastSpawnTime = 0;

    const spawnRain = () => {
      if (sproutQueue.length > 0 && fallingDrops.length < 100) {
        const item = sproutQueue.shift();
        const textWidth = ctx.measureText(item.char).width;
        fallingDrops.push({
          char: item.char,
          x: Math.random() * (width - textWidth),
          y: -lineHeight,
          w: textWidth,
          color: item.color,
          speed: item.speed,
          targetScale: item.targetScale,
        });
      }
    };

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

      // 단계 1: 하얀색 변환
      if (whiteProgress < 1) {
        whiteProgress += 0.003;
        if (whiteProgress > 1) whiteProgress = 1;
      }

      const baseScale = 1 - (0.5 * whiteProgress); // 1.0 -> 0.5 물리적 스케일

      // 물리적 좌표 업데이트 (토양)
      for (const sw of stackedWords) {
        if (sw.isBase) {
          sw.w = sw.origW * baseScale;
          sw.h = sw.origH * baseScale;
          sw.y = height - (height - sw.origY) * baseScale;
          sw.x = sw.origX + (sw.origW - sw.w) / 2;
        }
      }

      // 물리적 좌표 업데이트 (풀숲)
      for (const blade of grassBlades) {
        blade.y = height - (height - blade.origY) * baseScale;
        blade.height = blade.origHeight * baseScale;
      }

      // 단계 2: 풀숲 실루엣 등장
      if (whiteProgress >= 1 && grassProgress < 1) {
        grassProgress += 0.005;
        if (grassProgress > 1) grassProgress = 1;
      }

      // 풀숲 그리기
      if (grassProgress > 0) {
        ctx.fillStyle = `rgba(51, 51, 51, ${0.4 * grassProgress})`;
        ctx.beginPath();
        grassBlades.forEach(blade => {
          ctx.moveTo(blade.x - 10, blade.y);
          ctx.quadraticCurveTo(blade.x - 10 + blade.controlX, blade.y - blade.height/2, blade.x, blade.y - blade.height);
          ctx.quadraticCurveTo(blade.x + 10 + blade.controlX, blade.y - blade.height/2, blade.x + 10, blade.y);
        });
        ctx.fill();
      }

      // 단계 3: 비 내리기 시작 (조금 더 천천히 듬성듬성 스폰)
      if (isDataLoaded && grassProgress >= 1 && timestamp - lastSpawnTime > 250) {
        spawnRain();
        // spawnRain(); 한 개씩만 떨어지도록 수정
        lastSpawnTime = timestamp;
      }

      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = `bold ${fontSize}px sans-serif`;

      // 쌓인 단어 그리기 및 자라나는(Scale) 애니메이션
      for (const sw of stackedWords) {
        if (!sw.isBase) {
          // 통통 튀는 애니메이션 제거: 1.0부터 시작해서 부드럽게 목표 크기까지 확대
          if (sw.scaleY < sw.targetScale) {
            sw.scaleY += 0.01;
            if (sw.scaleY > sw.targetScale) sw.scaleY = sw.targetScale;
          }
          if (sw.scaleX < sw.targetScale) {
            sw.scaleX += 0.01;
            if (sw.scaleX > sw.targetScale) sw.scaleX = sw.targetScale;
          }
        }

        ctx.save();

        if (sw.isBase) {
          // 토양(200단어)은 하얀색으로 변하며 서서히 작아짐 (1.0 -> 0.5)
          const lightness = 65 + (35 * whiteProgress);
          const saturation = 80 - (80 * whiteProgress);
          ctx.fillStyle = `hsl(${sw.hue}, ${saturation}%, ${lightness}%)`;
          
          // 이미 물리적 좌표(x,y)가 계산되었으므로, 해당 위치에서 스케일만 적용
          ctx.translate(sw.x, sw.y);
          ctx.scale(baseScale, baseScale);
          ctx.fillText(sw.char, 0, 0);
        } else {
          // 싹(ngram 데이터)은 할당받은 본래 색상 사용
          ctx.fillStyle = sw.color;
          // 좌우 균형있게 커지도록 중앙 하단 기준
          ctx.translate(sw.x + sw.w / 2, sw.y + sw.h);
          ctx.scale(sw.scaleX, sw.scaleY);
          ctx.fillText(sw.char, -sw.w / 2, -sw.h);
        }

        ctx.restore();
      }

      // 떨어지는 비 그리기 및 충돌 계산
      for (let i = fallingDrops.length - 1; i >= 0; i--) {
        const drop = fallingDrops[i];
        
        const floorY = getFloorY(drop.x, drop.w);
        const grassY = getGrassCatchY(drop.x);
        
        // 바닥 단어와 풀숲 끝부분 중 더 높은 곳(Y값이 작은 곳)에 걸림
        const stopY = Math.min(floorY, grassY) - lineHeight;

        drop.y += drop.speed;

        if (drop.y >= stopY) {
          stackedWords.push({
            char: drop.char,
            x: drop.x,
            y: stopY,
            origX: drop.x,
            origY: stopY,
            origW: drop.w,
            origH: lineHeight,
            color: drop.color,
            w: drop.w,
            h: lineHeight,
            scaleX: 1.0,
            scaleY: 1.0, // 0.1에서 시작하는 압축(튀는) 애니메이션 제거. 기본 1.0에서 목표 크기로 부드럽게 확대
            targetScale: drop.targetScale, // 최종 목표 크기
            isBase: false,
          });
          fallingDrops.splice(i, 1);
          continue;
        }

        ctx.fillStyle = drop.color;
        ctx.fillText(drop.char, drop.x, drop.y);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="text-rain-grass-container">
      <canvas ref={canvasRef} className="text-rain-grass-canvas" />
    </div>
  );
};

export default TextRainGrass;
