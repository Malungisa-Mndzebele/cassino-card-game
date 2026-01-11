#!/usr/bin/env python3
"""Script to add debug logging to GameBoard.svelte build validation."""

import re

# Read the file
with open('src/lib/components/GameBoard.svelte', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the possibleBuildValues reactive statement and function
old_pattern = r'\$: possibleBuildValues = calculatePossibleBuildValues\(\);'
new_reactive = '// Force reactivity by explicitly depending on tableCards and myHand\n\t$: possibleBuildValues = calculatePossibleBuildValues(tableCards, myHand);'

content = re.sub(old_pattern, new_reactive, content)

# Find and replace the calculatePossibleBuildValues function
old_func_pattern = r'function calculatePossibleBuildValues\(\): number\[\] \{\s+if \(!selectedCard \|\| selectedTableCards\.length === 0\) return \[\];\s+const handCardValue = getCardValue\(selectedCard\);\s+const validValues: number\[\] = \[\];\s+for \(let v = 2; v <= 14; v\+\+\) \{\s+if \(v === handCardValue\) continue;\s+const hasCapturingCard = myHand\.some\(c => c\.id !== selectedCard\?\.id && getCardValues\(c\)\.includes\(v\)\);\s+if \(hasCapturingCard && canMakeValue\(v\)\) validValues\.push\(v\);\s+\}\s+return validValues;\s+\}'

new_func = '''function calculatePossibleBuildValues(tableCardsRef: typeof tableCards, myHandRef: typeof myHand): number[] {
\t\tif (!selectedCard || selectedTableCards.length === 0) {
\t\t\tconsole.log('[Build Debug] Early return - selectedCard:', !!selectedCard, 'selectedTableCards:', selectedTableCards.length);
\t\t\treturn [];
\t\t}
\t\tconst handCardValue = getCardValue(selectedCard);
\t\tconst validValues: number[] = [];
\t\t
\t\t// Debug logging
\t\tconsole.log('[Build Debug] === Starting build value calculation ===');
\t\tconsole.log('[Build Debug] Selected hand card:', selectedCard.rank, selectedCard.suit, 'value:', handCardValue, 'id:', selectedCard.id);
\t\tconsole.log('[Build Debug] Selected table card IDs:', selectedTableCards);
\t\tconsole.log('[Build Debug] Available table cards:', tableCardsRef.map(c => `${c.rank}_${c.suit}(${c.id})`));
\t\tconsole.log('[Build Debug] My hand cards:', myHandRef.map(c => `${c.rank}_${c.suit}(${c.id})`));
\t\tconsole.log('[Build Debug] isPlayer1:', isPlayer1, 'playerId:', playerId);
\t\t
\t\t// Check if table cards can be found
\t\tconst foundTableCards = selectedTableCards.map(id => {
\t\t\tconst found = tableCardsRef.find(c => c.id === id);
\t\t\tconsole.log(`[Build Debug] Looking for table card id "${id}":`, found ? `Found ${found.rank}_${found.suit}` : 'NOT FOUND');
\t\t\treturn found;
\t\t}).filter(Boolean);
\t\tconsole.log('[Build Debug] Found table cards count:', foundTableCards.length, 'of', selectedTableCards.length);
\t\t
\t\tfor (let v = 2; v <= 14; v++) {
\t\t\tif (v === handCardValue) continue;
\t\t\tconst hasCapturingCard = myHandRef.some(c => {
\t\t\t\tif (c.id === selectedCard?.id) return false;
\t\t\t\tconst cardValues = getCardValues(c);
\t\t\t\tconst matches = cardValues.includes(v);
\t\t\t\tif (matches) {
\t\t\t\t\tconsole.log(`[Build Debug] Found capturing card for value ${v}:`, c.rank, c.suit, 'values:', cardValues);
\t\t\t\t}
\t\t\t\treturn matches;
\t\t\t});
\t\t\tconst canMake = canMakeValue(v, tableCardsRef);
\t\t\tif (v === 11) {
\t\t\t\tconsole.log(`[Build Debug] Checking value 11: hasCapturingCard=${hasCapturingCard}, canMake=${canMake}`);
\t\t\t}
\t\t\tif (hasCapturingCard && canMake) {
\t\t\t\tconsole.log(`[Build Debug] Valid build value: ${v}`);
\t\t\t\tvalidValues.push(v);
\t\t\t}
\t\t}
\t\t
\t\tconsole.log('[Build Debug] Final valid values:', validValues);
\t\treturn validValues;
\t}'''

content = re.sub(old_func_pattern, new_func, content, flags=re.DOTALL)

# Find and replace the canMakeValue function
old_canmake_pattern = r'function canMakeValue\(targetValue: number\): boolean \{\s+if \(!selectedCard\) return false;\s+const handValues = getCardValues\(selectedCard\);\s+const selectedCards = selectedTableCards\.map\(id => tableCards\.find\(c => c\.id === id\)\)\.filter\(Boolean\) as CardType\[\];\s+for \(const handValue of handValues\) \{\s+const neededValue = targetValue - handValue;\s+if \(neededValue <= 0\) continue;\s+if \(canSumTo\(selectedCards, neededValue\)\) return true;\s+\}\s+return false;\s+\}'

new_canmake = '''function canMakeValue(targetValue: number, tableCardsRef: typeof tableCards): boolean {
\t\tif (!selectedCard) {
\t\t\tconsole.log(`[canMakeValue Debug] No selected card`);
\t\t\treturn false;
\t\t}
\t\tconst handValues = getCardValues(selectedCard);
\t\tconst selectedCards = selectedTableCards.map(id => {
\t\t\tconst found = tableCardsRef.find(c => c.id === id);
\t\t\tif (!found) {
\t\t\t\tconsole.log(`[canMakeValue Debug] Table card not found for id: "${id}"`);
\t\t\t}
\t\t\treturn found;
\t\t}).filter(Boolean) as CardType[];
\t\t
\t\tconsole.log(`[canMakeValue Debug] Target: ${targetValue}, Hand values: ${handValues}`);
\t\tconsole.log(`[canMakeValue Debug] Selected cards (${selectedCards.length}):`, selectedCards.map(c => `${c.rank}(${getCardValue(c)})`));
\t\t
\t\tif (selectedCards.length === 0) {
\t\t\tconsole.log(`[canMakeValue Debug] No selected cards found - returning false`);
\t\t\treturn false;
\t\t}
\t\t
\t\tfor (const handValue of handValues) {
\t\t\tconst neededValue = targetValue - handValue;
\t\t\tconsole.log(`[canMakeValue Debug] Hand value: ${handValue}, Needed from table: ${neededValue}`);
\t\t\tif (neededValue <= 0) continue;
\t\t\tconst canSum = canSumTo(selectedCards, neededValue);
\t\t\tconsole.log(`[canMakeValue Debug] Can sum to ${neededValue}? ${canSum}`);
\t\t\tif (canSum) return true;
\t\t}
\t\treturn false;
\t}'''

content = re.sub(old_canmake_pattern, new_canmake, content, flags=re.DOTALL)

# Write the file
with open('src/lib/components/GameBoard.svelte', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! Check git diff to see changes.")
