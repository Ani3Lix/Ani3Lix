import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { User } from "@/types";

// Authentication context interface
interface AuthContextType {
  user: User | null; // Current authenticated user
  isLoading: boolean; // Authentication check in progress
  isAuthenticated: boolean; // Whether user is logged in
  login: (identifier: string, password: string) => Promise<void>; // Login function
  register: (userData: RegisterData) => Promise<void>; // Registration function
  logout: () => void; // Logout function
  updateProfile: (data: ProfileUpdateData) => Promise<void>; // Profile update function
  hasRole: (role: string) => boolean; // Role checking utility
}

// Registration form data interface
interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

// Profile update data interface
interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

// Authentication response interface
interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Create authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
const TOKEN_KEY = "ani3lix_access_token";
const REFRESH_TOKEN_KEY = "ani3lix_refresh_token";

const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Authentication provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Query to fetch current user data
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!getAccessToken(), // Only run if token exists
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set user data when query succeeds
  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
    } else if (error && getAccessToken()) {
      // Token might be expired, try to refresh
      attemptTokenRefresh();
    }
  }, [userData, error]);

  // Attempt to refresh access token using refresh token
  const attemptTokenRefresh = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      setUser(null);
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/auth/refresh", {
        refreshToken,
      });
      const data = await response.json();
      
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      
      // Refetch user data with new token
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearTokens();
      setUser(null);
    }
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ identifier, password }: { identifier: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", {
        identifier,
        password,
      });
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setUser(data.user);
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      console.error("Login failed:", error);
      throw error;
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setUser(data.user);
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      console.error("Registration failed:", error);
      throw error;
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileUpdateData) => {
      const response = await apiRequest("PUT", "/api/users/profile", profileData);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      
      // Update user data in cache
      queryClient.setQueryData(["/api/auth/me"], { user: data.user });
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
      throw error;
    },
  });

  // Authentication functions
  const login = async (identifier: string, password: string): Promise<void> => {
    await loginMutation.mutateAsync({ identifier, password });
  };

  const register = async (userData: RegisterData): Promise<void> => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = (): void => {
    clearTokens();
    setUser(null);
    
    // Clear all queries from cache
    queryClient.clear();
  };

  const updateProfile = async (data: ProfileUpdateData): Promise<void> => {
    await updateProfileMutation.mutateAsync(data);
  };

  // Role checking utility function
  const hasRole = (requiredRole: string): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<string, number> = {
      user: 1,
      moderator: 2,
      admin: 3,
      site_owner: 4,
    };
    
    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  // Context value object
  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading && !!getAccessToken(),
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use authentication context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, hasRole, user } = useAuth();

    // Show loading spinner while checking authentication
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">Please log in to access this page.</p>
            <a 
              href="/login" 
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth"
            >
              Go to Login
            </a>
          </div>
        </div>
      );
    }

    // Check role permissions if required
    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Required role: {requiredRole} | Your role: {user?.role}
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
