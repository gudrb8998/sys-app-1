import React, { useRef, useEffect } from 'react';
import './TextRainStackWhite.css';
import { generateHangulPool, createRaindrop } from './textRainData';

/**
 * 흰 배경에서 잘 보이는 진한 색상을 반환합니다.
 */
function getDarkColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 35%)`;
}

const TextRainStackWhite = () => {
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

    let stackedWords = [];
    let lastSpawnTime = 0;
    let isFadingOut = false;
    let fadeOutAlpha = 1.0;

    const fontSize = 18;
    const lineHeight = fontSize + 4;

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

    const spawnDrop = () => {
      if (fallingDrops.length < maxActiveDrops && !isFadingOut && wordPool.length > 0) {
        const drop = createRaindrop(width, wordPool);
        if (!drop) return;
        drop.size = fontSize;
        drop.color = getDarkColor();
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
      // 캔버스 클리어 (흰 배경)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      if (timestamp - lastSpawnTime > 120) {
        spawnDrop();
        lastSpawnTime = timestamp;
      }

      // 쌓인 최고 높이 확인 → 80% 이상이면 페이드아웃
      let minY = height;
      for (const sw of stackedWords) {
        if (sw.y < minY) minY = sw.y;
      }
      if (height - minY > height * 0.8 && !isFadingOut) {
        isFadingOut = true;
      }

      // 200단어 모두 소진 + 떨어지는 단어 없으면 페이드아웃 → 재시작
      if (wordPool.length === 0 && fallingDrops.length === 0 && !isFadingOut) {
        isFadingOut = true;
      }

      if (isFadingOut) {
        fadeOutAlpha -= 0.01;
        if (fadeOutAlpha <= 0) {
          stackedWords = [];
          fallingDrops = [];
          wordPool.push(...generateHangulPool());
          isFadingOut = false;
          fadeOutAlpha = 1.0;
        }
      }

      // 쌓인 단어 그리기
      ctx.globalAlpha = isFadingOut ? fadeOutAlpha : 1.0;
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
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

        const floorY = getFloorY(drop.x, textWidth);
        const stopY = floorY - lineHeight;

        drop.y += drop.speed;

        if (drop.y >= stopY) {
          if (!isFadingOut) {
            stackedWords.push({
              char: drop.char,
              x: drop.x,
              y: stopY,
              color: drop.color,
              w: textWidth,
              h: lineHeight,
            });
          }
          fallingDrops.splice(i, 1);
          continue;
        }

        // 떨어지는 단어 그리기
        ctx.fillStyle = drop.color;
        ctx.globalAlpha = drop.opacity * (isFadingOut ? fadeOutAlpha : 1.0);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        ctx.fillText(drop.char, drop.x, drop.y);

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
    <div className="text-rain-stack-white-container">
      <canvas ref={canvasRef} className="text-rain-stack-white-canvas" />
    </div>
  );
};

export default TextRainStackWhite;
