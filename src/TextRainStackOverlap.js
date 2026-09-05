import React, { useRef, useEffect } from 'react';
import './TextRainStack.css';
import { generateHangulPool, createRaindrop } from './textRainData';

const TextRainStackOverlap = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const wordPool = generateHangulPool();
    let fallingDrops = [];
    const maxActiveDrops = 100;

    // 쌓인 단어 목록 (겹침 허용)
    let stackedWords = [];
    let lastSpawnTime = 0;
    let isFadingOut = false;
    let fadeOutAlpha = 1.0;

    const fontSize = 18;
    const lineHeight = fontSize + 4;

    // 바닥에서 현재 쌓인 높이 (단순히 행 단위로 쌓임)
    let currentStackRow = 0;
    let currentRowX = 0;

    const spawnDrop = () => {
      if (fallingDrops.length < maxActiveDrops && !isFadingOut) {
        const drop = createRaindrop(width, wordPool);
        drop.size = fontSize;
        fallingDrops.push(drop);
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      stackedWords = [];
      fallingDrops = [];
      isFadingOut = false;
      fadeOutAlpha = 1.0;
      currentStackRow = 0;
      currentRowX = 0;
    };

    window.addEventListener('resize', handleResize);

    const render = (timestamp) => {
      // 캔버스 클리어
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      if (timestamp - lastSpawnTime > 120) {
        spawnDrop();
        lastSpawnTime = timestamp;
      }

      // 쌓인 높이 확인 → 80% 이상이면 페이드아웃
      const stackHeightPx = currentStackRow * lineHeight;
      if (stackHeightPx > height * 0.8 && !isFadingOut) {
        isFadingOut = true;
      }

      if (isFadingOut) {
        fadeOutAlpha -= 0.01;
        if (fadeOutAlpha <= 0) {
          stackedWords = [];
          fallingDrops = [];
          isFadingOut = false;
          fadeOutAlpha = 1.0;
          currentStackRow = 0;
          currentRowX = 0;
        }
      }

      // 쌓인 단어 그리기
      ctx.globalAlpha = isFadingOut ? fadeOutAlpha : 1.0;
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      for (const sw of stackedWords) {
        ctx.fillStyle = sw.color;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(sw.char, sw.x, sw.y);
      }
      ctx.globalAlpha = 1.0;

      // 떨어지는 단어 업데이트 및 그리기
      ctx.font = `bold ${fontSize}px sans-serif`;
      const floorY = height - currentStackRow * lineHeight;

      for (let i = fallingDrops.length - 1; i >= 0; i--) {
        const drop = fallingDrops[i];

        drop.y += drop.speed;

        // 바닥(현재 쌓인 줄 높이)에 닿으면 쌓기
        if (drop.y >= floorY) {
          if (!isFadingOut) {
            const textWidth = ctx.measureText(drop.char).width;
            const gap = 8;

            // 현재 줄에 공간이 없으면 다음 줄로
            if (currentRowX + textWidth > width) {
              currentStackRow++;
              currentRowX = 0;
            }

            stackedWords.push({
              char: drop.char,
              x: currentRowX,
              y: height - currentStackRow * lineHeight,
              color: drop.color,
            });

            currentRowX += textWidth + gap;
          }
          fallingDrops.splice(i, 1);
          continue;
        }

        // 떨어지는 단어 그리기
        ctx.fillStyle = drop.color;
        ctx.globalAlpha = drop.opacity * (isFadingOut ? fadeOutAlpha : 1.0);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        ctx.shadowColor = drop.color;
        ctx.shadowBlur = 10;

        ctx.fillText(drop.char, drop.x, drop.y);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
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
    <div className="text-rain-stack-container">
      <canvas ref={canvasRef} className="text-rain-stack-canvas" />
    </div>
  );
};

export default TextRainStackOverlap;
