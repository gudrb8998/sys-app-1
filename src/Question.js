import React, { useState } from 'react';
import { addDoc, answersCollection } from './firebase';
import './Question.css';

const Question = () => {
  const [audienceAnswer, setAudienceAnswer] = useState('');
  const [performanceAnswer, setPerformanceAnswer] = useState('');

  const handleSubmit = async (answer, setter, questionNumber) => {
    if (!answer) return;
    try {
      await addDoc(answersCollection, {
        text: answer,
        questionNumber,       // 1번 또는 2번 구분
        createdAt: new Date()
      });
      setter('');
    } catch (err) {
      console.error('Error adding document: ', err);
    }
  };

  return (
    <div className="question-container">
      <div className="question-card">
        <h2>1. 나는 OOO한 관객이다.</h2>
        <input
          type="text"
          placeholder="답변을 입력하세요.."
          value={audienceAnswer}
          onChange={(e) => setAudienceAnswer(e.target.value)}
        />
        <button onClick={() => handleSubmit(audienceAnswer, setAudienceAnswer, 1)}>제출</button>
      </div>

      <div className="question-card">
        <h2>2. 내가 제일 재미있게 본 공연은 OOO이다.</h2>
        <input
          type="text"
          placeholder="답변을 입력하세요.."
          value={performanceAnswer}
          onChange={(e) => setPerformanceAnswer(e.target.value)}
        />
        <button onClick={() => handleSubmit(performanceAnswer, setPerformanceAnswer, 2)}>제출</button>
      </div>
    </div>
  );
};

export default Question;
