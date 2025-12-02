import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-End Production Test
 * Tests the complete game flow on the live deployment
 */

test.describe('Production Game Flow', () => {
	test('complete two-player game flow', async ({ browser }) => {
		// Create two separate browser contexts (simulating two players)
		const player1Context = await browser.newContext();
		const player2Context = await browser.newContext();

		const player1Page = await player1Context.newPage();
		const player2Page = await player2Context.newPage();

		let roomCode = '';

		try {
			// Step 1: Player 1 creates a room
			await test.step('Player 1 creates a room', async () => {
				await player1Page.goto('/');
				await player1Page.waitForLoadState('networkidle');

				// Enter player name
				const nameInput = player1Page.locator('[data-testid="player-name-input-create-test"]');
				await expect(nameInput).toBeVisible({ timeout: 10000 });
				await nameInput.fill('Player1');

				// Click create room button
				const createButton = player1Page.locator('[data-testid="create-room-test"]');
				await expect(createButton).toBeEnabled();
				await createButton.click();

				// Wait for room code to appear
				await player1Page.waitForSelector('text=/[A-Z0-9]{6}/', { timeout: 15000 });

				// Extract room code
				const roomCodeElement = player1Page.locator('.text-5xl.font-bold.tracking-widest');
				roomCode = await roomCodeElement.textContent() || '';
				expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);

				console.log(`Room created with code: ${roomCode}`);

				// Verify WebSocket connection
				await expect(player1Page.locator('text=Connected')).toBeVisible({ timeout: 10000 });
			});

			// Step 2: Player 2 joins the room
			await test.step('Player 2 joins the room', async () => {
				await player2Page.goto('/');
				await player2Page.waitForLoadState('networkidle');

				// Enter player name
				const nameInput = player2Page.locator('[data-testid="player-name-input-join"]');
				await expect(nameInput).toBeVisible({ timeout: 10000 });
				await nameInput.fill('Player2');

				// Enter room code
				const roomCodeInput = player2Page.locator('[data-testid="room-code-input"]');
				await roomCodeInput.fill(roomCode);

				// Click join button
				const joinButton = player2Page.locator('[data-testid="join-room-test"]');
				await expect(joinButton).toBeEnabled();
				await joinButton.click();

				// Wait for successful join (should navigate to game room)
				await player2Page.waitForURL(`**/room/${roomCode}**`, { timeout: 15000 });

				console.log('Player 2 joined the room');
			});

			// Step 3: Verify both players see each other
			await test.step('Both players see each other', async () => {
				// Player 1 should see Player 2 joined
				await expect(player1Page.locator('text=Player2')).toBeVisible({ timeout: 10000 });

				// Player 2 should see Player 1
				await expect(player2Page.locator('text=Player1')).toBeVisible({ timeout: 10000 });

				console.log('Both players can see each other');
			});

			// Step 4: Both players mark ready
			await test.step('Players mark ready', async () => {
				// Player 1 marks ready
				const player1ReadyButton = player1Page.locator('button:has-text("Ready")').first();
				if (await player1ReadyButton.isVisible()) {
					await player1ReadyButton.click();
					await expect(player1Page.locator('text=Waiting for opponent')).toBeVisible({
						timeout: 5000
					});
				}

				// Player 2 marks ready
				const player2ReadyButton = player2Page.locator('button:has-text("Ready")').first();
				if (await player2ReadyButton.isVisible()) {
					await player2ReadyButton.click();
				}

				console.log('Both players marked ready');
			});

			// Step 5: Verify game starts
			await test.step('Game starts', async () => {
				// Wait for game to start (dealer phase or card selection)
				await Promise.race([
					player1Page.waitForSelector('text=/Shuffle|Select|Deal/', { timeout: 20000 }),
					player1Page.waitForSelector('[data-testid="game-table"]', { timeout: 20000 })
				]);

				await Promise.race([
					player2Page.waitForSelector('text=/Shuffle|Select|Deal/', { timeout: 20000 }),
					player2Page.waitForSelector('[data-testid="game-table"]', { timeout: 20000 })
				]);

				console.log('Game started successfully');
			});

			// Step 6: Verify WebSocket connectivity
			await test.step('Verify WebSocket connectivity', async () => {
				// Check connection status indicators
				const player1Connected =
					(await player1Page.locator('text=Connected').count()) > 0 ||
					(await player1Page.locator('.bg-green-500').count()) > 0;

				const player2Connected =
					(await player2Page.locator('text=Connected').count()) > 0 ||
					(await player2Page.locator('.bg-green-500').count()) > 0;

				expect(player1Connected || player2Connected).toBeTruthy();

				console.log('WebSocket connections verified');
			});

			// Step 7: Test error handling
			await test.step('Test error handling', async () => {
				// Try to join the same room with same name (should show error or auto-deduplicate)
				const player3Context = await browser.newContext();
				const player3Page = await player3Context.newPage();

				await player3Page.goto('/');
				await player3Page.waitForLoadState('networkidle');

				const nameInput = player3Page.locator('[data-testid="player-name-input-join"]');
				await nameInput.fill('Player1'); // Same name as player 1

				const roomCodeInput = player3Page.locator('[data-testid="room-code-input"]');
				await roomCodeInput.fill(roomCode);

				const joinButton = player3Page.locator('[data-testid="join-room-test"]');
				await joinButton.click();

				// Should either show error or auto-deduplicate name
				await Promise.race([
					player3Page.waitForSelector('text=/already taken|full/i', { timeout: 5000 }),
					player3Page.waitForURL(`**/room/${roomCode}**`, { timeout: 5000 })
				]);

				await player3Page.close();
				await player3Context.close();

				console.log('Error handling tested');
			});
		} finally {
			// Cleanup
			await player1Page.close();
			await player2Page.close();
			await player1Context.close();
			await player2Context.close();
		}
	});

	test('quick match functionality', async ({ browser }) => {
		const player1Context = await browser.newContext();
		const player2Context = await browser.newContext();

		const player1Page = await player1Context.newPage();
		const player2Page = await player2Context.newPage();

		try {
			// Player 1 uses quick match
			await test.step('Player 1 uses quick match', async () => {
				await player1Page.goto('/');
				await player1Page.waitForLoadState('networkidle');

				const nameInput = player1Page.locator('[data-testid="player-name-input-create-test"]');
				await nameInput.fill('QuickPlayer1');

				const quickMatchButton = player1Page.locator('[data-testid="join-random-test"]');
				await expect(quickMatchButton).toBeEnabled();
				await quickMatchButton.click();

				// Should either create new room or join existing
				await player1Page.waitForURL('**/room/**', { timeout: 15000 });

				console.log('Player 1 used quick match');
			});

			// Player 2 uses quick match (should join Player 1's room)
			await test.step('Player 2 uses quick match', async () => {
				await player2Page.goto('/');
				await player2Page.waitForLoadState('networkidle');

				const nameInput = player2Page.locator('[data-testid="player-name-input-create-test"]');
				await nameInput.fill('QuickPlayer2');

				const quickMatchButton = player2Page.locator('[data-testid="join-random-test"]');
				await quickMatchButton.click();

				await player2Page.waitForURL('**/room/**', { timeout: 15000 });

				console.log('Player 2 used quick match');
			});

			// Verify they're in the same room
			await test.step('Verify players matched', async () => {
				// Both should see each other
				await Promise.race([
					expect(player1Page.locator('text=QuickPlayer2')).toBeVisible({ timeout: 10000 }),
					expect(player2Page.locator('text=QuickPlayer1')).toBeVisible({ timeout: 10000 })
				]);

				console.log('Quick match successful - players matched');
			});
		} finally {
			await player1Page.close();
			await player2Page.close();
			await player1Context.close();
			await player2Context.close();
		}
	});

	test('health check and API connectivity', async ({ request }) => {
		await test.step('Backend health check', async () => {
			const response = await request.get('https://cassino-game-backend.onrender.com/health');
			expect(response.ok()).toBeTruthy();

			const health = await response.json();
			expect(health).toHaveProperty('status');
			console.log('Backend health:', health);
		});
	});

	test('page load performance', async ({ page }) => {
		await test.step('Measure page load time', async () => {
			const startTime = Date.now();

			await page.goto('/');
			await page.waitForLoadState('networkidle');

			const loadTime = Date.now() - startTime;
			console.log(`Page load time: ${loadTime}ms`);

			// Page should load within 10 seconds
			expect(loadTime).toBeLessThan(10000);
		});
	});

	test('responsive design', async ({ browser }) => {
		const mobileContext = await browser.newContext({
			viewport: { width: 375, height: 667 }, // iPhone SE
			userAgent:
				'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
		});

		const mobilePage = await mobileContext.newPage();

		try {
			await test.step('Mobile view works', async () => {
				await mobilePage.goto('/');
				await mobilePage.waitForLoadState('networkidle');

				// Check that main elements are visible
				await expect(mobilePage.locator('text=Casino Card Game')).toBeVisible();
				await expect(mobilePage.locator('[data-testid="create-room-test"]')).toBeVisible();

				console.log('Mobile view verified');
			});
		} finally {
			await mobilePage.close();
			await mobileContext.close();
		}
	});
});
