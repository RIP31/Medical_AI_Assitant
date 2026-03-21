import React, { createContext, useContext, useState, useEffect } from 'react';
import { clearUserLocalData } from '../utils/privacyCleanup';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('medicalAI_auth_token');
      const savedUser = localStorage.getItem('medicalAI_active_user');

      if (token && savedUser) {
        try {
          // Optionally validate token with backend here
          // const res = await fetch('/api/auth/validate', { headers: { Authorization: `Bearer ${token}` } });
          // if (!res.ok) throw new Error('Token invalid');

          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Session validation failed:', error);
          logout();
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  // --- MOCK DB HELPERS (Fallback) ---
  const getMockUsers = () => {
    try {
      return JSON.parse(localStorage.getItem('medicalAI_users') || '{}');
    } catch { return {}; }
  };

  const findMockUser = (email) => {
    const users = getMockUsers();
    const normalize = (str) => str.toLowerCase().trim();
    return Object.values(users).find(u => normalize(u.email) === normalize(email));
  };

  const saveMockUser = (user) => {
    const users = getMockUsers();
    users[user.email.toLowerCase().trim()] = user;
    localStorage.setItem('medicalAI_users', JSON.stringify(users));
  };
  // ----------------------------------

  const signup = async (formData) => {
    const { name, email, password } = formData;

    try {
      // 1. Attempt API Registration
      console.log("Attempting Signup via API...");
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Signup Successful via API:", data);
        const { user, token } = data;

        localStorage.setItem('medicalAI_auth_token', token);
        localStorage.setItem('medicalAI_active_user', JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      } else {
        console.error("Signup API Error:", data.message);
        throw new Error(data.message || 'Registration failed');
      }

    } catch (error) {
      console.error("Signup Failed:", error);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      // 1. Attempt API Login
      console.log("Attempting Login via API...");
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login Successful via API:", data);
        const { user, token } = data;

        // --- PRIVACY RESET CHECK ---
        if (user.privacyResetRequired) {
          console.warn("Privacy Reset Required for this account.");
          clearUserLocalData(user.id, user.email);

          // Acknowledge reset to backend
          try {
            await fetch('/api/auth/ack-privacy-reset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id })
            });
            user.privacyResetRequired = false; // Update local state
            console.log("Privacy Reset Acknowledged.");
          } catch (ackError) {
            console.error("Failed to acknowledge privacy reset:", ackError);
          }
        }
        // ---------------------------

        localStorage.setItem('medicalAI_auth_token', token);
        localStorage.setItem('medicalAI_active_user', JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      } else {
        console.error("Login API Error:", data.message);
        throw new Error(data.message || 'Login failed');
      }

    } catch (error) {
      console.error("Login Failed:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('medicalAI_auth_token');
    localStorage.removeItem('medicalAI_active_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const continueAsGuest = () => {
    const guestUser = {
      id: 'guest',
      name: 'Guest User',
      email: 'guest',
      isGuest: true
    };
    setUser(guestUser);
    setIsAuthenticated(true);
    // Do NOT generate a token for guests, so they act as "unauthenticated" for protected API routes if any
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signup,
    login,
    logout,
    continueAsGuest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
