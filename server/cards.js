// Card definitions for the game

// Standard playing card suits
const SUITS = {
    hearts: { name: 'hearts', symbol: '♥', color: 'red' },
    diamonds: { name: 'diamonds', symbol: '♦', color: 'red' },
    clubs: { name: 'clubs', symbol: '♣', color: 'black' },
    spades: { name: 'spades', symbol: '♠', color: 'black' }
};

// Standard playing card ranks
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Rank values for matching (A=1, 2-10=face value, J=11, Q=12, K=13)
const RANK_VALUES = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13
};

/**
 * Create a standard deck of playing cards (2 decks + 2 jokers)
 * @returns {Array} Array of card objects
 */
function createDeck() {
    const deck = [];

    // Create 2 standard 52-card decks
    for (let deckNum = 0; deckNum < 2; deckNum++) {
        Object.values(SUITS).forEach(suit => {
            RANKS.forEach(rank => {
                deck.push({
                    suit: suit.name,
                    rank: rank,
                    color: suit.color,
                    symbol: suit.symbol,
                    value: RANK_VALUES[rank],
                    type: 'regular'
                });
            });
        });
    }

    // Add 2 Jokers (wild cards)
    deck.push({ type: 'joker', rank: 'Joker', color: 'red', isWild: true });
    deck.push({ type: 'joker', rank: 'Joker', color: 'black', isWild: true });

    return deck;
}

/**
 * Check if a card is playable on top of another card
 * @param {Object} card - The card to play
 * @param {Object} topCard - The card on top of discard pile
 * @param {Object} rules - Current game rules
 * @returns {boolean}
 */
function canPlayCard(card, topCard, rules) {
    if (!card || !topCard) return false;

    // Jokers can be played on anything
    if (card.type === 'joker') return true;

    // Can play on a joker with any card
    if (topCard.type === 'joker') return true;

    // Basic rule: match suit or rank
    if (rules.matchColorOrNumber) {
        return card.suit === topCard.suit || card.rank === topCard.rank;
    }

    // Future: Add more complex matching rules here
    // if (rules.eightIsWild && card.rank === '8') return true;

    return false;
}

module.exports = {
    SUITS,
    RANKS,
    RANK_VALUES,
    createDeck,
    canPlayCard
};

