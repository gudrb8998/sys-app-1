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

// 랜덤 스타일과 rect 계산
const getRandomStyle = (text, containerWidth = 500, containerHeight = 500) => {
  const minFont = 50;
  const maxFont = 70;
  const fontSize = Math.floor(Math.random() * (maxFont - minFont + 1)) + minFont;

  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 51) + 50;
  const lightness = Math.floor(Math.random() * 31) + 40;
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  const isVertical = Math.random() < 0.3;

  const width = isVertical ? fontSize : text.length * fontSize * 0.5;
  const height = isVertical ? text.length * fontSize * 0.6 : fontSize;

  const top = Math.random() * (containerHeight - height);
  const left = Math.random() * (containerWidth - width);

  return { fontSize, color, top, left, isVertical, opacity: 1, width, height };
};

// 충돌 체크
const isOverlap = (a, b) => {
  return !(
    a.left + a.width < b.left ||
    a.left > b.left + b.width ||
    a.top + a.height < b.top ||
    a.top > b.top + b.height
  );
};

// 개별 글자 컴포넌트: fade-in 효과 + opacity 유지
const FloatingText = ({ textObj }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOpacity(textObj.style.opacity); // 겹침으로 낮춘 opacity까지 적용
    }, 50); // 짧은 딜레이
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
        transition: 'opacity 0.8s ease-in'
      }}
    >
      {textObj.text}
    </div>
  );
};

const Main = () => {
  const [leftAnswers, setLeftAnswers] = useState([]);
  const [rightAnswers, setRightAnswers] = useState([]);

  const goFull = async () => {
    const el = document.documentElement; // 또는 특정 컨테이너
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        console.log("Entered fullscreen");
      } catch (err) {
        console.error("Fullscreen failed", err);
      }
    } else {
      alert("Fullscreen API not supported.");
    }
  };

  // 새 글자 추가 및 기존 글자 opacity 조정
  const handleNewAnswers = (newItems, existingItems, setItems) => {
    const updatedExisting = existingItems.map(item => {
      const overlap = newItems.some(newItem => isOverlap(item.style, newItem.style));
      return {
        ...item,
        style: {
          ...item.style,
          opacity: item.style.opacity < 0.1 ? item.style.opacity : (overlap ? 0.1 : item.style.opacity)
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
          const style = getRandomStyle(doc.data().text, window.innerWidth/2, window.innerHeight);
          return { id: doc.id, text: doc.data().text, style };
        });

      if (newAnswers.length > 0) handleNewAnswers(newAnswers, leftAnswers, setLeftAnswers);
    });

    const q2 = query(answersCollection, where('questionNumber', '==', 2));
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const newAnswers = snapshot.docs
        .filter(doc => !rightAnswers.some(a => a.id === doc.id))
        .map(doc => {
          const style = getRandomStyle(doc.data().text, window.innerWidth/2, window.innerHeight);
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
      <button className="clear-btn" onClick={handleClear}>데이터 초기화</button>
      <button onClick={goFull}>전체화면으로</button>;
      <div className="left-area">
        {leftAnswers.map(a => <FloatingText key={a.id} textObj={a} />)}
      </div>
      <div className="right-area">
        {rightAnswers.map(a => <FloatingText key={a.id} textObj={a} />)}
      </div>
      <div className="center-line"></div>
    </div>
  );
};

export default Main;
