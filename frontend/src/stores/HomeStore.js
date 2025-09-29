import { makeAutoObservable } from 'mobx';

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

    constructor() {
        makeAutoObservable(this);
    }

    setPosts = (posts) => {
        this.posts = posts;
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
    };
}

export default HomeStore;