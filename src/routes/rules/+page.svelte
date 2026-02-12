<script lang="ts">
  import { GameHeader } from '$components';
</script>

<svelte:head>
  <title>How to Play Casino Card Game - Rules & Strategy | KhasinoGaming</title>
  <meta name="description" content="Learn how to play the classic Casino card game. Complete rules, scoring system, strategy tips, and examples. Master capturing, building, and trailing to win!" />
  <meta name="keywords" content="casino card game rules, how to play casino, casino game strategy, card game tutorial, casino scoring, casino builds" />
  <link rel="canonical" href="https://khasinogaming.com/cassino/rules" />
</svelte:head>

<div class="rules-container">
  <GameHeader />
  
  <main class="rules-content">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Header -->
      <header class="text-center mb-12">
        <h1 class="text-5xl font-bold text-casino-gold mb-4">How to Play Casino</h1>
        <p class="text-xl text-gray-300">Master the classic card game with our complete guide</p>
      </header>

      <!-- Quick Start -->
      <section class="mb-12 bg-gray-800 rounded-lg p-6 border-2 border-casino-gold">
        <h2 class="text-3xl font-bold text-casino-gold mb-4">Quick Start</h2>
        <div class="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-4xl mb-2">👥</div>
            <h3 class="font-bold text-lg mb-2">2 Players</h3>
            <p class="text-gray-400">Head-to-head competition</p>
          </div>
          <div>
            <div class="text-4xl mb-2">🎴</div>
            <h3 class="font-bold text-lg mb-2">52 Cards</h3>
            <p class="text-gray-400">Standard deck</p>
          </div>
          <div>
            <div class="text-4xl mb-2">🎯</div>
            <h3 class="font-bold text-lg mb-2">First to 11</h3>
            <p class="text-gray-400">Points to win</p>
          </div>
        </div>
      </section>

      <!-- Game Overview -->
      <section class="mb-12">
        <h2 class="text-3xl font-bold text-casino-gold mb-4">Game Overview</h2>
        <p class="text-gray-300 mb-4 leading-relaxed">
          Casino is a classic fishing card game where players capture cards from the table by matching or building combinations. 
          The goal is to score points by capturing specific cards and having the most cards and spades at the end of the game.
        </p>
        <p class="text-gray-300 leading-relaxed">
          Each game consists of multiple rounds where players are dealt 4 cards at a time. Players take turns playing one card 
          from their hand to either capture cards from the table, create builds, or trail (leave a card on the table).
        </p>
      </section>

      <!-- Setup -->
      <section class="mb-12">
        <h2 class="text-3xl font-bold text-casino-gold mb-4">Setup</h2>
        <ol class="list-decimal list-inside space-y-3 text-gray-300">
          <li>Each player is dealt 4 cards</li>
          <li>4 cards are dealt face-up to the table</li>
          <li>The remaining deck is set aside for future deals</li>
          <li>Players alternate turns, starting with Player 1</li>
        </ol>
      </section>

      <!-- Actions -->
      <section class="mb-12">
        <h2 class="text-3xl font-bold text-casino-gold mb-4">Actions</h2>
        
        <div class="space-y-6">
          <!-- Capture -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-2xl font-bold text-casino-gold mb-3">🎯 Capture</h3>
            <p class="text-gray-300 mb-3">
              Play a card from your hand to capture one or more cards from the table that match its value.
            </p>
            <div class="bg-gray-900 rounded p-4 mb-3">
              <p class="font-bold text-casino-gold mb-2">Examples:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-300">
                <li>Play a 7 to capture a 7 from the table</li>
                <li>Play a 7 to capture a 3 and 4 from the table (3+4=7)</li>
                <li>Play a 10 to capture multiple cards that sum to 10</li>
              </ul>
            </div>
            <p class="text-sm text-gray-400">
              💡 Tip: You can capture multiple sets in one move if they all match your card's value
            </p>
          </div>

          <!-- Build -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-2xl font-bold text-casino-gold mb-3">🏗️ Build</h3>
            <p class="text-gray-300 mb-3">
              Combine cards on the table to create a build that you can capture on a future turn.
            </p>
            <div class="bg-gray-900 rounded p-4 mb-3">
              <p class="font-bold text-casino-gold mb-2">Example:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-300">
                <li>Play a 2 on a 5 to create a "build of 7"</li>
                <li>You must have a 7 in your hand to capture it later</li>
                <li>Opponent can capture your build if they have a 7</li>
              </ul>
            </div>
            <p class="text-sm text-gray-400">
              💡 Tip: Builds are risky but can help you capture multiple cards at once
            </p>
          </div>

          <!-- Trail -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-2xl font-bold text-casino-gold mb-3">🚶 Trail</h3>
            <p class="text-gray-300 mb-3">
              Play a card to the table without capturing anything. Use this when you can't or don't want to capture.
            </p>
            <div class="bg-gray-900 rounded p-4 mb-3">
              <p class="font-bold text-casino-gold mb-2">When to Trail:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-300">
                <li>No matching cards on the table</li>
                <li>Saving cards for future captures</li>
                <li>Strategic play to limit opponent's options</li>
              </ul>
            </div>
            <p class="text-sm text-gray-400">
              💡 Tip: Trailing face cards (J, Q, K) can only be captured by matching face cards
            </p>
          </div>
        </div>
      </section>

      <!-- Scoring -->
      <section class="mb-12">
        <h2 class="text-3xl font-bold text-casino-gold mb-4">Scoring</h2>
        <p class="text-gray-300 mb-4">Points are awarded at the end of each game:</p>
        
        <div class="grid md:grid-cols-2 gap-4">
          <div class="bg-gray-800 rounded-lg p-4 border-l-4 border-casino-gold">
            <h3 class="font-bold text-lg mb-2">🃏 Most Cards</h3>
            <p class="text-gray-300 mb-1">2 points</p>
            <p class="text-sm text-gray-400">Player with the most captured cards</p>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-4 border-l-4 border-casino-gold">
            <h3 class="font-bold text-lg mb-2">♠️ Most Spades</h3>
            <p class="text-gray-300 mb-1">2 points</p>
            <p class="text-sm text-gray-400">Player with the most spades</p>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-4 border-l-4 border-casino-gold">
            <h3 class="font-bold text-lg mb-2">🎴 Big Casino (10♦)</h3>
            <p class="text-gray-300 mb-1">2 points</p>
            <p class="text-sm text-gray-400">Capture the 10 of Diamonds</p>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-4 border-l-4 border-casino-gold">
            <h3 class="font-bold text-lg mb-2">🎯 Little Casino (2♠)</h3>
            <p class="text-gray-300 mb-1">1 point</p>
            <p class="text-sm text-gray-400">Capture the 2 of Spades</p>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-4 border-l-4 border-casino-gold md:col-span-2">
            <h3 class="font-bold text-lg mb-2">🌟 Aces</h3>
            <p class="text-gray-300 mb-1">1 point each</p>
            <p class="text-sm text-gray-400">Each Ace captured is worth 1 point (4 total possible)</p>
          </div>
        </div>

        <div class="mt-6 bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-500">
          <p class="text-blue-200">
            <strong>Maximum points per game:</strong> 11 points (2+2+2+1+4)
          </p>
        </div>
      </section>

      <!-- Strategy Tips -->
      <section class="mb-12">
        <h2 class="text-3xl font-bold text-casino-gold mb-4">Strategy Tips</h2>
        
        <div class="space-y-4">
          <div class="bg-gray-800 rounded-lg p-4">
            <h3 class="font-bold text-lg mb-2 text-casino-gold">🎯 Prioritize High-Value Cards</h3>
            <p class="text-gray-300">
              Focus on capturing the 10♦ (Big Casino) and 2♠ (Little Casino) as they're worth the most points.
            </p>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-4">
            <h3 class="font-bold text-lg mb-2 text-casino-gold">♠️ Count Spades</h3>
            <p class="text-gray-300">
              Keep track of spades captured. The 2-point bonus for most spades can swing the game.
            </p>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-4">
            <h3 class="font-bold text-lg mb-2 text-casino-gold">🏗️ Build Carefully</h3>
            <p class="text-gray-300">
              Only create builds when you're confident you can capture them. Your opponent can steal your builds!
            </p>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-4">
            <h3 class="font-bold text-lg mb-2 text-casino-gold">🃏 Control the Table</h3>
            <p class="text-gray-300">
              Try to capture multiple cards at once to reduce your opponent's options and work toward "most cards."
            </p>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-4">
            <h3 class="font-bold text-lg mb-2 text-casino-gold">🎴 Save Face Cards</h3>
            <p class="text-gray-300">
              Face cards (J, Q, K) can only capture matching face cards. Use them strategically or trail them early.
            </p>
          </div>
        </div>
      </section>

      <!-- Game Flow -->
      <section class="mb-12">
        <h2 class="text-3xl font-bold text-casino-gold mb-4">Game Flow</h2>
        
        <div class="space-y-4">
          <div class="flex items-start gap-4">
            <div class="bg-casino-gold text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
            <div>
              <h3 class="font-bold mb-1">Initial Deal</h3>
              <p class="text-gray-300">Each player receives 4 cards, 4 cards dealt to table</p>
            </div>
          </div>
          
          <div class="flex items-start gap-4">
            <div class="bg-casino-gold text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
            <div>
              <h3 class="font-bold mb-1">Play Rounds</h3>
              <p class="text-gray-300">Players alternate turns playing one card at a time</p>
            </div>
          </div>
          
          <div class="flex items-start gap-4">
            <div class="bg-casino-gold text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
            <div>
              <h3 class="font-bold mb-1">Redeal</h3>
              <p class="text-gray-300">When both players run out of cards, deal 4 more cards to each (no new table cards)</p>
            </div>
          </div>
          
          <div class="flex items-start gap-4">
            <div class="bg-casino-gold text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">4</div>
            <div>
              <h3 class="font-bold mb-1">End of Deck</h3>
              <p class="text-gray-300">When the deck is empty and all cards are played, score the game</p>
            </div>
          </div>
          
          <div class="flex items-start gap-4">
            <div class="bg-casino-gold text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">5</div>
            <div>
              <h3 class="font-bold mb-1">Winner</h3>
              <p class="text-gray-300">First player to reach 11 points wins the match!</p>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="mb-12">
        <h2 class="text-3xl font-bold text-casino-gold mb-4">Frequently Asked Questions</h2>
        
        <div class="space-y-4">
          <details class="bg-gray-800 rounded-lg p-4">
            <summary class="font-bold cursor-pointer text-casino-gold">Can I capture multiple sets with one card?</summary>
            <p class="text-gray-300 mt-2">
              Yes! If you play a 7, you can capture a 7, a 3+4, and a 2+5 all at once if they're all on the table.
            </p>
          </details>
          
          <details class="bg-gray-800 rounded-lg p-4">
            <summary class="font-bold cursor-pointer text-casino-gold">What happens to cards left on the table?</summary>
            <p class="text-gray-300 mt-2">
              At the end of the game, any remaining table cards go to the player who made the last capture.
            </p>
          </details>
          
          <details class="bg-gray-800 rounded-lg p-4">
            <summary class="font-bold cursor-pointer text-casino-gold">Can I capture my own build?</summary>
            <p class="text-gray-300 mt-2">
              Yes, but you must capture it on your next turn or your opponent can steal it!
            </p>
          </details>
          
          <details class="bg-gray-800 rounded-lg p-4">
            <summary class="font-bold cursor-pointer text-casino-gold">What if there's a tie in scoring?</summary>
            <p class="text-gray-300 mt-2">
              If both players have the same number of cards or spades, neither player gets those points.
            </p>
          </details>
          
          <details class="bg-gray-800 rounded-lg p-4">
            <summary class="font-bold cursor-pointer text-casino-gold">Can face cards be used in builds?</summary>
            <p class="text-gray-300 mt-2">
              No, face cards (J, Q, K) can only capture matching face cards. They cannot be used in numerical builds.
            </p>
          </details>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="text-center bg-gradient-to-r from-casino-gold to-yellow-600 rounded-lg p-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Ready to Play?</h2>
        <p class="text-gray-900 mb-6">Put your skills to the test in a real-time multiplayer match!</p>
        <a 
          href="/cassino/" 
          class="inline-block bg-gray-900 text-casino-gold px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors"
        >
          Start Playing Now
        </a>
      </section>
    </div>
  </main>
</div>

<style>
  .rules-container {
    min-height: 100vh;
    background: var(--bg-primary);
  }

  .rules-content {
    color: white;
  }

  details summary {
    list-style: none;
  }

  details summary::-webkit-details-marker {
    display: none;
  }

  details[open] summary {
    margin-bottom: 0.5rem;
  }

  details summary:hover {
    color: #fbbf24;
  }
</style>
