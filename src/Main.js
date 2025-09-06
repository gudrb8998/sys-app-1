// Main.js
import React, { useEffect, useState } from "react";
import { subscribeAnswers, deleteAllAnswers } from "./firebase";
import "./Main.css"; // fade-in 애니메이션 스타일

function Main() {
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeAnswers((snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnswers(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Main Page</h1>
      <button onClick={deleteAllAnswers}>모든 답변 삭제</button>
      <ul>
        {answers.map(answer => (
          <li key={answer.id} className="fade-in">{answer.text}</li>
        ))}
      </ul>
    </div>
  );
}

export default Main;
