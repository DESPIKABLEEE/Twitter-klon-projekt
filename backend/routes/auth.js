const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL || 'http://localhost:6969'}/api/auth/google/callback`
);


router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 50 }).trim(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    console.log('REGISTER', req.body); // debug
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('REGISTER: Validation errors:', errors.array()); // debug
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, username, password } = req.body;

    console.log('REGISTER'); // debug

    const existingUser = await query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      console.log('REGISTER'); // debug
      return res.status(400).json({
        success: false,
        message: 'Postoji vec'
      });
    }

    console.log('Hashing password'); // debug

    const passwordHash = await bcrypt.hash(password, 12);


    const result = await query(
      'INSERT INTO users (email, username, password_hash, display_name) VALUES (?, ?, ?, ?)',
      [email, username, passwordHash, username]
    );

    console.log('Kreacija usera ', result.insertId); // debug

    const newUser = await query(
      'SELECT id, email, username, display_name, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const token = jwt.sign(
      { userId: newUser[0].id, username: newUser[0].username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('uspilo za ', username); // debug

    res.status(201).json({
      success: true,
      message: 'Uspjesna registracija',
      data: {
        user: newUser[0],
        token
      }
    });

  } catch (error) {
    console.log('REGISTER', error); // debug
    res.status(500).json({
      success: false,
      message: 'Falitak registracije'
    });
  }
});


router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    console.log('LOGIN', req.body); // debug

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Neuspjesna validacija',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;


    const users = await query(
      'SELECT id, email, username, password_hash, display_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'korisnik ne postoji'
      });
    }

    const user = users[0];


    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Nepravilan email ili password'
      });
    }


    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );


    delete user.password_hash;

    res.json({
      success: true,
      message: 'Login da',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.log('LOGIN', error); // debug
    res.status(500).json({
      success: false,
      message: 'Login ne'
    });
  }
});


router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Nema tokena'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const users = await query(
      'SELECT id, email, username, display_name, bio, avatar_url, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User nije pronaden'
      });
    }

    res.json({
      success: true,
      data: {
        user: users[0]
      }
    });

  } catch (error) {
    console.log('GET_ME', error); // debug
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

router.get('/google', (req, res) => {
  try {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
      prompt: 'consent'
    });
    res.redirect(authorizeUrl);
  } catch (error) {
    console.error('Google OAuth init error:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize Google login' });
  }
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'No authorization code provided' });
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await query('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);

    if (user.length === 0) {
      const username = email.split('@')[0] + Math.random().toString(36).substring(2, 8);
      const result = await query(
        'INSERT INTO users (google_id, email, username, display_name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [googleId, email, username, name, picture]
      );
      
      user = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    } else {
      if (!user[0].google_id) {
        await query('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?', [googleId, picture, user[0].id]);
      }
      user = await query('SELECT * FROM users WHERE id = ?', [user[0].id]);
    }

    const token = jwt.sign(
      { userId: user[0].id, username: user[0].username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?token=${token}&google=true`);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({ success: false, message: 'Google login failed' });
  }
});

module.exports = router;