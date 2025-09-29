import { makeAutoObservable } from 'mobx'

class PostStore {
  posts = []
  loading = false
  error = null
  showOnlyFollowing = false
  
  constructor() {
    makeAutoObservable(this)
  }
  
  setPosts(posts) {
    this.posts = posts
  }
  
  addPost(post) {
    this.posts.unshift(post)
  }
  
  updatePost(postId, updates) {
    const index = this.posts.findIndex(post => post.id === postId)
    if (index !== -1) {
      this.posts[index] = { ...this.posts[index], ...updates }
    }
  }
  
  removePost(postId) {
    this.posts = this.posts.filter(post => post.id !== postId)
  }
  
  toggleFollow() {
    this.showOnlyFollowing = !this.showOnlyFollowing
  }
  
  setLoading(loading) {
    this.loading = loading
  }
  
  setError(error) {
    this.error = error
  }
  
  get filteredPosts() {
    return this.showOnlyFollowing 
      ? this.posts.filter(post => post.isFromFollowedUser) 
      : this.posts
  }
  
  get postsCount() {
    return this.posts.length
  }
}

export default PostStore