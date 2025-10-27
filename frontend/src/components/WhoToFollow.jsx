import React, { useEffect } from 'react';
import { observer } from 'mobx-react';
import { suggestionStore } from '../stores';
import './WhoToFollow.css';

const WhoToFollow = observer(() => {
  useEffect(() => {
    suggestionStore.fetchSuggestedUsers();
  }, []);

  const handleFollow = async (userId) => {
    await suggestionStore.followUser(userId);
  };

  // const handleShowMore = () => {
  //   suggestionStore.fetchSuggestedUsers();
  // };

  if (suggestionStore.loading) {
    return (
      <div className="who-to-follow-widget">
        <div className="widget-header">
          <h2 className="widget-title">Who to follow</h2>
        </div>
        <div className="loading-suggestions">
          <p>Loading suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="who-to-follow-widget">
      <div className="widget-header">
        <h2 className="widget-title">Who to follow</h2>
      </div>
      
      {suggestionStore.suggestedUsers.length === 0 ? (
        <div className="no-suggestions">
          <p>No suggestions available</p>
        </div>
      ) : (
        <>
          {suggestionStore.suggestedUsers.map(user => (
            <div key={user.id} className="suggestion-item">
              <div className="suggestion-avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} />
                ) : (
                  <div className="default-avatar">
                    {user.display_name ? user.display_name[0].toUpperCase() : user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="suggestion-info">
                <div className="suggestion-name">
                  {user.display_name || user.username}
                </div>
                <div className="suggestion-username">@{user.username}</div>
                <div className="suggestion-followers">
                  {user.followers_count} followers
                </div>
              </div>
              
              <button 
                className="follow-btn"
                onClick={() => handleFollow(user.id)}
              >
                Follow
              </button>
            </div>
          ))}
          
          {/* <div className="show-more">
            <button className="show-more-btn" onClick={handleShowMore}>
              Show more
            </button>
          </div> */}
        </>
      )}
    </div>
  );
});

export default WhoToFollow;