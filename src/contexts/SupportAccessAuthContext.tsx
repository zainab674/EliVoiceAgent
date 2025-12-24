import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Use same env logic as other files if possible, or just relative path
// But for typical Vite + Proxy setup, fetching /api/v1/... is correct.

export interface User {
  id: string;
  email: string | null;
  fullName: string | null;
  phone?: string | null;
  countryCode?: string | null;
  company?: string | null;
  industry?: string | null;
  role?: string | null;
  notifications?: boolean | null;
  onboardingCompleted?: boolean | null;
  plan?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signUp: (name: string, email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  // Stubbed for compatibility if needed, or removed if unused
  impersonateUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  exitImpersonation: () => Promise<void>;
  isImpersonating: boolean;
  originalUser: User | null;
  startSupportAccess: (sessionData: any) => Promise<{ success: boolean; message: string }>;
  endSupportAccess: () => Promise<void>;
  activeSupportSession: any | null;
  validateScopedToken: (token: string) => Promise<boolean>;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Stubs for removed functionality
  const [isImpersonating] = useState(false);
  const [originalUser] = useState<User | null>(null);
  const [activeSupportSession] = useState<any | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser({
          id: data.user._id, // MongoDB uses _id
          email: data.user.email,
          fullName: data.user.name,
          role: data.user.role || 'user',
          company: data.user.company,
          industry: data.user.industry,
          plan: data.user.plan,
          isActive: data.user.isActive,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
          onboardingCompleted: true // Assuming true if existing user, or could add field to backend
        });
      } else {
        // If token is invalid, clear it
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        // data contains user info too, we can set it directly
        setUser({
          id: data._id,
          email: data.email,
          fullName: data.name,
          role: 'user', // Default or from response if available
          isActive: true
          // Add other fields if returned from login, or fetch profile otherwise. 
          // Login usually returns minimal info. Let's fetch profile or just set minimal.
          // Setting minimal is faster.
        });

        // Fetch full profile to get everything else
        setTimeout(fetchUser, 100);

        return { success: true, message: 'Sign in successful' };
      }

      return { success: false, message: data.message || 'Error signing in' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error signing in' };
    }
  };

  const signUp = async (name: string, email: string, password: string, metadata?: Record<string, any>) => {
    try {
      const response = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, ...metadata })
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        // Do not auto-login on signup
        return { success: true, message: 'Sign up successful, please login' };
      }
      return { success: false, message: data.message || 'Error signing up' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error signing up' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Map frontend user fields to backend expected fields if necessary
      // Backend expects: name, company, industry, role.
      const payload: any = {};
      if (updates.fullName) payload.name = updates.fullName;
      if (updates.company) payload.company = updates.company;
      if (updates.industry) payload.industry = updates.industry;
      if (updates.role) payload.role = updates.role;

      const response = await fetch('/api/v1/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        // Optimistic or real update
        setUser(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (e) {
      console.error('Error updating profile:', e);
    }
  };

  // Stubs
  const impersonateUser = async () => ({ success: false, message: 'Feature removed' });
  const exitImpersonation = async () => { };
  const startSupportAccess = async () => ({ success: false, message: 'Feature removed' });
  const endSupportAccess = async () => { };
  const validateScopedToken = async () => false;

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    impersonateUser,
    exitImpersonation,
    isImpersonating,
    originalUser,
    startSupportAccess,
    endSupportAccess,
    activeSupportSession,
    validateScopedToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
