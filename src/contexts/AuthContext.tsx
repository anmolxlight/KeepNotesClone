import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authService, AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized]);

  const initializeAuth = async () => {
    if (isInitialized) return; // Prevent multiple initializations
    
    try {
      setIsLoading(true);
      await authService.initialize();
      
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        console.log('✅ Auth context initialized with user:', currentUser.name);
      } else {
        console.log('👤 No authenticated user found');
      }
    } catch (error) {
      console.error('❌ Auth context initialization failed:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (): Promise<AuthUser | null> => {
    try {
      const loggedInUser = await authService.login();
      if (loggedInUser) {
        setUser(loggedInUser);
        console.log('✅ User logged in:', loggedInUser.name);
      }
      return loggedInUser;
    } catch (error) {
      console.error('❌ Login failed:', error);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      console.log('✅ User logged out');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  const setUserCallback = useCallback((newUser: AuthUser | null) => {
    // Prevent unnecessary updates if the user is the same
    setUser(currentUser => {
      if (currentUser?.id === newUser?.id && currentUser?.name === newUser?.name) {
        console.log('👤 User unchanged, skipping update');
        return currentUser;
      }
      console.log('🔄 Setting user:', newUser?.name || 'null');
      return newUser;
    });
  }, []);

  const isAuthenticated = !!user && user.id !== 'guest';

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    setUser: setUserCallback,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 