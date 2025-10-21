import { makeAutoObservable } from 'mobx';
import PostService from '../services/PostService';

class BookmarkStore {
    bookmarks = [];
    bookmarksLoading = false;
    error = '';

    showComments = {};
    comments = {};
    newComment = {};
    commentLoading = {};

    constructor() {
        makeAutoObservable(this);
    }

    setBookmarks = (bookmarks) => {
        this.bookmarks = Array.isArray(bookmarks) ? bookmarks : [];
    };

    addBookmark = (post) => {
        this.bookmarks.unshift(post);
    };

    removeBookmark = (postId) => {
        this.bookmarks = this.bookmarks.filter(post => post.id !== postId);
    };

    updateBookmark = (postId, updates) => {
        const postIndex = this.bookmarks.findIndex(post => post.id === postId);
        if (postIndex !== -1) {
            this.bookmarks[postIndex] = { ...this.bookmarks[postIndex], ...updates };
        }
    };

    setBookmarksLoading = (value) => {
        this.bookmarksLoading = value;
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

    fetchBookmarks = async () => {
        try {
            this.setBookmarksLoading(true);
            this.setError('');
            const response = await PostService.fetchBookmarks();
            if (response.success) {
                this.setBookmarks(response.data.posts);
            }
            return response;
        } catch (error) {
            this.setError(error.message);
            console.error('Error fetching bookmarks:', error);
            throw error;
        } finally {
            this.setBookmarksLoading(false);
        }
    };

    likePost = async (postId) => {
        try {
            const post = this.bookmarks.find(p => p.id === postId);
            if (post) {
                const wasLiked = post.user_liked;
                this.updateBookmark(postId, {
                    user_liked: !wasLiked,
                    likes_count: wasLiked ? post.likes_count - 1 : post.likes_count + 1
                });

                const response = await PostService.likePost(postId);
                
                this.updateBookmark(postId, {
                    user_liked: response.data.isLiked,
                    likes_count: response.data.likesCount
                });
            }
        } catch (error) {
            const post = this.bookmarks.find(p => p.id === postId);
            if (post) {
                this.updateBookmark(postId, {
                    user_liked: !post.user_liked,
                    likes_count: post.user_liked ? post.likes_count - 1 : post.likes_count + 1
                });
            }
            console.error('Error toggling like:', error);
        }
    };

    bookmarkPost = async (postId) => {
        try {
            const post = this.bookmarks.find(p => p.id === postId);
            if (post) {
                const wasBookmarked = post.user_bookmarked || false;
                this.updateBookmark(postId, {
                    user_bookmarked: !wasBookmarked
                });

                const response = await PostService.bookmarkPost(postId);
                
                this.updateBookmark(postId, {
                    user_bookmarked: response.data.isBookmarked
                });

                // If unbookmarked, remove from list
                if (!response.data.isBookmarked) {
                    this.removeBookmark(postId);
                }
            }
        } catch (error) {
            const post = this.bookmarks.find(p => p.id === postId);
            if (post) {
                this.updateBookmark(postId, {
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
                
                const post = this.bookmarks.find(p => p.id === postId);
                if (post) {
                    this.updateBookmark(postId, {
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
                this.removeBookmark(postId);
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

    handleBookmarkPost = async (postId) => {
        try {
            await this.bookmarkPost(postId);
        } catch (error) {
            console.log('Error with bookmark:', error);
            throw error;
        }
    };

    initialize = async () => {
        try {
            await this.fetchBookmarks();
        } catch (error) {
            console.error('Error initializing bookmarks:', error);
            this.setError('Failed to load bookmarks');
        }
    };
}

export default BookmarkStore;
