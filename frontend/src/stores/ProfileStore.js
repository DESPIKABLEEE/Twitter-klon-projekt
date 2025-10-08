import { makeAutoObservable } from 'mobx'
import UserService from '../services/UserService'
import PostService from '../services/PostService'

class ProfileStore {
  profileData = null
  loading = true
  error = ''
  showComments = {}
  comments = {}
  newComment = {}
  commentLoading = {}
  
  showModal = false
  modalType = '' // ili followers ili following
  modalData = []
  modalLoading = false
  showUserDropdown = false
  
  isEditing = false
  editBio = ''
  
  constructor() {
    makeAutoObservable(this)
  }
  
  setProfileData(data) {
    this.profileData = data
  }
  
  clearProfileData() {
    this.profileData = null
    this.error = ''
    this.showComments = {}
    this.comments = {}
    this.newComment = {}
    this.commentLoading = {}
  }
  
  setLoading(loading) {
    this.loading = loading
  }
  
  setError(error) {
    this.error = error
  }
  
  async fetchProfile(username) {
    try {
      this.clearProfileData(); 
      this.cancelEditing();
      this.setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:6969/api/users/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        this.setProfileData(data.data);
      } else {
        this.setError(data.message || 'User not found');
      }
    } catch (error) {
      console.error('Error: ', error);
      this.setError('Ne mogu load profil');
    } finally {
      this.setLoading(false);
    }
  }
  
  async toggleFollow(userId) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:6969/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        this.setProfileData({
          ...this.profileData,
          user: {
            ...this.profileData.user,
            isFollowing: data.data.isFollowing,
            followers_count: data.data.followers_count
          }
        });
      }
    } catch (error) {
      console.error('follow problem', error);
    }
  }
  
  toggleComments(postId) {
    this.showComments = {
      ...this.showComments,
      [postId]: !this.showComments[postId]
    }
  }
  
  setComments(postId, comments) {
    this.comments = {
      ...this.comments,
      [postId]: comments
    }
  }
  
  addComment(postId, comment) {
    if (!this.comments[postId]) {
      this.comments[postId] = []
    }
    this.comments[postId].push(comment)
  }
  
  setNewComment(postId, text) {
    this.newComment = {
      ...this.newComment,
      [postId]: text
    }
  }
  
  setCommentLoading(postId, loading) {
    this.commentLoading = {
      ...this.commentLoading,
      [postId]: loading
    }
  }
  
  updatePost(postId, updates) {
    if (this.profileData && this.profileData.posts) {
      this.profileData.posts = this.profileData.posts.map(post =>
        post.id === postId ? { ...post, ...updates } : post
      )
    }
  }
  
  removePost(postId) {
    if (this.profileData && this.profileData.posts) {
      this.profileData.posts = this.profileData.posts.filter(post => post.id !== postId)
    }
  }
  
  openModal(type, data = []) {
    this.showModal = true
    this.modalType = type
    this.modalData = data
  }
  
  closeModal() {
    this.showModal = false
    this.modalType = ''
    this.modalData = []
  }
  
  setModalLoading(loading) {
    this.modalLoading = loading
  }
  
  setModalData(data) {
    this.modalData = data
  }
  
  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown
  }
  
  closeUserDropdown() {
    this.showUserDropdown = false
  }
  
  startEditing() {
    this.editBio = this.profileData?.user?.bio || ''
    this.isEditing = true
  }
  
  cancelEditing() {
    this.isEditing = false
    this.editBio = ''
  }
  
  setEditBio(bio) {
    this.editBio = bio
  }
  
  async saveProfile() {
    try {
      const result = await this.updateProfile({ bio: this.editBio });
      if (result.success) {
        this.isEditing = false;
        this.editBio = '';
      }
      return result;
    } catch (error) {
      console.error('Error saving profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  async fetchFollowers(username) {
    try {
      this.setModalLoading(true);
      const data = await UserService.getFollowers(username);
      this.setModalData(data.followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      this.setError('Failed to load followers');
    } finally {
      this.setModalLoading(false);
    }
  }

  async fetchFollowing(username) {
    try {
      this.setModalLoading(true);
      const data = await UserService.getFollowing(username);
      this.setModalData(data.following);
    } catch (error) {
      console.error('Error fetching following:', error);
      this.setError('Failed to load following');
    } finally {
      this.setModalLoading(false);
    }
  }

  async likePost(postId) {
    try {
      const response = await PostService.likePost(postId);
      this.updatePost(postId, {
        user_liked: response.data.isLiked,
        likes_count: response.data.likesCount
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }

  async fetchComments(postId) {
    try {
      const response = await PostService.fetchComments(postId);
      if (response.success) {
        this.setComments(postId, response.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }

  async createComment(postId, content) {
    try {
      const response = await PostService.createComment(postId, content);
      if (response.success) {
        this.addComment(postId, response.data);
        this.setNewComment(postId, '');
        
        const post = this.profileData.posts.find(p => p.id === postId);
        if (post) {
          this.updatePost(postId, {
            comments_count: post.comments_count + 1
          });
        }
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  }

  async deletePost(postId) {
    try {
      const response = await PostService.deletePost(postId);
      if (response.success) {
        this.removePost(postId);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }

  async updateProfile(profileData) {
    try {
      this.setLoading(true);
      const response = await UserService.updateProfile(profileData);
      
      if (response.success) {
        // Update the user data in profileData
        this.profileData = {
          ...this.profileData,
          user: {
            ...this.profileData.user,
            ...response.data
          }
        };
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      this.setError(error.message || 'Failed to update profile');
      return { success: false, error: error.message };
    } finally {
      this.setLoading(false);
    }
  }

  reset() {
    this.profileData = null
    this.loading = true
    this.error = ''
    this.showComments = {}
    this.comments = {}
    this.newComment = {}
    this.commentLoading = {}
    this.showModal = false
    this.modalType = ''
    this.modalData = []
    this.showUserDropdown = false
    this.isEditing = false
    this.editBio = ''
  }
}

export default ProfileStore