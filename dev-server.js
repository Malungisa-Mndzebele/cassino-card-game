const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5173; // Use Vite's default port

// Serve static files from the public directory first
app.use(express.static(path.join(__dirname, 'public')));

// Serve other static files from the root directory
app.use(express.static(path.join(__dirname)));

// Proxy API requests to backend
const backendUrl = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || 'http://localhost:8000';
app.use('/api', createProxyMiddleware({
  target: backendUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix
  },
}));

// Serve the main HTML file for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error(`❌ Error starting server on port ${PORT}:`, err.message);
    if (err.code === 'EADDRINUSE') {
      console.error(`   Port ${PORT} is already in use. Try: PORT=${PORT + 1} npm run dev`);
      process.exit(1);
    }
    throw err;
  }
  console.log(`🚀 Frontend development server running on port ${PORT}`);
  console.log(`📡 Proxying API requests to: ${backendUrl}`);
  console.log(`🌐 Open: http://localhost:${PORT}/cassino/`);
});
