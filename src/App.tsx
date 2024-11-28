import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DrowsinessDetector from "./DrowsinessDetector";
import Home from "./Home";
import Connect from "./Connect";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/detect" element={<DrowsinessDetector />} />
      </Routes>
    </Router>
  );
};

export default App;
