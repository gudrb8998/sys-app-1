// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Main from "./Main";
import Question from "./Question";
import QRCodeComponent from './QRCodeComponent';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/question" element={<Question />} />
        <Route path="/qr" element={<QRCodeComponent />} />
      </Routes>
    </Router>
  );
}

export default App;
