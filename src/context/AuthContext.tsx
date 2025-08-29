import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import toast from 'react-hot-toast';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';
const API_BASE_URL = 'http://localhost:5000';

// Map API user shape to app `User` shape used across the UI
const mapApiUserToAppUser = (apiUser: any): User => {
  const fallbackName = apiUser?.profile?.name || (apiUser?.email ? apiUser.email.split('@')[0] : 'User');
  const name = fallbackName;
  const avatarSeed = encodeURIComponent(name || 'User');
  return {
    id: apiUser.id,
    name,
    email: apiUser.email,
    role: apiUser.role as UserRole,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}`,
    bio: '',
    isOnline: true,
    createdAt: new Date().toISOString(),
  };
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  // Register function
  const register = async (name: string, email: string, password: string, role: UserRole): Promise<any> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to register');

      const mappedUser = mapApiUserToAppUser(data.user);
      setUser(mappedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      localStorage.setItem('token', data.token);

      toast.success('Account created successfully!');
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string, role: UserRole): Promise<any> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to login');

      const mappedUser = mapApiUserToAppUser(data.user);
      setUser(mappedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      localStorage.setItem('token', data.token);

      toast.success('Logged in successfully!');
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  // Update profile
  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to update profile');

      // Backend returns updated profile. Merge into existing user shape
      setUser(prev => {
        if (!prev) return prev;
        const nextUser: User = { ...prev, name: (data?.name as string) || prev.name };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
        return nextUser;
      });
      toast.success('Profile updated successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to send reset email');

      toast.success('Password reset instructions sent!');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to reset password');

      toast.success('Password reset successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
