import { makeAutoObservable } from 'mobx';
import PostService from '../services/PostService';

class RepostStore {
    reposts = [];
    repostsLoading = false;
    error = '';

    showComments = {};
    comments = {};
    newComment = {};
    commentLoading = {};

    constructor() {
        makeAutoObservable(this);
    }

    setReposts = (reposts) => {
        this.reposts = Array.isArray(reposts) ? reposts : [];
    };

    addRepost = (post) => {
        this.reposts.unshift(post);
    };

    removeRepost = (postId) => {
        this.reposts = this.reposts.filter(post => post.id !== postId);
    };

    updateRepost = (postId, updates) => {
        const postIndex = this.reposts.findIndex(post => post.id === postId);
        if (postIndex !== -1) {
            this.reposts[postIndex] = { ...this.reposts[postIndex], ...updates };
        }
    };

    setRepostsLoading = (value) => {
        this.repostsLoading = value;
    };

    setError = (error) => {
        this.error = error;
    };

    toggleComments = (postId) => {
        this.showComments[postId] = !this.showComments[postId];
    };

    setComments = (postId, comments) => {
        this.comments[postId] = comments;
    };

    addComment = (postId, comment) => {
        if (!this.comments[postId]) {
            this.comments[postId] = [];
        }
        this.comments[postId].push(comment);
    };

    setNewComment = (postId, content) => {
        this.newComment[postId] = content;
    };

    setCommentLoading = (postId, value) => {
        this.commentLoading[postId] = value;
    };

    fetchReposts = async (username) => {
        try {
            this.setRepostsLoading(true);
            this.setError('');
            const response = await PostService.fetchUserReposts(username);
            if (response.success) {
                this.setReposts(response.data.posts);
            }
            return response;
        } catch (error) {
            this.setError(error.message);
            console.error('Error fetching reposts:', error);
            throw error;
        } finally {
            this.setRepostsLoading(false);
        }
    };

    likePost = async (postId) => {
        try {
            const post = this.reposts.find(p => p.id === postId);
            if (post) {
                const wasLiked = post.user_liked;
                this.updateRepost(postId, {
                    user_liked: !wasLiked,
                    likes_count: wasLiked ? post.likes_count - 1 : post.likes_count + 1
                });

                const response = await PostService.likePost(postId);
                
                this.updateRepost(postId, {
                    user_liked: response.data.isLiked,
                    likes_count: response.data.likesCount
                });
            }
        } catch (error) {
            const post = this.reposts.find(p => p.id === postId);
            if (post) {
                this.updateRepost(postId, {
                    user_liked: !post.user_liked,
                    likes_count: post.user_liked ? post.likes_count - 1 : post.likes_count + 1
                });
            }
            console.error('Error toggling like:', error);
        }
    };

    repostPost = async (postId) => {
        try {
            const post = this.reposts.find(p => p.id === postId);
            if (post) {
                const wasReposted = post.user_reposted || false;
                this.updateRepost(postId, {
                    user_reposted: !wasReposted,
                    retweets_count: wasReposted ? post.retweets_count - 1 : post.retweets_count + 1
                });

                const response = await PostService.repostPost(postId);
                
                this.updateRepost(postId, {
                    user_reposted: response.data.isReposted,
                    retweets_count: response.data.repostsCount
                });
            }
        } catch (error) {
            const post = this.reposts.find(p => p.id === postId);
            if (post) {
                this.updateRepost(postId, {
                    user_reposted: !post.user_reposted,
                    retweets_count: post.user_reposted ? post.retweets_count - 1 : post.retweets_count + 1
                });
            }
            console.error('Error toggling repost:', error);
        }
    };

    bookmarkPost = async (postId) => {
        try {
            const post = this.reposts.find(p => p.id === postId);
            if (post) {
                const wasBookmarked = post.user_bookmarked || false;
                this.updateRepost(postId, {
                    user_bookmarked: !wasBookmarked
                });

                const response = await PostService.bookmarkPost(postId);
                
                this.updateRepost(postId, {
                    user_bookmarked: response.data.isBookmarked
                });
            }
        } catch (error) {
            const post = this.reposts.find(p => p.id === postId);
            if (post) {
                this.updateRepost(postId, {
                    user_bookmarked: !post.user_bookmarked
                });
            }
            console.error('Error toggling bookmark:', error);
        }
    };

    fetchComments = async (postId) => {
        try {
            const response = await PostService.fetchComments(postId);
            if (response.success) {
                this.setComments(postId, response.data.comments);
            }
            return response;
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    };

    createComment = async (postId, content) => {
        try {
            const response = await PostService.createComment(postId, content);
            if (response.success) {
                this.addComment(postId, response.data);
                this.setNewComment(postId, '');
                
                const post = this.reposts.find(p => p.id === postId);
                if (post) {
                    this.updateRepost(postId, {
                        comments_count: post.comments_count + 1
                    });
                }
            }
            return response;
        } catch (error) {
            console.error('Error creating comment:', error);
            throw error;
        }
    };

    deletePost = async (postId) => {
        try {
            const response = await PostService.deletePost(postId);
            if (response.success) {
                this.removeRepost(postId);
            }
            return response;
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    };

    handleToggleComments = async (postId) => {
        if (this.showComments[postId]) {
            this.toggleComments(postId);
        } else {
            this.toggleComments(postId);
            
            if (!this.comments[postId]) {
                try {
                    await this.fetchComments(postId);
                } catch (error) {
                    console.error('Error fetching comments:', error);
                }
            }
        }
    };

    handleCommentSubmit = async (postId, commentText) => {
        if (!commentText?.trim()) return;

        this.setCommentLoading(postId, true);

        try {
            await this.createComment(postId, commentText);
        } catch (error) {
            console.error('Error submitting comment:', error);
            throw error;
        } finally {
            this.setCommentLoading(postId, false);
        }
    };

    handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            await this.deletePost(postId);
        } catch (error) {
            console.error('Error deleting post:', error);
            this.setError('Failed to delete post');
            throw error;
        }
    };

    handleLikePost = async (postId) => {
        try {
            await this.likePost(postId);
        } catch (error) {
            console.log('Error with like:', error);
            throw error;
        }
    };

    handleRepostPost = async (postId) => {
        try {
            await this.repostPost(postId);
        } catch (error) {
            console.log('Error with repost:', error);
            throw error;
        }
    };

    handleBookmarkPost = async (postId) => {
        try {
            await this.bookmarkPost(postId);
        } catch (error) {
            console.log('Error with bookmark:', error);
            throw error;
        }
    };

    initialize = async (username) => {
        try {
            await this.fetchReposts(username);
        } catch (error) {
            console.error('Error initializing reposts:', error);
            this.setError('Failed to load reposts');
        }
    };
}

export default RepostStore;
