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
    lastAction
}) {
    const {
        started,
        players,
        yourHand,
        topCard,
        currentPlayerId,
        deckCount,
        roomCode
    } = gameState;

    const isYourTurn = currentPlayerId === playerId;
    const currentPlayer = players.find(p => p.id === playerId);
    const otherPlayers = players.filter(p => p.id !== playerId);

    const canPlayCard = (card) => {
        if (!isYourTurn || !topCard) return false;
        // Handle jokers
        if (card.type === 'joker') return true;
        if (topCard.type === 'joker') return true;
        // Match suit or rank
        return card.suit === topCard.suit || card.rank === topCard.rank;
    };

    // Check if player has any playable cards
    const hasPlayableCards = isYourTurn && yourHand && yourHand.some(card => canPlayCard(card));

    return (
        <div className="game-board">
            <div className="game-header">
                <div className="room-info">
                    <span className="room-code">Room: {roomCode}</span>
                    <button className="leave-button" onClick={onLeaveGame}>Leave</button>
                </div>
            </div>

            {!started ? (
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
                                <div className={`deck ${isYourTurn ? 'your-turn' : ''} ${!hasPlayableCards && isYourTurn ? 'must-draw' : ''}`}>
                                    <div className="card-back">
                                        {deckCount > 0 ? `${deckCount} cards` : 'Empty'}
                                    </div>
                                </div>
                                <button
                                    className={`draw-button ${!hasPlayableCards && isYourTurn ? 'must-draw' : ''}`}
                                    onClick={onDrawCard}
                                    disabled={!isYourTurn}
                                >
                                    {!hasPlayableCards && isYourTurn ? '⚠️ Must Draw!' : (isYourTurn ? '👆 Draw Card' : 'Draw Card')}
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

