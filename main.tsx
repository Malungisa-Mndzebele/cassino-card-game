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

// Wait for DOM and CSS to be ready before showing content
const root = document.getElementById('root')!;

// Function to add loaded class when everything is ready
function addLoadedClass() {
  // Ensure we're in the next tick to avoid any remaining flicker
  requestAnimationFrame(() => {
    root.classList.add('loaded');
  });
}

// Wait for all resources to be loaded
function waitForLoad() {
  if (document.readyState === 'complete') {
    // All resources loaded, show content
    addLoadedClass();
  } else {
    // Wait for load event
    window.addEventListener('load', addLoadedClass);
  }
}

// Start the loading process
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForLoad);
} else {
  // DOM is already ready, wait for resources
  waitForLoad();
}

ReactDOM.createRoot(root).render(
  <App />
)