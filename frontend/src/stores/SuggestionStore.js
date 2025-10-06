import { makeAutoObservable } from 'mobx';
import UserService from '../services/UserService';

class SuggestionStore {
    suggestedUsers = [];
    loading = false;
    error = '';

    constructor() {
        makeAutoObservable(this);
    }

    setSuggestedUsers = (users) => {
        this.suggestedUsers = Array.isArray(users) ? users : [];
    };

    addSuggestedUsers = (users) => {
        if (Array.isArray(users)) {
            this.suggestedUsers = [...this.suggestedUsers, ...users];
        }
    };

    removeSuggestedUser = (userId) => {
        this.suggestedUsers = this.suggestedUsers.filter(user => user.id !== userId);
    };

    setLoading = (loading) => {
        this.loading = loading;
    };

    setError = (error) => {
        this.error = error;
    };

    clearSuggestions = () => {
        this.suggestedUsers = [];
        this.error = '';
    };

    fetchSuggestedUsers = async () => {
        try {
            this.setLoading(true);
            this.setError('');
            
            const response = await UserService.getSuggestedUsers();
            this.setSuggestedUsers(response);
        } catch (error) {
            console.error('Error fetching suggested users:', error);
            this.setError('Failed to load suggestions');
        } finally {
            this.setLoading(false);
        }
    };

    followUser = async (userId) => {
        try {
            await UserService.followUser(userId);
            this.removeSuggestedUser(userId);
        } catch (error) {
            console.error('Error following user:', error);
            this.setError('Failed to follow user');
        }
    };
}

export default SuggestionStore;