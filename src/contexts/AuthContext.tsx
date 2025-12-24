// Auth context for managing user authentication state
import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, getStoredUser, getStoredToken, getCurrentUser, logout as authLogout } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Create context with a stable reference
const AuthContext = createContext<AuthContextType | null>(null);

// Prevent HMR issues by using displayName
AuthContext.displayName = 'AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      return getStoredUser();
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  }), [user, isLoading, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
