const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/test', async (req, res) => {
  try {
    const users = await query('SELECT COUNT(*) as count FROM users');
    const posts = await query('SELECT COUNT(*) as count FROM posts');
    
    res.json({
      success: true,
      data: {
        users_count: users[0].count,
        posts_count: posts[0].count,
        message: 'uzmi postove'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'error',
      error: error.message
    });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    console.log('post za user ', req.user); // debug
    console.log('start'); // debug
    
    const posts = await query(`
      SELECT 
        p.id,
        p.content,
        p.image_url,
        p.likes_count,
        p.comments_count,
        p.created_at,
        u.id as user_id,
        u.username,
        u.display_name,
        u.avatar_url,
        ${req.user ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked` : '0 as user_liked'}
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `, req.user ? [req.user.id] : []);

    console.log('finish'); // debug

    res.json({
      success: true,
      data: {
        posts: posts.map(post => ({
          ...post,
          user_liked: Boolean(post.user_liked)
        })),
        pagination: {
          page: 1,
          limit: 10,
          total: posts.length,
          totalPages: 1
        }
      }
    });

  } catch (error) {
    console.log('GET_POSTS', error); // debug
    res.status(500).json({
      success: false,
      message: 'ne radi fetch',
      error: error.message
    });
  }
});

router.get('/following', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('za usera ', userId); // debug
    
    const posts = await query(`
      SELECT 
        p.id,
        p.content,
        p.image_url,
        p.likes_count,
        p.comments_count,
        p.created_at,
        u.id as user_id,
        u.username,
        u.display_name,
        u.avatar_url,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as user_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE (
        p.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = ?
        ) 
        OR p.user_id = ?
      )
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [userId, userId, userId]); //LIMIT maknit?

    console.log('broj psotova :', posts.length); // more debug

    const response = {
      success: true,
      data: {
        posts: posts.map(post => ({
          ...post,
          user_liked: Boolean(post.user_liked)
        })),
        pagination: {
          page: 1,
          limit: 50,
          total: posts.length,
          totalPages: 1
        }
      }
    };
    
    console.log('za postove',response.data.posts.length); // debug

    res.json(response);

  } catch (error) {
    console.log('ERROR in following posts:', error);
    res.status(500).json({
      success: false,
      message: 'fetch ne radi',
      error: error.message
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const posts = await query(`
      SELECT 
        p.id,
        p.content,
        p.image_url,
        p.likes_count,
        p.comments_count,
        p.created_at,
        u.id as user_id,
        u.username,
        u.display_name,
        u.avatar_url,
        ${req.user ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked` : '0 as user_liked'}
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, req.user ? [req.user.id, postId] : [postId]);

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'nema posta'
      });
    }

    res.json({
      success: true,
      data: {
        ...posts[0],
        user_liked: Boolean(posts[0].user_liked)
      }
    });

  } catch (error) {
    console.log('GET_POST', error); // debug
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post'
    });
  }
});

router.post('/', authenticateToken, [
  body('content').isLength({ min: 1, max: 280 }).withMessage('Content must be between 1 and 280 characters'),
  body('image_url').optional().isURL().withMessage('Invalid image URL')
], async (req, res) => {
  try {
    console.log('creation'); // debug
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation failed'); // debug
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, image_url } = req.body;
    const userId = req.user.id;

    const result = await query(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [userId, content, image_url || null]
    );

    await query(
      'UPDATE users SET posts_count = posts_count + 1 WHERE id = ?',
      [userId]
    );

    const followers = await query(`
      SELECT f.follower_id, u.username as follower_username
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
    `, [userId]);

    const currentUser = await query('SELECT username FROM users WHERE id = ?', [userId]);

    const newPost = await query(`
      SELECT 
        p.id,
        p.content,
        p.image_url,
        p.likes_count,
        p.comments_count,
        p.created_at,
        u.id as user_id,
        u.username,
        u.display_name,
        u.avatar_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Post kreiran',
      data: newPost[0]
    });

  } catch (error) {
    console.log('CREATE_POST fail', error); // debug
    res.status(500).json({
      success: false,
      message: 'Fail za post'
    });
  }
});

router.put('/:id', authenticateToken, [
  body('content').isLength({ min: 1, max: 280 }).withMessage('Content must be between 1 and 280 characters'),
  body('image_url').optional().isURL().withMessage('Invalid image URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const postId = parseInt(req.params.id);
    const { content, image_url } = req.body;
    const userId = req.user.id;

    const posts = await query(
      'SELECT user_id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nema postova'
      });
    }

    if (posts[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Edit post'
      });
    }

    await query(
      'UPDATE posts SET content = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content, image_url || null, postId]
    );

    const updatedPost = await query(`
      SELECT 
        p.id,
        p.content,
        p.image_url,
        p.likes_count,
        p.comments_count,
        p.created_at,
        p.updated_at,
        u.id as user_id,
        u.username,
        u.display_name,
        u.avatar_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [postId]);

    res.json({
      success: true,
      message: 'Update radi',
      data: updatedPost[0]
    });

  } catch (error) {
    console.log('UPDATE_POST', error); // debug
    res.status(500).json({
      success: false,
      message: 'Ne radi update'
    });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const posts = await query(
      'SELECT user_id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nema posta'
      });
    }

    if (posts[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Samo svoje brisat'
      });
    }

    await query('DELETE FROM posts WHERE id = ?', [postId]);

    await query(
      'UPDATE users SET posts_count = posts_count - 1 WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Post se izbrisa'
    });

  } catch (error) {
    console.log('DELETE_POST', error); // debug
    res.status(500).json({
      success: false,
      message: 'Post se nije izbrisa'
    });
  }
});

