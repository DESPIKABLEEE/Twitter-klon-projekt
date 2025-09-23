const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Odbijen pristup'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const users = await query(
      'SELECT id, username, email, display_name, avatar_url FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Nepravilan token'
      });
    }

    req.user = users[0];
    next();

  } catch (error) {
    console.error('Auth middleware error', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Nepravilan token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Istek token'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Autektifikacija error'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      const users = await query(
        'SELECT id, username, email, display_name, avatar_url FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length > 0) {
        req.user = users[0];
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};