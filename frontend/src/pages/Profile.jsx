import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import { userStore, profileStore } from '../stores';
import { Trash, ChatCircleText, Heart, Calendar, ArrowLeft  } from "@phosphor-icons/react";
import FollowModal from '../components/FollowModal';
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleFollowToggle = async () => {
        if (!profileStore.profileData || profileStore.profileData.user.isOwnProfile) return;

        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`http://localhost:6969/api/users/${username}/follow`, {
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
        try {
            profileStore.setModalLoading(true);
            profileStore.openModal('followers');
            
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:6969/api/users/${username}/followers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                profileStore.setModalData(data.data.followers);
            }
        } catch (error) {
            console.error('Error followers:', error);
        } finally {
            profileStore.setModalLoading(false);
        }
    };

    const handleShowFollowing = async () => {
        try {
            profileStore.setModalLoading(true);
            profileStore.openModal('following');
            
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:6969/api/users/${username}/following`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                profileStore.setModalData(data.data.following);
            }
        } catch (error) {
            console.error('Error following:', error);
        } finally {
            profileStore.setModalLoading(false);
        }
    };

    const handleLikePost = async (postId) => {
        try {
            const token = userStore.token;
            const response = await fetch(`http://localhost:6969/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                profileStore.updatePost(postId, {
                    user_liked: data.data.isLiked,
                    likes_count: data.data.likesCount
                });
            }
        } catch (error) {
            console.error('Error like:', error);
        }
    };

    const handleToggleComments = async (postId) => {
        if (profileStore.showComments[postId]) {
            profileStore.toggleComments(postId);
        } else {
            profileStore.toggleComments(postId);
            
            if (!profileStore.comments[postId]) {
                try {
                    const token = userStore.token;
                    const response = await fetch(`http://localhost:6969/api/posts/${postId}/comments`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = await response.json();
                    if (data.success) {
                        profileStore.setComments(postId, data.data.comments);
                    }
                } catch (error) {
                    console.error('Error comments:', error);
                }
            }
        }
    };

    const handleCommentSubmit = async (postId, e) => {
        e.preventDefault();
        const commentText = profileStore.newComment[postId]?.trim();
        
        if (!commentText) return;

        profileStore.setCommentLoading(postId, true);

        try {
            const token = userStore.token;
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
                profileStore.addComment(postId, data.data);
                profileStore.setNewComment(postId, '');
                profileStore.updatePost(postId, {
                    comments_count: profileStore.profileData.posts.find(p => p.id === postId).comments_count + 1
                });
            }
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
            const token = userStore.token;
            const response = await fetch(`http://localhost:6969/api/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                profileStore.removePost(postId);
            }
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
        <div className="profile-container">
            <div className="profile-content">
                <header className="profile-header">
                    <div className="profile-nav">
                        <Link to="/" className="back-link">← Home</Link>
                        <h1 className="profile-title">{user.display_name || user.username}</h1>
                        <div className="profile-actions">
                            <button onClick={handleLogout} className="logout-btn">
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className="profile-info-card">
                    <div className="profile-info">
                        <div className="profile-avatar-section">
                            <div className="profile-avatar">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.username} />
                                ) : (
                                    <span className="profile-avatar-initial">
                                        {(user.display_name || user.username).charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="profile-details">
                            <h2 className="profile-display-name">{user.display_name || user.username}</h2>
                            <p className="profile-username">@{user.username}</p>
                            
                            {user.bio && <p className="profile-bio">{user.bio}</p>}
                            
                            <div className="profile-meta">
                                <span className="profile-meta-item">
                                    <Calendar size={32} weight="light" /> Joined {new Date(user.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="profile-stats">
                                <span className="profile-stat" onClick={handleShowFollowing} style={{ cursor: 'pointer' }}>
                                    <strong>{user.following_count || 0}</strong> Following
                                </span>
                                <span className="profile-stat" onClick={handleShowFollowers} style={{ cursor: 'pointer' }}>
                                    <strong>{user.followers_count || 0}</strong> Followers
                                </span>
                            </div>

                            {!user.isOwnProfile && (
                                <div className="profile-follow-action">
                                    <button 
                                        className={`follow-btn ${user.isFollowing ? 'following' : ''}`}
                                        onClick={handleFollowToggle}
                                    >
                                        {user.isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="profile-posts">
                    <h3 className="posts-title">Posts</h3>
                    {!posts || posts.length === 0 ? (
                        <div className="no-posts">
                            <p>{user.isOwnProfile ? "You haven't posted anything yet" : `${user.display_name || user.username} hasn't posted anything yet`}</p>
                        </div>
                    ) : (
                        <div className="posts-feed">
                            {posts.map(post => (
                                <div key={post.id} className="post-card">
                                    <div className="post-header">
                                        <div className="post-avatar">
                                            {post.avatar_url ? (
                                                <img src={post.avatar_url} alt={post.username} />
                                            ) : (
                                                <span className="post-avatar-initial">
                                                    {(post.display_name || post.username).charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="post-user-info">
                                            <div className="post-display-name">{post.display_name || post.username}</div>
                                            <div className="post-username">
                                                @{post.username} · {new Date(post.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        {userStore.user && userStore.user.username === post.username && (
                                            <button 
                                                className="delete-post-btn"
                                                onClick={() => handleDeletePost(post.id)}
                                                title="Delete post"
                                            >
                                                <Trash size={20} />
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
                                    
                                    {profileStore.showComments[post.id] && (
                                        <div className="comments-section">
                                            <div className="comments-list">
                                                {profileStore.comments[post.id]?.map(comment => (
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
                                                    value={profileStore.newComment[post.id] || ''}
                                                    onChange={(e) => profileStore.setNewComment(post.id, e.target.value)}
                                                    maxLength={280}
                                                    rows={2}
                                                />
                                                <button 
                                                    type="submit" 
                                                    className="comment-btn"
                                                    disabled={profileStore.commentLoading[post.id] || !(profileStore.newComment[post.id]?.trim())}
                                                >
                                                    {profileStore.commentLoading[post.id] ? 'Posting...' : 'Comment'}
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <FollowModal profileStore={profileStore} />
        </div>
    );
});

export default Profile;
