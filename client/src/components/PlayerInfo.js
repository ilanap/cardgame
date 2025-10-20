import React from 'react';
import './PlayerInfo.css';

function PlayerInfo({ player, isCurrentPlayer, isYou }) {
    return (
        <div className={`player-info ${isCurrentPlayer ? 'active' : ''} ${isYou ? 'you' : ''}`}>
            <div className="player-name">
                {player.name}
                {isYou && ' (You)'}
            </div>
            <div className="player-cards">
                <div className="card-count">
                    🃏 {player.cardCount} {player.cardCount === 1 ? 'card' : 'cards'}
                </div>
            </div>
        </div>
    );
}

export default PlayerInfo;

