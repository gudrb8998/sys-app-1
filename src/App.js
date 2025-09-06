// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Main from "./Main";
import Question from "./Question";

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Main</Link> | <Link to="/question">Question</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/question" element={<Question />} />
      </Routes>
    </Router>
  );
}

export default App;
