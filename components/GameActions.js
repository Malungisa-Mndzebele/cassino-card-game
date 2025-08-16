import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { GameHints } from './GameHints';
import { soundManager } from './SoundSystem';
function getCardValue(rank) {
    if (rank === 'A')
        return 14;
    if (rank === 'K')
        return 13;
    if (rank === 'Q')
        return 12;
    if (rank === 'J')
        return 11;
    return parseInt(rank);
}
export function GameActions({ playerHand, tableCards, builds, onPlayCard, isMyTurn, hintsEnabled = false, soundEnabled = true, playerId }) {
    const [selectedHandCard, setSelectedHandCard] = useState('');
    const [selectedTableCards, setSelectedTableCards] = useState([]);
    const [selectedBuilds, setSelectedBuilds] = useState([]);
    const [action, setAction] = useState('trail');
    const [buildValue, setBuildValue] = useState(0);
    const [highlightedCards, setHighlightedCards] = useState([]);
    const selectedCard = playerHand.find(card => card.id === selectedHandCard);
    const selectedCardValue = selectedCard ? getCardValue(selectedCard.rank) : 0;
    // Update highlights when hand card selection changes
    useEffect(() => {
        if (!hintsEnabled || !selectedCard) {
            setHighlightedCards([]);
            return;
        }
        const highlights = [];
        const handValue = getCardValue(selectedCard.rank);
        // Highlight direct capture opportunities
        for (const tableCard of tableCards) {
            if (getCardValue(tableCard.rank) === handValue) {
                highlights.push(tableCard.id);
            }
        }
        // Highlight builds that can be captured
        for (const build of builds) {
            if (build.value === handValue) {
                highlights.push(build.id);
            }
        }
        setHighlightedCards(highlights);
    }, [selectedCard, tableCards, builds, hintsEnabled]);
    const calculateSelectedValue = () => {
        let total = 0;
        // Add values from selected table cards
        for (const cardId of selectedTableCards) {
            const card = tableCards.find(c => c.id === cardId);
            if (card) {
                total += getCardValue(card.rank);
            }
        }
        // Add values from selected builds
        for (const buildId of selectedBuilds) {
            const build = builds.find(b => b.id === buildId);
            if (build) {
                total += build.value;
            }
        }
        return total;
    };
    const canCapture = () => {
        if (!selectedCard)
            return false;
        const total = calculateSelectedValue();
        return total === selectedCardValue && (selectedTableCards.length > 0 || selectedBuilds.length > 0);
    };
    const getCapturingCards = () => {
        if (!buildValue)
            return [];
        return playerHand.filter(card => getCardValue(card.rank) === buildValue && card.id !== selectedHandCard);
    };
    const canBuild = () => {
        if (!selectedCard || buildValue < 2 || buildValue > 14)
            return false;
        const total = selectedCardValue + calculateSelectedValue();
        const capturingCards = getCapturingCards();
        return total === buildValue && capturingCards.length > 0 && selectedTableCards.length > 0;
    };
    const handleTableCardClick = (cardId) => {
        if (selectedTableCards.includes(cardId)) {
            setSelectedTableCards(selectedTableCards.filter(id => id !== cardId));
        }
        else {
            setSelectedTableCards([...selectedTableCards, cardId]);
        }
    };
    const handleBuildClick = (buildId) => {
        if (selectedBuilds.includes(buildId)) {
            setSelectedBuilds(selectedBuilds.filter(id => id !== buildId));
        }
        else {
            setSelectedBuilds([...selectedBuilds, buildId]);
        }
    };
    const handlePlay = async () => {
        if (!selectedCard)
            return;
        try {
            if (action === 'capture' && canCapture()) {
                const targetCards = [...selectedTableCards];
                // Add cards from builds to targets
                for (const buildId of selectedBuilds) {
                    const build = builds.find(b => b.id === buildId);
                    if (build) {
                        targetCards.push(...build.cards.map(c => c.id));
                    }
                }
                if (soundEnabled) {
                    await soundManager.playSound('capture');
                }
                onPlayCard(selectedHandCard, 'capture', targetCards);
            }
            else if (action === 'build' && canBuild()) {
                if (soundEnabled) {
                    await soundManager.playSound('build');
                }
                onPlayCard(selectedHandCard, 'build', selectedTableCards, buildValue);
            }
            else {
                if (soundEnabled) {
                    await soundManager.playSound('trail');
                }
                onPlayCard(selectedHandCard, 'trail');
            }
            // Reset selections
            setSelectedHandCard('');
            setSelectedTableCards([]);
            setSelectedBuilds([]);
            setBuildValue(0);
            setAction('trail');
        }
        catch (error) {
            console.error('Error playing card:', error);
            if (soundEnabled) {
                await soundManager.playSound('error');
            }
        }
    };
    if (!isMyTurn) {
        return (_jsx("div", { className: "bg-white rounded-lg p-4 shadow-lg", children: _jsx("div", { className: "text-center text-gray-500", children: _jsx("p", { children: "Waiting for opponent's turn..." }) }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [hintsEnabled && (_jsx(GameHints, { playerHand: playerHand, tableCards: tableCards, builds: builds, enabled: hintsEnabled, playerId: playerId })), _jsxs("div", { className: "bg-white rounded-lg p-4 shadow-lg", children: [_jsx("h3", { className: "font-medium mb-3", children: "Your Hand - Select a card to play" }), _jsx("div", { className: "flex gap-2 justify-center", children: playerHand.map((card) => {
                            const isSelected = selectedHandCard === card.id;
                            const isCapturingCard = action === 'build' && buildValue > 0 &&
                                getCardValue(card.rank) === buildValue && card.id !== selectedHandCard;
                            return (_jsxs("div", { className: `cursor-pointer transition-all ${isSelected ? 'transform -translate-y-2 ring-2 ring-blue-500' : ''} ${isCapturingCard ? 'ring-2 ring-green-400 animate-pulse' : ''}`, onClick: () => setSelectedHandCard(card.id), children: [_jsx(Card, { suit: card.suit, rank: card.rank, id: card.id, isPlayable: true, size: "medium" }), isCapturingCard && (_jsx("p", { className: "text-xs text-center mt-1 text-green-600 font-medium", children: "Can capture build" }))] }, card.id));
                        }) }), selectedCard && (_jsx("div", { className: "mt-2 text-center", children: _jsxs(Badge, { variant: "default", children: ["Selected: ", selectedCard.rank, " of ", selectedCard.suit, " (Value: ", selectedCardValue, ")"] }) }))] }), selectedCard && (_jsxs("div", { className: "bg-white rounded-lg p-4 shadow-lg", children: [_jsx("h3", { className: "font-medium mb-3", children: "Choose Action" }), _jsxs("div", { className: "flex gap-2 mb-4", children: [_jsx(Button, { variant: action === 'trail' ? 'default' : 'outline', onClick: () => setAction('trail'), size: "sm", children: "Trail (Play to table)" }), _jsxs(Button, { variant: action === 'capture' ? 'default' : 'outline', onClick: () => setAction('capture'), size: "sm", disabled: !canCapture() && selectedTableCards.length === 0 && selectedBuilds.length === 0, children: ["Capture ", canCapture() && '✓'] }), _jsx(Button, { variant: action === 'build' ? 'default' : 'outline', onClick: () => setAction('build'), size: "sm", children: "Build" })] }), action === 'build' && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Build Value (2-14):" }), _jsx(Input, { type: "number", min: "2", max: "14", value: buildValue || '', onChange: (e) => setBuildValue(parseInt(e.target.value) || 0), className: "w-20" }), _jsxs("p", { className: "text-xs text-gray-600 mt-1", children: ["Current total: ", selectedCardValue + calculateSelectedValue(), buildValue > 0 && (_jsxs("span", { className: buildValue === selectedCardValue + calculateSelectedValue() ? 'text-green-600' : 'text-red-600', children: [' ', "(", buildValue === selectedCardValue + calculateSelectedValue() ? 'Perfect!' : 'Needs adjustment', ")"] }))] }), buildValue > 0 && (_jsx("div", { className: "mt-2", children: getCapturingCards().length > 0 ? (_jsxs("div", { className: "text-xs text-green-600", children: ["\u2713 You can capture this build with: ", getCapturingCards().map(c => c.rank).join(', ')] })) : (_jsxs("div", { className: "text-xs text-red-600", children: ["\u2717 You need a ", buildValue, "-value card in hand to capture this build", _jsx("br", {}), "Available values: ", playerHand
                                            .filter(c => c.id !== selectedHandCard)
                                            .map(c => getCardValue(c.rank))
                                            .sort((a, b) => a - b)
                                            .join(', ')] })) })), !canBuild() && buildValue > 0 && buildValue === selectedCardValue + calculateSelectedValue() && getCapturingCards().length === 0 && (_jsxs("div", { className: "mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700", children: [_jsx("strong", { children: "Rule Reminder:" }), " You can only build values that you have cards to capture with in your hand."] }))] })), (action === 'capture' || action === 'build') && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: action === 'capture'
                                    ? `Select cards that sum to ${selectedCardValue}:`
                                    : `Select cards to build with (need total ${buildValue}):` }), _jsxs("p", { className: "text-xs text-gray-500 mb-2", children: ["Currently selected value: ", calculateSelectedValue(), action === 'capture' && calculateSelectedValue() > 0 && (_jsxs("span", { className: calculateSelectedValue() === selectedCardValue ? 'text-green-600' : 'text-orange-600', children: [' ', "(", calculateSelectedValue() === selectedCardValue ? 'Perfect match!' : 'Keep adjusting', ")"] }))] })] })), _jsx("div", { className: "flex justify-center", children: _jsx(Button, { onClick: handlePlay, disabled: action === 'capture' ? !canCapture() :
                                action === 'build' ? !canBuild() :
                                    false, size: "lg", className: action === 'capture' && canCapture() ? 'bg-green-600 hover:bg-green-700' :
                                action === 'build' && canBuild() ? 'bg-blue-600 hover:bg-blue-700' :
                                    '', children: action === 'trail' ? 'Trail Card' :
                                action === 'capture' ? (canCapture() ? 'Capture Cards ✓' : 'Cannot Capture') :
                                    (canBuild() ? 'Create Build ✓' :
                                        buildValue > 0 && getCapturingCards().length === 0 ? 'Need Capturing Card' :
                                            'Create Build') }) }), action === 'build' && !canBuild() && buildValue > 0 && selectedTableCards.length > 0 && (_jsx("div", { className: "mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "text-yellow-600 mt-1", children: "\u26A0\uFE0F" }), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-medium text-yellow-800", children: "Build Rule Violation" }), _jsxs("p", { className: "text-yellow-700 mt-1", children: ["You can only create builds that you have cards to capture with.", getCapturingCards().length === 0 && (_jsxs("span", { children: [" You need a ", buildValue, "-value card in your hand to build ", buildValue, "."] }))] })] })] }) }))] })), _jsxs("div", { className: "bg-white rounded-lg p-4 shadow-lg", children: [_jsx("h3", { className: "font-medium mb-3", children: "Table Cards" }), tableCards.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-2 justify-center", children: tableCards.map((card) => (_jsxs("div", { className: `cursor-pointer transition-all ${selectedTableCards.includes(card.id) ? 'ring-2 ring-blue-500 transform scale-105' : ''} ${hintsEnabled && highlightedCards.includes(card.id) ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`, onClick: () => (action === 'capture' || action === 'build') && handleTableCardClick(card.id), children: [_jsx(Card, { suit: card.suit, rank: card.rank, id: card.id, size: "small" }), _jsxs("p", { className: "text-xs text-center mt-1", children: ["Val: ", getCardValue(card.rank)] })] }, card.id))) })) : (_jsx("p", { className: "text-center text-gray-500", children: "No cards on table" }))] }), builds.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg p-4 shadow-lg", children: [_jsx("h3", { className: "font-medium mb-3", children: "Current Builds" }), _jsx("div", { className: "space-y-2", children: builds.map((build) => (_jsxs("div", { className: `p-2 border rounded-lg cursor-pointer transition-all ${selectedBuilds.includes(build.id) ? 'ring-2 ring-blue-500 transform scale-102' : ''} ${hintsEnabled && highlightedCards.includes(build.id) ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`, onClick: () => action === 'capture' && handleBuildClick(build.id), children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs(Badge, { variant: "secondary", children: ["Build Value: ", build.value] }), _jsxs(Badge, { variant: build.owner === playerId ? "default" : "outline", children: ["Player ", build.owner, " ", build.owner === playerId && '(You)'] })] }), _jsx("div", { className: "flex gap-1", children: build.cards.map((card) => (_jsx(Card, { suit: card.suit, rank: card.rank, id: card.id, size: "small" }, card.id))) })] }, build.id))) })] }))] }));
}
