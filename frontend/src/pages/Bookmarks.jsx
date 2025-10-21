import React, { useEffect } from 'react';
import { observer } from 'mobx-react';
import { useNavigate } from 'react-router-dom';
import { userStore, bookmarkStore } from '../stores';
import './Home.css';
import { Trash, ChatCircleText, Heart, RocketLaunch, BookmarkSimple } from "@phosphor-icons/react";

const Bookmarks = observer(() => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData || userData === 'undefined' || userData === 'null') {
            navigate('/login');
            return;
        }
        
        try {
            const parsedUser = JSON.parse(userData);
            userStore.setUser(parsedUser);
            userStore.setToken(token);
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/login');
            return;
        }

        bookmarkStore.initialize();
    }, [navigate]);

    if (!userStore.user) {
        return null;
    }

    return (
        <div className="twitter-layout home-page">
            <div className="sidebar">
                <div className="sidebar-content">
                    <div className="logo">
                        <img src="/images/twitter.png" alt="X" style={{width: '100%', borderRadius: '50%'}} />
                    </div>
                    
                    <nav>
                        <div className="nav-item" onClick={() => navigate('/')}>
                            <span>Home</span>
                        </div>
                        <div className="nav-item active">
                            <BookmarkSimple className="nav-icon" weight="fill" />
                            <span>Bookmarks</span>
                        </div>
                        <div 
                            className="nav-item"
                            onClick={() => navigate(`/profile/${userStore.user?.username}`)}
                        >
                            <span>Profile</span>
                        </div>
                    </nav>
                </div>
            </div>

            <div className="main-content">
                <div className="main-header">
                    <h2>Bookmarks</h2>
                </div>

                <div className="posts-timeline">
                    {bookmarkStore.bookmarksLoading ? (
                        <div className="loading">Loading bookmarks...</div>
                    ) : bookmarkStore.bookmarks.length === 0 ? (
                        <div className="empty-state">
                            <h3>No bookmarks yet!</h3>
                            <p>Save posts to your bookmarks so you can find them later</p>
                        </div>
                    ) : (
                        bookmarkStore.bookmarks.map(post => (
                            <article key={post.id} className="post-item">
                                <div className="post-container">
                                    <div className="post-avatar">
                                        {post.display_name ? post.display_name[0].toUpperCase() : post.username[0].toUpperCase()}
                                    </div>
                                    <div className="post-content">
                                        <div className="post-header">
                                            <span className="post-author">{post.display_name || post.username}</span>
                                            <span className="post-handle">@{post.username}</span>
                                            <span className="post-time">·</span>
                                            <span className="post-time">{new Date(post.created_at).toLocaleDateString()}</span>
                                            {userStore.user && userStore.user.username === post.username && (
                                                <button 
                                                    className="post-action"
                                                    onClick={() => bookmarkStore.handleDeletePost(post.id)}
                                                    title="Delete post"
                                                    style={{marginLeft: 'auto'}}
                                                >
                                                    <Trash className="action-icon" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="post-text">
                                            {post.content}
                                        </div>
                                        {post.image_url && (
                                            <div className="post-image-container">
                                                <img 
                                                    src={post.image_url} 
                                                    alt="Post" 
                                                    className="post-image"
                                                />
                                            </div>
                                        )}
                                        <div className="post-actions">
                                            <button 
                                                className="post-action"
                                                onClick={() => bookmarkStore.handleToggleComments(post.id)}
                                            >
                                                <ChatCircleText className="action-icon" />
                                                <span>{post.comments_count}</span>
                                            </button>
                                            <button 
                                                className={`post-action ${post.user_liked ? 'liked' : ''}`}
                                                onClick={() => bookmarkStore.handleLikePost(post.id)}
                                            >
                                                <Heart className="action-icon" weight={post.user_liked ? 'fill' : 'regular'} />
                                                <span>{post.likes_count}</span>
                                            </button>
                                            <button className="post-action">
                                                <RocketLaunch className="action-icon" />
                                            </button>
                                            <button 
                                                className={`post-action ${post.user_bookmarked ? 'bookmarked' : ''}`}
                                                onClick={() => bookmarkStore.handleBookmarkPost(post.id)}
                                            >
                                                <BookmarkSimple className="action-icon" weight={post.user_bookmarked ? 'fill' : 'regular'} />
                                            </button>
                                        </div>
                                        
                                        {bookmarkStore.showComments[post.id] && (
                                            <div className="comments-section" style={{marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgb(47, 51, 54)'}}>
                                                <div className="comments-list">
                                                    {bookmarkStore.comments[post.id]?.map((comment, commentIndex) => (
                                                        <div key={`comment-${comment.id}-${commentIndex}`} className="comment-item" style={{padding: '0.5rem 0', borderBottom: '1px solid rgb(47, 51, 54)'}}>
                                                            <div 
                                                                style={{display: 'flex', alignItems: 'center', marginBottom: '0.25rem', cursor: 'pointer'}}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/profile/${comment.username}`);
                                                                }}
                                                            >
                                                                <div style={{width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: '#1d9bf0', marginRight: '0.5rem'}}></div>
                                                                <span style={{fontWeight: '700', marginRight: '0.5rem'}}>{comment.display_name || comment.username}</span>
                                                                <span style={{color: '#71767b'}}>@{comment.username}</span>
                                                            </div>
                                                            <p style={{marginLeft: '2rem', color: '#e7e9ea'}}>{comment.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <form onSubmit={(e) => {
                                                    e.preventDefault();
                                                    bookmarkStore.handleCommentSubmit(post.id, bookmarkStore.newComment[post.id]);
                                                }} className="comment-form">
                                                    <textarea
                                                        placeholder="Write a comment..."
                                                        value={bookmarkStore.newComment[post.id] || ''}
                                                        onChange={(e) => bookmarkStore.setNewComment(post.id, e.target.value)}
                                                        maxLength={280}
                                                        rows={2}
                                                        className="comment-textarea"
                                                    />
                                                    <button 
                                                        type="submit" 
                                                        className="post-button comment-submit-btn"
                                                        disabled={bookmarkStore.commentLoading[post.id] || !(bookmarkStore.newComment[post.id]?.trim())}
                                                    >
                                                        {bookmarkStore.commentLoading[post.id] ? 'Posting...' : 'Comment'}
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
});

export default Bookmarks;
