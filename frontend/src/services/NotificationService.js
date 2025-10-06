class NotificationService {
    constructor() {
        this.baseUrl = 'http://localhost:6969/api';
    }

    async fetchNotifications() {
        try {
            const response = await fetch(`${this.baseUrl}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed notifications');
            return await response.json();
        } catch (error) {
            console.error('Error notifications:', error);
            throw error;
        }
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`${this.baseUrl}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed mark notification read');
            return await response.json();
        } catch (error) {
            console.error('Error marking notification read:', error);
            throw error;
        }
    }

    async deleteNotification(notificationId) { // ne radi, moram popravit
        try {
            const response = await fetch(`${this.baseUrl}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete notification');
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }
}

export default new NotificationService();