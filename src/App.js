// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Main from "./Main";
import Question from "./Question";
import QRCodeComponent from './QRCodeComponent';
import AudienceTypeTest from "./AudienceTypeTest";
import QRCodeComponent2 from "./QRCodeComponent2";
import TextRainTree from "./TextRainTree";
import TextRainBubble from "./TextRainBubble";
import TextRainStackOverlap from "./TextRainStackOverlap";
import TextRainStackWhite from "./TextRainStackWhite";
import TextRainStackPreloaded from "./TextRainStackPreloaded";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/question" element={<Question />} />
        <Route path="/test" element={<AudienceTypeTest />} />
        <Route path="/qr" element={<QRCodeComponent />} />
        <Route path="/qr2" element={<QRCodeComponent2 />} />
        <Route path="/text-rain-stack" element={<TextRainStackOverlap />} />
        <Route path="/text-rain-stack-white" element={<TextRainStackWhite />} />
        <Route path="/text-rain-stack-preloaded" element={<TextRainStackPreloaded />} />
        <Route path="/text-rain-tree" element={<TextRainTree />} />
        <Route path="/text-rain-bubble" element={<TextRainBubble />} />
      </Routes>
    </Router>
  );
}

export default App;

