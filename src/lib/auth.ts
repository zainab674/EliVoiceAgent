
import { toast } from "sonner";

// Enhanced user interface with all available data
export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
  phone?: string | null;
  countryCode?: string | null;
  company?: string | null;
  industry?: string | null;
  teamSize?: string | null;
  role?: string | null;
  useCase?: string | null;
  theme?: string | null;
  notifications?: boolean | null;
  goals?: any | null;
  onboardingCompleted?: boolean | null;
  plan?: string | null;
  trialEndsAt?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// Contact information interface
export interface ContactInfo {
  email: string | null;
  phone: string | null;
  countryCode: string | null;
}

// User profile interface for database operations
export interface UserProfile {
  id: string;
  name?: string | null;
  company?: string | null;
  industry?: string | null;
  team_size?: string | null;
  role?: string | null;
  use_case?: string | null;
  theme?: string | null;
  notifications?: boolean | null;
  goals?: any | null;
  onboarding_completed?: boolean | null;
  plan?: string | null;
  trial_ends_at?: string | null;
  contact?: ContactInfo | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Auth state interface
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Sign up metadata interface
export interface SignUpMetadata {
  phone?: string;
  countryCode?: string;
}

// Auth utility class
export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  };
  private listeners: Set<(state: AuthState) => void> = new Set();
  private readonly STORAGE_KEY = 'token';
  private readonly API_URL = '/api/v1';

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize auth state and listen for changes
  private async initializeAuth() {
    const token = localStorage.getItem(this.STORAGE_KEY);
    if (token) {
      await this.refreshProfile();
    } else {
      this.updateAuthState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }

  // Update auth state and notify listeners
  private updateAuthState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.listeners.forEach(listener => listener(this.authState));
  }

  // Subscribe to auth state changes
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.authState);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Get current auth state
  public getAuthState(): AuthState {
    return this.authState;
  }

  // Get current user
  public getCurrentUser(): AuthUser | null {
    return this.authState.user;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  // Check if auth is loading
  public isLoading(): boolean {
    return this.authState.isLoading;
  }

  // Get auth error
  public getError(): string | null {
    return this.authState.error;
  }

  // Sign in with email and password
  public async signIn(email: string, password: string) {
    try {
      this.updateAuthState({ isLoading: true, error: null });

      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      // Save token
      if (data.token) {
        localStorage.setItem(this.STORAGE_KEY, data.token);

        // Load full profile
        await this.refreshProfile();
        return data;
      } else {
        throw new Error('No token received');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      this.updateAuthState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }

  // Sign up with email, password, and optional metadata
  public async signUp(
    name: string,
    email: string,
    password: string,
    metadata?: SignUpMetadata
  ) {
    try {
      this.updateAuthState({ isLoading: true, error: null });

      const response = await fetch(`${this.API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }

      if (data.token) {
        localStorage.setItem(this.STORAGE_KEY, data.token);
        // Load full profile
        await this.refreshProfile();
        return data;
      } else {
        // Maybe auto-login didn't happen?
        throw new Error('No token received after signup');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      this.updateAuthState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }

  // Sign out
  public async signOut() {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      localStorage.removeItem(this.STORAGE_KEY);
      this.updateAuthState({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      this.updateAuthState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }

  // Update user profile
  public async updateProfile(updates: Partial<UserProfile>) {
    const token = localStorage.getItem(this.STORAGE_KEY);
    if (!token) {
      throw new Error('No authenticated user');
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });

      const response = await fetch(`${this.API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      if (data.user) {
        this.refreshProfile(); // Simpler to just re-fetch or map the result
      }
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      this.updateAuthState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }

  // Refresh user profile
  public async refreshProfile() {
    const token = localStorage.getItem(this.STORAGE_KEY);
    if (!token) {
      this.updateAuthState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      //   this.updateAuthState({ isLoading: true, error: null }); // Don't flash loading on silent refresh

      const response = await fetch(`${this.API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        // If 401, token is bad
        if (response.status === 401) {
          localStorage.removeItem(this.STORAGE_KEY);
          this.updateAuthState({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      const userProfile = data.user;

      // Map to AuthUser
      const user: AuthUser = {
        id: userProfile._id,
        email: userProfile.email,
        fullName: userProfile.name,
        phone: userProfile.contact?.phone,
        countryCode: userProfile.contact?.countryCode,
        company: userProfile.company,
        industry: userProfile.industry,
        teamSize: userProfile.team_size,
        role: userProfile.role,
        useCase: userProfile.use_case,
        theme: userProfile.theme,
        notifications: userProfile.notifications,
        goals: userProfile.goals,
        onboardingCompleted: userProfile.onboarding_completed,
        plan: userProfile.plan,
        trialEndsAt: userProfile.trial_ends_at,
        isActive: userProfile.is_active,
        createdAt: userProfile.created_at,
        updatedAt: userProfile.updated_at,
      };

      this.updateAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile refresh failed';
      this.updateAuthState({ error: errorMessage, isLoading: false });
      // Keep old state? Or logout? For now keep old state but show error? 
      // Actually better to just log out if we rely on this
      //   localStorage.removeItem(this.STORAGE_KEY);
      //   this.updateAuthState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }

  // Utility methods
  public getUserDisplayName(): string {
    const user = this.getCurrentUser();
    return user?.fullName || user?.email || 'User';
  }

  public getUserInitials(): string {
    const user = this.getCurrentUser();
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  public hasCompletedOnboarding(): boolean {
    const user = this.getCurrentUser();
    return Boolean(user?.onboardingCompleted);
  }

  public isTrialActive(): boolean {
    const user = this.getCurrentUser();
    if (!user?.trialEndsAt) return false;
    return new Date(user.trialEndsAt) > new Date();
  }

  public getDaysUntilTrialEnds(): number {
    const user = this.getCurrentUser();
    if (!user?.trialEndsAt) return 0;
    const trialEnd = new Date(user.trialEndsAt);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export convenience functions
export const getCurrentUser = () => authService.getCurrentUser();
export const isAuthenticated = () => authService.isAuthenticated();
export const isLoading = () => authService.isLoading();
export const getAuthError = () => authService.getError();
export const signIn = (email: string, password: string) => authService.signIn(email, password);
export const signUp = (name: string, email: string, password: string, metadata?: SignUpMetadata) =>
  authService.signUp(name, email, password, metadata);
export const signOut = () => authService.signOut();
export const updateProfile = (updates: Partial<UserProfile>) => authService.updateProfile(updates);
export const refreshProfile = () => authService.refreshProfile();
export const getUserDisplayName = () => authService.getUserDisplayName();
export const getUserInitials = () => authService.getUserInitials();
export const hasCompletedOnboarding = () => authService.hasCompletedOnboarding();
export const isTrialActive = () => authService.isTrialActive();
export const getDaysUntilTrialEnds = () => authService.getDaysUntilTrialEnds();
export const getAccessToken = () => localStorage.getItem('token');
