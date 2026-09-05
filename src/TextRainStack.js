import React, { useRef, useEffect } from 'react';
import './TextRainStack.css';
import { generateHangulPool, createRaindrop } from './textRainData';

const TextRainStack = () => {
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

    // 쌓인 단어 목록: { char, x, y, color, width }
    let stackedWords = [];
    let lastSpawnTime = 0;
    let isFadingOut = false;
    let fadeOutAlpha = 1.0;

    const fontSize = 18;

    /**
     * 떨어지는 단어가 쌓일 수 있는 y 위치를 계산합니다.
     * 기존 쌓인 단어들과 겹치는지 확인하여 가장 높은 바닥을 반환합니다.
     */
    const getStackY = (dropX, dropWidth) => {
      let floorY = height;
      for (const sw of stackedWords) {
        // x 범위가 겹치는지 확인
        if (dropX + dropWidth > sw.x && dropX < sw.x + sw.width) {
          floorY = Math.min(floorY, sw.y);
        }
      }
      return floorY;
    };

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
    };

    window.addEventListener('resize', handleResize);

    const render = (timestamp) => {
      // 잔상 효과
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      if (timestamp - lastSpawnTime > 120) {
        spawnDrop();
        lastSpawnTime = timestamp;
      }

      // 쌓인 높이 확인 → 80% 이상이면 페이드아웃
      let minY = height;
      for (const sw of stackedWords) {
        if (sw.y < minY) minY = sw.y;
      }
      if (height - minY > height * 0.8 && !isFadingOut) {
        isFadingOut = true;
      }

      if (isFadingOut) {
        fadeOutAlpha -= 0.01;
        if (fadeOutAlpha <= 0) {
          stackedWords = [];
          fallingDrops = [];
          isFadingOut = false;
          fadeOutAlpha = 1.0;
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
      for (let i = fallingDrops.length - 1; i >= 0; i--) {
        const drop = fallingDrops[i];
        const textWidth = ctx.measureText(drop.char).width;

        const stackY = getStackY(drop.x, textWidth);

        drop.y += drop.speed;

        // 충돌 확인 (단어의 하단이 바닥/스택에 닿으면)
        if (drop.y >= stackY) {
          if (!isFadingOut) {
            stackedWords.push({
              char: drop.char,
              x: drop.x,
              y: stackY,
              color: drop.color,
              width: textWidth,
            });
          }
          fallingDrops.splice(i, 1);
          continue;
        }

        // 떨어지는 단어 그리기
        ctx.fillStyle = drop.color;
        ctx.globalAlpha = drop.opacity * (isFadingOut ? fadeOutAlpha : 1.0);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        // 글로우 효과
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

export default TextRainStack;
