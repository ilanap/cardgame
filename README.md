# Crazy Eights 8️⃣

A fun, colorful multiplayer card game based on the classic Crazy Eights. Built with React and Node.js + Socket.IO for kids and families.

## Features

- 🎮 **2-4 Players** - fun multiplayer card game
- 🌐 **Real-time Multiplayer** - each player on their own device
- 🎴 **Authentic Card Table** - classic green felt table design
- 🃏 **Real Playing Cards** - standard deck with suits and face cards
- 💾 **Auto-Rejoin** - refresh the page and automatically rejoin your game
- ⚙️ **Configurable Rules** - easily add/remove game rules (framework ready)

## Game Rules (Simple Start)

- Each player gets **7 cards**
- Uses **2 standard 52-card decks** plus **2 Jokers** (106 cards total)
- Play a card that matches the **suit OR rank** of the top card
- **Jokers are wild** - can be played on any card
- If you can't play, draw 1 card from the deck
- First player to empty their hand wins! 🏆

## Tech Stack

- **Frontend**: React, CSS
- **Backend**: Node.js, Express, Socket.IO
- **Real-time Communication**: WebSocket

## Installation

```bash
# Install root dependencies
npm install

# Install server and client dependencies
npm run install-all
```

## Running the App

### Development Mode (runs both server and client)
```bash
npm run dev
```

This will start:
- **Server** on `http://localhost:3001`
- **Client** on `http://localhost:3000`

The server will display your **network IP address** and **hostname** in the console. Share these URLs with other players on your local network!

### Run Server Only
```bash
npm run server
```

### Run Client Only
```bash
npm run client
```

## Playing on Multiple Devices

### Option 1: Using IP Address
1. Start the server with `npm run dev`
2. Note the Network IP displayed in the console (e.g., `http://192.168.1.100:3000`)
3. On other devices connected to the **same WiFi network**, open a browser and go to that URL

### Option 2: Using Hostname
1. Start the server with `npm run dev`
2. Note the Hostname displayed in the console (e.g., `http://YourComputerName.local:3000`)
3. On other devices (especially Apple devices), you can use the hostname URL

### Tips:
- All devices must be on the **same WiFi network**
- If you can't connect, check your firewall settings
- On macOS, you may need to allow incoming connections for Node.js
- The game will automatically connect to the correct server based on the URL you use

## How to Play

1. **Create a Game**
   - Enter your name
   - Choose number of players (2-4)
   - Get a room code

2. **Join a Game**
   - Enter your name
   - Enter the room code from your friend

3. **Play**
   - Wait for all players to join
   - Host starts the game
   - On your turn, click a card to play it (must match color or number)
   - If you can't play, click "Draw Card" button
   - First to empty their hand wins!

4. **Reconnect**
   - If you accidentally refresh or lose connection, just reload the page
   - You'll automatically rejoin your game with your cards intact!

## Project Structure

```
boaz/
├── server/
│   ├── server.js       # Socket.IO server
│   ├── game.js         # Game logic
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.js      # Main app component
│   │   ├── components/ # React components
│   │   └── ...
│   └── package.json
├── package.json        # Root package (workspace)
└── README.md
```

## Future Enhancements

- Add special cards (skip, reverse, draw 2, wild cards)
- Sound effects and animations
- Score tracking across multiple rounds
- More configurable rules
- Mobile responsiveness improvements
- AI opponent option for single player mode

## Notes for Parents/Teachers

- This is a local network game - all devices must be on the same network
- No user accounts or data collection
- Clean, ad-free experience
- Great for teaching turn-taking and strategy
- No internet connection required after installing dependencies

## Troubleshooting

### Can't connect from other devices?

1. **Check firewall**: Make sure ports 3000 and 3001 are allowed
   - macOS: System Preferences → Security & Privacy → Firewall → Firewall Options
   - Allow Node.js to accept incoming connections

2. **Check WiFi**: All devices must be on the same network (not guest networks)

3. **Try IP instead of hostname**: Some networks don't support `.local` hostnames

4. **Restart the server**: Sometimes you need to restart after firewall changes

Enjoy playing! 🎉

