const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory first
app.use(express.static(path.join(__dirname, 'public')));

// Serve other static files from the root directory
app.use(express.static(path.join(__dirname)));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: process.env.REACT_APP_API_URL || 'http://backend:8000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix
  },
}));

// Serve the main HTML file for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend development server running on port ${PORT}`);
  console.log(`📡 Proxying API requests to: ${process.env.REACT_APP_API_URL || 'http://backend:8000'}`);
});
