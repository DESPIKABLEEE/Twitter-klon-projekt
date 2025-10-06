const express = require('express');
const { query } = require('../config/database');
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

// DELETE notifikaciju
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const notification = await query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notification.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [notificationId, userId]);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

const createNotification = async () => {};

module.exports = { router, createNotification };