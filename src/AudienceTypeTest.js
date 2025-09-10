import React, { useState, useEffect } from "react";
import { questions } from "./questions";
import { results } from "./answers";
import "./AudienceTypeTest.css";

// 배열 랜덤 섞기 함수
const shuffleArray = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
};

const AudienceTypeTest = () => {
  const [answers, setAnswers] = useState(Array(questions.length).fill(""));
  const [currentPage, setCurrentPage] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState(
    shuffleArray(questions[0].options)
  );
  const [showModal, setShowModal] = useState(false);
  const [modalResults, setModalResults] = useState([]);
  const [showShare, setShowShare] = useState(false);

  // 페이지 변경 시 옵션 랜덤화
  useEffect(() => {
    setShuffledOptions(shuffleArray(questions[currentPage].options));
  }, [currentPage]);

  const handleAnswer = (index, key) => {
    const newAnswers = [...answers];
    newAnswers[index] = key;
    setAnswers(newAnswers);
  };

  const restartTest = () => {
    setAnswers(Array(questions.length).fill(""));
    setCurrentPage(0);
    setShowModal(false);
    setModalResults([]);
    setShowShare(false);
    setShuffledOptions(shuffleArray(questions[0].options));
  };

  const submitAnswers = () => {
    const countMap = {};
    answers.forEach((a) => {
      if (!a) return;
      countMap[a] = (countMap[a] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(countMap));
    const topKeys = Object.keys(countMap).filter((k) => countMap[k] === maxCount);

    const finalResults = topKeys.map((key) => results[key]);
    setModalResults(finalResults);
    setShowModal(true);
  };

  return (
    <div className="audience-test-container">
      {/* 질문 카드 */}
      <div className="question-card">
        <h3>
          Q{currentPage + 1}. {questions[currentPage].text}
        </h3>
        {shuffledOptions.map((opt) => (
          <label key={opt.key}>
            <input
              type="radio"
              name={`q${questions[currentPage].id}`}
              value={opt.key}
              checked={answers[currentPage] === opt.key}
              onChange={() => handleAnswer(currentPage, opt.key)}
            />
            <span>{opt.text}</span>
          </label>
        ))}
      </div>

      {/* 페이지 네비게이션 버튼 */}
      <div className="navigation-buttons">
        {currentPage > 0 && (
          <button onClick={() => setCurrentPage(currentPage - 1)}>이전</button>
        )}
        {currentPage < questions.length - 1 ? (
          <button onClick={() => setCurrentPage(currentPage + 1)}>다음</button>
        ) : (
          <button onClick={submitAnswers}>결과보기</button>
        )}
      </div>

      {/* 결과 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              &times;
            </button>

            {modalResults.map((res, idx) => (
              <div key={idx} style={{ marginBottom: "20px" }}>
                <div className="modal-header">{res.title}</div>
                <div className="modal-body">
                  <p><strong>캐릭터 설명</strong></p>
                  <p>{res.character}</p>
                  <p><strong>공연 추천 스타일</strong></p>
                  <p>{res.style}</p>
                  <p><strong>어울리는 장르</strong></p>
                  <p>{res.genre}</p>
                </div>
              </div>
            ))}

            {/* 다시하기 & 공유 버튼 */}
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
              <button onClick={restartTest} className="submit-button">다시하기</button>
              <button onClick={() => setShowShare(true)} className="submit-button">결과 공유</button>
            </div>

            {/* 공유 모달 */}
            {showShare && (
              <div className="modal-overlay" onClick={() => setShowShare(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setShowShare(false)}>
                    &times;
                  </button>
                  <h3 style={{ textAlign: "center", marginBottom: "10px" }}>공유하기</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={() => navigator.clipboard.writeText(window.location.href)}>기본 링크 복사</button>
                    <button onClick={() => window.open(`https://story.kakao.com/share?url=${encodeURIComponent(window.location.href)}`, "_blank")}>카카오스토리 공유</button>
                    <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, "_blank")}>트위터 공유</button>
                    <button onClick={() => alert("링크가 복사되었습니다. 인스타그램 앱에서 공유해주세요!")}>인스타그램 공유</button>
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
