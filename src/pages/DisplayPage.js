// src/pages/DisplayPage.js
import React, { useEffect, useRef, useState } from 'react';
import { loadStoredReviews, subscribeReviews } from '../reviewChannel';
import './DisplayPage.css';

const MAX_ITEMS = 30;
const FONT = 'bold 15px "Noto Sans KR", sans-serif';
const INTRO_SCALE = 2.2;  // 새 문장 초기 크기 배율
const INTRO_DURATION = 120; // 프레임 수 (~2초 @ 60fps)

function createItem(review, ctx, width, height) {
  ctx.font = FONT;
  const textW = ctx.measureText(review.text).width;
  const textH = 18;
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.35 + Math.random() * 0.3;
  return {
    id: review.id,
    text: review.text,
    color: review.color,
    x: width / 2 - textW / 2,
    y: height / 2 - textH / 2,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    w: textW,
    h: textH,
    scale: INTRO_SCALE,
    introFrames: INTRO_DURATION,
    alpha: 0,         // 페이드인 시작
    fadeOut: false,
    fadeAlpha: 1,
  };
}

export default function DisplayPage() {
  const canvasRef = useRef(null);
  const itemsRef = useRef([]);
  const rafRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // 크기 변경 시 w 재계산
      ctx.font = FONT;
      itemsRef.current.forEach((item) => {
        item.w = ctx.measureText(item.text).width;
      });
    }
    resize();
    window.addEventListener('resize', resize);

    // 기존 비평 복원
    const stored = loadStoredReviews();
    if (stored.length > 0) {
      ctx.font = FONT;
      const w = canvas.width;
      const h = canvas.height;
      itemsRef.current = stored.slice(-MAX_ITEMS).map((r) => {
        const item = createItem(r, ctx, w, h);
        // 복원된 항목은 이미 정상 크기로
        item.x = 40 + Math.random() * (w - 200);
        item.y = 40 + Math.random() * (h - 80);
        item.scale = 1;
        item.introFrames = 0;
        item.alpha = 1;
        return item;
      });
      setIsEmpty(false);
    }

    // 실시간 구독
    const unsub = subscribeReviews((review) => {
      ctx.font = FONT;
      const item = createItem(review, ctx, canvas.width, canvas.height);
      const list = [...itemsRef.current, item];
      // 최대 수 초과 시 가장 오래된 것 fade-out
      if (list.length > MAX_ITEMS) {
        list[0].fadeOut = true;
      }
      itemsRef.current = list;
      setIsEmpty(false);
    });

    // 애니메이션 루프
    function render() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      itemsRef.current = itemsRef.current.filter((item) => item.fadeAlpha > 0);

      itemsRef.current.forEach((item) => {
        // 인트로: 크기 & 알파 전환
        if (item.introFrames > 0) {
          item.introFrames -= 1;
          const progress = 1 - item.introFrames / INTRO_DURATION;
          item.scale = INTRO_SCALE - (INTRO_SCALE - 1) * progress;
          item.alpha = Math.min(1, progress * 2);
        } else {
          item.scale = 1;
          item.alpha = 1;
        }

        // fade-out
        if (item.fadeOut) {
          item.fadeAlpha -= 0.008;
        }

        // 이동
        item.x += item.vx;
        item.y += item.vy;

        // 경계 반사 (텍스트 전체가 화면 안에 유지)
        const scaledW = item.w * item.scale;
        const scaledH = item.h * item.scale;
        const margin = 20;
        if (item.x < margin) { item.x = margin; item.vx = Math.abs(item.vx); }
        if (item.x + scaledW > w - margin) { item.x = w - margin - scaledW; item.vx = -Math.abs(item.vx); }
        if (item.y < margin) { item.y = margin; item.vy = Math.abs(item.vy); }
        if (item.y + scaledH > h - margin) { item.y = h - margin - scaledH; item.vy = -Math.abs(item.vy); }

        // 그리기
        ctx.save();
        ctx.globalAlpha = item.alpha * item.fadeAlpha;
        ctx.font = `bold ${Math.round(15 * item.scale)}px "Noto Sans KR", sans-serif`;
        ctx.fillStyle = item.color;
        ctx.shadowColor = item.color;
        ctx.shadowBlur = item.scale > 1.1 ? 14 : 4;
        ctx.fillText(item.text, item.x, item.y + item.h * item.scale);
        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      unsub();
    };
  }, []);

  return (
    <div className="display-page">
      <canvas ref={canvasRef} className="display-canvas" />
      {isEmpty && (
        <div className="display-empty">
          한 줄 비평을 기다리고 있습니다…
        </div>
      )}
    </div>
  );
}
