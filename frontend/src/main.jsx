
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId = {"26649422327-mb8qu858s8l7f4fp01pdkiv499ppe997.apps.googleusercontent.com"}>
    <App />
  </GoogleOAuthProvider>,
);
