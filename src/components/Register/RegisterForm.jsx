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
      setError('隢�憛怠神������甈�雿�');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('撖�蝣潔��銝����');
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
        alert('閮餃��������嚗�');
        switchToLogin();
      } else {
        setError(data.message || '閮餃��憭望��');
      }
    } catch (err) {
      setError('隡箸����券�航炊嚗�隢�蝔�敺����閰�');
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-form">
        <button className="close-button" onClick={onClose}>��</button>
        <h2>閮餃��撣唾��</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>��冽�嗅��蝔�</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="隢�頛詨�亦�冽�嗅��蝔�"
            />
          </div>

          <div className="form-group">
            <label>��餃��靽∠拳</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="隢�頛詨�仿�餃��靽∠拳"
            />
          </div>

          <div className="form-group">
            <label>撖�蝣�</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="隢�頛詨�亙��蝣�"
            />
          </div>

          <div className="form-group">
            <label>蝣箄��撖�蝣�</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="隢����甈∟撓��亙��蝣�"
            />
          </div>

          <button type="submit" className="submit-button">
            閮餃��
          </button>
        </form>

        <div className="switch-form">
          撌脫��撣唾��嚗� <span onClick={switchToLogin}>蝡���喟�餃��</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm; 