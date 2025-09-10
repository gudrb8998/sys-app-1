import React, { useState } from "react";
import { questions } from "./questions";
import { audienceResults } from "./answers";
import "./AudienceTypeTest.css";

const AudienceTypeTest = () => {
  const [answers, setAnswers] = useState(Array(questions.length).fill(""));
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState([]);
  const [showShareBox, setShowShareBox] = useState(false);

  const handleAnswer = (index, key) => {
    const newAnswers = [...answers];
    newAnswers[index] = key;
    setAnswers(newAnswers);
  };

  const submitAnswers = () => {
    if (answers.some((a) => a === "")) {
      alert("모든 질문에 답변해 주세요.");
      return;
    }

    const counts = answers.reduce((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const maxCount = Math.max(...Object.values(counts));
    const maxKeys = Object.keys(counts).filter((key) => counts[key] === maxCount);
    const selectedResults = maxKeys.map((key) => audienceResults[key]);

    setResults(selectedResults);
    setShowModal(true);
  };

  const resetTest = () => {
    setAnswers(Array(questions.length).fill(""));
    setResults([]);
    setShowModal(false);
    setShowShareBox(false);
  };

  // 공유 기능
  const shareToClipboard = () => {
    const shareText = results.map((r) => `${r.title}\n${r.description}`).join("\n\n");
    navigator.clipboard.writeText(shareText);
    alert("결과가 클립보드에 복사되었습니다!");
  };

  const kakaoShare = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(results.map((r) => r.title).join(", "));
    window.open(`https://sharer.kakao.com/talk/friends/picker/link?url=${url}&text=${text}`, "_blank");
  };

  const twitterShare = () => {
    const text = encodeURIComponent(results.map((r) => r.title).join(", "));
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const instaShare = () => {
    alert("인스타그램은 웹 공유 기능이 제한적입니다. 모바일 앱에서 공유해주세요.");
  };

  return (
    <div className="audience-test-container">
      {questions.map((q, i) => (
        <div key={q.id} className="question-card">
          <h3>{q.text}</h3>
          {q.options.map((opt) => (
            <label key={opt.key}>
              <input
                type="radio"
                name={`q${q.id}`}
                value={opt.key}
                checked={answers[i] === opt.key}
                onChange={() => handleAnswer(i, opt.key)}
              />
              <span>{opt.text}</span>
            </label>
          ))}
        </div>
      ))}

      <button className="submit-button" onClick={submitAnswers}>
        결과 보기
      </button>

      {/* 결과 모달 */}
      {showModal && results.length > 0 && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setShowShareBox(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

            {/* 모달 닫기 */}
            <button className="modal-close" onClick={() => { setShowModal(false); setShowShareBox(false); }}>
              &times;
            </button>

            {results.map((result, idx) => (
              <div key={idx} style={{ marginBottom: "20px" }}>
                <div className="modal-header">{result.title}</div>
                <div className="modal-body">
                  <p><strong>캐릭터 설명:</strong><br />{result.description}</p>
                  <p><strong>공연 추천 스타일:</strong><br />{result.style}</p>
                  <p><strong>어울리는 장르:</strong><br />{result.genre}</p>
                </div>
              </div>
            ))}

            {/* 버튼 그룹 */}
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "15px" }}>
              <button className="submit-button" onClick={resetTest} style={{ backgroundColor: "#555" }}>
                다시하기
              </button>
              <button className="submit-button" onClick={() => setShowShareBox(true)} style={{ backgroundColor: "#3b5998" }}>
                공유하기
              </button>
            </div>

{/* 공유 박스 - 모달 위에 겹치게 */}
{showShareBox && (
  <div
    className="modal-overlay"
    style={{ background: "rgba(0,0,0,0.3)", zIndex: 1100 }}
    onClick={() => setShowShareBox(false)}
  >
    <div
      className="modal-content"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: "400px", padding: "20px", position: "relative" }}
    >
      <button
        className="modal-close"
        onClick={() => setShowShareBox(false)}
        style={{ top: "10px", right: "10px" }}
      >
        &times;
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
        <button className="submit-button" onClick={shareToClipboard} style={{ backgroundColor: "#999" }}>
          클립보드 공유
        </button>
        <button
          className="submit-button"
          onClick={() => {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(results.map((r) => r.title).join(", "));
            window.open(`https://story.kakao.com/share?url=${url}&text=${text}`, "_blank");
          }}
          style={{ backgroundColor: "#fee500", color: "#3c1e1e" }}
        >
          카카오스토리 공유
        </button>
        <button className="submit-button" onClick={twitterShare} style={{ backgroundColor: "#1da1f2" }}>
          트위터 공유
        </button>
        <button
          className="submit-button"
          onClick={() => alert("링크가 복사되었습니다. 인스타그램 앱에서 공유해주세요!")}
          style={{ backgroundColor: "#c13584" }}
        >
          인스타그램 공유
        </button>
      </div>
    </div>
  </div>
)}


          </div>
        </div>
      )}
    </div>
  );
};

export default AudienceTypeTest;
