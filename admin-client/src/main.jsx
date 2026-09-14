/**
 * src/main.jsx
 * Entry point — AuthProvider + AxiosBridge + App.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider, useAuth } from './context/AuthContext';
import { setAuthContext } from './api/axiosClient';
import './index.css';

function AxiosBridge({ children }) {
  const authCtx = useAuth();
  setAuthContext(authCtx); // synchronous wiring before any request
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AxiosBridge>
        <App />
      </AxiosBridge>
    </AuthProvider>
  </React.StrictMode>,
);
