// Simple random chat server using Node.js and ws
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

let waiting = null; // Waiting client
const pairs = new Map(); // Map: client -> partner

wss.on('connection', (ws) => {
    if (waiting && waiting.readyState === WebSocket.OPEN) {
        // Pair with waiting client
        pairs.set(ws, waiting);
        pairs.set(waiting, ws);
        waiting.send(JSON.stringify({ type: 'info', message: 'You are now connected to a stranger.' }));
        ws.send(JSON.stringify({ type: 'info', message: 'You are now connected to a stranger.' }));
        waiting = null;
    } else {
        // Wait for another client
        waiting = ws;
        ws.send(JSON.stringify({ type: 'info', message: 'Waiting for a stranger to connect...' }));
    }

    ws.on('message', (data) => {
        const partner = pairs.get(ws);
        if (partner && partner.readyState === WebSocket.OPEN) {
            partner.send(JSON.stringify({ type: 'message', message: data.toString() }));
        }
    });

    ws.on('close', () => {
        const partner = pairs.get(ws);
        if (partner && partner.readyState === WebSocket.OPEN) {
            partner.send(JSON.stringify({ type: 'info', message: 'Stranger disconnected. Looking for a new chat...' }));
            // Put partner back in waiting queue
            pairs.delete(partner);
            waiting = partner;
        }
        pairs.delete(ws);
        if (waiting === ws) waiting = null;
    });
});

console.log('Random chat server running on ws://localhost:3000');
