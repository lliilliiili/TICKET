const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
app.use(express.json());

// MySQL ?????��??置�??�???��????��??設置修�?��??
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // ??��?? MySQL ??��?��??
  password: 'js15021502',    // ??��????��?? MySQL �?�?
  database: 'concert_booking'
});

// 測試??��??庫�?????
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// ??�建??��?�表
connection.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// ??�建座�????????�?
connection.query(`
  CREATE TABLE IF NOT EXISTS areas (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    remaining INT NOT NULL
  )
`);

// ??�建�?票�?????�?
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

// 檢�?��?��?��??�????�????座�????��??
connection.query('SELECT * FROM areas', (err, results) => {
  if (err) {
    console.error('Error checking areas:', err);
    return;
  }

  // �????表�?�空???�?添�?????�???��??
  if (results.length === 0) {
    const initialAreas = [
      { id: 'rock', name: '???滾�??', price: 3800, remaining: 100 },
      { id: 'a', name: '座�?????A', price: 3200, remaining: 200 },
      { id: 'b', name: '座�?????B', price: 2800, remaining: 300 },
      { id: 'c', name: '座�?????C', price: 2200, remaining: 400 }
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

// 註�?? API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 檢�?��?�箱??��?�已�????
    const [existingUsers] = await connection.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '此信箱已被註???' });
    }

    // ???�?�?�?
    const hashedPassword = await bcrypt.hash(password, 10);

    // ?????��?��?��??
    await connection.promise().query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: '註�????????' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '伺�????��?�誤' });
  }
});

// ??��?? API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // ??��?��?��??
    const [users] = await connection.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '信箱???�?碼�?�誤' });
    }

    const user = users[0];

    // �?�?�?�?
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: '信箱???�?碼�?�誤' });
    }

    // �?�?�????�?�?
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '伺�????��?�誤' });
  }
});

// ??��??座�????????�?�?
app.get('/api/areas', async (req, res) => {
  try {
    const [areas] = await connection.promise().query('SELECT * FROM areas');
    res.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ message: '伺�????��?�誤' });
  }
});

// 添�??�?票�?????
app.post('/api/bookings', async (req, res) => {
  const { userId, areaId, quantity } = req.body;

  try {
    // ???�?�????
    await connection.promise().beginTransaction();

    // 檢�?�座�???��?�足�?
    const [areas] = await connection.promise().query(
      'SELECT * FROM areas WHERE id = ? AND remaining >= ?',
      [areaId, quantity]
    );

    if (areas.length === 0) {
      await connection.promise().rollback();
      return res.status(400).json({ message: '座�??�?�?' });
    }

    const area = areas[0];

    // ??��?��?��??座�?????
    await connection.promise().query(
      'UPDATE areas SET remaining = remaining - ? WHERE id = ?',
      [quantity, areaId]
    );

    // 添�??�?票�?????
    await connection.promise().query(
      'INSERT INTO bookings (user_id, area_name, price, quantity) VALUES (?, ?, ?, ?)',
      [userId, area.name, area.price, quantity]
    );

    // ???交�?????
    await connection.promise().commit();

    res.status(201).json({ message: '�?票�?????' });
  } catch (error) {
    await connection.promise().rollback();
    console.error('Booking error:', error);
    res.status(500).json({ message: '伺�????��?�誤' });
  }
});

// ??��????��?��??�?票�?????
app.get('/api/bookings/:userId', async (req, res) => {
  try {
    const [bookings] = await connection.promise().query(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_time DESC',
      [req.params.userId]
    );
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: '伺�????��?�誤' });
  }
});

// 添�?????置�????��?? API
app.post('/api/reset', async (req, res) => {
  try {
    // ???�?�????
    await connection.promise().beginTransaction();

    // �?空�??票�?????
    await connection.promise().query('DELETE FROM bookings');

    // ???置座�???��??
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

    // ???交�?????
    await connection.promise().commit();
    res.json({ message: '系統已�??�?' });
  } catch (error) {
    await connection.promise().rollback();
    console.error('Reset error:', error);
    res.status(500).json({ message: '???置失???' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});