router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const posts = await query('SELECT id FROM posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comments = await query(`
      SELECT 
        c.id,
        c.content,
        c.created_at,
        u.id as user_id,
        u.username,
        u.display_name,
        u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);

    res.json({
      success: true,
      data: {
        comments,
        count: comments.length
      }
    });

  } catch (error) {
    console.error('Comments error', error);
    res.status(500).json({
      success: false,
      message: 'Nema komentara',
      error: error.message
    });
  }
});

router.post('/:id/comments', authenticateToken, [
  body('content').isLength({ min: 1, max: 280 }).withMessage('Comment content must be between 1 and 280 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const postId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.user.id;

    const posts = await query('SELECT id FROM posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nema postova'
      });
    }

    const result = await query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content]
    );

    await query(
      'UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?',
      [postId]
    );

    const newComment = await query(`
      SELECT 
        c.id,
        c.content,
        c.created_at,
        u.id as user_id,
        u.username,
        u.display_name,
        u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Kreiran koemntar',
      data: newComment[0]
    });

  } catch (error) {
    console.error('Comment error ', error);
    res.status(500).json({
      success: false,
      message: 'Nema komentara',
      error: error.message
    });
  }
});

router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    console.log('like funkcija'); // debug
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    
    if (!postId || !userId) {
      console.log('LIKE_POST'); // debug
      return res.status(400).json({
        success: false,
        message: 'Nema data'
      });
    }

    const posts = await query(`
      SELECT p.id, p.user_id, u.username, u.display_name 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `, [postId]);
    
    if (posts.length === 0) {
      console.log('Nema posta : ', postId); // debug log
      return res.status(404).json({
        success: false,
        message: 'Nema post'
      });
    }

    const post = posts[0];
    console.log('Pronaden post ', post); // more debug

    const existingLike = await query(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    let likesCount = 0;

    let isLikedResult = false;
    if (existingLike.length > 0) {
      console.log('Micem like'); // debug

      await query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', 
        [postId, userId]);

      await query('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?', 
        [postId]);

      isLikedResult = false;
    } else {
      console.log('LIKE_POST: user hasnt liked, adding like...'); // debug

      await query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);

      await query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);

      isLikedResult = true;
    }

    const updatedPost = await query('SELECT likes_count FROM posts WHERE id = ?', [postId]);
    
    if (updatedPost.length === 0) {
      console.log('Error!'); // debug
      return res.status(500).json({
        success: false,
        message: 'error'
      });
    }
    
    let finalLikesCount = 0;
    finalLikesCount = updatedPost[0].likes_count;
    
    console.log('LIKE_POST', isLikedResult); // debug

    res.json({
      success: true,
      message: isLikedResult ? 'Post liked successfully' : 'Post unliked successfully',
      data: {
        isLiked: isLikedResult,
        likesCount: finalLikesCount
      }
    });

  } catch (error) {
    console.log('ERROR', error); 
    res.status(500).json({
      success: false,
      message: 'error oko likea',
      error: error.message
    });
  }
});

module.exports = router;