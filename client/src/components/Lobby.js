import React, { useState } from 'react';
import './Lobby.css';

function Lobby({ onJoinGame }) {
    const [playerName, setPlayerName] = useState('');
    const [rules, setRules] = useState({
        initialHandSize: 7,
        eightIsWild: false,
        drawUntilPlayable: false
    });

    const handleJoinGame = (e) => {
        e.preventDefault();
        if (playerName.trim()) {
            onJoinGame(playerName.trim(), rules);
        }
    };

    const toggleRule = (ruleKey) => {
        setRules(prev => ({
            ...prev,
            [ruleKey]: !prev[ruleKey]
        }));
    };

    const updateHandSize = (size) => {
        setRules(prev => ({
            ...prev,
            initialHandSize: size
        }));
    };

    return (
        <div className="lobby-container">
            <h1 className="game-title">8️⃣ Crazy Eights 8️⃣</h1>
            <form onSubmit={handleJoinGame} className="lobby-form">
                <input
                    type="text"
                    placeholder="Your Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    required
                />

                <div className="rules-selector">
                    <label>Game Rules:</label>
                    
                    <div className="rule-option">
                        <label>Starting Hand Size:</label>
                        <div className="hand-size-buttons">
                            {[5, 7, 9].map(size => (
                                <button
                                    key={size}
                                    type="button"
                                    className={`hand-size-btn ${rules.initialHandSize === size ? 'active' : ''}`}
                                    onClick={() => updateHandSize(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rule-option">
                        <label>
                            <input
                                type="checkbox"
                                checked={rules.eightIsWild}
                                onChange={() => toggleRule('eightIsWild')}
                            />
                            8s are Wild (can be played on any card)
                        </label>
                    </div>

                    <div className="rule-option">
                        <label>
                            <input
                                type="checkbox"
                                checked={rules.drawUntilPlayable}
                                onChange={() => toggleRule('drawUntilPlayable')}
                            />
                            Draw until playable (instead of draw 1 and pass)
                        </label>
                    </div>
                </div>

                <button type="submit" className="submit-button">
                    Join Game
                </button>
            </form>
        </div>
    );
}

export default Lobby;

