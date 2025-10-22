const { getActiveRules } = require('./rules');
const { createDeck, canPlayCard } = require('./cards');

class Game {
    constructor(roomCode, maxPlayers = 4) {
        this.roomCode = roomCode;
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.deck = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.started = false;
        this.gameOver = false;
        this.winner = null;
        this.direction = 1; // 1 for clockwise, -1 for counter-clockwise
    }

    // Initialize a deck of cards
    initializeDeck() {
        const deck = createDeck();
        return this.shuffleDeck(deck);
    }

    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    addPlayer(id, name) {
        if (this.players.length < this.maxPlayers) {
            // Check if player with this name already exists (rejoining)
            const existingPlayer = this.players.find(p => p.name === name);
            if (existingPlayer) {
                existingPlayer.id = id;
                existingPlayer.connected = true;
                return;
            }

            this.players.push({
                id,
                name,
                hand: [],
                connected: true
            });
        }
    }

    removePlayer(id) {
        this.players = this.players.filter(p => p.id !== id);
    }

    hasPlayer(id) {
        return this.players.some(p => p.id === id);
    }

    getPlayerName(id) {
        const player = this.players.find(p => p.id === id);
        return player ? player.name : null;
    }

    getPlayers() {
        return this.players.map(p => ({
            id: p.id,
            name: p.name,
            cardCount: p.hand.length
        }));
    }

    isFull() {
        return this.players.length >= this.maxPlayers;
    }

    isStarted() {
        return this.started;
    }

    startGame() {
        this.deck = this.initializeDeck();

        // Deal cards to each player (default 7 cards)
        const handSize = 7;
        this.players.forEach(player => {
            player.hand = this.deck.splice(0, handSize);
        });

        // Put first card on discard pile
        this.discardPile.push(this.deck.pop());

        this.started = true;
        this.gameOver = false;
        this.winner = null;
        this.currentPlayerIndex = 0;
    }

    restartGame() {
        this.deck = this.initializeDeck();

        // Deal cards to each player (default 7 cards)
        const handSize = 7;
        this.players.forEach(player => {
            player.hand = this.deck.splice(0, handSize);
        });

        // Put first card on discard pile
        this.discardPile.push(this.deck.pop());

        this.started = true;
        this.gameOver = false;
        this.winner = null;
        this.currentPlayerIndex = 0;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getTopCard() {
        return this.discardPile[this.discardPile.length - 1];
    }

    canPlayCard(card) {
        const topCard = this.getTopCard();
        return canPlayCard(card, topCard);
    }

    playCard(playerId, cardIndex) {
        const player = this.players.find(p => p.id === playerId);

        if (!player) {
            return { success: false, message: 'Player not found' };
        }

        if (this.getCurrentPlayer().id !== playerId) {
            return { success: false, message: 'Not your turn' };
        }

        if (cardIndex < 0 || cardIndex >= player.hand.length) {
            return { success: false, message: 'Invalid card' };
        }

        const card = player.hand[cardIndex];

        if (!this.canPlayCard(card)) {
            return { success: false, message: 'Cannot play this card' };
        }

        // Play the card
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);

        const action = {
            type: 'play',
            player: player.name,
            card
        };

        // Check for winner
        if (player.hand.length === 0) {
            this.gameOver = true;
            this.winner = player.name;
            return {
                success: true,
                action,
                winner: player.name
            };
        }

        // Move to next player
        this.nextPlayer();

        return { success: true, action };
    }

    drawCard(playerId) {
        const player = this.players.find(p => p.id === playerId);

        if (!player) {
            return { success: false, message: 'Player not found' };
        }

        if (this.getCurrentPlayer().id !== playerId) {
            return { success: false, message: 'Not your turn' };
        }

        // Reshuffle discard pile if deck is empty (keep top card)
        if (this.deck.length === 0) {
            const topCard = this.discardPile.pop();
            this.deck = this.shuffleDeck(this.discardPile);
            this.discardPile = [topCard];
        }

        if (this.deck.length > 0) {
            const card = this.deck.pop();
            player.hand.push(card);
        }

        const action = {
            type: 'draw',
            player: player.name
        };

        // Move to next player
        this.nextPlayer();

        return { success: true, action };
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    getGameState(playerId) {
        const player = this.players.find(p => p.id === playerId);
        const currentPlayer = this.getCurrentPlayer();

        return {
            roomCode: this.roomCode,
            started: this.started,
            gameOver: this.gameOver,
            winner: this.winner,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                cardCount: p.hand.length,
                // Only show hand for the requesting player
                hand: p.id === playerId ? p.hand : null
            })),
            yourHand: player ? player.hand : [],
            topCard: this.discardPile.length > 0 ? this.getTopCard() : null,
            currentPlayerId: currentPlayer ? currentPlayer.id : null,
            deckCount: this.deck.length
        };
    }
}

module.exports = Game;

