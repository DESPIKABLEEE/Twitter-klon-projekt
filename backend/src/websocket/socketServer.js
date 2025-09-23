const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;
const userSockets = new Map(); 

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.username} (ID: ${socket.userId}) connected`);
    
    userSockets.set(socket.userId, socket.id);

    socket.join(`user_${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`User ${socket.username} (ID: ${socket.userId}) disconnected`);
      userSockets.delete(socket.userId);
    });

    socket.emit('connected', {
      message: `Welcome ${socket.username}! Real-time notifications are active.`
    });
  });

  return io;
};

const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('new_notification', notification);
    console.log(`Notification sent to user ${userId}:`, notification);
  }
};

const broadcastNotification = (notification) => {
  if (io) {
    io.emit('broadcast_notification', notification);
    console.log('Broadcast notification sent:', notification);
  }
};

const sendNotificationToFollowers = async (userId, notification, query) => {
  try {
    if (io) {
      const followers = await query(
        'SELECT follower_id FROM follows WHERE following_id = ?',
        [userId]
      );

      followers.forEach(follower => {
        io.to(`user_${follower.follower_id}`).emit('new_notification', notification);
      });

      console.log(`Notification sent to ${followers.length} followers of user ${userId}`);
    }
  } catch (error) {
    console.error('Error sending notification to followers:', error);
  }
};

const getConnectedUsers = () => {
  return Array.from(userSockets.keys());
};

module.exports = {
  initializeSocket,
  sendNotificationToUser,
  broadcastNotification,
  sendNotificationToFollowers,
  getConnectedUsers
};