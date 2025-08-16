import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from './Card';
export function PlayerHand({ cards, isOpponent, playerName, onPlayCard, canPlay = false }) {
    return (_jsxs("div", { className: "bg-white rounded-lg p-4 shadow-lg", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h3", { className: "font-semibold text-lg", children: playerName }), _jsxs("span", { className: "text-sm text-gray-600", children: [cards.length, " cards"] })] }), _jsx("div", { className: "flex flex-wrap gap-2 justify-center", children: cards.map((card, index) => (_jsx("div", { className: `
              ${isOpponent ? '' : 'hover:z-10'} 
              ${!isOpponent && index > 0 ? '-ml-4' : ''}
            `, style: { zIndex: cards.length - index }, children: _jsx(Card, { suit: card.suit, rank: card.rank, id: card.id, isHidden: isOpponent, onClick: !isOpponent && onPlayCard && canPlay
                            ? () => onPlayCard(card.id)
                            : undefined, isPlayable: !isOpponent && canPlay, size: isOpponent ? 'small' : 'medium' }) }, card.id))) }), !isOpponent && canPlay && (_jsx("div", { className: "mt-2 text-center text-sm text-green-600 font-medium", children: "Click a card to play it" })), !isOpponent && !canPlay && (_jsx("div", { className: "mt-2 text-center text-sm text-gray-500", children: "Wait for your turn" }))] }));
}
