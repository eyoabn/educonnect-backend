const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'educonnect' })
  .then(() => {
    console.log(`✅ MongoDB Connected to database: ${process.env.DB_NAME || 'educonnect'}`);
    seedDefaultCourses();
    seedDefaultAdmin();
  })
  .catch(err => console.log('❌ MongoDB Error:', err));

// ═══ SEED DEFAULT COURSES ═══
async function seedDefaultCourses() {
  try {
    const Course = require('./models/Course');
    const courseCount = await Course.countDocuments();
    
    if (courseCount === 0) {
      const defaultCourses = [
        {
          name: 'Introduction to Computer Science',
          students: [],
          pending: [],
          avgGrade: 85,
          progress: 60,
        },
        {
          name: 'Advanced Mathematics',
          students: [],
          pending: [],
          avgGrade: 92,
          progress: 75,
        },
        {
          name: 'Physics Fundamentals',
          students: [],
          pending: [],
          avgGrade: 78,
          progress: 65,
        },
        {
          name: 'English Literature',
          students: [],
          pending: [],
          avgGrade: 88,
          progress: 70,
        },
        {
          name: 'Chemistry Lab',
          students: [],
          pending: [],
          avgGrade: 82,
          progress: 68,
        },
        {
          name: 'History & Civilization',
          students: [],
          pending: [],
          avgGrade: 90,
          progress: 72,
        },
      ];
      
      await Course.insertMany(defaultCourses);
      console.log('📚 Created 6 default courses');
    }
  } catch (err) {
    console.log('⚠️  Error seeding courses:', err.message);
  }
}

// ═══ SEED DEFAULT ADMIN ACCOUNT ═══
async function seedDefaultAdmin() {
  try {
    const User = require('./models/User');
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('🔐 Admin account already exists');
      return;
    }

    const adminEmail = 'admin@gmail.com';
    const adminName = 'admin';
    const adminPassword = '123456';

    const user = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      approved: true,
    });

    await user.save();
    console.log(`🔐 Created default admin account: ${adminEmail} / ${adminPassword}`);
  } catch (err) {
    console.log('⚠️  Error seeding admin account:', err.message);
  }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/qa', require('./routes/qa'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/schedule', require('./routes/schedule'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// Start Server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`📚 EduConnect Backend Active`);
});
