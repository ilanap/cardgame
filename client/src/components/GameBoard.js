import React from 'react';
import './GameBoard.css';
import Card from './Card';
import PlayerInfo from './PlayerInfo';

function GameBoard({
    gameState,
    playerId,
    onStartGame,
    onPlayCard,
    onDrawCard,
    onLeaveGame,
    onRestartGame,
    lastAction,
    rules
}) {
    const {
        started,
        gameOver,
        winner,
        players,
        yourHand,
        topCard,
        currentPlayerId,
        deckCount
    } = gameState;

    const isYourTurn = currentPlayerId === playerId;
    const currentPlayer = players.find(p => p.id === playerId);
    const otherPlayers = players.filter(p => p.id !== playerId);

    const canPlayCard = (card) => {
        if (!isYourTurn || !topCard) return false;
        
        // Handle jokers
        if (card.type === 'joker') return true;
        if (topCard.type === 'joker') return true;
        
        // 8s are wild (if rule enabled)
        if (rules?.eightIsWild && card.rank === '8') return true;
        
        // Basic rule: match suit or rank
        return card.suit === topCard.suit || card.rank === topCard.rank;
    };

    // Check if player has any playable cards
    const hasPlayableCards = isYourTurn && yourHand && yourHand.some(card => canPlayCard(card));

    // Show "must draw" when player has no playable cards (regardless of drawUntilPlayable rule)
    const mustDraw = isYourTurn && !hasPlayableCards;

    return (
        <div className="game-board">
            <div className="game-header">
                <div className="room-info">
                    {rules && (
                        <span className="rules-info">
                            {rules.initialHandSize} cards • 
                            {rules.eightIsWild && ' 8s wild •'}
                            {rules.drawUntilPlayable && ' Draw until playable'}
                        </span>
                    )}
                    <button className="leave-button" onClick={onLeaveGame}>Leave</button>
                </div>
            </div>

            {gameOver ? (
                <div className="game-over-screen">
                    <div className="winner-announcement">
                        <h1>🎉 Game Over! 🎉</h1>
                        <h2>{winner} Wins!</h2>
                        <div className="final-scores">
                            <h3>Final Scores:</h3>
                            {players.map(player => (
                                <div key={player.id} className={`final-score ${player.name === winner ? 'winner' : ''}`}>
                                    {player.name}: {player.cardCount} cards left
                                </div>
                            ))}
                        </div>
                        <div className="game-over-actions">
                            <button className="restart-button" onClick={onRestartGame}>
                                Play Again
                            </button>
                            <button className="leave-button" onClick={onLeaveGame}>
                                Leave Game
                            </button>
                        </div>
                    </div>
                </div>
            ) : !started ? (
                <div className="waiting-room">
                    <h2>Waiting Room</h2>
                    <div className="players-list">
                        {players.map(player => (
                            <div key={player.id} className="waiting-player">
                                {player.name} {player.isBot && '🤖'}
                            </div>
                        ))}
                    </div>
                    <p className="waiting-text">
                        Waiting for players... ({players.length} joined)
                    </p>
                    <button className="start-button" onClick={onStartGame}>
                        Start Game
                    </button>
                </div>
            ) : (
                <>
                    {/* Other Players */}
                    <div className="other-players">
                        {otherPlayers.map(player => (
                            <PlayerInfo
                                key={player.id}
                                player={player}
                                isCurrentPlayer={player.id === currentPlayerId}
                            />
                        ))}
                    </div>

                    {/* Game Area */}
                    <div className="game-area">
                        <div className="deck-area">
                            <div className="deck-column">
                                <div className={`deck ${isYourTurn ? 'your-turn' : ''} ${mustDraw ? 'must-draw' : ''}`}>
                                    <div className="card-back">
                                        {deckCount > 0 ? `${deckCount} cards` : 'Empty'}
                                    </div>
                                </div>
                                <button
                                    className={`draw-button ${mustDraw ? 'must-draw' : ''}`}
                                    onClick={onDrawCard}
                                    disabled={!isYourTurn}
                                >
                                    {mustDraw ? '⚠️ Must Draw!' : (isYourTurn ? '👆 Draw Card' : 'Draw Card')}
                                </button>
                            </div>
                            {topCard && (
                                <div className="discard-pile">
                                    <Card card={topCard} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Your Hand */}
                    <div className="your-area">
                        <div className="your-info">
                            <PlayerInfo
                                player={currentPlayer}
                                isCurrentPlayer={isYourTurn}
                                isYou={true}
                            />
                        </div>
                        <div className="your-hand">
                            {yourHand.map((card, index) => (
                                <div
                                    key={index}
                                    className={`hand-card ${canPlayCard(card) ? 'playable' : 'not-playable'}`}
                                    onClick={() => {
                                        if (isYourTurn && canPlayCard(card)) {
                                            onPlayCard(index);
                                        }
                                    }}
                                >
                                    <Card card={card} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default GameBoard;

