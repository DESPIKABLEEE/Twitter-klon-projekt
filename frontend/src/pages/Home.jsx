import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import './Home.css';

function Home() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(false);
    const [postsLoading, setPostsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showComments, setShowComments] = useState({});
    const [comments, setComments] = useState({}); 
    const [newComment, setNewComment] = useState({}); 
    const [commentLoading, setCommentLoading] = useState({}); 
    const [showFollowingOnly, setShowFollowingOnly] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            navigate('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            console.log('localStorage user', parsedUser); // debug
            
            fetchPosts();
        } catch (err) {
            console.log('Error', err); // debug log
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const fetchPosts = async (followingOnly = false) => {
        try {
            const token = localStorage.getItem('token');
            console.log('followingOnly:', followingOnly); // debug
            
            if (!token) {
                console.log('Nema tokena u browseru'); // debug
                setError('Please login again');
                navigate('/login');
                return;
            }
            
            setPostsLoading(true);
            
            let endpoint = 'http://localhost:6969/api/posts';
            if (followingOnly === true) {
                endpoint = endpoint + '/following'; 
            }
                            
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            console.log('data ', data); // debug
            
            if (data.success && data.data && data.data.posts) {
                console.log('Setting posts:', data.data.posts.length, 'posts'); // debug
                setPosts(data.data.posts);
            } else {
                console.log('ERROR ', data); 
                setError('ERROR sa postovima');
                alert('Something went wrong loading posts!'); 
            }
        } catch (error) {
            console.log('ERROR fetching', error); 
            setError('nema postova');
            alert('Error: ' + error.message); 
        } finally {
            console.log('setting loading false'); // debug
            setPostsLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:6969/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newPost })
            });

            const data = await response.json();
            if (data.success) {
                setPosts([data.data, ...posts]);
                setNewPost('');
            } else {
                setError(data.message || 'Failed to create post');
            }
        } catch (error) {
            console.error('Error kod kreacije', error);
            setError('Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFilter = (followingOnly) => {
        setShowFollowingOnly(followingOnly);
        setPostsLoading(true);
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
                const updatedPosts = [];
                for (let i = 0; i < posts.length; i++) {
                    if (posts[i].id === postId) {
                        updatedPosts.push({
                            ...posts[i],
                            user_liked: data.data.isLiked,
                            likes_count: data.data.likesCount
                        });
                    } else {
                        updatedPosts.push(posts[i]);
                    }
                }
                setPosts(updatedPosts);
            } else {
                alert('Failed to like/unlike post');
            }
        } catch (error) {
            console.log('Error sa postom', error);
            alert('Failed to like/unlike post');
        }
    };

    const handleToggleComments = async (postId) => {
        if (showComments[postId]) {
            setShowComments(prev => ({ ...prev, [postId]: false }));
        } else {
            setShowComments(prev => ({ ...prev, [postId]: true }));
            
            if (!comments[postId]) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`http://localhost:6969/api/posts/${postId}/comments`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = await response.json();
                    if (data.success) {
                        setComments(prev => ({ ...prev, [postId]: data.data.comments }));
                    }
                } catch (error) {
                    console.error('Error loading comments:', error);
                }
            }
        }
    };

    const handleCommentSubmit = async (postId, e) => {
        e.preventDefault();
        const commentText = newComment[postId]?.trim();
        
        if (!commentText) return;

        setCommentLoading(prev => ({ ...prev, [postId]: true }));

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
                setComments(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), data.data]
                }));
                
                setNewComment(prev => ({ ...prev, [postId]: '' }));
                
                setPosts(posts.map(post => 
                    post.id === postId 
                        ? { ...post, comments_count: post.comments_count + 1 }
                        : post
                ));
            } else {
                setError(data.message || 'Failed to post comment');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            setError('Failed to post comment');
        } finally {
            setCommentLoading(prev => ({ ...prev, [postId]: false }));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) {
        return <div className="loading">Loading...</div>;
    }

    const characterCount = newPost.length;
    const maxCharacters = 280;
    const isOverLimit = characterCount > maxCharacters;

    return (
        <div className="home-container">
            <div className="home-content">
                <header className="home-header">
                    <h1 className="home-title">Home</h1>
                    {user && <span className="user-greeting">Welcome, @{user.username}</span>}
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
                        className={`filter-btn ${!showFollowingOnly ? 'active' : ''}`}
                        onClick={() => handleToggleFilter(false)}
                    >
                        For you
                    </button>
                    <button 
                        className={`filter-btn ${showFollowingOnly ? 'active' : ''}`}
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
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            maxLength={320}
                        />
                        <div className="post-form-footer">
                            <span className={`character-count ${isOverLimit ? 'warning' : ''}`}>
                                {characterCount}/{maxCharacters}
                            </span>
                            <button 
                                type="submit" 
                                className="post-btn"
                                disabled={loading || !newPost.trim() || isOverLimit}
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
                    {error && <div className="error-message">{error}</div>}
                </div>

                <div className="posts-feed">
                    {postsLoading ? (
                        <div className="loading">Loading posts...</div>
                    ) : posts.length === 0 ? (
                        <div className="welcome-card">
                            <h3>No posts yet!</h3>
                            <p>Be the first to share something with the world 🚀</p>
                        </div>
                    ) : (
                        posts.map(post => (
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
                                        💬 {post.comments_count}
                                    </span>
                                    <span 
                                        className={`post-action-like ${post.user_liked ? 'post-action-liked' : ''}`}
                                        onClick={() => handleLikePost(post.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {post.user_liked ? '❤️' : '🤍'} {post.likes_count}
                                    </span>
                                </div>
                                
                                {/* Comments Section */}
                                {showComments[post.id] && (
                                    <div className="comments-section">
                                        <div className="comments-list">
                                            {comments[post.id]?.map(comment => (
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
                                                value={newComment[post.id] || ''}
                                                onChange={(e) => setNewComment(prev => ({ 
                                                    ...prev, 
                                                    [post.id]: e.target.value 
                                                }))}
                                                maxLength={280}
                                                rows={2}
                                            />
                                            <button 
                                                type="submit" 
                                                className="comment-btn"
                                                disabled={commentLoading[post.id] || !(newComment[post.id]?.trim())}
                                            >
                                                {commentLoading[post.id] ? 'Posting...' : 'Comment'}
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
}

export default Home;