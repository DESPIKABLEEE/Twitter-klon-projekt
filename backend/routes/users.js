const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { optionalAuth, authenticateToken } = require('../middlewares/auth');
const { sendNotificationToUser } = require('../src/websocket/socketServer');

router.get('/suggested', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const suggestedUsers = await query(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.followers_count
      FROM users u
      WHERE u.id != ? 
      AND u.id NOT IN (
        SELECT following_id 
        FROM follows 
        WHERE follower_id = ?
      )
      ORDER BY RAND()
      LIMIT 3
    `, [currentUserId, currentUserId]);

    res.json({
      success: true,
      data: { users: suggestedUsers }
    });

  } catch (error) {
    console.log('GET_SUGGESTED_USERS', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/:username/followers', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    
    const userResult = await query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = userResult[0].id;

    const followers = await query(`
      SELECT u.id, u.username, u.display_name, u.avatar_url
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: { followers }
    });

  } catch (error) {
    console.log('GET_FOLLOWERS', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/:username/following', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    
    const userResult = await query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = userResult[0].id;

    const following = await query(`
      SELECT u.id, u.username, u.display_name, u.avatar_url
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: { following }
    });

  } catch (error) {
    console.log('GET_FOLLOWING', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/search', optionalAuth, async (req, res) => {
  console.log('SEARCH endpoint called with query:', req.query);
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.json({
        success: true,
        data: { users: [] }
      });
    }

    const searchTerm = `%${q.trim()}%`;
    
    const users = await query(`
      SELECT 
        u.id, 
        u.username, 
        u.display_name, 
        u.avatar_url,
        u.followers_count,
        u.following_count,
        ${req.user ? `(SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following` : '0 as is_following'}
      FROM users u
      WHERE (u.username LIKE ? OR u.display_name LIKE ?)
      AND u.id != ?
      ORDER BY 
        CASE 
          WHEN u.username LIKE ? THEN 1
          WHEN u.display_name LIKE ? THEN 2
          ELSE 3
        END,
        u.followers_count DESC
      LIMIT 20
    `, [
      req.user ? req.user.id : null,
      searchTerm, 
      searchTerm,
      req.user ? req.user.id : 0,
      `${q.trim()}%`,
      `${q.trim()}%`
    ]);

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.log('SEARCH_USERS', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const userResult = await query(
      `SELECT id, username, email, display_name, bio, 
              avatar_url, created_at, followers_count, following_count
       FROM users 
       WHERE username = ?`,
      [username]
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ne postoji user'
      });
    }

    const user = userResult[0];

    let isFollowing = false;

    if (currentUserId && currentUserId !== user.id) {
      const followResult = await query(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
        [currentUserId, user.id]
      );
      isFollowing = followResult.length > 0;
    }

    const postsResult = await query(
      `SELECT p.*, u.username, u.display_name, u.avatar_url,
              COUNT(DISTINCT l.id) as likes_count,
              COUNT(DISTINCT c.id) as comments_count,
              MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) as user_liked,
              MAX(CASE WHEN b.user_id = ? THEN 1 ELSE 0 END) as user_bookmarked
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON p.id = l.post_id
       LEFT JOIN comments c ON p.id = c.post_id
       LEFT JOIN bookmarks b ON p.id = b.post_id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [currentUserId, currentUserId, user.id]
    );

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          isFollowing,
          isOwnProfile: currentUserId === user.id
        },
        posts: postsResult.map(post => ({
          ...post,
          user_liked: Boolean(post.user_liked),
          user_bookmarked: Boolean(post.user_bookmarked)
        }))
      }
    });

  } catch (error) {
    console.log('get user', error); // debug
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/:userId/follow', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const targetUserResult = await query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (targetUserResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nema usera'
      });
    }

    const targetUserId = targetUserResult[0].id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'follow samog sebe'
      });
    }

    const existingFollow = await query(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
      [currentUserId, targetUserId]
    );

    let isFollowing;
    
    if (existingFollow.length > 0) {
      await query(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [currentUserId, targetUserId]
      );
      
      await query(
        'UPDATE users SET followers_count = followers_count - 1 WHERE id = ?',
        [targetUserId]
      );
      await query(
        'UPDATE users SET following_count = following_count - 1 WHERE id = ?',
        [currentUserId]
      );
      
      isFollowing = false;
    } else {
      await query(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
        [currentUserId, targetUserId]
      );
      
      await query(
        'UPDATE users SET followers_count = followers_count + 1 WHERE id = ?',
        [targetUserId]
      );
      await query(
        'UPDATE users SET following_count = following_count + 1 WHERE id = ?',
        [currentUserId]
      );
      
      try {
        const insertResult = await query(`
          INSERT INTO notifications (user_id, type, related_user_id, content) 
          VALUES (?, 'follow', ?, ?)
        `, [
          targetUserId, 
          currentUserId, 
          `${req.user.username} started following you`
        ]);

        const notificationId = insertResult.insertId;

        const notification = {
          id: notificationId,
          type: 'follow',
          message: `<strong>@${req.user.username}</strong> started following you`,
          from_user: {
            id: currentUserId,
            username: req.user.username
          },
          created_at: new Date().toISOString()
        };

        sendNotificationToUser(targetUserId, notification);
        console.log(`Follow notification sent to user ${targetUserId}`);
      } catch (notifError) {
        console.error('Error sending follow notification:', notifError);
      }
      
      isFollowing = true;
    }

    const updatedUser = await query(
      'SELECT followers_count, following_count FROM users WHERE id = ?',
      [targetUserId]
    );

    res.json({
      success: true,
      data: {
        isFollowing,
        followers_count: updatedUser[0].followers_count,
        following_count: updatedUser[0].following_count
      }
    });

  } catch (error) {
    console.log('FOLLOW_UNFOLLOW', error); // debug
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, display_name } = req.body;

    if (bio !== undefined && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio must be less than 500 characters'
      });
    }

    if (display_name !== undefined && display_name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Display name must be less than 50 characters'
      });
    }

    let updateFields = [];
    let values = [];

    if (bio !== undefined) {
      updateFields.push('bio = ?');
      values.push(bio);
    }

    if (display_name !== undefined) {
      updateFields.push('display_name = ?');
      values.push(display_name);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = NOW() 
      WHERE id = ?
    `;

    await query(updateQuery, values);

    const updatedUser = await query(
      'SELECT id, username, display_name, bio, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: updatedUser[0],
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.log('Uprate profile error', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});



// dummy
router.get('/', (req, res) => {
  res.json({ success: true, message: 'dummy' });
});

module.exports = router;