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

// Store active games
const games = new Map();

// Generate a random room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Create a new game room
    socket.on('createGame', ({ playerName, playerCount }) => {
        const roomCode = generateRoomCode();
        const game = new Game(roomCode, playerCount);
        game.addPlayer(socket.id, playerName);
        games.set(roomCode, game);

        socket.join(roomCode);
        socket.emit('gameCreated', {
            roomCode,
            playerId: socket.id,
            playerName,
            gameState: game.getGameState(socket.id)
        });

        console.log(`Game created: ${roomCode} by ${playerName}`);
    });

    // Join an existing game
    socket.on('joinGame', ({ roomCode, playerName }) => {
        const game = games.get(roomCode);

        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        if (game.isFull()) {
            socket.emit('error', { message: 'Game is full' });
            return;
        }

        if (game.isStarted()) {
            socket.emit('error', { message: 'Game already in progress. Please wait until it finishes or create a new game.' });
            return;
        }

        game.addPlayer(socket.id, playerName);
        socket.join(roomCode);

        // Notify all players in the room
        io.to(roomCode).emit('playerJoined', {
            players: game.getPlayers()
        });

        socket.emit('gameJoined', {
            roomCode,
            playerId: socket.id,
            playerName,
            gameState: game.getGameState(socket.id)
        });

        console.log(`${playerName} joined game: ${roomCode}`);
    });

    // Rejoin an existing game after disconnect/refresh
    socket.on('rejoinGame', ({ roomCode, playerName }) => {
        const game = games.get(roomCode);

        if (!game) {
            socket.emit('error', { message: 'Game no longer exists' });
            return;
        }

        // Check if player was in this game (by name)
        const existingPlayer = game.players.find(p => p.name === playerName);

        if (existingPlayer) {
            // Update the player's socket ID and mark as connected
            existingPlayer.id = socket.id;
            existingPlayer.connected = true;
            socket.join(roomCode);

            socket.emit('gameRejoined', {
                roomCode,
                playerId: socket.id,
                playerName,
                gameState: game.getGameState(socket.id)
            });

            // Notify other players
            io.to(roomCode).emit('playerRejoined', {
                playerName,
                players: game.getPlayers()
            });

            console.log(`${playerName} rejoined game: ${roomCode}`);
        } else {
            // Player wasn't in this game, try to join as new player
            if (game.isFull()) {
                socket.emit('error', { message: 'Game is full' });
                return;
            }

            if (game.isStarted()) {
                socket.emit('error', { message: 'Game already in progress. Please wait until it finishes or create a new game.' });
                return;
            }

            game.addPlayer(socket.id, playerName);
            socket.join(roomCode);

            io.to(roomCode).emit('playerJoined', {
                players: game.getPlayers()
            });

            socket.emit('gameJoined', {
                roomCode,
                playerId: socket.id,
                playerName,
                gameState: game.getGameState(socket.id)
            });

            console.log(`${playerName} joined game: ${roomCode}`);
        }
    });

    // Start the game
    socket.on('startGame', ({ roomCode }) => {
        const game = games.get(roomCode);

        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        game.startGame();

        // Send personalized game state to each player
        game.getPlayers().forEach(player => {
            io.to(player.id).emit('gameStarted', {
                gameState: game.getGameState(player.id)
            });
        });

        console.log(`Game started: ${roomCode}`);
    });

    // Play a card
    socket.on('playCard', ({ roomCode, cardIndex }) => {
        const game = games.get(roomCode);

        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        const result = game.playCard(socket.id, cardIndex);

        if (!result.success) {
            socket.emit('error', { message: result.message });
            return;
        }

        // Send updated game state to all players
        game.getPlayers().forEach(player => {
            io.to(player.id).emit('gameUpdate', {
                gameState: game.getGameState(player.id),
                lastAction: result.action
            });
        });

        // Check for winner
        if (result.winner) {
            io.to(roomCode).emit('gameOver', {
                winner: result.winner,
                gameState: game.getGameState(socket.id)
            });
        }
    });

    // Draw a card
    socket.on('drawCard', ({ roomCode }) => {
        const game = games.get(roomCode);

        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        const result = game.drawCard(socket.id);

        if (!result.success) {
            socket.emit('error', { message: result.message });
            return;
        }

        // Send updated game state to all players
        game.getPlayers().forEach(player => {
            io.to(player.id).emit('gameUpdate', {
                gameState: game.getGameState(player.id),
                lastAction: result.action
            });
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Give players 30 seconds to reconnect before removing them
        setTimeout(() => {
            games.forEach((game, roomCode) => {
                const player = game.players.find(p => p.id === socket.id);

                if (player && !player.connected) {
                    // Player didn't reconnect, remove them
                    const playerName = player.name;
                    game.removePlayer(socket.id);

                    if (game.getPlayers().length === 0) {
                        games.delete(roomCode);
                        console.log(`Game ${roomCode} deleted (no players)`);
                    } else {
                        io.to(roomCode).emit('playerLeft', {
                            playerName,
                            players: game.getPlayers()
                        });
                    }
                }
            });
        }, 30000); // 30 second grace period

        // Mark player as disconnected but keep them in the game
        games.forEach((game, roomCode) => {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                player.connected = false;
                console.log(`${player.name} disconnected, waiting for reconnection...`);
            }
        });
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

