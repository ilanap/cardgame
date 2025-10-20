// Game rules configuration
// Enable/disable rules here to customize gameplay

const DEFAULT_RULES = {
    // Basic rules
    matchColorOrNumber: true,    // Must match suit OR rank to play
    initialHandSize: 7,           // Number of cards each player starts with

    // Special card rules (for future expansion)
    eightIsWild: false,           // 8 can be played on any card and change color
    skipCard: false,              // Skip next player's turn
    reverseCard: false,           // Reverse play direction
    drawTwoCard: false,           // Next player draws 2 cards
    wildCard: false,              // Can be played on any card
    wildDrawFourCard: false,      // Wild + next player draws 4

    // Gameplay rules
    drawUntilPlayable: false,     // Draw cards until you can play (instead of draw 1)
    stackDrawCards: false,        // Can stack draw-2 or draw-4 cards
    jumpIn: false,                // Players can jump in with exact match card
};

/**
 * Get the current active rules
 * Can be customized per game in the future
 */
function getActiveRules(customRules = {}) {
    return {
        ...DEFAULT_RULES,
        ...customRules
    };
}

/**
 * Validate if a rule configuration is valid
 */
function validateRules(rules) {
    // Ensure required rules exist
    if (typeof rules.matchColorOrNumber !== 'boolean') {
        return { valid: false, error: 'matchColorOrNumber must be a boolean' };
    }

    if (typeof rules.initialHandSize !== 'number' || rules.initialHandSize < 1) {
        return { valid: false, error: 'initialHandSize must be a positive number' };
    }

    return { valid: true };
}

/**
 * Get a description of a rule for UI display
 */
function getRuleDescription(ruleKey) {
    const descriptions = {
        matchColorOrNumber: 'Play a card matching the suit OR rank',
        initialHandSize: 'Starting hand size for each player',
        eightIsWild: 'Number 8 acts as a wild card',
        skipCard: 'Skip the next player\'s turn',
        reverseCard: 'Reverse the play direction',
        drawTwoCard: 'Force next player to draw 2 cards',
        wildCard: 'Wild cards can be played on anything',
        wildDrawFourCard: 'Wild card + draw 4 combo',
        drawUntilPlayable: 'Draw cards until you can play one',
        stackDrawCards: 'Stack multiple draw cards together',
        jumpIn: 'Jump in with an exact matching card'
    };

    return descriptions[ruleKey] || ruleKey;
}

module.exports = {
    DEFAULT_RULES,
    getActiveRules,
    validateRules,
    getRuleDescription
};

