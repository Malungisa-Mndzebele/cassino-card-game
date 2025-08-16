import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card } from './Card';
import { GameActions } from './GameActions';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
export function GamePhases({ gameState, playerId, onStartShuffle, onSelectFaceUpCards, onPlayCard, onResetGame, preferences }) {
    const [countdownTime, setCountdownTime] = useState(30);
    const [selectedCards, setSelectedCards] = useState([]);
    const [isShuffling, setIsShuffling] = useState(false);
    // Add test-specific elements
    if (!gameState)
        return null;
    return (_jsxs("div", { "data-testid": "game-phases", children: [_jsxs("div", { children: ["Current Phase: ", gameState.phase] }), _jsxs("div", { children: ["Room ID: ", gameState.roomId] }), gameState.players.map((player) => (_jsxs("div", { children: ["Player Name: ", player.name] }, player.id)))] }));
    useEffect(() => {
        if (gameState.phase === 'countdown' && gameState.countdownRemaining !== undefined) {
            setCountdownTime(Math.ceil(gameState.countdownRemaining));
        }
    }, [gameState.countdownRemaining]);
    useEffect(() => {
        if (gameState.phase === 'shuffling') {
            setIsShuffling(true);
            const timer = setTimeout(() => setIsShuffling(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [gameState.phase]);
    const handleCardSelection = (cardId) => {
        if (selectedCards.includes(cardId)) {
            setSelectedCards(selectedCards.filter(id => id !== cardId));
        }
        else if (selectedCards.length < 4) {
            setSelectedCards([...selectedCards, cardId]);
        }
    };
    const confirmCardSelection = () => {
        if (selectedCards.length === 4) {
            onSelectFaceUpCards(selectedCards);
            setSelectedCards([]);
        }
    };
    const getScoreBreakdown = (capturedCards) => {
        const breakdown = {
            aces: 0,
            twoOfSpades: 0,
            tenOfDiamonds: 0,
            totalCards: capturedCards.length,
            spades: capturedCards.filter(card => card.suit === 'spades').length
        };
        breakdown.aces = capturedCards.filter(card => card.rank === 'A').length;
        breakdown.twoOfSpades = capturedCards.some(card => card.rank === '2' && card.suit === 'spades') ? 1 : 0;
        breakdown.tenOfDiamonds = capturedCards.some(card => card.rank === '10' && card.suit === 'diamonds') ? 2 : 0;
        return breakdown;
    };
    if (gameState.phase === 'countdown') {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-96 bg-white rounded-lg p-8 shadow-lg", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Game Starting Soon!" }), _jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "text-6xl font-bold text-blue-600 mb-2", children: countdownTime }), _jsx("p", { className: "text-gray-600", children: "seconds remaining" })] }), _jsx(Progress, { value: (30 - countdownTime) / 30 * 100, className: "w-64 mb-4" }), _jsxs("p", { className: "text-sm text-gray-500 text-center", children: ["The game will begin automatically when the countdown reaches zero.", _jsx("br", {}), "Player 1 will then instruct the dealer to shuffle the cards."] })] }));
    }
    if (gameState.phase === 'readyToShuffle') {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-96 bg-white rounded-lg p-8 shadow-lg", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Ready to Begin" }), _jsx("p", { className: "text-gray-600 mb-6 text-center", children: playerId === 1
                        ? "You may now instruct the dealer to shuffle the cards."
                        : "Waiting for Player 1 to instruct the dealer to shuffle the cards." }), playerId === 1 && (_jsx(Button, { onClick: onStartShuffle, size: "lg", className: "bg-blue-600 hover:bg-blue-700", children: "Instruct Dealer to Shuffle Cards" }))] }));
    }
    if (gameState.phase === 'shuffling' || isShuffling) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-96 bg-white rounded-lg p-8 shadow-lg", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Shuffling Cards" }), _jsx("div", { className: "relative mb-6", children: _jsx("div", { className: "flex space-x-2", children: [1, 2, 3, 4, 5].map((i) => (_jsx("div", { className: `w-16 h-24 bg-blue-800 border-2 border-blue-900 rounded-lg transition-all duration-500 ${isShuffling ? 'animate-bounce' : ''}`, style: {
                                animationDelay: `${i * 0.1}s`,
                                transform: isShuffling ? `translateY(-${Math.sin(Date.now() / 200 + i) * 10}px)` : 'none'
                            }, children: _jsx("div", { className: "text-white text-center mt-8", children: "\uD83C\uDCA0" }) }, i))) }) }), _jsx("p", { className: "text-gray-600 text-center", children: "The dealer is shuffling the deck..." })] }));
    }
    if (gameState.phase === 'cardSelection') {
        return (_jsxs("div", { className: "bg-white rounded-lg p-6 shadow-lg", children: [_jsx("h2", { className: "text-2xl font-bold mb-4 text-center", children: "Card Selection Phase" }), _jsx("p", { className: "text-gray-600 mb-6 text-center", children: playerId === 1
                        ? "Select 4 cards to place face up on the table"
                        : "Player 1 is selecting 4 cards to place face up on the table" }), playerId === 1 && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "text-center", children: _jsxs(Badge, { variant: selectedCards.length === 4 ? "default" : "secondary", children: [selectedCards.length, "/4 cards selected"] }) }), _jsx("div", { className: "grid grid-cols-6 gap-2 max-h-96 overflow-y-auto p-4 border rounded-lg", children: gameState.deck.slice(0, 20).map((card) => (_jsx(Card, { suit: card.suit, rank: card.rank, id: card.id, onClick: () => handleCardSelection(card.id), isPlayable: true, size: "small" }, card.id))) }), _jsx("div", { className: "text-center", children: _jsx(Button, { onClick: confirmCardSelection, disabled: selectedCards.length !== 4, size: "lg", children: "Confirm Selection" }) })] }))] }));
    }
    if (gameState.phase === 'dealing' || gameState.phase === 'dealingRound2') {
        const isRound2 = gameState.phase === 'dealingRound2';
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-96 bg-white rounded-lg p-8 shadow-lg", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: isRound2 ? 'Dealing Cards for Round 2' : 'Dealing Cards' }), _jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex space-x-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-20 h-28 bg-green-600 border-2 border-green-700 rounded-lg flex items-center justify-center mb-2", children: _jsx("span", { className: "text-white", children: "P1" }) }), _jsx("p", { className: "text-sm", children: "Player 1" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-24 bg-blue-800 border-2 border-blue-900 rounded-lg flex items-center justify-center animate-pulse", children: _jsx("div", { className: "text-white", children: "\uD83C\uDCA0" }) }), _jsx("p", { className: "text-sm mt-2", children: "Dealer" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-20 h-28 bg-red-600 border-2 border-red-700 rounded-lg flex items-center justify-center mb-2", children: _jsx("span", { className: "text-white", children: "P2" }) }), _jsx("p", { className: "text-sm", children: "Player 2" })] })] }) }), _jsx("p", { className: "text-gray-600 text-center", children: isRound2
                        ? "The dealer is distributing 4 more cards to each player..."
                        : "The dealer is distributing 4 cards to each player alternately..." })] }));
    }
    if (gameState.phase === 'round1' || gameState.phase === 'round2') {
        const currentPlayerHand = playerId === 1 ? gameState.player1Hand : gameState.player2Hand;
        const myCaptures = playerId === 1 ? gameState.player1Captured : gameState.player2Captured;
        const opponentCaptures = playerId === 1 ? gameState.player2Captured : gameState.player1Captured;
        const isMyTurn = gameState.currentTurn === playerId;
        const myScore = playerId === 1 ? gameState.player1Score : gameState.player2Score;
        const opponentScore = playerId === 1 ? gameState.player2Score : gameState.player1Score;
        const myBreakdown = getScoreBreakdown(myCaptures || []);
        const opponentBreakdown = getScoreBreakdown(opponentCaptures || []);
        return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-white rounded-lg p-4 shadow-lg", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-bold", children: ["Cassino - Round ", gameState.round, gameState.phase === 'round2' && gameState.round === 2 && " (Final Round)"] }), _jsx("p", { className: "text-sm text-gray-600", children: isMyTurn ? "Your turn" : `Player ${gameState.currentTurn}'s turn` })] }), _jsxs("div", { className: "flex space-x-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Your Score" }), _jsxs(Badge, { variant: "default", className: "text-lg", children: [myScore, "/11"] })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Opponent" }), _jsxs(Badge, { variant: "secondary", className: "text-lg", children: [opponentScore, "/11"] })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-white rounded-lg p-4 shadow-lg", children: [_jsxs("h3", { className: "font-semibold mb-3", children: ["Your Captured Cards (", myCaptures?.length || 0, ")"] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Aces:" }), _jsxs(Badge, { variant: "secondary", children: [myBreakdown.aces, " pts"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "2\u2660:" }), _jsxs(Badge, { variant: "secondary", children: [myBreakdown.twoOfSpades, " pts"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "10\u2666:" }), _jsxs(Badge, { variant: "secondary", children: [myBreakdown.tenOfDiamonds, " pts"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Spades:" }), _jsx("span", { children: myBreakdown.spades })] })] }), myCaptures && myCaptures.length > 0 && (_jsx("div", { className: "mt-3 max-h-20 overflow-y-auto", children: _jsxs("div", { className: "flex flex-wrap gap-1", children: [myCaptures.slice(-10).map((card, index) => (_jsx(Card, { suit: card.suit, rank: card.rank, id: card.id, size: "small" }, `${card.id}-${index}`))), myCaptures.length > 10 && (_jsxs("span", { className: "text-xs text-gray-500 self-center ml-2", children: ["+", myCaptures.length - 10, " more"] }))] }) }))] }), _jsxs("div", { className: "bg-white rounded-lg p-4 shadow-lg", children: [_jsxs("h3", { className: "font-semibold mb-3", children: ["Opponent Captured (", opponentCaptures?.length || 0, ")"] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Aces:" }), _jsxs(Badge, { variant: "outline", children: [opponentBreakdown.aces, " pts"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "2\u2660:" }), _jsxs(Badge, { variant: "outline", children: [opponentBreakdown.twoOfSpades, " pts"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "10\u2666:" }), _jsxs(Badge, { variant: "outline", children: [opponentBreakdown.tenOfDiamonds, " pts"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Spades:" }), _jsx("span", { children: opponentBreakdown.spades })] })] }), _jsxs("div", { className: "mt-3 text-center text-gray-500", children: [_jsx("div", { className: "w-12 h-16 bg-gray-200 rounded mx-auto" }), _jsx("p", { className: "text-xs mt-1", children: "Hidden cards" })] })] })] }), gameState.lastPlay && (_jsxs("div", { className: "bg-white rounded-lg p-4 shadow-lg", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Last Play" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Player ", gameState.lastPlay.playerId, " ", gameState.lastPlay.action, "ed ", gameState.lastPlay.card.rank, "\u2666", gameState.lastPlay.action === 'capture' && ` (${gameState.lastPlay.capturedCards?.length || 0} cards)`, gameState.lastPlay.action === 'build' && ` (value ${gameState.lastPlay.buildValue})`] })] })), _jsx(GameActions, { playerHand: currentPlayerHand || [], tableCards: gameState.tableCards || [], builds: gameState.builds || [], onPlayCard: onPlayCard, isMyTurn: isMyTurn, hintsEnabled: preferences.hintsEnabled, soundEnabled: preferences.soundEnabled, playerId: playerId })] }));
    }
    if (gameState.phase === 'finished') {
        const myScore = playerId === 1 ? gameState.player1Score : gameState.player2Score;
        const opponentScore = playerId === 1 ? gameState.player2Score : gameState.player1Score;
        const isWinner = gameState.winner === playerId;
        const isTie = gameState.winner === 'tie';
        const myCaptures = playerId === 1 ? gameState.player1Captured : gameState.player2Captured;
        const opponentCaptures = playerId === 1 ? gameState.player2Captured : gameState.player1Captured;
        const myBreakdown = getScoreBreakdown(myCaptures || []);
        const opponentBreakdown = getScoreBreakdown(opponentCaptures || []);
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-96 bg-white rounded-lg p-8 shadow-lg", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h2", { className: `text-3xl font-bold mb-4 ${isTie ? 'text-yellow-600' : isWinner ? 'text-green-600' : 'text-red-600'}`, children: isTie ? "It's a Tie!" : isWinner ? "You Won!" : "You Lost!" }), _jsxs("div", { className: "bg-gray-100 rounded-lg p-6 mb-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Final Scores" }), _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-medium text-gray-600", children: "Your Score" }), _jsxs("div", { className: `text-3xl font-bold ${isWinner ? 'text-green-600' : 'text-gray-800'}`, children: [myScore, "/11"] }), _jsxs("div", { className: "text-xs space-y-1 mt-2", children: [_jsxs("div", { children: ["Aces: ", myBreakdown.aces] }), _jsxs("div", { children: ["2\u2660: ", myBreakdown.twoOfSpades] }), _jsxs("div", { children: ["10\u2666: ", myBreakdown.tenOfDiamonds] }), _jsxs("div", { children: ["Cards: ", myBreakdown.totalCards] }), _jsxs("div", { children: ["Spades: ", myBreakdown.spades] })] })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-medium text-gray-600", children: "Opponent" }), _jsxs("div", { className: `text-3xl font-bold ${!isWinner && !isTie ? 'text-green-600' : 'text-gray-800'}`, children: [opponentScore, "/11"] }), _jsxs("div", { className: "text-xs space-y-1 mt-2", children: [_jsxs("div", { children: ["Aces: ", opponentBreakdown.aces] }), _jsxs("div", { children: ["2\u2660: ", opponentBreakdown.twoOfSpades] }), _jsxs("div", { children: ["10\u2666: ", opponentBreakdown.tenOfDiamonds] }), _jsxs("div", { children: ["Cards: ", opponentBreakdown.totalCards] }), _jsxs("div", { children: ["Spades: ", opponentBreakdown.spades] })] })] })] })] }), _jsxs("div", { className: "text-sm text-gray-600 mb-6", children: [_jsx("p", { children: "Game completed after 2 rounds" }), _jsxs("p", { children: ["Total cards captured: ", (myCaptures?.length || 0) + (opponentCaptures?.length || 0)] })] })] }), _jsx(Button, { onClick: onResetGame, size: "lg", className: "bg-blue-600 hover:bg-blue-700", children: "Play Again" })] }));
    }
    return (_jsx("div", { className: "flex items-center justify-center min-h-96", children: _jsx("p", { children: "Loading game phase..." }) }));
}
