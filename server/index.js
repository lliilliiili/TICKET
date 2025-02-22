const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
app.use(express.json());

// MySQL ?????¥é??ç½®ï??è«???¹æ????¨ç??è¨­ç½®ä¿®æ?¹ï??
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // ??¨ç?? MySQL ??¨æ?¶å??
  password: 'js15021502',    // ??¹æ????¨ç?? MySQL å¯?ç¢?
  database: 'concert_booking'
});

// æ¸¬è©¦??¸æ??åº«é?????
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// ??µå»º??¨æ?¶è¡¨
connection.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// ??µå»ºåº§ä????????è¡?
connection.query(`
  CREATE TABLE IF NOT EXISTS areas (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    remaining INT NOT NULL
  )
`);

// ??µå»ºè¨?ç¥¨è?????è¡?
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

// æª¢æ?¥æ?¯å?¦é??è¦????å§????åº§ä????¸æ??
connection.query('SELECT * FROM areas', (err, results) => {
  if (err) {
    console.error('Error checking areas:', err);
    return;
  }

  // å¦????è¡¨æ?¯ç©º???ï¼?æ·»å?????å§???¸æ??
  if (results.length === 0) {
    const initialAreas = [
      { id: 'rock', name: '???æ»¾å??', price: 3800, remaining: 100 },
      { id: 'a', name: 'åº§ä?????A', price: 3200, remaining: 200 },
      { id: 'b', name: 'åº§ä?????B', price: 2800, remaining: 300 },
      { id: 'c', name: 'åº§ä?????C', price: 2200, remaining: 400 }
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

// è¨»å?? API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // æª¢æ?¥é?µç®±??¯å?¦å·²å­????
    const [existingUsers] = await connection.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'æ­¤ä¿¡ç®±å·²è¢«è¨»???' });
    }

    // ???å¯?å¯?ç¢?
    const hashedPassword = await bcrypt.hash(password, 10);

    // ?????¥æ?°ç?¨æ??
    await connection.promise().query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'è¨»å????????' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'ä¼ºæ????¨é?¯èª¤' });
  }
});

// ??»å?? API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // ??¥æ?¾ç?¨æ??
    const [users] = await connection.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'ä¿¡ç®±???å¯?ç¢¼é?¯èª¤' });
    }

    const user = users[0];

    // é©?è­?å¯?ç¢?
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'ä¿¡ç®±???å¯?ç¢¼é?¯èª¤' });
    }

    // ä¸?è¦?è¿????å¯?ç¢?
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'ä¼ºæ????¨é?¯èª¤' });
  }
});

// ??²å??åº§ä????????è³?è¨?
app.get('/api/areas', async (req, res) => {
  try {
    const [areas] = await connection.promise().query('SELECT * FROM areas');
    res.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ message: 'ä¼ºæ????¨é?¯èª¤' });
  }
});

// æ·»å??è¨?ç¥¨è?????
app.post('/api/bookings', async (req, res) => {
  const { userId, areaId, quantity } = req.body;

  try {
    // ???å§?äº????
    await connection.promise().beginTransaction();

    // æª¢æ?¥åº§ä½???¯å?¦è¶³å¤?
    const [areas] = await connection.promise().query(
      'SELECT * FROM areas WHERE id = ? AND remaining >= ?',
      [areaId, quantity]
    );

    if (areas.length === 0) {
      await connection.promise().rollback();
      return res.status(400).json({ message: 'åº§ä??ä¸?è¶?' });
    }

    const area = areas[0];

    // ??´æ?°å?©é??åº§ä?????
    await connection.promise().query(
      'UPDATE areas SET remaining = remaining - ? WHERE id = ?',
      [quantity, areaId]
    );

    // æ·»å??è¨?ç¥¨è?????
    await connection.promise().query(
      'INSERT INTO bookings (user_id, area_name, price, quantity) VALUES (?, ?, ?, ?)',
      [userId, area.name, area.price, quantity]
    );

    // ???äº¤ä?????
    await connection.promise().commit();

    res.status(201).json({ message: 'è¨?ç¥¨æ?????' });
  } catch (error) {
    await connection.promise().rollback();
    console.error('Booking error:', error);
    res.status(500).json({ message: 'ä¼ºæ????¨é?¯èª¤' });
  }
});

// ??²å????¨æ?¶ç??è¨?ç¥¨è?????
app.get('/api/bookings/:userId', async (req, res) => {
  try {
    const [bookings] = await connection.promise().query(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_time DESC',
      [req.params.userId]
    );
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'ä¼ºæ????¨é?¯èª¤' });
  }
});

// æ·»å?????ç½®å????½ç?? API
app.post('/api/reset', async (req, res) => {
  try {
    // ???å§?äº????
    await connection.promise().beginTransaction();

    // æ¸?ç©ºè??ç¥¨è?????
    await connection.promise().query('DELETE FROM bookings');

    // ???ç½®åº§ä½???¸é??
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

    // ???äº¤ä?????
    await connection.promise().commit();
    res.json({ message: 'ç³»çµ±å·²é??ç½?' });
  } catch (error) {
    await connection.promise().rollback();
    console.error('Reset error:', error);
    res.status(500).json({ message: '???ç½®å¤±???' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});