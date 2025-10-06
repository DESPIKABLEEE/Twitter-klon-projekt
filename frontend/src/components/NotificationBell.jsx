import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { Bell, Trash } from "@phosphor-icons/react";
import { notificationStore, userStore } from '../stores';
import './NotificationBell.css';

const NotificationBell = observer(() => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Pokreni WebSocket s kratkim delay-em da server bude spreman
    if (userStore.token && !notificationStore.isConnected) {
      const timer = setTimeout(() => {
        notificationStore.connect(userStore.token);
        notificationStore.requestNotificationPermission();
      }, 1000);

      return () => clearTimeout(timer);
    }

    return () => {
      // Cleanup - ne disconnectamo jer želimo zadržati konekciju između stranica
    };
  }, []);

  // MobX observer će automatski reagirati na promjene u userStore.token

  // Pozicioniraj dropdown da ne ide van ekrana
  const adjustDropdownPosition = () => {
    setTimeout(() => {
      if (dropdownRef.current) {
        const dropdown = dropdownRef.current;
        const bellIcon = dropdown.parentElement.querySelector('.bell-icon');
        
        if (bellIcon) {
          const bellRect = bellIcon.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          
          // Pozicioniraj dropdown relativno na bell icon
          dropdown.style.top = `${bellRect.bottom + 5}px`;
          dropdown.style.right = `${viewportWidth - bellRect.right}px`;
          dropdown.style.left = 'auto';
          
          // Proveri da li ide van ekrana i adjustuj
          const dropdownRect = dropdown.getBoundingClientRect();
          
          if (dropdownRect.right > viewportWidth - 20) {
            dropdown.style.right = '20px';
          }
          
          if (dropdownRect.left < 20) {
            dropdown.style.left = '20px';
            dropdown.style.right = 'auto';
          }
        }
      }
    }, 10);
  };

  const handleNotificationClick = (notification, e) => {
    e.stopPropagation(); // Spriječi bubbling
    notificationStore.deleteNotification(notification.id);
  };

  return (
    <>
      <div className="bell-icon" onClick={() => { notificationStore.toggleDropdown(); adjustDropdownPosition(); }}>
        <Bell className="nav-icon" />
        <span>Notifications</span>
        {notificationStore.notifications.length > 0 && (
          <span className="notification-badge">{notificationStore.notifications.length}</span>
        )}
      </div>

      {notificationStore.isDropdownOpen && (
        <div className="notification-dropdown" ref={dropdownRef}>
          <div className="notification-header">
            <h3>Notifications</h3>
            {notificationStore.unreadCount > 0 && (
              <span className="unread-count">{notificationStore.unreadCount} unread</span>
            )}
          </div>
          
          <div className="notification-list">
            {notificationStore.notifications.length === 0 ? (
              <div className="no-notifications">
                No notifications yet
              </div>
            ) : (
              notificationStore.notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={(e) => handleNotificationClick(notification, e)}
                  title="Click to delete notification"
                >
                  <div className="notification-content">
                    <p dangerouslySetInnerHTML={{ __html: notification.message }}></p>
                    <div className="notification-time">
                      {notificationStore.formatTimeAgo(notification.created_at)}
                      {!notification.is_read && <span className="unread-dot">•</span>}
                    </div>
                  </div>
                  <div className="delete-icon">
                    <Trash size={16} />
                    <span>Delete</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {notificationStore.notifications.length > 10 && (
            <div className="see-all">
              <Link to="/notifications">See all notifications</Link>
            </div>
          )}
        </div>
      )}
    </>
  );
});

export default NotificationBell;