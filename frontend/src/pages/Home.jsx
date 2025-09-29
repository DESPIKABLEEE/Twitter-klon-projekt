import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import { userStore, homeStore } from '../stores';
import NotificationBell from '../components/NotificationBell';
import './Home.css';
import { Trash, ChatCircleText, Heart, RocketLaunch } from "@phosphor-icons/react";

const Home = observer(() => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            navigate('/login');
            return;
        }
        
        userStore.setUser(JSON.parse(userData));
        userStore.setToken(token);
        
        homeStore.setShowFollowingOnly(false);
        fetchPosts(false);
    }, [navigate]);

    const fetchPosts = async (followingOnly = false) => {
        try {
            const token = localStorage.getItem('token');
            console.log('followingOnly:', followingOnly);
            
            if (!token) {
                console.log('Nema tokena u browseru');
                return;
            }

            console.log('Token prilikom poziva fetch posta:', token);
            homeStore.setPostsLoading(true);

            const endpoint = followingOnly 
                ? 'http://localhost:6969/api/posts/following'
                : 'http://localhost:6969/api/posts';

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                homeStore.setPosts(data.data.posts);
            } else {
                console.error('Greška postovi:', data.message);
                homeStore.setError(data.message || 'Failed to fetch posts');
            }
        } catch (error) {
            console.error('Greška :', error);
            homeStore.setError('Error loading posts');
        } finally {
            homeStore.setPostsLoading(false);
        }
    };    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!homeStore.newPost.trim()) return;

        homeStore.setLoading(true);
        homeStore.setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:6969/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: homeStore.newPost })
            });

            const data = await response.json();
            if (data.success) {
                homeStore.addPost(data.data);
                homeStore.setNewPost('');
            } else {
                homeStore.setError(data.message || 'Failed to create post');
            }
        } catch (error) {
            console.error('Error kod kreacije', error);
            homeStore.setError('Failed to create post');
        } finally {
            homeStore.setLoading(false);
        }
    };

    const handleToggleFilter = (followingOnly) => {
        homeStore.setShowFollowingOnly(followingOnly);
        homeStore.setPostsLoading(true);
        fetchPosts(followingOnly);
    };

    const handleLikePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:6969/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            console.log('Like ', data); // debug
            if (data.success) {
                homeStore.updatePost(postId, {
                    user_liked: data.data.isLiked,
                    likes_count: data.data.likesCount
                });
            } else {
                alert('Failed like/unlike');
            }
        } catch (error) {
            console.log('Error sa postom', error);
            alert('Failed like/unlike');
        }
    };

    const handleToggleComments = async (postId) => {
        if (homeStore.showComments[postId]) {
            homeStore.toggleComments(postId);
        } else {
            homeStore.toggleComments(postId);
            
            if (!homeStore.comments[postId]) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`http://localhost:6969/api/posts/${postId}/comments`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = await response.json();
                    if (data.success) {
                        homeStore.setComments(postId, data.data.comments);
                    }
                } catch (error) {
                    console.error('Error comments:', error);
                }
            }
        }
    };

    const handleCommentSubmit = async (postId, e) => {
        e.preventDefault();
        const commentText = homeStore.newComment[postId]?.trim();
        
        if (!commentText) return;

        homeStore.setCommentLoading(postId, true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:6969/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: commentText })
            });

            const data = await response.json();
            if (data.success) {
                homeStore.addComment(postId, data.data);
                homeStore.setNewComment(postId, '');
                
                homeStore.updatePost(postId, {
                    comments_count: homeStore.posts.find(p => p.id === postId).comments_count + 1
                });
            } else {
                homeStore.setError(data.message || 'Failed to post comment');
            }
        } catch (error) {
            console.error('Error comment:', error);
            homeStore.setError('Failed comment');
        } finally {
            homeStore.setCommentLoading(postId, false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:6969/api/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                homeStore.removePost(postId);
            } else {
                homeStore.setError(data.message || 'Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            homeStore.setError('Failed to delete post');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!userStore.user) {
        return <div className="loading">Loading...</div>;
    }

    const characterCount = homeStore.newPost.length;
    const maxCharacters = 280;
    const isOverLimit = characterCount > maxCharacters;

    return (
        <div className="home-container">
            <div className="home-content">
                <header className="home-header">
                    <h1 className="home-title">Home</h1>
                    {userStore.user && (
                        <span className="user-greeting">
                            Welcome, <Link to={`/${userStore.user.username}`} className="user-greeting-link">@{userStore.user.username}</Link>
                        </span>
                    )}
                    <div className="header-actions">
                        <NotificationBell />
                        <button 
                            onClick={handleLogout}
                            className="logout-btn"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <div className="posts-filter">
                    <button 
                        className={`filter-btn ${!homeStore.showFollowingOnly ? 'active' : ''}`}
                        onClick={() => handleToggleFilter(false)}
                    >
                        For you
                    </button>
                    <button 
                        className={`filter-btn ${homeStore.showFollowingOnly ? 'active' : ''}`}
                        onClick={() => handleToggleFilter(true)}
                    >
                        Following
                    </button>
                </div>

                <div className="post-form-card">
                    <form onSubmit={handleCreatePost} className="post-form">
                        <textarea
                            className="post-textarea"
                            placeholder="What's happening?"
                            value={homeStore.newPost}
                            onChange={(e) => homeStore.setNewPost(e.target.value)}
                            maxLength={320}
                        />
                        <div className="post-form-footer">
                            <span className={`character-count ${isOverLimit ? 'warning' : ''}`}>
                                {characterCount}/{maxCharacters}
                            </span>
                            <button 
                                type="submit" 
                                className="post-btn"
                                disabled={homeStore.loading || !homeStore.newPost.trim() || isOverLimit}
                            >
                                {homeStore.loading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
                    {homeStore.error && <div className="error-message">{homeStore.error}</div>}
                </div>

                <div className="posts-feed">
                    {homeStore.postsLoading ? (
                        <div className="loading">Loading posts...</div>
                    ) : homeStore.posts.length === 0 ? (
                        <div className="welcome-card">
                            <h3>No posts yet!</h3>
                            <p>Be the first to share something with the world <RocketLaunch size={32} weight="light" /></p>
                        </div>
                    ) : (
                        homeStore.posts.map(post => (
                            <div key={post.id} className="welcome-card">
                                <div className="post-header">
                                    <Link to={`/${post.username}`} className="post-avatar">
                                        {post.avatar_url ? (
                                            <img src={post.avatar_url} alt={post.username} />
                                        ) : (
                                            <span className="post-avatar-initial">
                                                {(post.display_name || post.username).charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </Link>
                                    <div className="post-user-info">
                                        <Link to={`/${post.username}`} className="post-display-name-link">
                                            <div className="post-display-name">{post.display_name || post.username}</div>
                                        </Link>
                                        <div className="post-username">
                                            <Link to={`/${post.username}`} className="post-username-link">
                                                @{post.username}
                                            </Link> · {new Date(post.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    {userStore.user && userStore.user.username === post.username && (
                                        <button 
                                            className="delete-post-btn"
                                            onClick={() => handleDeletePost(post.id)}
                                            title="Delete post"
                                        >
                                            <Trash size={32} />
                                        </button>
                                    )}
                                </div>
                                <p className="post-content">{post.content}</p>
                                {post.image_url && (
                                    <img 
                                        src={post.image_url} 
                                        alt="Post" 
                                        className="post-image"
                                    />
                                )}
                                <div className="post-actions">
                                    <span 
                                        className="post-action-comment"
                                        onClick={() => handleToggleComments(post.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <ChatCircleText size={32} /> {post.comments_count}
                                    </span>
                                    <span 
                                        className={`post-action-like ${post.user_liked ? 'post-action-liked' : ''}`}
                                        onClick={() => handleLikePost(post.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {post.user_liked ? <Heart size={32} weight="light" /> : <Heart size={32} weight="light" />} {post.likes_count}
                                    </span>
                                </div>
                                
                                {homeStore.showComments[post.id] && (
                                    <div className="comments-section">
                                        <div className="comments-list">
                                            {homeStore.comments[post.id]?.map(comment => (
                                                <div key={comment.id} className="comment-item">
                                                    <div className="comment-header">
                                                        <Link to={`/${comment.username}`} className="comment-avatar">
                                                            {comment.avatar_url ? (
                                                                <img src={comment.avatar_url} alt={comment.username} />
                                                            ) : (
                                                                <span className="comment-avatar-initial">
                                                                    {(comment.display_name || comment.username).charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </Link>
                                                        <div className="comment-user-info">
                                                            <Link to={`/${comment.username}`} className="comment-display-name">
                                                                {comment.display_name || comment.username}
                                                            </Link>
                                                            <span className="comment-username">
                                                                @{comment.username} · {new Date(comment.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="comment-content">{comment.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="comment-form">
                                            <textarea
                                                className="comment-textarea"
                                                placeholder="Write a comment..."
                                                value={homeStore.newComment[post.id] || ''}
                                                onChange={(e) => homeStore.setNewComment(post.id, e.target.value)}
                                                maxLength={280}
                                                rows={2}
                                            />
                                            <button 
                                                type="submit" 
                                                className="comment-btn"
                                                disabled={homeStore.commentLoading[post.id] || !(homeStore.newComment[post.id]?.trim())}
                                            >
                                                {homeStore.commentLoading[post.id] ? 'Posting...' : 'Comment'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
});

export default Home;