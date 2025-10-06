import { makeAutoObservable } from 'mobx'
import AuthService from '../services/AuthService'

class UserStore {
  user = null
  token = null
  isLoggedIn = false
  loading = false
  error = ''
  
  constructor() {
    makeAutoObservable(this)
    this.loadFromStorage()
  }
  
  loadFromStorage() {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user && user !== 'undefined' && user !== 'null') {
      try {
        this.token = token
        this.user = JSON.parse(user)
        this.isLoggedIn = true
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        this.user = null
        this.token = null
        this.isLoggedIn = false
      }
    }
  }

  async handleGoogleOAuth(searchParams, navigate) {
    const token = searchParams.get('token')
    const isGoogleLogin = searchParams.get('google')

    if (token && isGoogleLogin) {
      try {
        this.loading = true
        this.error = ''

        localStorage.setItem('token', token)
        this.token = token
        
        const data = await AuthService.getCurrentUser()
        
        this.login(data.data.user, token)
        
        navigate('/')
      } catch (error) {
        console.error('Google OAuth error:', error)
        this.error = 'Failed to complete Google login'
        navigate('/')
      } finally {
        this.loading = false
      }
    }
  }
  
  login(userData, token) {
    this.user = userData
    this.token = token
    this.isLoggedIn = true
    
    try {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      console.error('Error saving login data to localStorage:', error)
    }
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
    if (this.user && typeof this.user === 'object') {
      this.user = { ...this.user, ...userData }
      try {
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch (error) {
        console.error('Error saving user data to localStorage:', error)
      }
    }
  }

  setLoading(loading) {
    this.loading = loading
  }

  setError(error) {
    this.error = error
  }

  async loginUser(credentials) {
    try {
      console.log('UserStore.loginUser called with:', credentials);
      this.setLoading(true)
      this.setError('')
      const response = await AuthService.login(credentials)
      console.log('Login successful, response received:', response);
      
      const user = response.data?.user || response.user;
      const token = response.data?.token || response.token;
      
      if (!user || !token) {
        throw new Error('Invalid response structure from server');
      }
      
      this.login(user, token)
      return response
    } catch (error) {
      console.error('UserStore.loginUser error:', error);
      this.setError(error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  }

  async registerUser(userData) {
    try {
      this.setLoading(true)
      this.setError('')
      const response = await AuthService.register(userData)
      
      const user = response.data?.user || response.user;
      const token = response.data?.token || response.token;
      
      if (!user || !token) {
        throw new Error('Invalid response structure from server');
      }
      
      this.login(user, token)
      return response
    } catch (error) {
      this.setError(error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  }

  async fetchUserProfile() {
    try {
      const userData = await AuthService.getUserProfile()
      this.updateUser(userData)
      return userData
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  }

  logoutUser() {
    AuthService.logout()
    this.logout()
  }
}

export default UserStore