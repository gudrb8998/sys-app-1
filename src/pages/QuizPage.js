// src/pages/QuizPage.js
import React, { useState, useEffect } from 'react';
import { QUESTIONS, calcResult } from '../criticismData';
import { sendReview } from '../reviewChannel';
import './QuizPage.css';

const STEPS = { START: 'start', QUESTION: 'question', RESULT: 'result', INPUT: 'input', DONE: 'done' };
const AUTO_RETURN_SEC = 5;

export default function QuizPage() {
  const [step, setStep] = useState(STEPS.START);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // 선택한 유형 id 배열
  const [result, setResult] = useState(null); // calcResult 반환값
  const [reviewText, setReviewText] = useState('');
  const [countdown, setCountdown] = useState(AUTO_RETURN_SEC);

  // 완료 화면 자동 복귀 타이머
  useEffect(() => {
    if (step !== STEPS.DONE) return;
    setCountdown(AUTO_RETURN_SEC);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleReset() {
    setStep(STEPS.START);
    setQuestionIndex(0);
    setAnswers([]);
    setResult(null);
    setReviewText('');
  }

  function handleAnswer(type) {
    const newAnswers = [...answers.slice(0, questionIndex), type];
    setAnswers(newAnswers);

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      // 마지막 질문 → 결과 계산
      const res = calcResult(newAnswers);
      setResult(res);
      setStep(STEPS.RESULT);
    }
  }

  function handleBack() {
    if (questionIndex === 0) {
      setStep(STEPS.START);
    } else {
      setQuestionIndex(questionIndex - 1);
    }
  }

  function handleSubmitReview() {
    if (!reviewText.trim()) return;
    sendReview(reviewText.trim(), result.primary.id, result.dominantColor);
    setStep(STEPS.DONE);
  }

  // ── 시작 화면 ──
  if (step === STEPS.START) {
    return (
      <div className="quiz-page">
        <div className="quiz-start">
          <h1>당신은 어떤 방식으로<br />비평하나요?</h1>
          <p>
            공연을 본 뒤 우리는 저마다 다른 방식으로 생각하고 반응합니다.<br />
            정답은 없습니다. 지금의 나와 가장 가까운 답을 선택해주세요.
          </p>
          <button
            className="quiz-primary-btn"
            onClick={() => { setStep(STEPS.QUESTION); setQuestionIndex(0); }}
          >
            시작하기
          </button>
        </div>
      </div>
    );
  }

  // ── 질문 화면 ──
  if (step === STEPS.QUESTION) {
    const q = QUESTIONS[questionIndex];
    return (
      <div className="quiz-page">
        <div className="quiz-question">
          <p className="quiz-progress">질문 {questionIndex + 1} / {QUESTIONS.length}</p>
          <h2>{q.text}</h2>
          <div className="quiz-options">
            {q.options.map((opt) => (
              <button
                key={opt.label}
                className="quiz-option-btn"
                onClick={() => handleAnswer(opt.type)}
              >
                <span className="quiz-option-label">{opt.label}</span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
          <button className="quiz-back-btn" onClick={handleBack}>
            ← 이전으로
          </button>
        </div>
      </div>
    );
  }

  // ── 결과 화면 ──
  if (step === STEPS.RESULT && result) {
    const types = result.secondary
      ? [result.primary, result.secondary]
      : [result.primary];

    return (
      <div className="quiz-page">
        <div className="quiz-result">
          <p className="quiz-result-subtitle">나의 비평 유형</p>
          <h1 className="quiz-result-title">
            {types.length === 1
              ? `당신에게 가장 가까운 비평 방식은\n'${result.primary.name}'입니다.`
              : `당신에게 가장 가까운 비평 방식은\n'${result.primary.name}'과 '${result.secondary.name}'입니다.`}
          </h1>

          {types.map((t) => (
            <div
              key={t.id}
              className="quiz-result-card"
              style={{ borderColor: t.color }}
            >
              {types.length > 1 && (
                <p style={{ color: t.color, fontWeight: 700, marginBottom: 12 }}>{t.name}</p>
              )}
              {types.length === 1 && (
                <p style={{ whiteSpace: 'pre-line' }}>{t.description}</p>
              )}
              <div className="quiz-keywords">
                {t.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="quiz-keyword-tag"
                    style={{ color: t.color, borderColor: t.color }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <button
            className="quiz-primary-btn"
            style={{ marginTop: 32 }}
            onClick={() => setStep(STEPS.INPUT)}
          >
            한 줄 비평 작성하기
          </button>
        </div>
      </div>
    );
  }

  // ── 입력 화면 ──
  if (step === STEPS.INPUT) {
    return (
      <div className="quiz-page">
        <div className="quiz-input-screen">
          <h2>오늘의 한 줄 비평</h2>
          <p>오늘 전시를 보고 떠오른 생각을 자유롭게 적어주세요.</p>
          <div className="quiz-textarea-wrap">
            <textarea
              className="quiz-textarea"
              maxLength={60}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="느낀 점, 기억에 남는 장면, 한 문장으로 표현해보세요."
            />
          </div>
          <p className="quiz-char-count">{reviewText.length} / 60</p>
          <button
            className="quiz-primary-btn"
            onClick={handleSubmitReview}
            disabled={!reviewText.trim()}
          >
            완료
          </button>
        </div>
      </div>
    );
  }

  // ── 완료 화면 ──
  if (step === STEPS.DONE) {
    return (
      <div className="quiz-page">
        <div className="quiz-done">
          <h2>당신의 한 줄 비평이<br />전시의 일부가 되었습니다.</h2>
          <p>대형 화면에서 확인해보세요.</p>
          <p className="quiz-countdown">{countdown}초 후 처음으로 돌아갑니다.</p>
        </div>
      </div>
    );
  }

  return null;
}
