/* @refresh reset */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppUser, MOCK_USERS } from '@/data/mockData';

interface AuthContextType {
  currentUser: AppUser | null;
  login: (email: string) => boolean;
  logout: () => void;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isSrOperator: () => boolean;
  isOperator: () => boolean;
  isStaff: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(MOCK_USERS[0]); // default admin

  const login = useCallback((email: string) => {
    const user = MOCK_USERS.find(u => u.email === email);
    if (user) { setCurrentUser(user); return true; }
    return false;
  }, []);

  const logout = useCallback(() => setCurrentUser(null), []);

  const hasRole = (role: string) => currentUser?.role === role;

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAdmin: () => hasRole('super_admin'),
      isManager: () => hasRole('ops_manager'),
      isSrOperator: () => hasRole('sr_operator'),
      isOperator: () => hasRole('operator'),
      isStaff: () => hasRole('staff'),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
