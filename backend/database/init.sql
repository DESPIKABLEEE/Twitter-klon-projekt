-- Create database if not exists
CREATE DATABASE IF NOT EXISTS railway;

-- Use railway database
USE railway;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(255),
    google_id VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_google_id (google_id)
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    retweets_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (post_id, user_id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower_id (follower_id),
    INDEX idx_following_id (following_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('like', 'comment', 'follow', 'new_post') NOT NULL,
    related_user_id INT,
    related_post_id INT,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (related_post_id) REFERENCES posts(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (post_id, user_id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
);

-- Reposts table
CREATE TABLE IF NOT EXISTS reposts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_repost (post_id, user_id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
);

UPDATE users SET 
    followers_count = (SELECT COUNT(*) FROM follows WHERE following_id = users.id),
    following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = users.id),
    posts_count = (SELECT COUNT(*) FROM posts WHERE user_id = users.id);

UPDATE posts SET 
    likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = posts.id),
    comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id),
    retweets_count = (SELECT COUNT(*) FROM reposts WHERE post_id = posts.id);