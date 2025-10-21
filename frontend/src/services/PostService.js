import { createClient } from '@supabase/supabase-js';
import { getApiBaseUrl } from '../config/api';

class PostService {
    constructor() {
        this.baseUrl = getApiBaseUrl();
        
        // Debug: Log env vars
        console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
        
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
            console.warn('Supabase credentials are missing. Using fallback.');
        }
        
        this.supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL || 'https://vmwsahocyqftzhkmiaua.supabase.co',
            import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3NhaG9jeXFmdHpoay1taWF1YSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzU5ODUxMjIyLCJleHAiOjE5NzU4NzUyMjJ9.l12JKTUfg3YFZXV9G5M_D8hX8kL4pQ9vR3J6nZ_b5sE'
        );
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

    async uploadToSupabase(file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `posts/${fileName}`;

            const { error } = await this.supabase.storage
                .from('images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                throw error;
            }

            const { data: { publicUrl } } = this.supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }
    }

    async createPost(content, imageFile = null) {
        try {
            let imageUrl = null;
            
            if (imageFile) {
                imageUrl = await this.uploadToSupabase(imageFile);
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
}

export default new PostService();