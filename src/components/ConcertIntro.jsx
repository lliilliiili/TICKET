import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConcertIntro.css';
import LoginForm from './Register/LoginForm';
import RegisterForm from './Register/RegisterForm';

const ConcertIntro = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const handleBookingClick = () => {
    if (user) {
      navigate('/booking');
    } else {
      setShowAuthModal(true);
      setIsLogin(true);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/booking');
  };

  return (
    <div className="concert-intro">
      <div className="header-buttons">
        {user ? (
          <div className="user-info">
            <span>歡迎，{user.username}</span>
            <button 
              className="logout-button" 
              onClick={() => {
                setUser(null);
                localStorage.removeItem('user');
              }}
            >
              登出
            </button>
          </div>
        ) : (
          <button 
            className="login-button"
            onClick={() => {
              setIsLogin(true);
              setShowAuthModal(true);
            }}
          >
            登入/註冊
          </button>
        )}
      </div>

      <div className="concert-hero">
        <img 
          src="/concert-banner.jpg" 
          alt="演唱會主視覺" 
          className="hero-image"
        />
        <div className="hero-content">
          <h1>2024 年度巨星演唱會</h1>
          <p className="concert-date">2024.08.15 19:30</p>
          <p className="concert-venue">台北小巨蛋</p>
        </div>
      </div>

      <div className="concert-details">
        <div className="artist-info">
          <img 
            src="/artist-photo.jpg" 
            alt="歌手照片" 
            className="artist-image"
          />
          <h2>好樂團7 GOOD BAND</h2>
          <p className="artist-description">
            知名歌手簡介和成就描述...
          </p>
        </div>

        <div className="concert-info">
          <h3>演唱會資訊</h3>
          <ul>
            <li>演出時間：2024年8月15日 19:30</li>
            <li>演出地點：台北小巨蛋</li>
            <li>開放入場：18:30</li>
            <li>票價資訊：
              <ul>
                <li>搖滾區 NT$3800</li>
                <li>座位區A NT$3200</li>
                <li>座位區B NT$2800</li>
                <li>座位區C NT$2200</li>
              </ul>
            </li>
          </ul>
        </div>

        <button 
          className="booking-button"
          onClick={handleBookingClick}
        >
          {user ? '立即購票' : '登入購票'}
        </button>
      </div>

      {showAuthModal && (
        isLogin ? (
          <LoginForm 
            onClose={() => setShowAuthModal(false)}
            switchToRegister={() => setIsLogin(false)}
            onLogin={handleLogin}
          />
        ) : (
          <RegisterForm 
            onClose={() => setShowAuthModal(false)}
            switchToLogin={() => setIsLogin(true)}
          />
        )
      )}
    </div>
  );
};

export default ConcertIntro; 