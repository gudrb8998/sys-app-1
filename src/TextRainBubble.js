import React, { useEffect, useRef } from 'react';
import './TextRainBubble.css';
import { generateHangulPool, createRaindrop } from './textRainData';

const TextRainBubble = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let drops = [];
    let lastSpawnTime = 0;
    const pool = generateHangulPool(200);
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const spawnDrop = (time) => {
      if (drops.length < 120 && time - lastSpawnTime > 80) {
        const drop = createRaindrop(canvas.width, pool);
        
        // Add bubble-specific properties
        drop.pulseSpeed = 0.001 + Math.random() * 0.002;
        drop.pulsePhase = Math.random() * Math.PI * 2;
        drop.driftSpeed = 0.0005 + Math.random() * 0.001;
        drop.driftPhase = Math.random() * Math.PI * 2;
        drop.driftAmount = 20 + Math.random() * 20;
        drop.state = 'falling'; // 'falling' or 'popping'
        drop.popScale = 1;
        
        drops.push(drop);
        lastSpawnTime = time;
      }
    };
    
    const render = (time) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      spawnDrop(time);
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        
        if (drop.state === 'falling') {
          drop.y += drop.speed;
          
          if (drop.y > canvas.height - drop.size * 2) {
            drop.state = 'popping';
          }
        }
        
        let currentScale = 1;
        let currentOpacity = drop.opacity !== undefined ? drop.opacity : 1;
        
        if (drop.state === 'falling') {
          currentScale = 1.0 + Math.sin(time * drop.pulseSpeed + drop.pulsePhase) * 0.4;
        } else if (drop.state === 'popping') {
          drop.popScale += 0.05;
          currentScale = (1.0 + Math.sin(time * drop.pulseSpeed + drop.pulsePhase) * 0.4) * drop.popScale;
          currentOpacity -= 0.05;
          if (currentOpacity <= 0) {
            drops.splice(i, 1);
            continue;
          }
        }
        
        const xOffset = Math.sin(time * drop.driftSpeed + drop.driftPhase) * drop.driftAmount;
        const currentX = drop.x + xOffset;
        const radius = drop.size * currentScale * 0.8;
        
        // Bubble Fill
        ctx.globalAlpha = currentOpacity * 0.05;
        ctx.fillStyle = drop.color;
        ctx.beginPath();
        ctx.arc(currentX, drop.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bubble Stroke
        ctx.globalAlpha = currentOpacity * 0.3;
        ctx.strokeStyle = drop.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Character
        ctx.globalAlpha = currentOpacity;
        ctx.font = `${drop.size * currentScale}px "Malgun Gothic", sans-serif`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = drop.color;
        ctx.fillStyle = drop.color;
        ctx.fillText(drop.char, currentX, drop.y);

        // Reset
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
    <div className="text-rain-bubble-container">
      <canvas ref={canvasRef} className="text-rain-bubble-canvas" />
    </div>
  );
};

export default TextRainBubble;
