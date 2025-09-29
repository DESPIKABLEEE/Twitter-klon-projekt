import { makeAutoObservable } from 'mobx'

class UserStore {
  user = null
  token = null
  isLoggedIn = false
  
  constructor() {
    makeAutoObservable(this)
    this.loadFromStorage()
  }
  
  loadFromStorage() {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      this.token = token
      this.user = JSON.parse(user)
      this.isLoggedIn = true
    }
  }
  
  login(userData, token) {
    this.user = userData
    this.token = token
    this.isLoggedIn = true
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
  }
  
  logout() {
    this.user = null
    this.token = null
    this.isLoggedIn = false
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  setUser(userData) {
    this.user = userData
    this.isLoggedIn = !!userData
  }

  setToken(token) {
    this.token = token
  }
  
  updateUser(userData) {
    this.user = { ...this.user, ...userData }
    localStorage.setItem('user', JSON.stringify(this.user))
  }
}

export default UserStore