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

const getRandomStyle = (isLeft) => {
  const minFont = 40;
  const maxFont = 100;
  const fontSize = Math.floor(Math.random() * (maxFont - minFont + 1)) + minFont;

  // HSL 랜덤 색상
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 51) + 50; // 50~100%
  const lightness = Math.floor(Math.random() * 31) + 40; // 40~70%
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  const top = Math.random() * 80;      // 영역 내 세로 위치
  const left = Math.random() * 100;    // 영역 내부 0~100%
  const isVertical = Math.random() < 0.5;

  return { fontSize, color, top: `${top}%`, left: `${left}%`, isVertical };
};

const Main = () => {
  const [leftAnswers, setLeftAnswers] = useState([]);
  const [rightAnswers, setRightAnswers] = useState([]);

  useEffect(() => {
    const q1 = query(answersCollection, where('questionNumber', '==', 1));
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const newAnswers = snapshot.docs
        .filter(doc => !leftAnswers.some(a => a.id === doc.id))
        .map(doc => ({ id: doc.id, text: doc.data().text, style: getRandomStyle(true) }));
      if (newAnswers.length > 0) setLeftAnswers(prev => [...prev, ...newAnswers]);
    });

    const q2 = query(answersCollection, where('questionNumber', '==', 2));
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const newAnswers = snapshot.docs
        .filter(doc => !rightAnswers.some(a => a.id === doc.id))
        .map(doc => ({ id: doc.id, text: doc.data().text, style: getRandomStyle(false) }));
      if (newAnswers.length > 0) setRightAnswers(prev => [...prev, ...newAnswers]);
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

      {/* 왼쪽 영역 */}
      <div className="left-area">
        {leftAnswers.map(a => (
          <div
            key={a.id}
            className={`floating-text ${a.style.isVertical ? 'vertical' : ''}`}
            style={{ ...a.style }}
          >
            {a.text}
          </div>
        ))}
      </div>

      {/* 오른쪽 영역 */}
      <div className="right-area">
        {rightAnswers.map(a => (
          <div
            key={a.id}
            className={`floating-text ${a.style.isVertical ? 'vertical' : ''}`}
            style={{ ...a.style }}
          >
            {a.text}
          </div>
        ))}
      </div>

      <div className="center-line"></div>
    </div>
  );
};

export default Main;
