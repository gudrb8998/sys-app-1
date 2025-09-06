// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// answers 컬렉션 참조
export const answersCollection = collection(db, "answers");

// 새 답변 추가
export const addAnswer = async (text) => {
  try {
    await addDoc(answersCollection, { text, createdAt: new Date() });
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

// 실시간 구독
export const subscribeAnswers = (callback) => {
  const q = query(answersCollection, orderBy("createdAt"));
  return onSnapshot(q, callback);
};

// 모든 답변 삭제
export const deleteAllAnswers = async () => {
  try {
    const snapshot = await getDocs(answersCollection);
    const promises = snapshot.docs.map(docItem => deleteDoc(doc(db, "answers", docItem.id)));
    await Promise.all(promises);
    console.log("모든 답변 삭제 완료!");
  } catch (error) {
    console.error("삭제 중 오류 발생:", error);
  }
};