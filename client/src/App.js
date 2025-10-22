import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';

// Automatically detect server URL based on current host
// If accessing via IP/hostname, connect to same IP/hostname
// Otherwise default to localhost:3001
function getSocketURL() {
    if (process.env.REACT_APP_SOCKET_URL) {
        return process.env.REACT_APP_SOCKET_URL;
    }

    const hostname = window.location.hostname;
    const port = 3001;

    // If accessing from network (not localhost), use the same hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:${port}`;
    }

    return `http://localhost:${port}`;
}

const SOCKET_URL = getSocketURL();

function App() {
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [roomCode, setRoomCode] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [playerName, setPlayerName] = useState(null);
    const [error, setError] = useState(null);
    const [rules, setRules] = useState({
        initialHandSize: 7,
        eightIsWild: false,
        drawUntilPlayable: false
    });
    const [lastAction, setLastAction] = useState(null);

    // Load saved game session on mount (sessionStorage is per-tab)
    useEffect(() => {
        const savedSession = sessionStorage.getItem('crazyEightsSession');
        if (savedSession) {
            try {
                const { playerId: savedPlayerId, playerName: savedPlayerName } = JSON.parse(savedSession);
                setPlayerId(savedPlayerId);
                setPlayerName(savedPlayerName);
            } catch (e) {
                sessionStorage.removeItem('crazyEightsSession');
            }
        }
    }, []);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to server');

            // Try to rejoin saved game
            const savedSession = sessionStorage.getItem('crazyEightsSession');
            if (savedSession) {
                try {
                    const { playerName: savedPlayerName } = JSON.parse(savedSession);
                    console.log('Attempting to rejoin game');
                    newSocket.emit('rejoinGame', { playerName: savedPlayerName });
                } catch (e) {
                    console.error('Failed to rejoin:', e);
                    sessionStorage.removeItem('crazyEightsSession');
                }
            }
        });

        newSocket.on('gameJoined', ({ playerId, playerName, gameState }) => {
            setPlayerId(playerId);
            setPlayerName(playerName);
            setGameState(gameState);
            setError(null);

            // Save session to sessionStorage (per-tab, allows multiple users in different tabs)
            sessionStorage.setItem('crazyEightsSession', JSON.stringify({ playerId, playerName }));
        });

        newSocket.on('gameRejoined', ({ playerId, playerName, gameState }) => {
            console.log('Successfully rejoined game');
            setPlayerId(playerId);
            setPlayerName(playerName);
            setGameState(gameState);
            setError(null);
        });

        newSocket.on('playerJoined', ({ players }) => {
            setGameState(prev => ({ ...prev, players }));
        });

        newSocket.on('playerRejoined', ({ playerName, players }) => {
            setGameState(prev => ({ ...prev, players }));
            console.log(`${playerName} rejoined the game`);
        });

        newSocket.on('gameRestarted', ({ gameState }) => {
            setGameState(gameState);
            setError(null);
        });

        newSocket.on('gameStarted', ({ gameState }) => {
            setGameState(gameState);
            setError(null);
        });

        newSocket.on('gameUpdate', ({ gameState, lastAction }) => {
            setGameState(gameState);
            if (lastAction) {
                setLastAction(lastAction);
                setTimeout(() => setLastAction(null), 3000);
            }
        });

        newSocket.on('gameOver', ({ winner, gameState }) => {
            setGameState({...gameState, gameOver: true, winner});
        });

        newSocket.on('playerLeft', ({ playerName, players }) => {
            setGameState(prev => ({ ...prev, players }));
            setError(`${playerName} left the game`);
            setTimeout(() => setError(null), 3000);
        });

        newSocket.on('error', ({ message }) => {
            setError(message);

            // If game no longer exists, clear saved session
            if (message.includes('no longer exists') || message.includes('not found')) {
                sessionStorage.removeItem('crazyEightsSession');
            }

            setTimeout(() => setError(null), 3000);
        });

        return () => {
            newSocket.close();
        };
    }, []);

    const joinGame = (playerName, gameRules) => {
        setRules(gameRules);
        if (socket) {
            socket.emit('joinGame', { playerName });
        }
    };

    const startGame = () => {
        if (socket) {
            socket.emit('startGame');
        }
    };

    const playCard = (cardIndex) => {
        if (socket) {
            socket.emit('playCard', { cardIndex });
        }
    };

    const drawCard = () => {
        if (socket) {
            socket.emit('drawCard');
        }
    };

    const restartGame = () => {
        if (socket) {
            socket.emit('restartGame');
        }
    };

    const leaveGame = () => {
        setGameState(null);
        setPlayerId(null);
        setPlayerName(null);
        setError(null);
        setLastAction(null);

        // Clear saved session
        sessionStorage.removeItem('crazyEightsSession');
    };

    return (
        <div className="App">
            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            {!gameState ? (
                <Lobby
                    onJoinGame={joinGame}
                />
            ) : (
                <GameBoard
                    gameState={gameState}
                    playerId={playerId}
                    onStartGame={startGame}
                    onPlayCard={playCard}
                    onDrawCard={drawCard}
                    onLeaveGame={leaveGame}
                    onRestartGame={restartGame}
                    lastAction={lastAction}
                    rules={rules}
                />
            )}
        </div>
    );
}

export default App;

