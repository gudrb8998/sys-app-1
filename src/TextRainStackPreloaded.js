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


    let stackedWords = [];

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
        hue: drop.color.match(/\d+/)[0], // hsl(hue, ...)에서 숫자만 추출
        w: textWidth,
        h: lineHeight,
      });
    }

    let whiteProgress = 0;



    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      stackedWords = [];
      fallingDrops = [];
      whiteProgress = 0;
      
      const newPool = generateHangulPool();
      ctx.font = `bold ${fontSize}px sans-serif`;
      while (newPool.length > 0) {
        const drop = createRaindrop(width, newPool);
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
        });
      }
    };

    window.addEventListener('resize', handleResize);

    const render = (timestamp) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 진행도 증가 (약 5초 동안 0에서 1로)
      if (whiteProgress < 1) {
        whiteProgress += 0.003;
        if (whiteProgress > 1) whiteProgress = 1;
      }

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = `bold ${fontSize}px sans-serif`;

      for (const sw of stackedWords) {
        // 65%에서 100%(순백색)로 서서히 밝아짐
        const lightness = 65 + (35 * whiteProgress);
        // 채도는 80%에서 0%로 서서히 빠짐 (더 깔끔한 흰색을 위해)
        const saturation = 80 - (80 * whiteProgress);
        
        ctx.fillStyle = `hsl(${sw.hue}, ${saturation}%, ${lightness}%)`;
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
