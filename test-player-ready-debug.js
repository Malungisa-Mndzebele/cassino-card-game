// Debug test for player-ready endpoint
const API_URL = 'http://localhost:8000';

async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    const text = await res.text();
    console.log(`Response status: ${res.status}`);
    console.log(`Response body: ${text}`);
    try {
        return { ok: res.ok, status: res.status, data: JSON.parse(text) };
    } catch {
        return { ok: res.ok, status: res.status, data: text };
    }
}

async function test() {
    console.log('Creating room...');
    const createRes = await fetchJson(`${API_URL}/rooms/create`, {
        method: 'POST',
        body: JSON.stringify({ player_name: 'TestPlayer' })
    });
    
    if (!createRes.ok) {
        console.log('Failed to create room');
        return;
    }
    
    const roomId = createRes.data.room_id;
    const playerId = createRes.data.player_id;
    console.log(`Room: ${roomId}, Player: ${playerId}`);
    
    console.log('\nSetting player ready...');
    const readyRes = await fetchJson(`${API_URL}/rooms/player-ready`, {
        method: 'POST',
        body: JSON.stringify({ 
            room_id: roomId, 
            player_id: playerId, 
            is_ready: true 
        })
    });
    
    console.log('\nDone!');
}

test().catch(console.error);
