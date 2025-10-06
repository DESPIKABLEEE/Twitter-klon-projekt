import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import { userStore, homeStore } from '../stores';
import NotificationBell from '../components/NotificationBell';
import WhoToFollow from '../components/WhoToFollow';
import PremiumSubscription from '../components/PremiumSubscription';
import './Home.css';
import { 
    Trash, 
    ChatCircleText, 
    Heart, 
    RocketLaunch, 
    House,
    MagnifyingGlass,
    Bell,
    Envelope,
    BookmarkSimple,
    User,
    DotsThree,
    ImageSquare,
    Gif,
    ListBullets,
    SmileySticker,
    CalendarBlank,
    MapPin
} from "@phosphor-icons/react";

const Home = observer(() => {
    const navigate = useNavigate();
    const [showUserDropdown, setShowUserDropdown] = useState(false);

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
        
        homeStore.setShowFollowingOnly(false);
        fetchPosts();
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = () => {
            if (showUserDropdown) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showUserDropdown]);

    const fetchPosts = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Nema tokena u browseru');
            return;
        }
        
        await homeStore.fetchPosts();
    };    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!homeStore.newPost.trim()) return;

        try {
            await homeStore.createPost(homeStore.newPost);
        } catch (error) {
            console.error('Error kod kreacije', error);
        }
    };



    const handleLikePost = async (postId) => {
        try {
            await homeStore.likePost(postId);
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
                    await homeStore.fetchComments(postId);
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
            await homeStore.createComment(postId, commentText);
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            homeStore.setCommentLoading(postId, false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            await homeStore.deletePost(postId);
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
        <div className="twitter-layout">
            {/* Left Sidebar */}
            <div className="sidebar">
                <div className="sidebar-content">
                    <div className="logo">
                        <img src="/images/pas.jpeg" alt="X" style={{width: '100%', borderRadius: '50%'}} />
                    </div>
                    
                    <nav>
                        <div className="nav-item active" onClick={() => navigate('/')}>
                            <House className="nav-icon" weight="fill" />
                            <span>Home</span>
                        </div>
                        <div className="nav-item">
                            <MagnifyingGlass className="nav-icon" />
                            <span>Explore</span>
                        </div>
                        <div className="nav-item notification-nav">
                            <NotificationBell />
                        </div>
                        <div className="nav-item">
                            <Envelope className="nav-icon" />
                            <span>Messages</span>
                        </div>
                        <div className="nav-item">
                            <BookmarkSimple className="nav-icon" />
                            <span>Bookmarks</span>
                        </div>
                        <div className="nav-item">
                            <DotsThree className="nav-icon" />
                            <span>More</span>
                        </div>
                    </nav>
                    
                    <div className="user-menu" onClick={(e) => {
                        e.stopPropagation();
                        setShowUserDropdown(!showUserDropdown);
                    }}>
                        <div className="user-info">
                            <User className="user-profile-icon" size={24} />
                        </div>
                        {showUserDropdown && (
                            <div className="user-dropdown">
                                <button onClick={handleLogout} className="logout-dropdown-btn">
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="main-content">
                <div className="main-header">
                    <div className="feed-tabs">
                        <button 
                            className={`feed-tab ${!homeStore.showFollowingOnly ? 'active' : ''}`}
                            onClick={() => {
                                if (homeStore.showFollowingOnly) {
                                    homeStore.toggleFeedType();
                                }
                            }}
                        >
                            For You
                        </button>
                        <button 
                            className={`feed-tab ${homeStore.showFollowingOnly ? 'active' : ''}`}
                            onClick={() => {
                                if (!homeStore.showFollowingOnly) {
                                    homeStore.toggleFeedType();
                                }
                            }}
                        >
                            Following
                        </button>
                    </div>
                </div>

                <div className="tweet-compose">
                    <div className="compose-container">
                        <Link to={`/${userStore.user?.username}`} className="compose-avatar">
                            <User size={24} />
                        </Link>
                        <form onSubmit={handleCreatePost} className="compose-form">
                            <textarea
                                className="compose-textarea"
                                placeholder="What is happening?!"
                                value={homeStore.newPost}
                                onChange={(e) => homeStore.setNewPost(e.target.value)}
                                maxLength={320}
                            />
                            <div className="compose-actions">
                                <div className="compose-options">
                                    <button type="button" className="compose-option">
                                        <ImageSquare size={20} />
                                    </button>
                                    <button type="button" className="compose-option">
                                        <Gif size={20} />
                                    </button>
                                    <button type="button" className="compose-option">
                                        <ListBullets size={20} />
                                    </button>
                                    <button type="button" className="compose-option">
                                        <SmileySticker size={20} />
                                    </button>
                                    <button type="button" className="compose-option">
                                        <CalendarBlank size={20} />
                                    </button>
                                    <button type="button" className="compose-option">
                                        <MapPin size={20} />
                                    </button>
                                </div>
                                <button 
                                    type="submit" 
                                    className="post-button"
                                    disabled={homeStore.loading || !homeStore.newPost.trim() || isOverLimit}
                                >
                                    {homeStore.loading ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                    {homeStore.error && <div className="error">{homeStore.error}</div>}
                </div>

                <div className="posts-timeline">
                    {homeStore.postsLoading ? (
                        <div className="loading">Loading posts...</div>
                    ) : !Array.isArray(homeStore.posts) || homeStore.posts.length === 0 ? (
                        <div className="empty-state">
                            <h3>No posts yet!</h3>
                            <p>Be the first to share something with the world</p>
                        </div>
                    ) : (
                        homeStore.posts.map(post => (
                            <article key={post.id} className="post-item">
                                <div className="post-container">
                                    <div className="post-avatar"></div>
                                    <div className="post-content">
                                        <div className="post-header">
                                            <span className="post-author">{post.display_name || post.username}</span>
                                            <span className="post-handle">@{post.username}</span>
                                            <span className="post-time">·</span>
                                            <span className="post-time">{new Date(post.created_at).toLocaleDateString()}</span>
                                            {userStore.user && userStore.user.username === post.username && (
                                                <button 
                                                    className="post-action"
                                                    onClick={() => handleDeletePost(post.id)}
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
                                            <img 
                                                src={post.image_url} 
                                                alt="Post" 
                                                className="post-image"
                                                style={{width: '100%', borderRadius: '1rem', marginTop: '0.75rem'}}
                                            />
                                        )}
                                        <div className="post-actions">
                                            <button 
                                                className="post-action"
                                                onClick={() => handleToggleComments(post.id)}
                                            >
                                                <ChatCircleText className="action-icon" />
                                                <span>{post.comments_count}</span>
                                            </button>
                                            <button 
                                                className={`post-action ${post.user_liked ? 'liked' : ''}`}
                                                onClick={() => handleLikePost(post.id)}
                                            >
                                                <Heart className="action-icon" weight={post.user_liked ? 'fill' : 'regular'} />
                                                <span>{post.likes_count}</span>
                                            </button>
                                            <button className="post-action">
                                                <RocketLaunch className="action-icon" />
                                            </button>
                                            <button className="post-action">
                                                <BookmarkSimple className="action-icon" />
                                            </button>
                                        </div>
                                        
                                        {homeStore.showComments[post.id] && (
                                            <div className="comments-section" style={{marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgb(47, 51, 54)'}}>
                                                <div className="comments-list">
                                                    {homeStore.comments[post.id]?.map((comment, commentIndex) => (
                                                        <div key={`comment-${comment.id}-${commentIndex}`} className="comment-item" style={{padding: '0.5rem 0', borderBottom: '1px solid rgb(47, 51, 54)'}}>
                                                            <div style={{display: 'flex', alignItems: 'center', marginBottom: '0.25rem'}}>
                                                                <div style={{width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: '#1d9bf0', marginRight: '0.5rem'}}></div>
                                                                <span style={{fontWeight: '700', marginRight: '0.5rem'}}>{comment.display_name || comment.username}</span>
                                                                <span style={{color: '#71767b'}}>@{comment.username}</span>
                                                            </div>
                                                            <p style={{marginLeft: '2rem', color: '#e7e9ea'}}>{comment.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <form onSubmit={(e) => handleCommentSubmit(post.id, e)} style={{marginTop: '0.75rem', display: 'flex', gap: '0.5rem'}}>
                                                    <textarea
                                                        placeholder="Write a comment..."
                                                        value={homeStore.newComment[post.id] || ''}
                                                        onChange={(e) => homeStore.setNewComment(post.id, e.target.value)}
                                                        maxLength={280}
                                                        rows={2}
                                                        style={{
                                                            flex: 1,
                                                            background: 'transparent',
                                                            border: '1px solid rgb(47, 51, 54)',
                                                            borderRadius: '0.5rem',
                                                            color: '#e7e9ea',
                                                            padding: '0.5rem',
                                                            resize: 'none',
                                                            fontFamily: 'inherit'
                                                        }}
                                                    />
                                                    <button 
                                                        type="submit" 
                                                        className="post-button"
                                                        disabled={homeStore.commentLoading[post.id] || !(homeStore.newComment[post.id]?.trim())}
                                                        style={{alignSelf: 'flex-end'}}
                                                    >
                                                        {homeStore.commentLoading[post.id] ? 'Posting...' : 'Comment'}
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

            <div className="right-sidebar">
                <PremiumSubscription />
                
                <div className="trending-widget">
                    <div className="widget-header">
                        <h2 className="widget-title">What's happening</h2>
                    </div>
                    <div className="trending-item">
                        <div className="trending-category">Trending in Technology</div>
                        <div className="trending-topic">#WebDevelopment</div>
                        <div className="trending-tweets">42.1K posts</div>
                    </div>
                    <div className="trending-item">
                        <div className="trending-category">Trending</div>
                        <div className="trending-topic">#ReactJS</div>
                        <div className="trending-tweets">125K posts</div>
                    </div>
                    <div className="trending-item">
                        <div className="trending-category">Technology · Trending</div>
                        <div className="trending-topic">#JavaScript</div>
                        <div className="trending-tweets">89.2K posts</div>
                    </div>
                </div>
                
                <WhoToFollow />
            </div>
        </div>
    );
});

export default Home;