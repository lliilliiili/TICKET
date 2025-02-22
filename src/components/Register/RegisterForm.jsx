import React, { useState } from 'react';
import './RegisterForm.css';

const RegisterForm = ({ onClose, switchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('請填寫所有欄位');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('密碼不一致');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('註冊成功！');
        switchToLogin();
      } else {
        setError(data.message || '註冊失敗');
      }
    } catch (err) {
      setError('伺服器錯誤，請稍後再試');
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-form">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>註冊帳號</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用戶名稱</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="請輸入用戶名稱"
            />
          </div>

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

          <div className="form-group">
            <label>確認密碼</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="請再次輸入密碼"
            />
          </div>

          <button type="submit" className="submit-button">
            註冊
          </button>
        </form>

        <div className="switch-form">
          已有帳號？ <span onClick={switchToLogin}>立即登入</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm; 