import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, answersCollection } from './firebase';
import './Main.css';

// 글자수 기준 줄바꿈
const formatText = (text, maxPerLine = 6) => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += text[i];
    if ((i + 1) % maxPerLine === 0 && i !== text.length - 1) {
      result += '\n';
    }
  }
  return result;
};

// 랜덤 스타일과 rect 계산 (줄바꿈 반영)
const getRandomStyle = (text, containerWidth = 500, containerHeight = 500, maxPerLine = 6) => {
  const minFont = 30;
  const maxFont = 50;
  const fontSize = Math.floor(Math.random() * (maxFont - minFont + 1)) + minFont;

  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 51) + 50;
  const lightness = Math.floor(Math.random() * 31) + 40;
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  const isVertical = Math.random() < 0.3;

  const lines = Math.ceil(text.length / maxPerLine);
  const charsInLine = Math.min(text.length, maxPerLine);

  // 글자 수 기반 width/height 계산
  const width = isVertical ? fontSize * charsInLine : fontSize * 0.5 * charsInLine;
  const height = isVertical ? fontSize * lines : fontSize * lines;

  const margin = 30;
  const maxLeft = containerWidth - width - margin;
  const maxTop = containerHeight - height - margin;

  const top = Math.random() * (maxTop - margin) + margin;
  const left = Math.random() * (maxLeft - margin) + margin;

  return { fontSize, color, top, left, isVertical, opacity: 1, width, height };
};

// 충돌 체크 개선
const isOverlap = (a, b, padding = 5) => {
  return !(
    a.left + a.width + padding < b.left ||
    a.left > b.left + b.width + padding ||
    a.top + a.height + padding < b.top ||
    a.top > b.top + b.height + padding
  );
};

// 개별 글자 컴포넌트
const FloatingText = ({ textObj }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOpacity(textObj.style.opacity);
    }, 50);
    return () => clearTimeout(timeout);
  }, [textObj]);

  return (
    <div
      className={`floating-text ${textObj.style.isVertical ? 'vertical' : ''}`}
      style={{
        fontSize: `${textObj.style.fontSize}px`,
        color: textObj.style.color,
        top: `${textObj.style.top}px`,
        left: `${textObj.style.left}px`,
        opacity,
        transition: 'opacity 0.8s ease-in',
        whiteSpace: 'pre'
      }}
    >
      {formatText(textObj.text, 6)}
    </div>
  );
};

const Main = () => {
  const [leftAnswers, setLeftAnswers] = useState([]);
  const [rightAnswers, setRightAnswers] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const goFull = async () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen();
      } catch (err) {
        console.error("Fullscreen failed", err);
      }
    } else {
      alert("Fullscreen API not supported.");
    }
  };

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
    };
  }, []);

  // 새 글자 추가 + 충돌 처리
  const handleNewAnswers = (newItems, existingItems, setItems) => {
    const updatedExisting = existingItems.map(item => {
      const hasOverlap = newItems.some(newItem => isOverlap(item.style, newItem.style, 5));
      return {
        ...item,
        style: {
          ...item.style,
          opacity: hasOverlap ? 0 : item.style.opacity
        }
      };
    });
    setItems([...updatedExisting, ...newItems]);
  };

  // Firebase 구독
  useEffect(() => {
    const q1 = query(answersCollection, where('questionNumber', '==', 1));
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const newAnswers = snapshot.docs
        .filter(doc => !leftAnswers.some(a => a.id === doc.id))
        .map(doc => {
          const style = getRandomStyle(doc.data().text, window.innerWidth / 2, window.innerHeight, 6);
          return { id: doc.id, text: doc.data().text, style };
        });
      if (newAnswers.length > 0) handleNewAnswers(newAnswers, leftAnswers, setLeftAnswers);
    });

    const q2 = query(answersCollection, where('questionNumber', '==', 2));
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const newAnswers = snapshot.docs
        .filter(doc => !rightAnswers.some(a => a.id === doc.id))
        .map(doc => {
          const style = getRandomStyle(doc.data().text, window.innerWidth / 2, window.innerHeight, 6);
          return { id: doc.id, text: doc.data().text, style };
        });
      if (newAnswers.length > 0) handleNewAnswers(newAnswers, rightAnswers, setRightAnswers);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [leftAnswers, rightAnswers]);

  const handleClear = async () => {
    const snapshot = await getDocs(answersCollection);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'answers', d.id)));
    await Promise.all(deletePromises);
    setLeftAnswers([]);
    setRightAnswers([]);
  };

  return (
    <div className="main-container">
      <button className="clear-btn" onClick={handleClear}></button>
      {!isFullscreen && <button onClick={goFull}>전체화면으로</button>}
      <div className="left-area">{leftAnswers.map(a => <FloatingText key={a.id} textObj={a} />)}</div>
      <div className="right-area">{rightAnswers.map(a => <FloatingText key={a.id} textObj={a} />)}</div>
      <div className="center-line"></div>
    </div>
  );
};

export default Main;
