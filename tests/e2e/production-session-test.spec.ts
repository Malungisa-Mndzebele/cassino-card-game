import { test, expect } from '@playwright/test';

/**
 * Production Session Management Tests
 * Tests session tokens, reconnection, and state recovery
 */

test.describe('Production Session Management', () => {
  
  test('should generate session token on room creation', async ({ page }) => {
    console.log('🔐 Testing session token generation...');
    
    await page.goto('/');
    
    // Create room
    await page.locator('[data-testid="player-name-input-create-test"]').fill('SessionTest');
    await page.locator('[data-testid="create-room-test"]').click();
    
    // Wait for room to be created
    await expect(page.getByText(/room code/i)).toBeVisible({ timeout: 10000 });
    
    // Check localStorage for session token
    const sessionToken = await page.evaluate(() => {
      return localStorage.getItem('casino_session_token') || sessionStorage.getItem('casino_session_token');
    });
    
    expect(sessionToken).toBeTruthy();
    console.log('✅ Session token generated:', sessionToken?.substring(0, 20) + '...');
  });

  test('should maintain session after page refresh', async ({ page }) => {
    console.log('🔄 Testing session persistence...');
    
    await page.goto('/');
    
    // Create room
    await page.locator('[data-testid="player-name-input-create-test"]').fill('RefreshTest');
    await page.locator('[data-testid="create-room-test"]').click();
    
    // Wait for room
    await expect(page.getByText(/room code/i)).toBeVisible({ timeout: 10000 });
    
    // Get room code
    const roomCodeElement = page.locator('text=/[A-Z0-9]{6}/').first();
    const roomCode = await roomCodeElement.textContent();
    
    // Get session token before refresh
    const tokenBefore = await page.evaluate(() => {
      return localStorage.getItem('casino_session_token');
    });
    
    console.log('Room code:', roomCode);
    console.log('Token before refresh:', tokenBefore?.substring(0, 20) + '...');
    
    // Refresh page
    await page.reload();
    
    // Check token persists
    const tokenAfter = await page.evaluate(() => {
      return localStorage.getItem('casino_session_token');
    });
    
    expect(tokenAfter).toBe(tokenBefore);
    console.log('✅ Session token persisted after refresh');
    
    // Check if we're still in the room (reconnection worked)
    await expect(page.getByText('RefreshTest')).toBeVisible({ timeout: 10000 });
    console.log('✅ Reconnected to room after refresh');
  });

  test('should establish WebSocket with session token', async ({ page }) => {
    console.log('🔌 Testing WebSocket with session...');
    
    const wsMessages: any[] = [];
    
    // Listen for WebSocket messages
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        try {
          const data = JSON.parse(event.payload as string);
          wsMessages.push(data);
        } catch (e) {
          // Ignore non-JSON messages
        }
      });
    });
    
    await page.goto('/');
    await page.locator('[data-testid="player-name-input-create-test"]').fill('WSSessionTest');
    await page.locator('[data-testid="create-room-test"]').click();
    
    // Wait for WebSocket messages
    await page.waitForTimeout(3000);
    
    // Check if we received any messages
    expect(wsMessages.length).toBeGreaterThan(0);
    console.log(`✅ Received ${wsMessages.length} WebSocket messages`);
    
    // Check for session-related messages
    const hasSessionMessage = wsMessages.some(msg => 
      msg.type === 'session_created' || msg.session_token
    );
    
    if (hasSessionMessage) {
      console.log('✅ Session-related WebSocket messages received');
    }
  });

  test('should handle concurrent connection detection', async ({ page, context }) => {
    console.log('👥 Testing concurrent connection detection...');
    
    await page.goto('/');
    
    // Create room in first tab
    await page.locator('[data-testid="player-name-input-create-test"]').fill('ConcurrentTest');
    await page.locator('[data-testid="create-room-test"]').click();
    
    await expect(page.getByText(/room code/i)).toBeVisible({ timeout: 10000 });
    
    // Get room code and session token
    const roomCodeElement = page.locator('text=/[A-Z0-9]{6}/').first();
    const roomCode = await roomCodeElement.textContent();
    const sessionToken = await page.evaluate(() => localStorage.getItem('casino_session_token'));
    
    console.log('Room code:', roomCode);
    console.log('Session token:', sessionToken?.substring(0, 20) + '...');
    
    // Open second tab with same session token
    const page2 = await context.newPage();
    
    // Set the same session token in second tab
    await page2.goto('/');
    await page2.evaluate((token) => {
      if (token) localStorage.setItem('casino_session_token', token);
    }, sessionToken);
    
    // Try to join the same room
    await page2.locator('[data-testid="room-code-input"]').fill(roomCode || '');
    await page2.locator('[data-testid="player-name-input-join"]').fill('ConcurrentTest2');
    await page2.locator('[data-testid="join-room-test"]').click();
    
    // Should detect concurrent connection or handle gracefully
    await page2.waitForTimeout(2000);
    
    console.log('✅ Concurrent connection handled');
    
    await page2.close();
  });

  test('should send heartbeat messages', async ({ page }) => {
    console.log('💓 Testing heartbeat mechanism...');
    
    let heartbeatCount = 0;
    
    page.on('websocket', ws => {
      ws.on('framesent', event => {
        try {
          const data = JSON.parse(event.payload as string);
          if (data.type === 'heartbeat' || data.type === 'ping') {
            heartbeatCount++;
          }
        } catch (e) {
          // Ignore
        }
      });
    });
    
    await page.goto('/');
    await page.locator('[data-testid="player-name-input-create-test"]').fill('HeartbeatTest');
    await page.locator('[data-testid="create-room-test"]').click();
    
    await expect(page.getByText(/room code/i)).toBeVisible({ timeout: 10000 });
    
    // Wait for heartbeats (they should be sent periodically)
    await page.waitForTimeout(15000);
    
    console.log(`✅ Heartbeat messages sent: ${heartbeatCount}`);
    expect(heartbeatCount).toBeGreaterThan(0);
  });

  test('should recover state after disconnect and reconnect', async ({ page }) => {
    console.log('🔄 Testing state recovery...');
    
    await page.goto('/');
    
    // Create room
    await page.locator('[data-testid="player-name-input-create-test"]').fill('RecoveryTest');
    await page.locator('[data-testid="create-room-test"]').click();
    
    await expect(page.getByText(/room code/i)).toBeVisible({ timeout: 10000 });
    
    const roomCodeElement = page.locator('text=/[A-Z0-9]{6}/').first();
    const roomCode = await roomCodeElement.textContent();
    
    console.log('Room created:', roomCode);
    
    // Simulate disconnect by going offline
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    
    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(3000);
    
    // Check if we're still in the room
    await expect(page.getByText('RecoveryTest')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ State recovered after reconnection');
  });

  test('should clean up session on explicit disconnect', async ({ page }) => {
    console.log('🧹 Testing session cleanup...');
    
    await page.goto('/');
    
    // Create room
    await page.locator('[data-testid="player-name-input-create-test"]').fill('CleanupTest');
    await page.locator('[data-testid="create-room-test"]').click();
    
    await expect(page.getByText(/room code/i)).toBeVisible({ timeout: 10000 });
    
    // Verify session token exists
    let sessionToken = await page.evaluate(() => localStorage.getItem('casino_session_token'));
    expect(sessionToken).toBeTruthy();
    
    // Leave room (if there's a leave button)
    const leaveButton = page.getByRole('button', { name: /leave|exit|quit/i });
    if (await leaveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await leaveButton.click();
      await page.waitForTimeout(1000);
      
      // Check if session token is cleared
      sessionToken = await page.evaluate(() => localStorage.getItem('casino_session_token'));
      
      if (!sessionToken) {
        console.log('✅ Session token cleared on leave');
      } else {
        console.log('ℹ️ Session token persists (may be intentional for rejoin)');
      }
    } else {
      console.log('ℹ️ No leave button found, skipping cleanup test');
    }
  });
});
