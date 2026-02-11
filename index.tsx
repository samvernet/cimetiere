if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    body {
      padding-bottom: env(safe-area-inset-bottom) !important;
      min-height: 100vh;
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
