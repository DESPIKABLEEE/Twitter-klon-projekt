import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './Profile.css';

function Profile() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:6969/api/users/${username}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setProfileData(data.data);
            } else {
                setError(data.message || 'User not found');
            }
        } catch (error) {
            console.error('Error: ', error);
            setError('Ne mogu load profil');
        } finally {
            setLoading(false);
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

    const handleFollow = async () => {
        if (!profileData || profileData.user.isOwnProfile) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:6969/api/users/${username}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                // Update local state
                setProfileData(prevData => ({
                    ...prevData,
                    user: {
                        ...prevData.user,
                        isFollowing: data.data.isFollowing,
                        followers_count: data.data.followers_count,
                        following_count: data.data.following_count
                    }
                }));
            }
            // else {
            //     console.error('Follow problem', data.message);
            // }
        } catch (error) {
            console.error('follow problem', error);
        }
    };

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    if (error) {
        return (
            <div className="profile-container">
                <div className="profile-content">
                    <div className="error-message">{error}</div>
                    <Link to="/" className="back-link">← Back to Home</Link>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return <div className="loading">No profile data</div>;
    }

    const { user, posts } = profileData;

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
                                    📅 Joined {new Date(user.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="profile-stats">
                                <span className="profile-stat">
                                    <strong>{user.following_count || 0}</strong> Following
                                </span>
                                <span className="profile-stat">
                                    <strong>{user.followers_count || 0}</strong> Followers
                                </span>
                            </div>

                            {!user.isOwnProfile && (
                                <div className="profile-follow-action">
                                    <button 
                                        className={`follow-btn ${user.isFollowing ? 'following' : ''}`}
                                        onClick={handleFollow}
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
                    {posts.length === 0 ? (
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
                                        <span>💬 {post.comments_count}</span>
                                        <span className={post.user_liked ? 'post-action-liked' : ''}>
                                            {post.user_liked ? '❤️' : '🤍'} {post.likes_count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
