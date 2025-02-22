import React, { useState } from 'react';
import './RegisterForm.css';

const LoginForm = ({ onClose, switchToRegister, onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
        onClose();
      } else {
        setError(data.message || '登入失敗');
      }
    } catch (err) {
      setError('伺服器錯誤，請稍後再試');
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-form">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>會員登入</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>電子信箱</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="請輸入電子信箱"
            />
          </div>

          <div className="form-group">
            <label>密碼</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="請輸入密碼"
            />
          </div>

          <button type="submit" className="submit-button">
            登入
          </button>
        </form>

        <div className="switch-form">
          還沒有帳號？ <span onClick={switchToRegister}>立即註冊</span>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 