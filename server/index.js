const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
app.use(express.json());

// MySQL 連接配置
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // 您的 MySQL 用戶名
  password: 'js15021502',    // 您的 MySQL 密碼
  database: 'concert_booking'
});

// 測試數據庫連接
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// 創建用戶表
connection.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// 創建座位區域表
connection.query(`
  CREATE TABLE IF NOT EXISTS areas (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    remaining INT NOT NULL
  )
`);

// 創建訂票記錄表
connection.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    area_name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    quantity INT NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// 檢查是否需要初始化座位數據
connection.query('SELECT * FROM areas', (err, results) => {
  if (err) {
    console.error('Error checking areas:', err);
    return;
  }

  // 如果表是空的，添加初始數據
  if (results.length === 0) {
    const initialAreas = [
      { id: 'rock', name: '搖滾區', price: 3800, remaining: 100 },
      { id: 'a', name: '座位區A', price: 3200, remaining: 200 },
      { id: 'b', name: '座位區B', price: 2800, remaining: 300 },
      { id: 'c', name: '座位區C', price: 2200, remaining: 400 }
    ];

    connection.query(
      'INSERT INTO areas (id, name, price, remaining) VALUES ?',
      [initialAreas.map(area => [area.id, area.name, area.price, area.remaining])],
      (err) => {
        if (err) {
          console.error('Error initializing areas:', err);
        } else {
          console.log('Areas initialized successfully');
        }
      }
    );
  }
});

// 註冊 API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 檢查郵箱是否已存在
    const [existingUsers] = await connection.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '此信箱已被註冊' });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用戶
    await connection.promise().query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: '註冊成功' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 登入 API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 查找用戶
    const [users] = await connection.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '信箱或密碼錯誤' });
    }

    const user = users[0];

    // 驗證密碼
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: '信箱或密碼錯誤' });
    }

    // 不要返回密碼
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 獲取座位區域資訊
app.get('/api/areas', async (req, res) => {
  try {
    const [areas] = await connection.promise().query('SELECT * FROM areas');
    res.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 添加訂票記錄
app.post('/api/bookings', async (req, res) => {
  const { userId, areaId, quantity } = req.body;

  try {
    // 開始事務
    await connection.promise().beginTransaction();

    // 檢查座位是否足夠
    const [areas] = await connection.promise().query(
      'SELECT * FROM areas WHERE id = ? AND remaining >= ?',
      [areaId, quantity]
    );

    if (areas.length === 0) {
      await connection.promise().rollback();
      return res.status(400).json({ message: '座位不足' });
    }

    const area = areas[0];

    // 更新剩餘座位數
    await connection.promise().query(
      'UPDATE areas SET remaining = remaining - ? WHERE id = ?',
      [quantity, areaId]
    );

    // 添加訂票記錄
    await connection.promise().query(
      'INSERT INTO bookings (user_id, area_name, price, quantity) VALUES (?, ?, ?, ?)',
      [userId, area.name, area.price, quantity]
    );

    // 提交事務
    await connection.promise().commit();

    res.status(201).json({ message: '訂票成功' });
  } catch (error) {
    await connection.promise().rollback();
    console.error('Booking error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 獲取用戶的訂票記錄
app.get('/api/bookings/:userId', async (req, res) => {
  try {
    const [bookings] = await connection.promise().query(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_time DESC',
      [req.params.userId]
    );
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 添加重置系統 API
app.post('/api/reset', async (req, res) => {
  try {
    // 開始事務
    await connection.promise().beginTransaction();

    // 清空訂票記錄
    await connection.promise().query('DELETE FROM bookings');

    // 重置座位數量
    const resetAreas = [
      { id: 'rock', remaining: 100 },
      { id: 'a', remaining: 200 },
      { id: 'b', remaining: 300 },
      { id: 'c', remaining: 400 }
    ];

    for (const area of resetAreas) {
      await connection.promise().query(
        'UPDATE areas SET remaining = ? WHERE id = ?',
        [area.remaining, area.id]
      );
    }

    // 提交事務
    await connection.promise().commit();
    res.json({ message: '系統已重置' });
  } catch (error) {
    await connection.promise().rollback();
    console.error('Reset error:', error);
    res.status(500).json({ message: '重置失敗' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});