import React, { useState, useEffect } from 'react';
// import { io } from 'socket.io-client';
// import './NotificationBell.css';
import { Bell } from "@phosphor-icons/react";

const NotificationBell = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {}, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="notification-bell">
      <div className="bell-icon" onClick={toggleDropdown}><Bell size={32} /></div>

      {isDropdownOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
          </div>
          <div className="notification-list">
            <div className="no-notifications">
              Notifications temporarily disabled
            </div>
            
          </div>

          
        </div>
      )}
    </div>
  );
};

export default NotificationBell;