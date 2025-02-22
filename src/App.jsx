import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ConcertIntro from './components/ConcertIntro';
import BookingPage from './components/BookingPage';
import BookingRecord from './components/BookingRecord';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConcertIntro />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/cart" element={<BookingRecord />} />
      </Routes>
    </Router>
  );
}

export default App; 