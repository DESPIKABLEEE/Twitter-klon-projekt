const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

const router = express.Router();


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
        message: 'nepravilan mail ili password' // ode bi tribalo ic korisnik ne postoji a ne nepravilan mail
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


    delete user.password_hash; // zasto brisem sifru

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

module.exports = router;