import React, { useRef, useEffect } from 'react';
import './TextRainSprout.css';
import { generateHangulPool, createRaindrop } from './textRainData';
import ngramCsvPath from './ngram.csv';

// gram_size에 따른 색상 (Hue) 할당
const getHueForGramSize = (size) => {
  switch (Number(size)) {
    case 2: return 210; // 파랑
    case 3: return 120; // 초록
    case 4: return 60;  // 노랑
    default: return 0;  // 빨강 (5 이상)
  }
};

const TextRainSprout = () => {
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

    // 1. 토양 세팅 (기존 200단어 바닥에 미리 깔기)
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
        scale: 1, // 토양은 이미 완성 상태
        isBase: true,
      });
    }

    let whiteProgress = 0;
    
    // 2. CSV 로드 및 Sprout 큐 준비
    fetch(ngramCsvPath)
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split('\n').slice(1); // 헤더 제외
        const parsed = lines.map(line => {
          const [gramSize, word, freq] = line.split(',');
          return {
            gramSize: Number(gramSize),
            word: word ? word.replace(/_/g, ' ') : '', // _를 공백으로
            freq: Number(freq)
          };
        }).filter(item => item.word);
        
        parsed.sort((a, b) => b.freq - a.freq);
        
        const maxFreq = parsed[0]?.freq || 1;
        
        // 큐에 넣기 (스폰 대기열)
        sproutQueue = parsed.map(item => {
          const hue = getHueForGramSize(item.gramSize);
          
          // 빈도가 높을수록 명도 50~90%, 투명도 1.0. 낮을수록 명도 낮고 투명도 0.5
          const freqRatio = item.freq / maxFreq; 
          const lightness = 40 + (50 * freqRatio);
          const opacity = 0.4 + (0.6 * freqRatio);
          
          return {
            char: item.word,
            color: `hsla(${hue}, 80%, ${lightness}%, ${opacity})`,
          };
        });

        isDataLoaded = true;
      });

    let lastSpawnTime = 0;

    const spawnSprout = () => {
      if (sproutQueue.length > 0) {
        const item = sproutQueue.shift();
        const textWidth = ctx.measureText(item.char).width;
        const spawnX = Math.random() * (width - textWidth);
        
        const floorY = getFloorY(spawnX, textWidth);
        const stopY = floorY - lineHeight;

        const newSprout = {
          char: item.char,
          x: spawnX,
          y: stopY,
          color: item.color,
          w: textWidth,
          h: lineHeight,
          scale: 0, // 0에서 시작해서 위로 자라남
        };

        stackedWords.push(newSprout);
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      // 화면이 리사이즈되면 깔끔하게 처음부터 다시 시작 (데이터 큐 등은 유지 불가하므로 리로드 유도 또는 단순 캔버스 조정)
      // 여기서는 캔버스 크기만 맞춥니다.
    };

    window.addEventListener('resize', handleResize);

    const render = (timestamp) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 토양 단어들이 하얀색으로 변환되는 진행도
      if (whiteProgress < 1) {
        whiteProgress += 0.003;
        if (whiteProgress > 1) whiteProgress = 1;
      }

      // 싹은 하얀색 변환이 끝난 후에 천천히 나타나기 시작
      if (isDataLoaded && whiteProgress >= 1 && timestamp - lastSpawnTime > 150) {
        spawnSprout();
        spawnSprout(); // 한 번에 2개씩만 스폰 (기존 5개에서 감소)
        lastSpawnTime = timestamp;
      }

      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      for (const sw of stackedWords) {
        // 자라나는 애니메이션 속도 감소 (기존 0.05 -> 0.02)
        if (sw.scale < 1) {
          sw.scale += 0.02;
          if (sw.scale > 1) sw.scale = 1;
        }

        if (sw.isBase) {
          // 토양(200단어)은 서서히 하얀색으로 변환
          const lightness = 65 + (35 * whiteProgress);
          const saturation = 80 - (80 * whiteProgress);
          ctx.fillStyle = `hsl(${sw.hue}, ${saturation}%, ${lightness}%)`;
        } else {
          // 싹(ngram 데이터)은 할당받은 본래 색상 사용
          ctx.fillStyle = sw.color;
        }
        
        // Scale 애니메이션 적용을 위한 transform (하단 고정, 위로 자라남)
        ctx.save();
        ctx.translate(sw.x, sw.y + sw.h); // 단어 바닥 기준점으로 이동
        ctx.scale(1, sw.scale); // y축으로만 늘어남
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(sw.char, 0, -sw.h);
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
    <div className="text-rain-sprout-container">
      <canvas ref={canvasRef} className="text-rain-sprout-canvas" />
    </div>
  );
};

export default TextRainSprout;
