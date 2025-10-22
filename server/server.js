const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const os = require('os');
const Game = require('./game');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow connections from any origin on local network
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Function to get local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Store single active game
let currentGame = null;

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join game (creates new game if none exists)
    socket.on('joinGame', ({ playerName }) => {
        // If no game exists, create one
        if (!currentGame) {
            currentGame = new Game('GLOBAL', 4);
            console.log('New global game created');
        }

        // Check if game is full
        if (currentGame.isFull()) {
            socket.emit('error', { message: 'Game is full' });
            return;
        }

        // Check if game already started
        if (currentGame.isStarted()) {
            socket.emit('error', { message: 'Game already in progress. Please wait until it finishes.' });
            return;
        }

        currentGame.addPlayer(socket.id, playerName);

        // Notify all players in the game
        currentGame.getPlayers().forEach(player => {
            io.to(player.id).emit('playerJoined', {
                players: currentGame.getPlayers()
            });
        });

        socket.emit('gameJoined', {
            playerId: socket.id,
            playerName,
            gameState: currentGame.getGameState(socket.id)
        });

        console.log(`${playerName} joined the global game`);
    });

    // Rejoin an existing game after disconnect/refresh
    socket.on('rejoinGame', ({ playerName }) => {
        if (!currentGame) {
            socket.emit('error', { message: 'No game exists to rejoin' });
            return;
        }

        // Check if player was in this game (by name)
        const existingPlayer = currentGame.players.find(p => p.name === playerName);

        if (existingPlayer) {
            // Update the player's socket ID and mark as connected
            existingPlayer.id = socket.id;
            existingPlayer.connected = true;

            socket.emit('gameRejoined', {
                playerId: socket.id,
                playerName,
                gameState: currentGame.getGameState(socket.id)
            });

            // Notify other players
            currentGame.getPlayers().forEach(player => {
                if (player.id !== socket.id) {
                    io.to(player.id).emit('playerRejoined', {
                        playerName,
                        players: currentGame.getPlayers()
                    });
                }
            });

            console.log(`${playerName} rejoined the global game`);
        } else {
            // Player wasn't in this game, try to join as new player
            if (currentGame.isFull()) {
                socket.emit('error', { message: 'Game is full' });
                return;
            }

            if (currentGame.isStarted()) {
                socket.emit('error', { message: 'Game already in progress. Please wait until it finishes.' });
                return;
            }

            currentGame.addPlayer(socket.id, playerName);

            currentGame.getPlayers().forEach(player => {
                io.to(player.id).emit('playerJoined', {
                    players: currentGame.getPlayers()
                });
            });

            socket.emit('gameJoined', {
                playerId: socket.id,
                playerName,
                gameState: currentGame.getGameState(socket.id)
            });

            console.log(`${playerName} joined the global game`);
        }
    });

    // Start the game
    socket.on('startGame', () => {
        if (!currentGame) {
            socket.emit('error', { message: 'No game exists' });
            return;
        }

        currentGame.startGame();

        // Send personalized game state to each player
        currentGame.getPlayers().forEach(player => {
            io.to(player.id).emit('gameStarted', {
                gameState: currentGame.getGameState(player.id)
            });
        });

        console.log('Global game started');
    });

    // Play a card
    socket.on('playCard', ({ cardIndex }) => {
        if (!currentGame) {
            socket.emit('error', { message: 'No game exists' });
            return;
        }

        const result = currentGame.playCard(socket.id, cardIndex);

        if (!result.success) {
            socket.emit('error', { message: result.message });
            return;
        }

        // Send updated game state to all players
        currentGame.getPlayers().forEach(player => {
            io.to(player.id).emit('gameUpdate', {
                gameState: currentGame.getGameState(player.id),
                lastAction: result.action
            });
        });

        // Check for winner
        if (result.winner) {
            currentGame.getPlayers().forEach(player => {
                io.to(player.id).emit('gameOver', {
                    winner: result.winner,
                    gameState: currentGame.getGameState(player.id)
                });
            });
        }
    });

    // Draw a card
    socket.on('drawCard', () => {
        if (!currentGame) {
            socket.emit('error', { message: 'No game exists' });
            return;
        }

        const result = currentGame.drawCard(socket.id);

        if (!result.success) {
            socket.emit('error', { message: result.message });
            return;
        }

        // Send updated game state to all players
        currentGame.getPlayers().forEach(player => {
            io.to(player.id).emit('gameUpdate', {
                gameState: currentGame.getGameState(player.id),
                lastAction: result.action
            });
        });
    });

    // Restart game with same players
    socket.on('restartGame', () => {
        if (!currentGame) {
            socket.emit('error', { message: 'No game exists' });
            return;
        }

        // Reset game state but keep players
        currentGame.restartGame();

        // Send updated game state to all players
        currentGame.getPlayers().forEach(player => {
            io.to(player.id).emit('gameRestarted', {
                gameState: currentGame.getGameState(player.id)
            });
        });

        console.log('Global game restarted');
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        if (currentGame) {
            const player = currentGame.players.find(p => p.id === socket.id);
            if (player) {
                player.connected = false;
                console.log(`${player.name} disconnected, waiting for reconnection...`);

                // Give player 30 seconds to reconnect before removing them
                setTimeout(() => {
                    if (currentGame && player && !player.connected) {
                        // Player didn't reconnect, remove them
                        const playerName = player.name;
                        currentGame.removePlayer(socket.id);

                        if (currentGame.getPlayers().length === 0) {
                            currentGame = null;
                            console.log('Global game deleted (no players)');
                        } else {
                            currentGame.getPlayers().forEach(p => {
                                io.to(p.id).emit('playerLeft', {
                                    playerName,
                                    players: currentGame.getPlayers()
                                });
                            });
                        }
                    }
                }, 30000); // 30 second grace period
            }
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIPAddress();
    const hostname = os.hostname();

    console.log('\n8️⃣  Crazy Eights Game Server is running!\n');
    console.log('📍 You can access the server at:');
    console.log(`   - Local:    http://localhost:${PORT}`);
    console.log(`   - Network:  http://${localIP}:${PORT}`);
    console.log(`   - Hostname: http://${hostname}.local:${PORT}`);
    console.log('\n💡 Share the Network URL with other players on your local network!\n');
});

