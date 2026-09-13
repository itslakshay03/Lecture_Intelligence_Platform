import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  loginApi,
  registerApi,
  fetchCurrentUserApi,
  logoutApi,
  registerUnauthorizedHandler,
} from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getAuthToken);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Logout helper
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      /* ignore network failures during logout */
    } finally {
      clearAuthToken();
      setTokenState(null);
      setUser(null);
    }
  }, []);

  // Login handler
  const login = useCallback(async (credentials) => {
    const data = await loginApi(credentials);
    const authToken = data.token;
    const userData = data.user;

    setAuthToken(authToken);
    setTokenState(authToken);
    setUser(userData);
    return userData;
  }, []);

  // Register handler
  const register = useCallback(async (registrationData) => {
    const data = await registerApi(registrationData);
    const authToken = data.token;
    const userData = data.user;

    setAuthToken(authToken);
    setTokenState(authToken);
    setUser(userData);
    return userData;
  }, []);

  // Refresh current user profile
  const refreshUser = useCallback(async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null);
      setTokenState(null);
      return null;
    }

    try {
      const res = await fetchCurrentUserApi();
      const userData = res?.user || res;
      setUser(userData);
      return userData;
    } catch (err) {
      console.warn('Failed to refresh user profile:', err.message);
      clearAuthToken();
      setTokenState(null);
      setUser(null);
      return null;
    }
  }, []);

  // Restore session on initial mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const savedToken = getAuthToken();
      if (!savedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetchCurrentUserApi();
        const userData = res?.user || res;
        if (isMounted) {
          setUser(userData);
          setTokenState(savedToken);
        }
      } catch (err) {
        console.warn('Initial session validation failed:', err.message);
        if (isMounted) {
          clearAuthToken();
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Register global 401 Unauthorized handler
  useEffect(() => {
    const unregister = registerUnauthorizedHandler(() => {
      clearAuthToken();
      setTokenState(null);
      setUser(null);
    });

    return unregister;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

export default AuthContext;
