import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookingPage.css';
import RegisterForm from './Register/RegisterForm';
import LoginForm from './Register/LoginForm';

const BookingPage = () => {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  
  // 添加預設的座位區域數據，當無法連接數據庫時使用
  const [areas, setAreas] = useState([
    { id: 'rock', name: '搖滾區', price: 3800, remaining: 100 },
    { id: 'a', name: '座位區A', price: 3200, remaining: 200 },
    { id: 'b', name: '座位區B', price: 2800, remaining: 300 },
    { id: 'c', name: '座位區C', price: 2200, remaining: 400 }
  ]);

  // 檢查用戶是否已登入
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // 嘗試從服務器獲取座位資訊
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/areas');
        if (response.ok) {
          const data = await response.json();
          setAreas(data);
        }
      } catch (error) {
        console.error('Error fetching areas:', error);
        // 如果獲取失敗，保持使用預設數據
      }
    };

    fetchAreas();
  }, []);

  const handleAddToCart = async () => {
    if (!selectedArea) {
      alert('請選擇座位區域');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          areaId: selectedArea,
          quantity: quantity
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('訂票成功！');
        // 重新獲取座位資訊
        const areasResponse = await fetch('http://localhost:3001/api/areas');
        const areasData = await areasResponse.json();
        setAreas(areasData);
        
        setSelectedArea('');
        setQuantity(1);
      } else {
        alert(data.message || '訂票失敗');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('訂票失敗，請稍後再試');
    }
  };

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleReset = async () => {
    if (window.confirm('確定要重置系統嗎？這將清除所有訂票紀錄並登出所有用戶。')) {
      try {
        const response = await fetch('http://localhost:3001/api/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          alert('系統已重置');
          handleLogout();
        } else {
          alert('重置失敗，請稍後再試');
        }
      } catch (error) {
        console.error('Reset error:', error);
        alert('重置失敗，請稍後再試');
      }
    }
  };

  if (!user) {
    return null; // 如果未登入，不渲染任何內容
  }

  return (
    <div className="booking-page">
      <div className="booking-header">
        <h1>2024 年度巨星演唱會 - 訂票系統</h1>
        <div className="header-buttons">
          <button 
            className="cart-button"
            onClick={() => navigate('/cart')}
          >
            訂票紀錄
          </button>
          <div className="user-info">
            <span>
              {user.isAdmin ? (
                <span className="admin-badge">
                  👑 管理員：{user.username}
                </span>
              ) : (
                `歡迎，${user.username}`
              )}
            </span>
            <button className="logout-button" onClick={handleLogout}>
              登出
            </button>
          </div>
        </div>
      </div>

      <div className="booking-content">
        <div className="seating-map">
          <img 
            src="/seating-map.jpg" 
            alt="座位圖" 
            className="map-image"
          />
        </div>

        <div className="booking-form">
          <div className="area-selection">
            <h3>選擇區域</h3>
            <div className="area-grid">
              {areas.map(area => (
                <div 
                  key={area.id}
                  className={`area-card ${selectedArea === area.id ? 'selected' : ''}`}
                  onClick={() => setSelectedArea(area.id)}
                >
                  <h4>{area.name}</h4>
                  <p className="price">NT$ {area.price}</p>
                  <p className="remaining">剩餘座位: {area.remaining}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="quantity-selection">
            <h3>選擇張數</h3>
            <select 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              {[1, 2, 3, 4].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div className="total-price">
            <h3>總金額</h3>
            <p>
              NT$ {selectedArea ? 
                areas.find(a => a.id === selectedArea).price * quantity : 
                0
              }
            </p>
          </div>

          <button className="submit-button" onClick={handleAddToCart}>
            加入訂票
          </button>

          <div className="admin-controls">
            <button className="reset-button" onClick={handleReset}>
              重置系統
            </button>
          </div>
        </div>
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

export default BookingPage; 