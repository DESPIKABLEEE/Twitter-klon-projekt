import React from 'react';
import { 
  PencilSimple, 
  VideoCamera, 
  RocketLaunch, 
  EyeSlash,
  Crown 
} from "@phosphor-icons/react";
import './PremiumSubscription.css';

const PremiumSubscription = () => {
  // const handleSubscribe = () => {
  //   alert('Premium subscription feature coming soon!');
  // };

  return (
    <div className="premium-widget">
      <div className="premium-header">
        <Crown size={20} weight="fill" />
        <h2 className="premium-title">Subscribe to Premium</h2>
      </div>
      
      <div className="premium-content">
        <p className="premium-description">
          Subscribe to unlock new features and if eligible, receive a share of ads revenue.
        </p>
        
        <ul className="premium-features">
          <li>
            <PencilSimple size={16} weight="bold" />
            Edit post
          </li>
          <li>
            <VideoCamera size={16} weight="bold" />
            Post longer videos
          </li>
          <li>
            <RocketLaunch size={16} weight="bold" />
            Priority ranking in conversations
          </li>
          <li>
            <EyeSlash size={16} weight="bold" />
            See fewer ads
          </li>
        </ul>
        
        <button className="subscribe-btn">
          Subscribe
        </button>
      </div>
    </div>
  );
};

export default PremiumSubscription;