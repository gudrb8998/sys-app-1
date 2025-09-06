import React, { useEffect, useState } from 'react';
import { db, answersCollection } from './firebase';
import { onSnapshot, query, where, deleteDoc, doc, getDocs } from 'firebase/firestore';
import './Main.css';

const Main = () => {
  const [answers1, setAnswers1] = useState([]);
  const [answers2, setAnswers2] = useState([]);

  useEffect(() => {
    const q1 = query(answersCollection, where("questionNumber", "==", 1));
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const newDocs = snapshot.docs.map(doc => doc.data());
      setAnswers1(prev => {
        const existingTexts = new Set(prev.map(a => a.text));
        const uniqueNew = newDocs.filter(a => !existingTexts.has(a.text));
        const withCoords = uniqueNew.map(a => ({
          ...a,
          x: Math.random() * 45,
          y: Math.random() * 90,
        }));
        return [...prev, ...withCoords];
      });
    });

    const q2 = query(answersCollection, where("questionNumber", "==", 2));
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const newDocs = snapshot.docs.map(doc => doc.data());
      setAnswers2(prev => {
        const existingTexts = new Set(prev.map(a => a.text));
        const uniqueNew = newDocs.filter(a => !existingTexts.has(a.text));
        const withCoords = uniqueNew.map(a => ({
          ...a,
          x: 55 + Math.random() * 45,
          y: Math.random() * 90,
        }));
        return [...prev, ...withCoords];
      });
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  const handleClearData = async () => {
    try {
      const snapshot = await getDocs(answersCollection);
      const promises = snapshot.docs.map(docRef => deleteDoc(doc(db, "answers", docRef.id)));
      await Promise.all(promises);
      setAnswers1([]);
      setAnswers2([]);
      alert('데이터가 초기화되었습니다!');
    } catch (err) {
      console.error('Error clearing documents: ', err);
    }
  };

  return (
    <div className="main-container">
      {/* 중앙선 */}
      <div className="center-line" />

      {/* 데이터 초기화 버튼 */}
      <button className="clear-button" onClick={handleClearData}>
        데이터 초기화
      </button>

      {/* 왼쪽 글자 */}
      {answers1.map((a, idx) => (
        <div
          key={a.text + idx}
          className="floating-text"
          style={{
            left: `${a.x}%`,
            top: `${a.y}%`,
            animationDelay: `${Math.random()}s`
          }}
        >
          {a.text}
        </div>
      ))}

      {/* 오른쪽 글자 */}
      {answers2.map((a, idx) => (
        <div
          key={a.text + idx}
          className="floating-text"
          style={{
            left: `${a.x}%`,
            top: `${a.y}%`,
            animationDelay: `${Math.random()}s`
          }}
        >
          {a.text}
        </div>
      ))}
    </div>
  );
};

export default Main;
