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

    // 쌓인 단어 목록: { char, x, y, color, w, h }
    // y는 단어 상단 기준 (top), h는 높이
    let stackedWords = [];
    let lastSpawnTime = 0;
    let isFadingOut = false;
    let fadeOutAlpha = 1.0;

    const fontSize = 18;
    const lineHeight = fontSize + 4;

    /**
     * 떨어지는 단어가 멈출 y 위치를 계산합니다.
     * 해당 단어의 x 범위와 겹치는 쌓인 단어 중 가장 높은 것의 상단을 반환합니다.
     */
    const getFloorY = (dropX, dropW) => {
      let floorY = height; // 바닥
      for (const sw of stackedWords) {
        // x 범위 겹침 확인
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
      // 캔버스 클리어
      ctx.fillStyle = '#000000';
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

        // 이 단어가 멈출 바닥 위치
        const floorY = getFloorY(drop.x, textWidth);
        const stopY = floorY - lineHeight;

        drop.y += drop.speed;

        // 바닥 또는 쌓인 단어 위에 도달
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
