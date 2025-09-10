// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Main from "./Main";
import Question from "./Question";
import QRCodeComponent from './QRCodeComponent';
import AudienceTypeTest from "./AudienceTypeTest";
import QRCodeComponent2 from "./QRCodeComponent2";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/question" element={<Question />} />
        <Route path="/test" element={<AudienceTypeTest />} />
        <Route path="/qr" element={<QRCodeComponent />} />
        <Route path="/qr2" element={<QRCodeComponent2 />} />
      </Routes>
    </Router>
  );
}

export default App;
