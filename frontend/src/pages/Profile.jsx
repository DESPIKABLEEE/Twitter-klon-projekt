import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import { userStore, profileStore, homeStore } from '../stores';
import NotificationBell from '../components/NotificationBell';
import WhoToFollow from '../components/WhoToFollow';
import PremiumSubscription from '../components/PremiumSubscription';
import SearchModal from '../components/SearchModal';
import './Home.css';
import { 
    Trash, 
    ChatCircleText, 
    Heart, 
    Calendar, 
    ArrowLeft, 
    House,
    MagnifyingGlass,
    Envelope,
    BookmarkSimple,
    User
} from "@phosphor-icons/react";
import FollowModal from '../components/FollowModal';
import './Profile.css';

const Profile = observer(() => {
    const { username } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            navigate('/login');
            return;
        }

        try {
            profileStore.fetchProfile(username);
        } catch (error) {
            console.error('Data ', error);
            navigate('/login');
        }
    }, [username, navigate]);

    useEffect(() => {
        const handleClickOutside = () => {
            if (profileStore.showUserDropdown) {
                profileStore.closeUserDropdown();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    });

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleFollowToggle = async () => {
        if (!profileStore.profileData || profileStore.profileData.user.isOwnProfile) return;

        await profileStore.toggleFollow(profileStore.profileData.user.id);
    };

    const handleShowFollowers = async () => {
        profileStore.openModal('followers');
        await profileStore.fetchFollowers(username);
    };

    const handleShowFollowing = async () => {
        profileStore.openModal('following');
        await profileStore.fetchFollowing(username);
    };

    const handleLikePost = async (postId) => {
        await profileStore.likePost(postId);
    };

    const handleBookmarkPost = async (postId) => {
        await profileStore.bookmarkPost(postId);
    };

    const handleToggleComments = async (postId) => {
        if (profileStore.showComments[postId]) {
            profileStore.toggleComments(postId);
        } else {
            profileStore.toggleComments(postId);
            
            if (!profileStore.comments[postId]) {
                await profileStore.fetchComments(postId);
            }
        }
    };

    const handleCommentSubmit = async (postId, e) => {
        e.preventDefault();
        const commentText = profileStore.newComment[postId]?.trim();
        
        if (!commentText) return;

        profileStore.setCommentLoading(postId, true);

        try {
            await profileStore.createComment(postId, commentText);
        } catch (error) {
            console.error('Error comment:', error);
        } finally {
            profileStore.setCommentLoading(postId, false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            await profileStore.deletePost(postId);
        } catch (error) {
            console.error('Error post:', error);
        }
    };

    if (profileStore.loading) {
        return <div className="loading">Loading profile...</div>;
    }

    if (profileStore.error) { //error stranica
        return (
            <div className="profile-container">
                <div className="profile-content">
                    <div className="error-message">{profileStore.error}</div>
                    <Link to="/" className="back-link"><ArrowLeft size={32} weight="light" /> Back to Home</Link>
                </div>
            </div>
        );
    }

    if (!profileStore.profileData || !profileStore.profileData.user) {
        return <div className="loading">No profile data</div>;
    }

    const { user, posts } = profileStore.profileData;

    return (
        <div className="twitter-layout profile-page">
            <div className="sidebar">
                <div className="sidebar-content">
                    <div className="logo">
                        <img src="/images/twitter.png" alt="X" style={{width: '100%', borderRadius: '50%'}} />
                    </div>
                    
                    <nav>
                        <div className="nav-item" onClick={() => navigate('/')}>
                            <House className="nav-icon" weight="fill" />
                            <span>Home</span>
                        </div>
                        <div 
                            className="nav-item"
                            onClick={() => homeStore.setShowSearchModal(true)}
                        >
                            <MagnifyingGlass className="nav-icon" />
                            <span>Search</span>
                        </div>
                        <div className="nav-item notification-nav">
                            <NotificationBell />
                        </div>
                        <div className="nav-item">
                            <Envelope className="nav-icon" />
                            <span>Messages</span>
                        </div>
                        <div 
                            className="nav-item"
                            onClick={() => navigate('/bookmarks')}
                        >
                            <BookmarkSimple className="nav-icon" />
                            <span>Bookmarks</span>
                        </div>
                        <div 
                            className="nav-item"
                            onClick={() => navigate(`/profile/${userStore.user?.username}`)}
                        >
                            <User className="nav-icon" />
                            <span>Profile</span>
                        </div>
                    </nav>
                    
                    <div className="user-menu" onClick={(e) => {
                        e.stopPropagation();
                        profileStore.toggleUserDropdown();
                    }}>
                        <div className="user-info">
                            <User className="user-profile-icon" size={24} />
                            <span className="user-name">{userStore.user?.display_name || userStore.user?.username}</span>
                        </div>
                        {profileStore.showUserDropdown && (
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
                    <div style={{display: 'flex', alignItems: 'center', gap: '2rem'}}>
                        <ArrowLeft 
                            size={20} 
                            style={{cursor: 'pointer'}} 
                            onClick={() => navigate('/')}
                        />
                        <div>
                            <h1 className="header-title">{user.display_name || user.username}</h1>
                            <p className="header-subtitle">
                                {posts?.length || 0} posts
                            </p>
                        </div>
                    </div>
                </div>

                <div className="profile-banner"></div>
                
                <div className="profile-info">
                    <div className="profile-header-row">
                        <div className="profile-avatar-large">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.username} />
                            ) : (
                                (user.display_name || user.username).charAt(0).toUpperCase()
                            )}
                        </div>
                        
                        <div className="profile-actions">
                            {!user.isOwnProfile ? (
                                <button 
                                    className={`profile-follow-btn ${user.isFollowing ? 'following' : ''}`}
                                    onClick={handleFollowToggle}
                                >
                                    {user.isFollowing ? 'Following' : 'Follow'}
                                </button>
                            ) : (
                                <div className="profile-edit-actions">
                                    {!profileStore.isEditing ? (
                                        <button className="profile-edit-btn" onClick={() => profileStore.startEditing()}>
                                            Edit profile
                                        </button>
                                    ) : (
                                        <div className="edit-actions">
                                            <button className="cancel-edit-btn" onClick={() => profileStore.cancelEditing()}>
                                                Cancel
                                            </button>
                                            <button className="save-edit-btn" onClick={() => profileStore.saveProfile()}>
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="profile-details-section">
                        <h2 className="profile-display-name">
                            {user.display_name || user.username}
                        </h2>
                        <p className="profile-handle">
                            @{user.username}
                        </p>
                    </div>
                    
                    {user.bio && !profileStore.isEditing && (
                        <p className="profile-bio">
                            {user.bio}
                        </p>
                    )}
                    
                    {profileStore.isEditing && (
                        <div className="profile-bio-edit">
                            <textarea
                                className="bio-textarea"
                                value={profileStore.editBio}
                                onChange={(e) => profileStore.setEditBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                maxLength={500}
                                rows={3}
                            />
                            <div className="bio-char-count">
                                {profileStore.editBio.length}/500
                            </div>
                        </div>
                    )}
                    
                    <div className="profile-joined-date">
                        <Calendar size={16} />
                        <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}</span>
                    </div>
                    
                    <div className="profile-stats">
                        <button 
                            className="profile-stat-btn"
                            onClick={handleShowFollowing}
                        >
                            <span className="profile-stat-number">{user.following_count || 0}</span>
                            <span className="profile-stat-label">Following</span>
                        </button>
                        <button 
                            className="profile-stat-btn"
                            onClick={handleShowFollowers}
                        >
                            <span className="profile-stat-number">{user.followers_count || 0}</span>
                            <span className="profile-stat-label">Followers</span>
                        </button>
                    </div>
                </div>

                <div className="profile-tabs">
                    <button className="profile-tab active">
                        Posts
                    </button>
                    <button className="profile-tab">
                        Replies
                    </button>
                    <button className="profile-tab">
                        Media
                    </button>
                </div>

                <div className="posts-timeline">
                    {!posts || posts.length === 0 ? (
                        <div className="empty-state">
                            <h3>No Posts yet</h3>
                            <p>When {user.isOwnProfile ? 'you' : `@${user.username}`} post{user.isOwnProfile ? '' : 's'}, {user.isOwnProfile ? 'they' : 'it'} will show up here.</p>
                        </div>
                    ) : (
                        posts.map((post, index) => (
                            <article key={`profile-post-${post.id}-${index}`} className="post-item">
                                <div className="post-container">
                                    <div className="post-avatar">
                                        {post.avatar_url ? (
                                            <img src={post.avatar_url} alt={post.username} />
                                        ) : (
                                            (post.display_name || post.username).charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="post-content">
                                        <div className="post-header">
                                            <Link to={`/profile/${post.username}`} className="post-author-link">
                                                <span className="post-author">{post.display_name || post.username}</span>
                                            </Link>
                                            <span className="post-handle">@{post.username}</span>
                                            <span className="post-time">·</span>
                                            <span className="post-time">{new Date(post.created_at).toLocaleDateString()}</span>
                                            {userStore.user && userStore.user.username === post.username && (
                                                <button 
                                                    className="post-action"
                                                    onClick={() => handleDeletePost(post.id)}
                                                    title="Delete post"
                                                >
                                                    <Trash className="action-icon" size={16} />
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
                                            />
                                        )}
                                        <div className="post-actions">
                                            <button 
                                                className="post-action"
                                                onClick={() => handleToggleComments(post.id)}
                                            >
                                                <ChatCircleText className="action-icon" size={16} />
                                                <span>{post.comments_count || 0}</span>
                                            </button>
                                            <button 
                                                className={`post-action ${post.user_liked ? 'liked' : ''}`}
                                                onClick={() => handleLikePost(post.id)}
                                            >
                                                <Heart className="action-icon" size={16} weight={post.user_liked ? 'fill' : 'regular'} />
                                                <span>{post.likes_count || 0}</span>
                                            </button>
                                            <button 
                                                className={`post-action ${post.user_bookmarked ? 'bookmarked' : ''}`}
                                                onClick={() => handleBookmarkPost(post.id)}
                                            >
                                                <BookmarkSimple className="action-icon" size={16} weight={post.user_bookmarked ? 'fill' : 'regular'} />
                                            </button>
                                        </div>
                                        
                                        {profileStore.showComments[post.id] && (
                                            <div className="comments-section">
                                                <div className="comments-list">
                                                    {profileStore.comments[post.id]?.map(comment => (
                                                        <div key={comment.id} className="comment-item">
                                                            <div 
                                                                className="comment-header" 
                                                                style={{cursor: 'pointer'}}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/profile/${comment.username}`);
                                                                }}
                                                            >
                                                                <div className="comment-avatar">
                                                                    {comment.avatar_url ? (
                                                                        <img src={comment.avatar_url} alt={comment.username} />
                                                                    ) : (
                                                                        <span className="comment-initial">
                                                                            {(comment.display_name || comment.username).charAt(0).toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="comment-author">{comment.display_name || comment.username}</span>
                                                                <span className="comment-handle">@{comment.username}</span>
                                                                <span className="comment-time">·</span>
                                                                <span className="comment-time">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="comment-content">{comment.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="comment-form">
                                                    <textarea
                                                        className="comment-textarea"
                                                        placeholder="Post your reply"
                                                        value={profileStore.newComment[post.id] || ''}
                                                        onChange={(e) => profileStore.setNewComment(post.id, e.target.value)}
                                                        maxLength={280}
                                                    />
                                                    <button 
                                                        type="submit" 
                                                        className="comment-submit-btn"
                                                        disabled={profileStore.commentLoading[post.id] || !(profileStore.newComment[post.id]?.trim())}
                                                    >
                                                        {profileStore.commentLoading[post.id] ? 'Posting...' : 'Comment'}
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
            
            <SearchModal 
                isOpen={homeStore.showSearchModal}
                onClose={() => homeStore.setShowSearchModal(false)}
            />

            <FollowModal profileStore={profileStore} />
        </div>
    );
});

export default Profile;
