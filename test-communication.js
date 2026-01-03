/**
 * Test script for voice/video/chat communication between players
 * Tests WebSocket message relay for communication features
 */

const API_URL = 'https://cassino-game-backend.onrender.com';

async function testCommunication() {
    console.log('=== Testing Communication Feature ===\n');
    
    // Step 1: Create a room with Player 1
    console.log('1. Creating room with Player 1...');
    const createResponse = await fetch(`${API_URL}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: 'TestPlayer1' })
    });
    
    if (!createResponse.ok) {
        console.error('Failed to create room:', await createResponse.text());
        return;
    }
    
    const createData = await createResponse.json();
    const roomId = createData.room_id;
    const player1Token = createData.session_token;
    console.log(`   Room created: ${roomId}`);
    console.log(`   Player 1 token: ${player1Token?.substring(0, 30)}...`);
    
    // Step 2: Player 2 joins the room
    console.log('\n2. Player 2 joining room...');
    const joinResponse = await fetch(`${API_URL}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, player_name: 'TestPlayer2' })
    });
    
    if (!joinResponse.ok) {
        console.error('Failed to join room:', await joinResponse.text());
        return;
    }
    
    const joinData = await joinResponse.json();
    const player2Token = joinData.session_token;
    console.log(`   Player 2 joined`);
    console.log(`   Player 2 token: ${player2Token?.substring(0, 30)}...`);
    
    // Step 3: Connect both players via WebSocket
    console.log('\n3. Connecting WebSockets...');
    
    const WebSocket = (await import('ws')).default;
    
    const ws1Url = `${API_URL.replace('https', 'wss')}/ws/${roomId}?session_token=${encodeURIComponent(player1Token)}`;
    const ws2Url = `${API_URL.replace('https', 'wss')}/ws/${roomId}?session_token=${encodeURIComponent(player2Token)}`;
    
    let player1Messages = [];
    let player2Messages = [];
    
    const ws1 = new WebSocket(ws1Url);
    const ws2 = new WebSocket(ws2Url);
    
    // Track connection state
    let ws1Connected = false;
    let ws2Connected = false;
    
    ws1.on('open', () => {
        console.log('   Player 1 WebSocket connected');
        ws1Connected = true;
    });
    
    ws2.on('open', () => {
        console.log('   Player 2 WebSocket connected');
        ws2Connected = true;
    });
    
    ws1.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        player1Messages.push(msg);
        console.log(`   [P1 received] ${msg.type}:`, JSON.stringify(msg.data || {}).substring(0, 100));
    });
    
    ws2.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        player2Messages.push(msg);
        console.log(`   [P2 received] ${msg.type}:`, JSON.stringify(msg.data || {}).substring(0, 100));
    });
    
    ws1.on('error', (err) => console.error('   WS1 error:', err.message));
    ws2.on('error', (err) => console.error('   WS2 error:', err.message));
    
    // Wait for both connections
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (!ws1Connected || !ws2Connected) {
        console.error('   Failed to connect WebSockets');
        ws1.close();
        ws2.close();
        return;
    }
    
    // Step 4: Test chat message relay
    console.log('\n4. Testing chat message relay...');
    const chatMessage = {
        type: 'chat_message',
        data: {
            id: `msg_${Date.now()}`,
            content: 'Hello from Player 1!',
            sender_name: 'TestPlayer1'
        }
    };
    
    console.log('   Player 1 sending chat message...');
    ws1.send(JSON.stringify(chatMessage));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const chatReceived = player2Messages.find(m => m.type === 'chat_message');
    if (chatReceived) {
        console.log('   ✓ Player 2 received chat message:', chatReceived.data?.content);
    } else {
        console.log('   ✗ Player 2 did NOT receive chat message');
        console.log('   Player 2 messages:', player2Messages.map(m => m.type));
    }
    
    // Step 5: Test media status relay
    console.log('\n5. Testing media status relay...');
    const mediaStatus = {
        type: 'media_status',
        data: {
            audio_muted: false,
            video_muted: true
        }
    };
    
    console.log('   Player 1 sending media status...');
    ws1.send(JSON.stringify(mediaStatus));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mediaReceived = player2Messages.find(m => m.type === 'media_status');
    if (mediaReceived) {
        console.log('   ✓ Player 2 received media status:', mediaReceived.data);
    } else {
        console.log('   ✗ Player 2 did NOT receive media status');
    }
    
    // Step 6: Test WebRTC offer relay
    console.log('\n6. Testing WebRTC offer relay...');
    const webrtcOffer = {
        type: 'webrtc_offer',
        data: {
            sdp: 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n',
            type: 'offer'
        }
    };
    
    console.log('   Player 1 sending WebRTC offer...');
    ws1.send(JSON.stringify(webrtcOffer));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const offerReceived = player2Messages.find(m => m.type === 'webrtc_offer');
    if (offerReceived) {
        console.log('   ✓ Player 2 received WebRTC offer');
    } else {
        console.log('   ✗ Player 2 did NOT receive WebRTC offer');
    }
    
    // Step 7: Test WebRTC answer relay (from Player 2 to Player 1)
    console.log('\n7. Testing WebRTC answer relay...');
    player1Messages = []; // Clear to check new messages
    
    const webrtcAnswer = {
        type: 'webrtc_answer',
        data: {
            sdp: 'v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n',
            type: 'answer'
        }
    };
    
    console.log('   Player 2 sending WebRTC answer...');
    ws2.send(JSON.stringify(webrtcAnswer));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const answerReceived = player1Messages.find(m => m.type === 'webrtc_answer');
    if (answerReceived) {
        console.log('   ✓ Player 1 received WebRTC answer');
    } else {
        console.log('   ✗ Player 1 did NOT receive WebRTC answer');
        console.log('   Player 1 messages:', player1Messages.map(m => m.type));
    }
    
    // Step 8: Test ICE candidate relay
    console.log('\n8. Testing ICE candidate relay...');
    player2Messages = []; // Clear
    
    const iceCandidate = {
        type: 'webrtc_ice_candidate',
        data: {
            candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 54321 typ host',
            sdpMLineIndex: 0,
            sdpMid: 'audio'
        }
    };
    
    console.log('   Player 1 sending ICE candidate...');
    ws1.send(JSON.stringify(iceCandidate));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const iceReceived = player2Messages.find(m => m.type === 'webrtc_ice_candidate');
    if (iceReceived) {
        console.log('   ✓ Player 2 received ICE candidate');
    } else {
        console.log('   ✗ Player 2 did NOT receive ICE candidate');
    }
    
    // Cleanup
    console.log('\n9. Cleaning up...');
    ws1.close();
    ws2.close();
    
    console.log('\n=== Test Complete ===');
}

testCommunication().catch(console.error);
