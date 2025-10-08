const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await query(`
      SELECT n.*, u.username, u.display_name, u.avatar_url
      FROM notifications n
      LEFT JOIN users u ON n.related_user_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]);

    const unreadCount = await query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);

    res.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          message: n.content,
          from_user: n.related_user_id ? {
            id: n.related_user_id,
            username: n.username,
            display_name: n.display_name,
            avatar_url: n.avatar_url
          } : null,
          post_id: n.related_post_id,
          is_read: n.is_read,
          created_at: n.created_at
        })),
        unreadCount: unreadCount[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);

    res.json({
      success: true,
      data: { unreadCount: result[0].count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ 
      success: true, 
      message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
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