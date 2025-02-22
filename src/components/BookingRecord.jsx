import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookingRecord.css';

const BookingRecord = () => {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/bookings/${user.id}`);
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  const getTotalPrice = () => {
    return bookings.reduce((total, booking) => total + (booking.price * booking.quantity), 0);
  };

  const handleCancelBooking = (index) => {
    if (window.confirm('確定要取消這筆訂票嗎？')) {
      const newBookings = bookings.filter((_, i) => i !== index);
      setBookings(newBookings);
      localStorage.setItem('cartItems', JSON.stringify(newBookings));
    }
  };

  return (
    <div className="booking-record-page">
      <div className="booking-record-header">
        <h1>訂票紀錄</h1>
        <button className="back-button" onClick={() => navigate('/booking')}>
          返回訂票
        </button>
      </div>

      <div className="booking-record-content">
        {bookings.length === 0 ? (
          <div className="empty-record">
            <p>目前沒有訂票紀錄</p>
          </div>
        ) : (
          <>
            <div className="booking-items">
              {bookings.map((booking, index) => (
                <div key={booking.id} className="booking-item">
                  <div className="item-info">
                    <h3>{booking.area_name}</h3>
                    <p>數量: {booking.quantity} 張</p>
                    <p>單價: NT$ {booking.price}</p>
                    <p>訂票時間: {new Date(booking.booking_time).toLocaleString()}</p>
                  </div>
                  <div className="item-actions">
                    <p className="item-total">小計: NT$ {booking.price * booking.quantity}</p>
                    <button 
                      className="cancel-button"
                      onClick={() => handleCancelBooking(index)}
                    >
                      取消訂票
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="booking-summary">
              <h3>總計</h3>
              <p className="total-price">NT$ {getTotalPrice()}</p>
              <button className="checkout-button">
                確認付款
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingRecord; 