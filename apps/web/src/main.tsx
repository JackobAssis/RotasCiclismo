import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { recoveryService } from './services/recovery.service';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Non-blocking recovery on app startup
recoveryService.init().catch(() => {});
