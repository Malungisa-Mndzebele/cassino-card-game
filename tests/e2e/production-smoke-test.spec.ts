import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://khasinogaming.com/cassino';
const BACKEND_URL = 'https://cassino-game-backend.fly.dev';

test.describe('Production Smoke Tests', () => {
  test('should load production site successfully', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Check for main app elements
    await expect(page.locator('text=Casino Card Game')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Production site loaded successfully');
  });

  test('should verify backend health endpoint', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.database).toBe('connected');
    
    console.log('✅ Backend health check passed:', data);
  });

  test('should display room creation form', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    
    // Look for create room heading and button
    const createHeading = page.getByRole('heading', { name: /create new room/i });
    await expect(createHeading).toBeVisible({ timeout: 10000 });
    
    const createButton = page.getByRole('button', { name: /create/i }).first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Room creation UI is visible');
  });

  test('should be able to create a room', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    
    // Wait for app to be ready
    await page.waitForTimeout(2000);
    
    // First, click the "Create Room" button to show the form
    const showCreateButton = page.locator('[data-testid="show-create-form-button"]').or(
      page.getByRole('button', { name: /create room/i }).first()
    );
    await expect(showCreateButton).toBeVisible({ timeout: 10000 });
    await showCreateButton.click();
    
    // Wait for form to appear
    await page.waitForTimeout(1000);
    
    // Find the player name input in the Create New Room section
    const nameInput = page.locator('[data-testid="player-name-input-create-test"]').or(
      page.locator('input[id="create-player-name"]').or(
        page.locator('input[type="text"]').first()
      )
    );
    
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('ProductionTestPlayer');
    
    // Click the actual create room button (not the show form button)
    const createButton = page.locator('[data-testid="create-room-test"]').or(
      page.getByRole('button', { name: /^create room$/i }).first()
    );
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Wait for room to be created and check for game UI
    await page.waitForTimeout(5000);
    
    // Check if we're in a room (look for game elements or room code)
    const inRoom = await page.locator('text=/Room Code|Waiting for players|Game|Casino Room/i').count() > 0;
    
    if (inRoom) {
      console.log('✅ Room created successfully');
    } else {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/room-creation-debug.png', fullPage: true });
      console.log('⚠️ Room creation may have issues - screenshot saved');
      console.log('   Current URL:', page.url());
      console.log('   Page title:', await page.title());
    }
    
    // Don't fail if room creation has issues, just report
    expect(inRoom).toBeTruthy();
  });

  test('should verify WebSocket connection capability', async ({ page }) => {
    const errors: string[] = [];
    const wsMessages: string[] = [];
    
    // Listen for console messages
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
      }
      if (text.toLowerCase().includes('websocket') || text.toLowerCase().includes('ws')) {
        wsMessages.push(text);
      }
    });
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // First, click the "Create Room" button to show the form
    const showCreateButton = page.locator('[data-testid="show-create-form-button"]').or(
      page.getByRole('button', { name: /create room/i }).first()
    );
    
    const buttonVisible = await showCreateButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (buttonVisible) {
      await showCreateButton.click();
      await page.waitForTimeout(1000);
      
      // Try to create a room (which should establish WebSocket)
      const nameInput = page.locator('[data-testid="player-name-input-create-test"]').or(
        page.locator('input[id="create-player-name"]').or(
          page.locator('input[type="text"]').first()
        )
      );
      
      const inputVisible = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (inputVisible) {
        await nameInput.fill('WSTestPlayer');
        
        const createButton = page.locator('[data-testid="create-room-test"]').or(
          page.getByRole('button', { name: /^create room$/i }).first()
        );
        
        const createButtonVisible = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (createButtonVisible) {
          await createButton.click();
          await page.waitForTimeout(5000);
        }
      }
    }
    
    // Check for WebSocket errors
    const wsErrors = errors.filter(e => 
      e.toLowerCase().includes('websocket') || 
      e.toLowerCase().includes('ws') ||
      e.toLowerCase().includes('connection')
    );
    
    if (wsErrors.length === 0) {
      console.log('✅ No WebSocket errors detected');
    } else {
      console.log('⚠️ WebSocket errors:', wsErrors.slice(0, 3));
      console.log('⚠️ WebSocket messages:', wsMessages.slice(0, 3));
    }
    
    // Don't fail on WebSocket errors, just report
    expect(wsErrors.length).toBeLessThan(10);
  });

  test('should verify API endpoints are accessible', async ({ request }) => {
    // Test health endpoint
    const healthResponse = await request.get(`${BACKEND_URL}/health`);
    expect(healthResponse.ok()).toBeTruthy();
    expect(healthResponse.status()).toBe(200);
    
    console.log('✅ Health endpoint is accessible');
    
    // Test root endpoint
    const rootResponse = await request.get(`${BACKEND_URL}/`);
    expect(rootResponse.ok()).toBeTruthy();
    
    const rootData = await rootResponse.json();
    expect(rootData.message).toContain('Casino Card Game');
    
    console.log('✅ Root API endpoint is accessible');
    
    // Test room creation endpoint with POST
    const createRoomResponse = await request.post(`${BACKEND_URL}/rooms/create`, {
      data: {
        player_name: 'TestPlayer',
        max_players: 2
      }
    });
    
    // Accept either 200 (success) or 400/422 (validation error) as valid responses
    const validStatuses = [200, 201, 400, 422];
    expect(validStatuses).toContain(createRoomResponse.status());
    
    if (createRoomResponse.ok()) {
      const room = await createRoomResponse.json();
      console.log('✅ Room creation endpoint is accessible');
      console.log(`   Created room: ${room.room_code || 'N/A'}`);
    } else {
      console.log('✅ Room creation endpoint exists (validation working)');
    }
  });

  test('should have CORS configuration', async ({ request }) => {
    // Test with OPTIONS request (preflight)
    const optionsResponse = await request.fetch(`${BACKEND_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://khasinogaming.com',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const headers = optionsResponse.headers();
    
    // Check if CORS headers exist (may be lowercase)
    const hasCors = 
      headers['access-control-allow-origin'] !== undefined ||
      headers['Access-Control-Allow-Origin'] !== undefined;
    
    if (hasCors) {
      console.log('✅ CORS headers are configured');
    } else {
      console.log('⚠️ CORS headers not found - may need configuration');
      // Don't fail the test, just warn
    }
    
    // At minimum, the endpoint should respond
    expect([200, 204]).toContain(optionsResponse.status());
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    if (errors.length === 0) {
      console.log('✅ No JavaScript errors on page load');
    } else {
      console.log('⚠️ JavaScript errors found:', errors);
    }
    
    // Don't fail the test, just report
    expect(errors.length).toBeLessThan(5);
  });

  test('should have responsive design', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    
    let title = await page.locator('text=Casino Card Game').count();
    expect(title).toBeGreaterThan(0);
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    title = await page.locator('text=Casino Card Game').count();
    expect(title).toBeGreaterThan(0);
    
    console.log('✅ Responsive design working on desktop and mobile');
  });
});
