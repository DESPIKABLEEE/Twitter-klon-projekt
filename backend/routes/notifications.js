const express = require('express');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

// moram napravit

router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, data: { notifications: [], unreadCount: 0 } });
});

router.get('/unread-count', authenticateToken, (req, res) => {
  res.json({ success: true, data: { unreadCount: 0 } });
});

router.put('/:id/read', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'OK' });
});

router.put('/read-all', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'OK' });
});

const createNotification = async () => {};

module.exports = { router, createNotification };