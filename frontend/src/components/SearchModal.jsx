import React, { useEffect } from 'react';
import { observer } from 'mobx-react';
import { useNavigate } from 'react-router-dom';
import { X, MagnifyingGlass, User } from "@phosphor-icons/react";
import { homeStore } from '../stores';
import './SearchModal.css';

const SearchModal = observer(({ isOpen, onClose }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) {
            homeStore.setSearchQuery('');
            homeStore.setSearchResults([]);
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const query = e.target.value;
        homeStore.setSearchQuery(query);
        homeStore.searchUsers(query);
    };

    const handleUserClick = (username) => {
        navigate(`/${username}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="search-modal-overlay" onClick={onClose}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="search-modal-header">
                    <h2>Search username</h2>
                    <button className="search-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="search-input-container">
                    <MagnifyingGlass className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Pretraži korisnike..."
                        value={homeStore.searchQuery}
                        onChange={handleInputChange}
                        className="search-input"
                        autoFocus
                    />
                </div>

                <div className="search-results">
                    {homeStore.searchLoading && (
                        <div className="search-loading">Searching...</div>
                    )}

                    {!homeStore.searchLoading && homeStore.searchResults.length === 0 && homeStore.searchQuery.trim() && (
                        <div className="search-empty">No results for "{homeStore.searchQuery}"</div>
                    )}

                    {!homeStore.searchLoading && homeStore.searchResults.map(user => (
                        <div
                            key={user.id}
                            className="search-user-item"
                            onClick={() => handleUserClick(user.username)}
                        >
                            <div className="search-user-avatar">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.username} />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                            <div className="search-user-info">
                                <div className="search-user-display-name">
                                    {user.display_name}
                                </div>
                                <div className="search-user-username">
                                    @{user.username}
                                </div>
                            </div>
                            <div className="search-user-stats">
                                <span>{user.followers_count} followers</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default SearchModal;