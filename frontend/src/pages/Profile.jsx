// popravit da se prikazuje desni sidebar sa home pagea na profile pageu
import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import { userStore, profileStore } from '../stores';
import './TwitterHome.css';
import { 
    Trash, 
    ChatCircleText, 
    Heart, 
    Calendar, 
    ArrowLeft, 
    House,
    MagnifyingGlass,
    Bell,
    Envelope,
    BookmarkSimple,
    User,
    DotsThree,
    Plus
} from "@phosphor-icons/react";
import FollowModal from '../components/FollowModal';
import NotificationBell from '../components/NotificationBell';
import './TwitterHome.css';
import './Profile.css';

const Profile = observer(() => {
    const { username } = useParams();
    const navigate = useNavigate();

    const fetchProfile = useCallback(async () => {
        try {
            profileStore.clearProfileData(); 
            profileStore.setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:6969/api/users/${username}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                profileStore.setProfileData(data.data);
            } else {
                profileStore.setError(data.message || 'User not found');
            }
        } catch (error) {
            console.error('Error: ', error);
            profileStore.setError('Ne mogu load profil');
        } finally {
            profileStore.setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            navigate('/login');
            return;
        }

        try {
            fetchProfile();
        } catch (error) {
            console.error('Data ', error);
            navigate('/login');
        }
    }, [username, navigate, fetchProfile]);

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

        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`http://localhost:6969/api/users/${profileStore.profileData.user.id}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                profileStore.setProfileData({
                    ...profileStore.profileData,
                    user: {
                        ...profileStore.profileData.user,
                        isFollowing: data.data.isFollowing,
                        followers_count: data.data.followers_count
                    }
                });
            }
        } catch (error) {
            console.error('follow problem', error);
        }
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

    if (profileStore.error) {
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
        <div className="twitter-layout">
            {/* Left Sidebar */}
            <div className="sidebar">
                <div className="sidebar-content">
                    <div className="logo">
                        <img src="/images/pas.jpeg" alt="X" style={{width: '100%', borderRadius: '50%'}} />
                    </div>
                    
                    <nav>
                        <div className="nav-item" onClick={() => navigate('/')}>
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
                        profileStore.toggleUserDropdown();
                    }}>
                        <div className="user-info">
                            <User className="user-profile-icon" size={24} />
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

            {/* Main Content */}
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
                                <button className="profile-edit-btn">
                                    Edit profile
                                </button>
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
                    
                    {user.bio && (
                        <p className="profile-bio">
                            {user.bio}
                        </p>
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
                                            <span className="post-author">{post.display_name || post.username}</span>
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
                                            <button className="post-action">
                                                <BookmarkSimple className="action-icon" size={16} />
                                            </button>
                                        </div>
                                        
                                        {profileStore.showComments[post.id] && (
                                            <div className="comments-section">
                                                <div className="comments-list">
                                                    {profileStore.comments[post.id]?.map(comment => (
                                                        <div key={comment.id} className="comment-item">
                                                            <div className="comment-header">
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
            
            <FollowModal profileStore={profileStore} />
        </div>
    );
});

export default Profile;
