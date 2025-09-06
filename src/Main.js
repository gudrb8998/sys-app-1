// Main.js
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

  const top = Math.random() * 80; // 화면 내 위치
  const left = isLeft ? Math.random() * 50 : 50 + Math.random() * 50; // 좌/우 영역
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
  const snapshot = await getDocs(answersCollection); // getDocs 사용
  const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'answers', d.id)));
  await Promise.all(deletePromises);

  setLeftAnswers([]);
  setRightAnswers([]);
};
  return (
    <div className="main-container">
      <button className="clear-btn" onClick={handleClear}>데이터 초기화</button>

      {leftAnswers.map(a => (
        <div
          key={a.id}
          className={`floating-text left ${a.style.isVertical ? 'vertical' : ''}`}
          style={{ ...a.style }}
        >
          {a.text}
        </div>
      ))}

      {rightAnswers.map(a => (
        <div
          key={a.id}
          className={`floating-text right ${a.style.isVertical ? 'vertical' : ''}`}
          style={{ ...a.style }}
        >
          {a.text}
        </div>
      ))}

      <div className="center-line"></div>
    </div>
  );
};

export default Main;
