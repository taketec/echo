import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <GoogleOAuthProvider clientId = {'26649422327-mb8qu858s8l7f4fp01pdkiv499ppe997.apps.googleusercontent.com'}>

    <App /> 
     </GoogleOAuthProvider>,

  </StrictMode>,
)
