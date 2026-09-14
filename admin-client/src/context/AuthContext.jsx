/**
 * src/context/AuthContext.jsx
 *
 * Holds the current staff session in React memory.
 */
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }) {
  const [staff, setStaff]               = useState(null);
  const [accessToken, setAccessToken]   = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const accessTokenRef  = useRef(null);
  const refreshTokenRef = useRef(null);

  const updateAccessToken = useCallback((newToken) => {
    accessTokenRef.current = newToken;
    setAccessToken(newToken);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    const { accessToken: at, refreshToken: rt, staff: staffData } = response.data.data;

    accessTokenRef.current  = at;
    refreshTokenRef.current = rt;
    setAccessToken(at);
    setRefreshToken(rt);
    setStaff(staffData);

    return staffData;
  }, []);

  const logout = useCallback(() => {
    accessTokenRef.current  = null;
    refreshTokenRef.current = null;
    setAccessToken(null);
    setRefreshToken(null);
    setStaff(null);
  }, []);

  const value = {
    staff,
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(accessToken && staff),
    accessTokenRef,
    refreshTokenRef,
    login,
    logout,
    updateAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
