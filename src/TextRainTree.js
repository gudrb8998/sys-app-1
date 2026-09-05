import React, { useEffect, useRef } from 'react';
import './TextRainTree.css';
import { generateHangulPool, createRaindrop } from './textRainData';

const TextRainTree = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    
    let pool = generateHangulPool(200);
    let raindrops = [];
    let caughtDrops = [];
    let branches = [];
    
    let isFading = false;
    let fadeAlpha = 1;
    
    // Generate tree branches using recursive function
    const generateTree = () => {
      branches = [];
      const rootX = width / 2;
      const rootY = height;
      const initialLength = height * 0.25;
      
      const buildTree = (x, y, angle, length, depth) => {
        if (depth === 0) return;
        
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        branches.push({ 
          startX: x, 
          startY: y, 
          endX, 
          endY, 
          depth, 
          caughtCount: 0 
        });
        
        const numBranches = Math.random() > 0.4 ? 2 : 3;
        for (let i = 0; i < numBranches; i++) {
          const nextAngle = angle + (Math.random() * 1.4 - 0.7);
          const nextLength = length * (0.6 + Math.random() * 0.2);
          buildTree(endX, endY, nextAngle, nextLength, depth - 1);
        }
      };
      
      // Start root pointing up (-PI / 2), 7 levels deep
      buildTree(rootX, rootY, -Math.PI / 2, initialLength, 7);
    };
    
    generateTree();
    
    // Helper to find shortest distance from point to line segment
    const distToSegment = (p, v, w) => {
      const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
      if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    };

    const drawTree = (alpha = 1) => {
      ctx.lineCap = 'round';
      branches.forEach(b => {
        ctx.beginPath();
        ctx.moveTo(b.startX, b.startY);
        // Using quadratic curve could make it more organic, but simple lines work well for silhouette
        ctx.lineTo(b.endX, b.endY);
        ctx.lineWidth = b.depth * 2;
        ctx.strokeStyle = `rgba(51, 51, 51, ${0.4 * alpha})`;
        ctx.stroke();
      });
    };
    
    let lastTime = 0;
    let spawnTimer = 0;
    
    const render = (time) => {
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      lastTime = time;
      
      // Clear canvas with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      // Handle fade out phase
      if (isFading) {
        fadeAlpha -= deltaTime * 0.0005;
        if (fadeAlpha <= 0) {
          fadeAlpha = 1;
          isFading = false;
          caughtDrops = [];
          pool.push(...generateHangulPool());
          generateTree(); // Regenerate tree for a new cycle
        }
      }
      
      drawTree(fadeAlpha);
      
      // Spawn new falling characters
      spawnTimer += deltaTime;
      if (spawnTimer > 100 && !isFading && pool.length > 0) {
        // Spawn 1-3 characters at a time
        const count = Math.min(Math.floor(Math.random() * 3) + 1, pool.length);
        for (let i = 0; i < count; i++) {
          const drop = createRaindrop(width, pool);
          if (drop) raindrops.push(drop);
        }
        spawnTimer = 0;
      }
      
      // Update and draw falling raindrops
      for (let i = raindrops.length - 1; i >= 0; i--) {
        const drop = raindrops[i];
        drop.y += drop.speed;
        
        let caught = false;
        
        // Collision detection with branches
        if (!isFading) {
          for (let j = 0; j < branches.length; j++) {
            const b = branches[j];
            if (b.caughtCount >= 6) continue; // Limit max characters per branch
            
            const dist = distToSegment(
              { x: drop.x, y: drop.y },
              { x: b.startX, y: b.startY },
              { x: b.endX, y: b.endY }
            );
            
            if (dist < drop.size) { // Collision confirmed
              caught = true;
              b.caughtCount++;
              caughtDrops.push({
                ...drop,
                branch: b,
                swingSeed: Math.random() * Math.PI * 2, // Random starting phase for swing
                originX: drop.x,
                originY: drop.y
              });
              break;
            }
          }
        }
        
        if (caught || drop.y > height) {
          raindrops.splice(i, 1);
        } else {
          // Draw falling drop
          ctx.font = `${drop.size}px sans-serif`;
          ctx.fillStyle = drop.color;
          ctx.globalAlpha = drop.opacity;
          ctx.fillText(drop.char, drop.x, drop.y);
          ctx.globalAlpha = 1;
        }
      }
      
      // Draw caught drops (fruits)
      caughtDrops.forEach(drop => {
        // Gentle swinging motion
        const swing = Math.sin(time * 0.002 + drop.swingSeed) * 4;
        
        ctx.font = `${drop.size}px sans-serif`;
        ctx.fillStyle = drop.color;
        ctx.globalAlpha = drop.opacity * fadeAlpha;
        
        // Glow effect
        ctx.shadowColor = drop.color;
        ctx.shadowBlur = 10;
        
        ctx.fillText(drop.char, drop.originX + swing, drop.originY);
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });
      
      // Check full condition
      if (caughtDrops.length >= 40 && !isFading) {
        isFading = true;
      }

      // 200단어 모두 소진 + 떨어지는 단어 없으면 페이드아웃 → 재시작
      if (pool.length === 0 && raindrops.length === 0 && !isFading) {
        isFading = true;
      }
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    animationFrameId = requestAnimationFrame(render);
    
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      generateTree();
      caughtDrops = [];
      raindrops = [];
      isFading = false;
      fadeAlpha = 1;
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <div className="text-rain-tree-container">
      <canvas ref={canvasRef} className="text-rain-tree-canvas" />
    </div>
  );
};

export default TextRainTree;
