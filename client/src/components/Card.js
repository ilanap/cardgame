import React from 'react';
import './Card.css';

function Card({ card }) {
    // Handle Joker cards
    if (card.type === 'joker') {
        return (
            <div className={`card joker ${card.color}`}>
                <div className="card-rank">🃏</div>
                <div className="card-center joker-center">JOKER</div>
                <div className="card-rank bottom">🃏</div>
            </div>
        );
    }

    // Regular playing cards
    const colorClass = card.color === 'red' ? 'red' : 'black';

    return (
        <div className={`card playing-card ${colorClass}`}>
            <div className="card-rank">
                <div>{card.rank}</div>
                <div className="suit-symbol">{card.symbol}</div>
            </div>
            <div className="card-center">
                <span className="center-symbol">{card.symbol}</span>
            </div>
            <div className="card-rank bottom">
                <div>{card.rank}</div>
                <div className="suit-symbol">{card.symbol}</div>
            </div>
        </div>
    );
}

export default Card;

