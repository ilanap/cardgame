import React, { useState } from 'react';
import './Lobby.css';

function Lobby({ onCreateGame, onJoinGame }) {
    const [playerName, setPlayerName] = useState('');
    const [playerCount, setPlayerCount] = useState(2);
    const [roomCodeInput, setRoomCodeInput] = useState('');
    const [mode, setMode] = useState(null); // 'create' or 'join'

    const handleCreateGame = (e) => {
        e.preventDefault();
        if (playerName.trim()) {
            onCreateGame(playerName.trim(), playerCount);
        }
    };

    const handleJoinGame = (e) => {
        e.preventDefault();
        if (playerName.trim() && roomCodeInput.trim()) {
            onJoinGame(roomCodeInput.trim().toUpperCase(), playerName.trim());
        }
    };

    if (!mode) {
        return (
            <div className="lobby-container">
                <h1 className="game-title">8️⃣ Crazy Eights 8️⃣</h1>
                <div className="mode-selection">
                    <button className="mode-button create" onClick={() => setMode('create')}>
                        Create New Game
                    </button>
                    <button className="mode-button join" onClick={() => setMode('join')}>
                        Join Game
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'create') {
        return (
            <div className="lobby-container">
                <h1 className="game-title">8️⃣ Create Game 8️⃣</h1>
                <form onSubmit={handleCreateGame} className="lobby-form">
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={20}
                        required
                    />

                    <div className="player-count-selector">
                        <label>Number of Players:</label>
                        <div className="player-count-buttons">
                            {[2, 3, 4].map(count => (
                                <button
                                    key={count}
                                    type="button"
                                    className={`player-count-btn ${playerCount === count ? 'active' : ''}`}
                                    onClick={() => setPlayerCount(count)}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="submit-button">
                        Create Game
                    </button>
                    <button type="button" className="back-button" onClick={() => setMode(null)}>
                        Back
                    </button>
                </form>
            </div>
        );
    }

    if (mode === 'join') {
        return (
            <div className="lobby-container">
                <h1 className="game-title">8️⃣ Join Game 8️⃣</h1>
                <form onSubmit={handleJoinGame} className="lobby-form">
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={20}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Room Code"
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                        maxLength={6}
                        required
                    />
                    <button type="submit" className="submit-button">
                        Join Game
                    </button>
                    <button type="button" className="back-button" onClick={() => setMode(null)}>
                        Back
                    </button>
                </form>
            </div>
        );
    }
}

export default Lobby;

