# Twitter Clone Backend

Node.js backend for Twitter clone with MySQL database and WebSocket support.

## Features
- REST API for authentication and posts
- MySQL database integration
- Real-time notifications via WebSockets
- JWT authentication
- Google/Apple OAuth integration
- Docker containerization

## API Endpoints

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- POST /api/auth/google - Google OAuth
- POST /api/auth/apple - Apple OAuth
- GET /api/auth/me - Get current user

### Users
- GET /api/users/:username - Get user profile
- PUT /api/users/:id - Update user profile
- POST /api/users/:id/follow - Follow user
- DELETE /api/users/:id/follow - Unfollow user

### Posts
- GET /api/posts - Get all posts (feed)
- GET /api/posts/following - Get posts from followed users
- GET /api/posts/:id - Get single post
- POST /api/posts - Create new post
- DELETE /api/posts/:id - Delete post
- POST /api/posts/:id/like - Like post
- DELETE /api/posts/:id/like - Unlike post
- POST /api/posts/:id/comments - Add comment
- GET /api/posts/:id/comments - Get comments

### Notifications
- GET /api/notifications - Get user notifications
- PUT /api/notifications/:id/read - Mark notification as read

## Database Schema

### Users
- id, username, email, password_hash, display_name, bio, avatar_url, created_at, updated_at

### Posts
- id, user_id, content, image_url, created_at, updated_at

### Comments
- id, post_id, user_id, content, created_at

### Likes
- id, post_id, user_id, created_at

### Follows
- id, follower_id, following_id, created_at

### Notifications
- id, user_id, type, content, is_read, created_at

## Setup

1. Install Docker and Docker Compose
2. Run: `docker-compose up -d`
3. Backend will be available at http://localhost:5000
4. WebSocket server at ws://localhost:8080