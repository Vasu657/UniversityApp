const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admins can perform this action' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

router.post('/signup', async (req, res) => {
  const { name, email, password, role, branch } = req.body;

  if (!name || !email || !password || !role || !branch) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  // Validate role
  const validRoles = ['student', 'faculty', 'super_admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    // Determine the table based on role
    const table = role === 'student' ? 'users' : role === 'faculty' ? 'faculty' : 'super_admins';

    // Check for existing user in the appropriate table
    const [existingUser] = await db.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO ${table} (name, email, password, role, branch) VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, branch]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in POST /auth/signup:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Determine the table based on role
    const table = role === 'student' ? 'users' : role === 'faculty' ? 'faculty' : 'super_admins';

    const [users] = await db.query(`SELECT * FROM ${table} WHERE email = ? AND role = ?`, [email, role]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, branch: user.branch, table },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch } });
  } catch (error) {
    console.error('Error in POST /auth/login:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/add-faculty', authenticateToken, async (req, res) => {
  const { name, email, password, branch, role } = req.body;

  if (!name || !email || !password || !branch || role !== 'faculty') {
    return res.status(400).json({ message: 'All fields are required and role must be faculty' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // Check for existing faculty
    const [existingFaculty] = await db.query('SELECT * FROM faculty WHERE email = ?', [email]);
    if (existingFaculty.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO faculty (name, email, password, role, branch) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'faculty', branch]
    );

    res.status(201).json({ message: 'Faculty added successfully' });
  } catch (error) {
    console.error('Error in POST /auth/add-faculty:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;