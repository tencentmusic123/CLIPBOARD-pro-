import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for persisted session on mount (Simulated)
  useEffect(() => {
    const storedUser = localStorage.getItem('clipboard_max_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    
    // --- OAUTH SIMULATION START ---
    // In a production app, you would implement the real Google Identity Services SDK here.
    // Example: google.accounts.oauth2.initTokenClient(...)
    
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Mock User Data returned from "Google"
        const mockUser: User = {
          id: 'google-uid-12345',
          name: 'Alex Sterling',
          email: 'alex.sterling@gmail.com',
          // Using a generic avatar placeholder or initial
          photoUrl: '' 
        };
        
        setUser(mockUser);
        localStorage.setItem('clipboard_max_user', JSON.stringify(mockUser));
        setIsLoading(false);
        resolve();
      }, 1500); // Simulate network delay
    });
    // --- OAUTH SIMULATION END ---
  };

  const logout = () => {
    setIsLoading(true);
    setTimeout(() => {
        setUser(null);
        localStorage.removeItem('clipboard_max_user');
        setIsLoading(false);
    }, 500);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      loginWithGoogle,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};