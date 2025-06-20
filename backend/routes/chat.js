const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Error logging function
const logError = (error, endpoint, additionalInfo = {}) => {
  const logMessage = `[${new Date().toISOString()}] Error in ${endpoint}: ${error.message}\n` +
    `Stack: ${error.stack}\n` +
    `Additional Info: ${JSON.stringify(additionalInfo, null, 2)}\n`;
  const logFile = path.join(__dirname, '../logs/error.log');
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
};

// Log incoming requests
router.use((req, res, next) => {
  next();
});

// Get students by faculty branch
router.get('/students', authenticate, async (req, res) => {
  const facultyId = req.user.id;
  try {
    if (req.user.role !== 'faculty') {
      logError(new Error('Unauthorized role'), 'GET /chat/students', { facultyId, role: req.user.role });
      return res.status(403).json({ message: 'Only faculty can access this endpoint' });
    }
    const [faculty] = await db.query('SELECT id, branch FROM faculty WHERE id = ?', [facultyId]);
    if (faculty.length === 0) {
      logError(new Error('Faculty not found'), 'GET /chat/students', { facultyId });
      return res.status(404).json({ message: 'Faculty not found' });
    }
    const branch = faculty[0].branch;
    if (!branch) {
      logError(new Error('Faculty branch not set'), 'GET /chat/students', { facultyId });
      return res.status(400).json({ message: 'Faculty branch not configured' });
    }
    const [students] = await db.query(
      'SELECT id, name, email FROM users WHERE branch = ? AND role = "student"',
      [branch]
    );
    res.json({ students });
  } catch (error) {
    logError(error, 'GET /chat/students', { facultyId, role: req.user.role });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message
router.post('/send', authenticate, async (req, res) => {
  const { receiver_id, receiver_role, message } = req.body;
  if (!receiver_id || !receiver_role || !message) {
    return res.status(400).json({ message: 'Receiver ID, role, and message are required' });
  }
  if (!['faculty', 'student'].includes(receiver_role)) {
    return res.status(400).json({ message: 'Invalid receiver role' });
  }
  try {
    if (!['faculty', 'student'].includes(req.user.role)) {
      logError(new Error('Unauthorized role'), 'POST /chat/send', { senderId: req.user.id, role: req.user.role });
      return res.status(403).json({ message: 'Invalid sender role' });
    }
    const senderTable = req.user.role === 'faculty' ? 'faculty' : 'users';
    const receiverTable = receiver_role === 'faculty' ? 'faculty' : 'users';
    const [sender] = await db.query(`SELECT id FROM ${senderTable} WHERE id = ?`, [req.user.id]);
    if (sender.length === 0) {
      logError(new Error('Sender not found'), 'POST /chat/send', { senderId: req.user.id, senderRole: req.user.role });
      return res.status(404).json({ message: 'Sender not found' });
    }
    const [receiver] = await db.query(`SELECT id FROM ${receiverTable} WHERE id = ?`, [receiver_id]);
    if (receiver.length === 0) {
      logError(new Error('Receiver not found'), 'POST /chat/send', { receiverId: receiver_id, receiverRole: receiver_role });
      return res.status(404).json({ message: 'Receiver not found' });
    }
    await db.query(
      'INSERT INTO messages (sender_id, sender_role, receiver_id, receiver_role, message, is_read) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.role, receiver_id, receiver_role, message, false]
    );
    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    logError(error, 'POST /chat/send', { senderId: req.user.id, receiverId: receiver_id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages between faculty and student
router.get('/messages/:otherUserId/:otherUserRole', authenticate, async (req, res) => {
  const { otherUserId, otherUserRole } = req.params;
  if (!['faculty', 'student'].includes(otherUserRole)) {
    return res.status(400).json({ message: 'Invalid user role' });
  }
  try {
    if (!['faculty', 'student'].includes(req.user.role)) {
      logError(new Error('Unauthorized role'), `GET /chat/messages/${otherUserId}/${otherUserRole}`, { userId: req.user.id, role: req.user.role });
      return res.status(403).json({ message: 'Invalid user role' });
    }
    const userId = req.user.id;
    const userRole = req.user.role;
    const otherTable = otherUserRole === 'faculty' ? 'faculty' : 'users';
    const [otherUser] = await db.query(`SELECT id FROM ${otherTable} WHERE id = ?`, [otherUserId]);
    if (otherUser.length === 0) {
      logError(new Error('User not found'), `GET /chat/messages/${otherUserId}/${otherUserRole}`, { otherUserId, otherUserRole });
      return res.status(404).json({ message: 'User not found' });
    }
    const [messages] = await db.query(
      `SELECT id, sender_id, sender_role, receiver_id, receiver_role, message, created_at, is_read
       FROM messages
       WHERE (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
          OR (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
       ORDER BY created_at ASC`,
      [userId, userRole, otherUserId, otherUserRole, otherUserId, otherUserRole, userId, userRole]
    );
    res.json({ messages });
  } catch (error) {
    logError(error, `GET /chat/messages/${otherUserId}/${otherUserRole}`, { userId: req.user.id, otherUserId, otherUserRole });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark messages as read
router.post('/mark-read/:otherUserId/:otherUserRole', authenticate, async (req, res) => {
  const { otherUserId, otherUserRole } = req.params;
  if (!['faculty', 'student'].includes(otherUserRole)) {
    return res.status(400).json({ message: 'Invalid user role' });
  }
  try {
    if (!['faculty', 'student'].includes(req.user.role)) {
      logError(new Error('Unauthorized role'), `POST /chat/mark-read/${otherUserId}/${otherUserRole}`, { userId: req.user.id, role: req.user.role });
      return res.status(403).json({ message: 'Invalid user role' });
    }
    const userId = req.user.id;
    const userRole = req.user.role;
    const otherTable = otherUserRole === 'faculty' ? 'faculty' : 'users';
    const [otherUser] = await db.query(`SELECT id FROM ${otherTable} WHERE id = ?`, [otherUserId]);
    if (otherUser.length === 0) {
      logError(new Error('User not found'), `POST /chat/mark-read/${otherUserId}/${otherUserRole}`, { otherUserId, otherUserRole });
      return res.status(404).json({ message: 'User not found' });
    }
    await db.query(
      `UPDATE messages
       SET is_read = ?
       WHERE sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ? AND is_read = ?`,
      [true, otherUserId, otherUserRole, userId, userRole, false]
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    logError(error, `POST /chat/mark-read/${otherUserId}/${otherUserRole}`, { userId: req.user.id, otherUserId, otherUserRole });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;