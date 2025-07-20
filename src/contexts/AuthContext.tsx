import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Static admin credentials (in production, use environment variables)
const ADMIN_CREDENTIALS = {
  username: 'tzpmv',
  password: 'tzpmv97'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if admin is already logged in
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setIsAdmin(true);
      localStorage.setItem('admin_session', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('admin_session');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};