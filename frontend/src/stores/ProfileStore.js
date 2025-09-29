import { makeAutoObservable } from 'mobx'

class ProfileStore {
  profileData = null
  loading = true
  error = ''
  showComments = {}
  comments = {}
  newComment = {}
  commentLoading = {}
  
  showModal = false
  modalType = '' // 'followers' or 'following'
  modalData = []
  modalLoading = false
  
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
  }
}

export default ProfileStore