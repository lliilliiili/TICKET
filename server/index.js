const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// 註冊 API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: '此信箱已被註冊' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword
      }
    });

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
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 獲取座位區域資訊
app.get('/api/areas', async (req, res) => {
  try {
    const areas = await prisma.area.findMany();
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
    await prisma.$transaction(async (tx) => {
      const area = await tx.area.findUnique({
        where: { id: areaId }
      });

      if (!area || area.remaining < quantity) {
        throw new Error('座位不足');
      }

      await tx.area.update({
        where: { id: areaId },
        data: { remaining: area.remaining - quantity }
      });

      await tx.booking.create({
        data: {
          userId,
          areaName: area.name,
          price: area.price,
          quantity
        }
      });
    });

    res.status(201).json({ message: '訂票成功' });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: error.message || '訂票失敗' });
  }
});

// 獲取用戶的訂票記錄
app.get('/api/bookings/:userId', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: parseInt(req.params.userId) },
      orderBy: { bookingTime: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 重置系統
app.post('/api/reset', async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.booking.deleteMany(),
      prisma.area.updateMany({
        data: {
          remaining: {
            set: function(area) {
              switch(area.id) {
                case 'rock': return 100;
                case 'a': return 200;
                case 'b': return 300;
                case 'c': return 400;
                default: return area.remaining;
              }
            }
          }
        }
      })
    ]);

    res.json({ message: '系統已重置' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ message: '重置失敗' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});