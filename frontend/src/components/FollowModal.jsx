import React from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import './FollowModal.css';

const FollowModal = observer(({ profileStore }) => {
  if (!profileStore.showModal) return null;

  const handleClose = (e) => {
    if (e.target === e.currentTarget) {
      profileStore.closeModal();
    }
  };

  const title = profileStore.modalType === 'followers' ? 'Followers' : 'Following';

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button 
            className="modal-close-btn"
            onClick={() => profileStore.closeModal()}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {profileStore.modalLoading ? (
            <div className="modal-loading">Loading...</div>
          ) : !profileStore.modalData || profileStore.modalData.length === 0 ? (
            <div className="modal-empty">
              No {profileStore.modalType} yet.
            </div>
          ) : (
            <div className="user-list">
              {profileStore.modalData.map(user => (
                <Link 
                  key={user.id} 
                  to={`/${user.username}`}
                  className="user-item"
                  onClick={() => profileStore.closeModal()}
                >
                  <div className="user-avatar">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} />
                    ) : (
                      <span className="user-avatar-initial">
                        {(user.display_name || user.username).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="user-info">
                    <div className="user-display-name">
                      {user.display_name || user.username}
                    </div>
                    <div className="user-username">@{user.username}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default FollowModal;