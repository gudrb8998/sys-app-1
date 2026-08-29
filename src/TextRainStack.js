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

    const charPool = generateHangulPool(200);
    let fallingDrops = [];
    const maxActiveDrops = 150;
    
    // Grid system for stacking
    const fontSize = 20;
    let cols = Math.floor(width / fontSize);
    let stackGrid = Array(cols).fill(0).map(() => []);

    let lastSpawnTime = 0;
    let isFadingOut = false;
    let fadeOutAlpha = 1.0;

    const spawnDrop = () => {
      if (fallingDrops.length < maxActiveDrops && !isFadingOut) {
        const drop = createRaindrop(width, charPool);
        // Normalize size to fontSize for stacking alignment
        drop.size = fontSize;
        // Align x to grid
        const colIndex = Math.floor(drop.x / fontSize);
        drop.x = colIndex * fontSize;
        drop.colIndex = colIndex;
        fallingDrops.push(drop);
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      // Re-initialize grid
      const newCols = Math.floor(width / fontSize);
      const newStackGrid = Array(newCols).fill(0).map(() => []);
      
      // Preserve existing stack as much as possible, mapping to new cols
      for (let c = 0; c < Math.min(cols, newCols); c++) {
          newStackGrid[c] = stackGrid[c];
      }
      cols = newCols;
      stackGrid = newStackGrid;
    };

    window.addEventListener('resize', handleResize);

    const render = (timestamp) => {
      // Background with slight trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      if (timestamp - lastSpawnTime > 100) {
        spawnDrop();
        lastSpawnTime = timestamp;
      }

      // Check max stack height
      let maxStackHeight = 0;
      for (let c = 0; c < cols; c++) {
        if (stackGrid[c] && stackGrid[c].length > maxStackHeight) {
          maxStackHeight = stackGrid[c].length;
        }
      }

      const currentMaxHeightPx = maxStackHeight * fontSize;
      if (currentMaxHeightPx > height * 0.8 && !isFadingOut) {
        isFadingOut = true;
      }

      if (isFadingOut) {
        fadeOutAlpha -= 0.01;
        if (fadeOutAlpha <= 0) {
          // Reset
          stackGrid = Array(cols).fill(0).map(() => []);
          fallingDrops = [];
          isFadingOut = false;
          fadeOutAlpha = 1.0;
        }
      }

      // Draw and update stacked drops
      ctx.globalAlpha = isFadingOut ? fadeOutAlpha : 1.0;
      ctx.shadowBlur = 0;
      for (let c = 0; c < cols; c++) {
        if (!stackGrid[c]) continue;
        for (let r = 0; r < stackGrid[c].length; r++) {
          const item = stackGrid[c][r];
          ctx.fillStyle = item.color;
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(item.char, c * fontSize + fontSize / 2, height - (r * fontSize));
        }
      }
      ctx.globalAlpha = 1.0;

      // Update and draw falling drops
      for (let i = fallingDrops.length - 1; i >= 0; i--) {
        const drop = fallingDrops[i];
        
        // Prevent drop from moving outside screen bounds if resized
        if (drop.colIndex >= cols) {
            fallingDrops.splice(i, 1);
            continue;
        }

        const colStackCount = stackGrid[drop.colIndex] ? stackGrid[drop.colIndex].length : 0;
        const stackY = height - (colStackCount * fontSize);

        drop.y += drop.speed;

        // Check collision
        if (drop.y + fontSize >= stackY) {
          // Stack it
          if (!isFadingOut && stackGrid[drop.colIndex]) {
              stackGrid[drop.colIndex].push({
                  char: drop.char,
                  color: drop.color
              });
          }
          fallingDrops.splice(i, 1);
          continue;
        }

        // Draw falling drop
        ctx.fillStyle = drop.color;
        ctx.globalAlpha = drop.opacity * (isFadingOut ? fadeOutAlpha : 1.0);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        
        // Subtle glow
        ctx.shadowColor = drop.color;
        ctx.shadowBlur = 10;

        ctx.fillText(drop.char, drop.x + fontSize / 2, drop.y);
        
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
