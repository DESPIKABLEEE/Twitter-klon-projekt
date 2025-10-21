import { getApiBaseUrl } from '../config/api';

class PostService {
    constructor() {
        this.baseUrl = getApiBaseUrl();
    }

    async fetchPosts() {
        try {
            const response = await fetch(`${this.baseUrl}/posts`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch posts');
            return await response.json();
        } catch (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }
    }

    async fetchFollowingPosts() {
        try {
            const response = await fetch(`${this.baseUrl}/posts/following`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch following posts');
            return await response.json();
        } catch (error) {
            console.error('Error fetching following posts:', error);
            throw error;
        }
    }

    async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${this.baseUrl}/upload/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Greška pri uploadu slike');
            }

            const data = await response.json();
            return data.data.image_url;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    async createPost(content, imageFile = null) {
        try {
            let imageUrl = null;
            
            if (imageFile) {
                imageUrl = await this.uploadImage(imageFile);
            }
            
            const payload = {
                content: content,
                image_url: imageUrl
            };
            
            const response = await fetch(`${this.baseUrl}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed create post');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }

    async likePost(postId) {
        try {
            const response = await fetch(`${this.baseUrl}/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed like post');
            return await response.json();
        } catch (error) {
            console.error('Error liking post:', error);
            throw error;
        }
    }

    async fetchComments(postId) {
        try {
            const response = await fetch(`${this.baseUrl}/posts/${postId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch comments');
            return await response.json();
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    }

    async createComment(postId, content) {
        try {
            const response = await fetch(`${this.baseUrl}/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content })
            });
            if (!response.ok) throw new Error('Failed create comment');
            return await response.json();
        } catch (error) {
            console.error('Error creating comment:', error);
            throw error;
        }
    }

    async deletePost(postId) {
        try {
            const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete post');
            return await response.json();
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    }

    async bookmarkPost(postId) {
        try {
            const response = await fetch(`${this.baseUrl}/posts/${postId}/bookmark`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to bookmark post');
            return await response.json();
        } catch (error) {
            console.error('Error bookmarking post:', error);
            throw error;
        }
    }

    async fetchBookmarks() {
        try {
            const response = await fetch(`${this.baseUrl}/posts/user/bookmarks`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch bookmarks');
            return await response.json();
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
            throw error;
        }
    }
}

export default new PostService();