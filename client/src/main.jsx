import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './i18n/index.jsx';
import { AuthProvider, captureReferral } from './api.js';
import App from './App.jsx';
import './index.css';

// Remember a referral link (?ref=CODE&c=CAMPAIGN) so the sign-up counts for the friend who shared it
captureReferral();

// PWA: offline app shell + cached lessons and Cloudinary images (production builds only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('Service worker not registered:', e));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);
