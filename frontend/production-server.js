const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Configure proxy middleware
const apiProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/cassino/api': '', // Remove both /cassino and /api prefixes
    },
    onProxyReq: (proxyReq, req, res) => {
        // Log the original and rewritten URLs for debugging
        console.log('Original URL:', req.url);
        console.log('Proxied URL:', proxyReq.path);
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ error: 'Proxy Error', details: err.message });
    }
});

// Serve static files from root directory
app.use('/cassino', express.static(path.join(__dirname, '..')));

// API proxy
app.use('/cassino/api', apiProxy);

// WebSocket proxy
app.use('/cassino/ws', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
        '^/cassino/ws': '/ws'
    }
}));

// Handle client-side routing
app.get('/cassino/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log('🎮 Casino Card Game Frontend');
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🔗 Backend URL: ${BACKEND_URL}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`🚀 Ready to serve at http://localhost:${PORT}/cassino`);
});