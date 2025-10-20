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
    const [lastAction, setLastAction] = useState(null);

    // Load saved game session on mount (sessionStorage is per-tab)
    useEffect(() => {
        const savedSession = sessionStorage.getItem('crazyEightsSession');
        if (savedSession) {
            try {
                const { roomCode: savedRoomCode, playerId: savedPlayerId, playerName: savedPlayerName } = JSON.parse(savedSession);
                setRoomCode(savedRoomCode);
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
                    const { roomCode: savedRoomCode, playerName: savedPlayerName } = JSON.parse(savedSession);
                    console.log('Attempting to rejoin game:', savedRoomCode);
                    newSocket.emit('rejoinGame', { roomCode: savedRoomCode, playerName: savedPlayerName });
                } catch (e) {
                    console.error('Failed to rejoin:', e);
                    sessionStorage.removeItem('crazyEightsSession');
                }
            }
        });

        newSocket.on('gameCreated', ({ roomCode, playerId, playerName, gameState }) => {
            setRoomCode(roomCode);
            setPlayerId(playerId);
            setPlayerName(playerName);
            setGameState(gameState);
            setError(null);

            // Save session to sessionStorage (per-tab, allows multiple users in different tabs)
            sessionStorage.setItem('crazyEightsSession', JSON.stringify({ roomCode, playerId, playerName }));
        });

        newSocket.on('gameJoined', ({ roomCode, playerId, playerName, gameState }) => {
            setRoomCode(roomCode);
            setPlayerId(playerId);
            setPlayerName(playerName);
            setGameState(gameState);
            setError(null);

            // Save session to sessionStorage (per-tab, allows multiple users in different tabs)
            sessionStorage.setItem('crazyEightsSession', JSON.stringify({ roomCode, playerId, playerName }));
        });

        newSocket.on('gameRejoined', ({ roomCode, playerId, playerName, gameState }) => {
            console.log('Successfully rejoined game');
            setRoomCode(roomCode);
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
            setGameState(gameState);
            alert(`🎉 ${winner} wins! 🎉`);
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

    const createGame = (playerName, playerCount) => {
        if (socket) {
            socket.emit('createGame', { playerName, playerCount });
        }
    };

    const joinGame = (roomCode, playerName) => {
        if (socket) {
            socket.emit('joinGame', { roomCode, playerName });
        }
    };

    const startGame = () => {
        if (socket && roomCode) {
            socket.emit('startGame', { roomCode });
        }
    };

    const playCard = (cardIndex) => {
        if (socket && roomCode) {
            socket.emit('playCard', { roomCode, cardIndex });
        }
    };

    const drawCard = () => {
        if (socket && roomCode) {
            socket.emit('drawCard', { roomCode });
        }
    };

    const leaveGame = () => {
        setGameState(null);
        setRoomCode(null);
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
                    onCreateGame={createGame}
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
                    lastAction={lastAction}
                />
            )}
        </div>
    );
}

export default App;

