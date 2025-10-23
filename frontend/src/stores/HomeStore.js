import { makeAutoObservable } from 'mobx';
import PostService from '../services/PostService';
import { getApiBaseUrl } from '../config/api';

class HomeStore {
    posts = [];
    newPost = '';
    loading = false;
    postsLoading = false;
    error = '';

    showComments = {};
    comments = {};
    newComment = {};
    commentLoading = {};
    showFollowingOnly = false;

    // Image upload state
    imageFile = null;
    imagePreview = null;
    uploading = false;

    showSearchModal = false;
    searchQuery = '';
    searchResults = [];
    searchLoading = false;

    constructor() {
        makeAutoObservable(this);
    }

    setPosts = (posts) => {
        this.posts = Array.isArray(posts) ? posts : []; //bitno
    };

    addPost = (post) => {
        this.posts.unshift(post);
    };

    removePost = (postId) => {
        this.posts = this.posts.filter(post => post.id !== postId);
    };

    updatePost = (postId, updates) => {
        const postIndex = this.posts.findIndex(post => post.id === postId);
        if (postIndex !== -1) {
            this.posts[postIndex] = { ...this.posts[postIndex], ...updates };
        }
    };

    setNewPost = (content) => {
        this.newPost = content;
    };

    setLoading = (value) => {
        this.loading = value;
    };

    setPostsLoading = (value) => {
        this.postsLoading = value;
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

    setShowFollowingOnly = (value) => {
        this.showFollowingOnly = value;
    };

    resetNewPost = () => {
        this.newPost = '';
        this.clearImage();
    };

    setImageFile = (file) => {
        this.imageFile = file;
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.imagePreview = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            this.imagePreview = null;
        }
    };

    clearImage = () => {
        this.imageFile = null;
        this.imagePreview = null;
    };

    setUploading = (value) => {
        this.uploading = value;
    };

    setShowSearchModal = (value) => {
        this.showSearchModal = value;
        if (!value) {
            this.searchQuery = '';
            this.searchResults = [];
        }
    };

    setSearchQuery = (query) => {
        this.searchQuery = query;
    };

    setSearchResults = (results) => {
        this.searchResults = results;
    };

    setSearchLoading = (value) => {
        this.searchLoading = value;
    };

    searchUsers = async (query) => {
        if (!query || query.trim().length < 2) {
            this.setSearchResults([]);
            return;
        }

        try {
            this.setSearchLoading(true);
            const response = await fetch(`${getApiBaseUrl()}/users/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            this.setSearchResults(data.data.users || []);
        } catch (error) {
            console.error('Search error:', error);
            this.setSearchResults([]);
        } finally {
            this.setSearchLoading(false);
        }
    };

    fetchPosts = async () => {
        try {
            this.setPostsLoading(true);
            this.setError('');
            const response = await PostService.fetchPosts();
            const posts = response.data?.posts || response.posts || response || [];
            this.setPosts(Array.isArray(posts) ? posts : []);
        } catch (error) {
            this.setError(error.message);
            this.setPosts([]); 
        } finally {
            this.setPostsLoading(false);
        }
    };

    fetchFollowingPosts = async () => {
        try {
            this.setPostsLoading(true);
            this.setError('');
            const response = await PostService.fetchFollowingPosts();
            const posts = response.data?.posts || response.posts || response || [];
            this.setPosts(Array.isArray(posts) ? posts : []);
        } catch (error) {
            this.setError(error.message);
            this.setPosts([]);
        } finally {
            this.setPostsLoading(false);
        }
    };

    toggleFeedType = () => {
        this.showFollowingOnly = !this.showFollowingOnly;
        if (this.showFollowingOnly) {
            this.fetchFollowingPosts();
        } else {
            this.fetchPosts();
        }
    };

    createPost = async (content, image = null) => {
        try {
            this.setLoading(true);
            this.setError('');
            
            const imageToUpload = image || this.imageFile;
            
            if (imageToUpload) {
                this.setUploading(true);
            }
            
            const newPost = await PostService.createPost(content, imageToUpload);
            this.addPost(newPost);
            this.resetNewPost();
            await this.fetchPosts();
            return newPost;
        } catch (error) {
            this.setError(error.message);
            throw error;
        } finally {
            this.setLoading(false);
            this.setUploading(false);
        }
    };

    likePost = async (postId) => {
        try {
            const post = this.posts.find(p => p.id === postId);
            if (post) {
                const wasLiked = post.user_liked;
                this.updatePost(postId, {
                    user_liked: !wasLiked,
                    likes_count: wasLiked ? post.likes_count - 1 : post.likes_count + 1
                });

                const response = await PostService.likePost(postId);
                
                this.updatePost(postId, {
                    user_liked: response.data.isLiked,
                    likes_count: response.data.likesCount
                });
            }
        } catch (error) {
            const post = this.posts.find(p => p.id === postId);
            if (post) {
                this.updatePost(postId, {
                    user_liked: !post.user_liked,
                    likes_count: post.user_liked ? post.likes_count - 1 : post.likes_count + 1
                });
            }
            console.error('Error toggling like:', error);
        }
    };

    bookmarkPost = async (postId) => {
        try {
            const post = this.posts.find(p => p.id === postId);
            if (post) {
                const wasBookmarked = post.user_bookmarked || false;
                this.updatePost(postId, {
                    user_bookmarked: !wasBookmarked
                });

                const response = await PostService.bookmarkPost(postId);
                
                this.updatePost(postId, {
                    user_bookmarked: response.data.isBookmarked
                });
            }
        } catch (error) {
            const post = this.posts.find(p => p.id === postId);
            if (post) {
                this.updatePost(postId, {
                    user_bookmarked: !post.user_bookmarked
                });
            }
            console.error('Error toggling bookmark:', error);
        }
    };

    repostPost = async (postId) => {
        try {
            const post = this.posts.find(p => p.id === postId);
            if (post) {
                const wasReposted = post.user_reposted || false;
                this.updatePost(postId, {
                    user_reposted: !wasReposted,
                    retweets_count: wasReposted ? post.retweets_count - 1 : post.retweets_count + 1
                });

                const response = await PostService.repostPost(postId);
                
                this.updatePost(postId, {
                    user_reposted: response.data.isReposted,
                    retweets_count: response.data.repostsCount
                });
            }
        } catch (error) {
            const post = this.posts.find(p => p.id === postId);
            if (post) {
                this.updatePost(postId, {
                    user_reposted: !post.user_reposted,
                    retweets_count: post.user_reposted ? post.retweets_count - 1 : post.retweets_count + 1
                });
            }
            console.error('Error toggling repost:', error);
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
                
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    this.updatePost(postId, {
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
                this.removePost(postId);
            }
            return response;
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    };
}

export default HomeStore;