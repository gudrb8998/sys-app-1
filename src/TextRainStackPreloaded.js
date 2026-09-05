import React, { useRef, useEffect } from 'react';
import './TextRainStack.css';
import { generateHangulPool, createRaindrop } from './textRainData';

const TextRainStackPreloaded = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const wordPool = generateHangulPool(); // 초기 200단어
    let fallingDrops = [];
    const maxActiveDrops = 100;

    let stackedWords = [];
    let lastSpawnTime = 0;

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

    // --- 초기 200단어 미리 쌓기 ---
    ctx.font = `bold ${fontSize}px sans-serif`;
    while (wordPool.length > 0) {
      const drop = createRaindrop(width, wordPool);
      if (!drop) break;
      const textWidth = ctx.measureText(drop.char).width;
      
      const floorY = getFloorY(drop.x, textWidth);
      const stopY = floorY - lineHeight;

      stackedWords.push({
        char: drop.char,
        x: drop.x,
        y: stopY,
        color: drop.color,
        w: textWidth,
        h: lineHeight,
      });
    }

    // 미리 쌓은 후, 추가로 비가 내리지 않게 풀을 리필하지 않음
    // wordPool.push(...generateHangulPool());
    // ----------------------------

    const spawnDrop = () => {
      if (fallingDrops.length < maxActiveDrops && wordPool.length > 0) {
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
    };

    window.addEventListener('resize', handleResize);

    const render = (timestamp) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      if (timestamp - lastSpawnTime > 120) {
        spawnDrop();
        lastSpawnTime = timestamp;
      }

      // 정적 화면이므로 페이드아웃 로직 제거

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      for (const sw of stackedWords) {
        ctx.fillStyle = sw.color;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(sw.char, sw.x, sw.y);
      }
      ctx.globalAlpha = 1.0;

      ctx.font = `bold ${fontSize}px sans-serif`;
      for (let i = fallingDrops.length - 1; i >= 0; i--) {
        const drop = fallingDrops[i];
        const textWidth = ctx.measureText(drop.char).width;

        const floorY = getFloorY(drop.x, textWidth);
        const stopY = floorY - lineHeight;

        drop.y += drop.speed;

        if (drop.y >= stopY) {
          stackedWords.push({
            char: drop.char,
            x: drop.x,
            y: stopY,
            color: drop.color,
            w: textWidth,
            h: lineHeight,
          });
          fallingDrops.splice(i, 1);
          continue;
        }

        ctx.fillStyle = drop.color;
        ctx.globalAlpha = drop.opacity;
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
    <div className="text-rain-stack-container">
      <canvas ref={canvasRef} className="text-rain-stack-canvas" />
    </div>
  );
};

export default TextRainStackPreloaded;
