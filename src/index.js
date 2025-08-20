import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Use createRoot instead of ReactDOM.render
const root = ReactDOM.createRoot(document.getElementById('root'));

// StrictMode intentionally double-invokes effects in development to detect side effects
// This causes duplicate API requests during development
// For production, we want StrictMode enabled for better error detection
const isDevelopment = process.env.NODE_ENV === 'development';

root.render(
  isDevelopment ? (
    <App />
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);
