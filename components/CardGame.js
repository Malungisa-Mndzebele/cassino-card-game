import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
export function CardGame() {
    const [gameState, setGameState] = useState(null);
    const [playerId, setPlayerId] = useState('');
    const [gameId, setGameId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        // Generate unique player ID
        const id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setPlayerId(id);
    }, []);
    useEffect(() => {
        if (gameId) {
            const interval = setInterval(pollGameState, 2000);
            return () => clearInterval(interval);
        }
    }, [gameId, playerId]);
    const pollGameState = async () => {
        if (!gameId || !playerId)
            return;
        // TODO: Replace with Convex query or local mock
        setTimeout(() => {
            setGameState((prev) => prev || { id: gameId, players: [playerId], playerHands: { [playerId]: [] }, currentTurn: 0, currentTrick: [], scores: { [playerId]: 0 }, status: 'waiting' });
        }, 200);
    };
    const joinGame = async () => {
        if (!playerId || isJoining)
            return;
        setIsJoining(true);
        setError('');
        // TODO: Replace with Convex mutation
        setTimeout(() => {
            setGameId('mock-game-id');
            setGameState({ id: 'mock-game-id', players: [playerId], playerHands: { [playerId]: [] }, currentTurn: 0, currentTrick: [], scores: { [playerId]: 0 }, status: 'waiting' });
            setIsJoining(false);
        }, 200);
    };
    const playCard = async (cardId) => {
        if (!gameId || !playerId || !gameState)
            return;
        // TODO: Replace with Convex mutation
        setGameState((prev) => ({ ...prev, currentTrick: [...(prev?.currentTrick || []), { id: cardId, suit: 'hearts', rank: 'A' }] }));
        setError('');
    };
    const resetGame = async () => {
        if (!gameId)
            return;
        // TODO: Replace with Convex mutation
        setGameState(null);
        setError('');
    };
    const getSuitSymbol = (suit) => {
        switch (suit) {
            case 'hearts': return '♥';
            case 'diamonds': return '♦';
            case 'clubs': return '♣';
            case 'spades': return '♠';
            default: return suit;
        }
    };
    const getSuitColor = (suit) => {
        return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black';
    };
    if (!gameState) {
        return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-screen p-4", children: _jsx(Card, { className: "p-8 w-full max-w-md", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Card Game" }), _jsx("p", { className: "text-gray-600", children: "Join a game to play against another player online!" }), error && (_jsx("p", { className: "text-red-500 text-sm", children: error })), _jsx(Button, { onClick: joinGame, disabled: isJoining, className: "w-full", children: isJoining ? 'Joining...' : 'Join Game' })] }) }) }));
    }
    if (gameState.status === 'waiting') {
        return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-screen p-4", children: _jsx(Card, { className: "p-8 w-full max-w-md", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Waiting for Player" }), _jsxs("p", { className: "text-gray-600", children: ["Game ID: ", gameId] }), _jsx("p", { className: "text-sm text-gray-500", children: "Share this URL with another player to start the game." }), _jsx("div", { className: "animate-pulse", children: _jsx("div", { className: "h-2 bg-gray-200 rounded" }) })] }) }) }));
    }
    const playerHand = gameState.playerHands[playerId] || [];
    const currentPlayerIndex = gameState.currentTurn % gameState.players.length;
    const currentPlayerId = gameState.players[currentPlayerIndex];
    const isMyTurn = playerId === currentPlayerId;
    const opponentId = gameState.players.find(p => p !== playerId) || '';
    const opponentHandSize = gameState.playerHands[opponentId]?.length || 0;
    return (_jsx("div", { className: "min-h-screen bg-green-100 p-4", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("div", { className: "bg-white rounded-lg p-4 mb-4 shadow", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Card Game" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Game ID: ", gameId] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Your Score" }), _jsx(Badge, { variant: "secondary", className: "text-lg", children: gameState.scores[playerId] || 0 })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Opponent Score" }), _jsx(Badge, { variant: "secondary", className: "text-lg", children: gameState.scores[opponentId] || 0 })] })] })] }) }), _jsx("div", { className: "bg-white rounded-lg p-4 mb-4 shadow", children: gameState.status === 'finished' ? (_jsxs("div", { className: "text-center space-y-4", children: [_jsx("h2", { className: "text-xl font-bold text-green-600", children: "Game Over!" }), _jsx("p", { className: "text-lg", children: gameState.winner === playerId
                                    ? 'You Won!'
                                    : gameState.winner === 'tie'
                                        ? "It's a Tie!"
                                        : 'You Lost!' }), _jsx(Button, { onClick: resetGame, children: "Play Again" })] })) : (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-lg", children: isMyTurn ? "Your Turn" : "Opponent's Turn" }), gameState.currentTrick.length > 0 && (_jsxs("p", { className: "text-sm text-gray-600 mt-2", children: ["Cards in play: ", gameState.currentTrick.length, "/2"] }))] })) }), gameState.currentTrick.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg p-4 mb-4 shadow", children: [_jsx("h3", { className: "text-lg font-semibold mb-2 text-center", children: "Current Trick" }), _jsx("div", { className: "flex justify-center space-x-4", children: gameState.currentTrick.map((card, index) => (_jsx("div", { className: "bg-white border-2 border-gray-300 rounded-lg p-3 shadow-sm", children: _jsxs("div", { className: `text-center ${getSuitColor(card.suit)}`, children: [_jsx("div", { className: "text-lg font-bold", children: card.rank }), _jsx("div", { className: "text-2xl", children: getSuitSymbol(card.suit) })] }) }, `${card.id}-${index}`))) })] })), _jsx("div", { className: "bg-white rounded-lg p-4 mb-4 shadow", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Opponent Cards" }), _jsxs("div", { className: "flex justify-center mt-2", children: [Array.from({ length: Math.min(opponentHandSize, 10) }).map((_, index) => (_jsx("div", { className: "w-8 h-12 bg-blue-600 border border-blue-700 rounded-sm -ml-2 first:ml-0" }, index))), opponentHandSize > 10 && (_jsxs("span", { className: "ml-2 text-sm text-gray-600", children: ["+", opponentHandSize - 10, " more"] }))] })] }) }), _jsx(Separator, { className: "my-4" }), _jsxs("div", { className: "bg-white rounded-lg p-4 shadow", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 text-center", children: ["Your Cards (", playerHand.length, ")"] }), error && (_jsx("p", { className: "text-red-500 text-sm text-center mb-4", children: error })), _jsx("div", { className: "flex flex-wrap justify-center gap-2", children: playerHand.map((card) => (_jsx("button", { onClick: () => playCard(card.id), disabled: !isMyTurn || gameState.status !== 'playing', className: `
                  bg-white border-2 rounded-lg p-3 shadow-sm transition-all
                  ${isMyTurn && gameState.status === 'playing'
                                    ? 'border-blue-300 hover:border-blue-500 hover:shadow-md cursor-pointer'
                                    : 'border-gray-300 cursor-not-allowed opacity-50'}
                `, children: _jsxs("div", { className: `text-center ${getSuitColor(card.suit)}`, children: [_jsx("div", { className: "text-lg font-bold", children: card.rank }), _jsx("div", { className: "text-2xl", children: getSuitSymbol(card.suit) })] }) }, card.id))) }), playerHand.length === 0 && gameState.status === 'playing' && (_jsx("p", { className: "text-center text-gray-500", children: "No cards left" }))] })] }) }));
}
