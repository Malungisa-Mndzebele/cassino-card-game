import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

// Production error handling
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
  // Disable console.log in production
  console.log = () => {}
  
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
  })
}

import { ConvexProvider } from './convexClient';

// Add loaded class to prevent flickering
const root = document.getElementById('root')!;
root.classList.add('loaded');

ReactDOM.createRoot(root).render(
  <ConvexProvider>
    <App />
  </ConvexProvider>,
)