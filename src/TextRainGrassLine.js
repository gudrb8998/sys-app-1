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

const TextRainGrassLine = () => {
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
        targetLineHeight: 0,
        currentLineHeight: 0,
        isBase: true,
      });
    }

    // 2. 풀숲 실루엣 생성 (토양 위에 조금 더 길게)
    let grassBlades = [];
    for (let x = 0; x < width; x += 15) {
      const soilY = getFloorY(x, 10);
      grassBlades.push({
        x: x,
        y: soilY,
        origY: soilY,
        height: 60 + Math.random() * 100, // (60~160)
        origHeight: 0,
        controlX: (Math.random() - 0.5) * 40,
      });
    }
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
          };
        });

        isDataLoaded = true;
      });

    let lastSpawnTime = 0;

    const spawnRain = () => {
      if (sproutQueue.length > 0 && fallingDrops.length < 100) {
        const item = sproutQueue.shift();
        const baseTextWidth = ctx.measureText(item.char).width;

        // 떨어질 때부터 이미 커진 크기를 가지도록 설정
        const scaledW = baseTextWidth * item.targetScale;
        const scaledH = lineHeight * item.targetScale;

        fallingDrops.push({
          char: item.char,
          x: Math.random() * (width - scaledW),
          y: -scaledH,
          w: scaledW,
          h: scaledH,
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

      const baseScale = 1 - (0.25 * whiteProgress); // 1.0 -> 0.75

      for (const sw of stackedWords) {
        if (sw.isBase) {
          sw.w = sw.origW * baseScale;
          sw.h = sw.origH * baseScale;
          sw.y = height - (height - sw.origY) * baseScale;
          sw.x = sw.origX + (sw.origW - sw.w) / 2;
        }
      }

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

      // 단계 3: 비 내리기 시작
      if (isDataLoaded && grassProgress >= 1 && timestamp - lastSpawnTime > 250) {
        spawnRain();
        lastSpawnTime = timestamp;
      }

      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = `bold ${fontSize}px sans-serif`;

      // 쌓인 단어 및 자라나는 싹(선) 그리기
      for (const sw of stackedWords) {
        if (!sw.isBase && sw.currentLineHeight < sw.targetLineHeight) {
          sw.currentLineHeight += 0.5;
        }

        ctx.save();

        if (sw.isBase) {
          const lightness = 65 + (35 * whiteProgress);
          const saturation = 80 - (80 * whiteProgress);
          ctx.fillStyle = `hsl(${sw.hue}, ${saturation}%, ${lightness}%)`;

          ctx.translate(sw.x, sw.y);
          ctx.scale(baseScale, baseScale);
          ctx.fillText(sw.char, 0, 0);
        } else {
          // 싹(ngram 데이터)은 떨어질 때의 크기 그대로 렌더링
          ctx.fillStyle = sw.color;
          ctx.translate(sw.x, sw.y);
          ctx.scale(sw.targetScale, sw.targetScale);
          ctx.fillText(sw.char, 0, 0);

          // 싹(선) 그리기 (스케일 상태이므로 선의 높이를 스케일 역산하거나 0,0 기준에서 그립니다)
          if (sw.currentLineHeight > 0) {
            ctx.beginPath();
            ctx.strokeStyle = sw.color;
            // 스케일된 상태이므로 선 두께 조절
            ctx.lineWidth = 2 / sw.targetScale;
            // 스케일된 좌표계에서의 중심 x
            const localCenterX = (sw.w / sw.targetScale) / 2;
            ctx.moveTo(localCenterX, 0);
            ctx.lineTo(localCenterX, - (sw.currentLineHeight / sw.targetScale));
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // 떨어지는 비 그리기 및 충돌 계산
      for (let i = fallingDrops.length - 1; i >= 0; i--) {
        const drop = fallingDrops[i];
        
        const floorY = getFloorY(drop.x, drop.w);
        const grassY = getGrassCatchY(drop.x);
        
        const stopY = Math.min(floorY, grassY) - drop.h;

        drop.y += drop.speed;

        if (drop.y >= stopY) {
          stackedWords.push({
            char: drop.char,
            x: drop.x,
            y: stopY,
            origX: drop.x,
            origY: stopY,
            origW: drop.w,
            origH: drop.h,
            color: drop.color,
            w: drop.w,
            h: drop.h,
            targetScale: drop.targetScale,
            targetLineHeight: 10 + Math.random() * 30, // 싹(선)이 자라날 목표 높이
            currentLineHeight: 0,
            isBase: false,
          });
          fallingDrops.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = drop.color;
        ctx.translate(drop.x, drop.y);
        ctx.scale(drop.targetScale, drop.targetScale);
        ctx.fillText(drop.char, 0, 0);
        ctx.restore();
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

export default TextRainGrassLine;
