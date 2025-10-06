class UserService {
  constructor() {
    this.API_URL = 'http://localhost:6969/api';
  }

  async getSuggestedUsers() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.API_URL}/users/suggested`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed fetch suggested users');
      }

      return data.data.users;
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      throw error;
    }
  }

  async followUser(userId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.API_URL}/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to follow user');
      }

      return data.data;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async getFollowers(username) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.API_URL}/users/${username}/followers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed get followers');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting followers:', error);
      throw error;
    }
  }

  async getFollowing(username) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.API_URL}/users/${username}/following`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed get following');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting following:', error);
      throw error;
    }
  }
}

export default new UserService();