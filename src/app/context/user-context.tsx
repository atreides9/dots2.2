import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  userId: string;
  setUserId: (id: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>(() => {
    // Get from localStorage or create new
    const stored = localStorage.getItem('brainmate-user-id');
    if (stored) return stored;
    
    const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('brainmate-user-id', newId);
    return newId;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('brainmate-authenticated') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('brainmate-user-id', userId);
  }, [userId]);

  useEffect(() => {
    localStorage.setItem('brainmate-authenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  const logout = () => {
    // Clear all user data
    localStorage.removeItem('brainmate-user-id');
    localStorage.removeItem('brainmate-authenticated');
    localStorage.removeItem('brainmate-onboarding-complete');
    setIsAuthenticated(false);
    
    // Generate new guest ID
    const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setUserId(newId);
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, logout, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}