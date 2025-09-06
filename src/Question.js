// Question.js
import React, { useState } from "react";
import { addAnswer } from "./firebase";

function Question() {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text) return;
    await addAnswer(text);
    setText("");
  };

  return (
    <div>
      <h2>나는 xxx한 관객이다</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="답변을 입력하세요"
        />
        <button type="submit">제출</button>
      </form>
    </div>
  );
}

export default Question;
