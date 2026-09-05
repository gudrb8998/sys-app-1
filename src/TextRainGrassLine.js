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

    // 풀숲 실루엣 생성
    let grassBlades = [];
    for (let i = 0; i < 40; i++) {
      grassBlades.push({
        x: Math.random() * width,
        height: 100 + Math.random() * 300,
        controlX: (Math.random() - 0.5) * 150,
      });
    }

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

    const getGrassCatchY = (dropX) => {
      let catchY = height;
      for (const blade of grassBlades) {
        // 풀 끝부분 근처(±20px)에 떨어지면 걸림
        if (Math.abs(dropX - blade.x) < 20) {
          const tipY = height - blade.height;
          if (tipY < catchY) catchY = tipY;
        }
      }
      return catchY;
    };

    // 1. 200단어 베이스 세팅
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
        color: drop.color,
        hue: drop.color.match(/\d+/)[0],
        w: textWidth,
        h: lineHeight,
        scale: 1,
        isBase: true,
      });
    }

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
            speed: 2 + Math.random() * 2, // 떨어지는 속도
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

      // 단계 2: 풀숲 실루엣 등장
      if (whiteProgress >= 1 && grassProgress < 1) {
        grassProgress += 0.005;
        if (grassProgress > 1) grassProgress = 1;
      }

      // 풀숲 그리기
      if (grassProgress > 0) {
        ctx.fillStyle = `rgba(51, 51, 51, ${0.4 * grassProgress})`;
        ctx.beginPath();
        ctx.moveTo(0, height);
        grassBlades.forEach(blade => {
          ctx.quadraticCurveTo(blade.x - 20 + blade.controlX, height - blade.height/2, blade.x, height - blade.height);
          ctx.quadraticCurveTo(blade.x + 20 + blade.controlX, height - blade.height/2, blade.x + 20, height);
        });
        ctx.lineTo(width, height);
        ctx.fill();
      }

      // 단계 3: 비 내리기 시작
      if (isDataLoaded && grassProgress >= 1 && timestamp - lastSpawnTime > 100) {
        spawnRain();
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

        if (sw.isBase) {
          const lightness = 65 + (35 * whiteProgress);
          const saturation = 80 - (80 * whiteProgress);
          ctx.fillStyle = `hsl(${sw.hue}, ${saturation}%, ${lightness}%)`;
        } else {
          ctx.fillStyle = sw.color;
        }

        ctx.fillText(sw.char, sw.x, sw.y);

        // 싹(선) 그리기
        if (!sw.isBase && sw.currentLineHeight > 0) {
          ctx.beginPath();
          ctx.strokeStyle = sw.color;
          ctx.lineWidth = 2;
          const centerX = sw.x + sw.w / 2;
          ctx.moveTo(centerX, sw.y);
          ctx.lineTo(centerX, sw.y - sw.currentLineHeight);
          ctx.stroke();
        }
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
            color: drop.color,
            w: drop.w,
            h: lineHeight,
            scale: 1, // 글자는 즉시 나타남
            targetLineHeight: 10 + Math.random() * 30, // 싹(선)이 자라날 목표 높이
            currentLineHeight: 0,
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

export default TextRainGrassLine;
