import { makeAutoObservable } from 'mobx';
import { io } from 'socket.io-client';
import NotificationService from '../services/NotificationService';

class NotificationStore {
    notifications = [];
    unreadCount = 0;
    isDropdownOpen = false;
    socket = null;
    isConnected = false;
    currentToken = null;
    connectionAttempts = 0;

    constructor() {
        makeAutoObservable(this);
    }

    connect(token) {
        if (!token) {
            console.log('No token for WebSocket connection');
            return;
        }

        if (this.socket && this.isConnected && this.currentToken === token) {
            console.log('WebSocket already connected with same token');
            return;
        }

        if (this.socket) {
            console.log('Disconnecting old socket');
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        this.currentToken = token;

        const socketUrl = 'http://localhost:6969';

        this.socket = io(socketUrl, {
            auth: { token },
            transports: ['polling', 'websocket'],
            timeout: 10000,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 3,
            maxReconnectionAttempts: 3
        });

        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.connectionAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            //moram ovo imat jer mi se prvo zovne socket pa onda stranica
            if (reason === 'io server disconnect') {
                setTimeout(() => this.reconnect(), 1000);
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('WebSocket reconnected after', attemptNumber, 'attempts');
            this.isConnected = true;
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('WebSocket reconnect attempt', attemptNumber);
        });

        this.socket.on('reconnect_error', (error) => {
            console.log('WebSocket reconnect error:', error);
        });

        this.socket.on('reconnect_failed', () => {
            console.log('WebSocket reconnect failed - giving up');
        });

        this.socket.on('new_notification', (notification) => {
            this.addNotification(notification);
            this.showBrowserNotification(notification);
        });

        this.socket.on('connect_error', () => {
            this.connectionAttempts++;
            
            if (this.connectionAttempts >= 3) {
                this.disconnect();
            }
        });
    }

    addNotification = (notification) => {
        this.notifications.unshift({
            ...notification,
            id: notification.id || Date.now(),
            is_read: false,
            created_at: notification.created_at || new Date().toISOString()
        });
        this.unreadCount++;
    };

    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`New ${notification.type}`, {
                body: notification.message,
                icon: '/vite.svg'
            });
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
            return permission === 'granted';
        }
        return false;
    }

    toggleDropdown = () => {
        this.isDropdownOpen = !this.isDropdownOpen;
        
        if (this.isDropdownOpen) {
            setTimeout(() => this.markAllAsRead(), 1000);
        }
    };

    closeDropdown = () => {
        this.isDropdownOpen = false;
    };

    markAsRead = (notificationId) => {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
            notification.is_read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
    };

    markAllAsRead = () => {
        this.notifications.forEach(n => n.is_read = true);
        this.unreadCount = 0;
    };

    deleteNotification = async (notificationId) => {
        try {
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                const notification = this.notifications[index];
                if (!notification.is_read) {
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                }
                this.notifications.splice(index, 1);
            }

            await NotificationService.deleteNotification(notificationId); 
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    fetchNotifications = async () => {
        try {
            const notifications = await NotificationService.fetchNotifications();
            this.notifications = notifications;
            this.unreadCount = notifications.filter(n => !n.is_read).length;
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    markNotificationAsRead = async (notificationId) => {
        try {
            await NotificationService.markAsRead(notificationId);
            this.markAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    disconnect = () => {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.currentToken = null;
        }
    };

    reconnect = () => {
        if (this.currentToken) {
            console.log('Attempting to reconnect WebSocket...');
            this.connect(this.currentToken);
        }
    };

    formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
        return `${Math.floor(diffMins / 1440)}d`;
    };
}

export default NotificationStore;