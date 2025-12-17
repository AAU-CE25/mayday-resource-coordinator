"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type {
  UserResponse,
  LoginCredentials,
  AuthTokenResponse,
} from "./types";
import {
  getCurrentUser,
  logout as apiLogout,
  getAuthToken,
  clearAuthToken,
  login as apiLogin,
} from "./api-client";

// Roles that are allowed to access the coordinator dashboard
const ALLOWED_ROLES = ["AUTHORITY", "VC"];

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  loginWithCredentials: (
    credentials: LoginCredentials
  ) => Promise<AuthTokenResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Only check auth on mount
  useEffect(() => {
    if (checked) return;

    async function loadUser() {
      const token = getAuthToken();

      // No token - redirect to login if not already there
      if (!token) {
        setIsLoading(false);
        if (
          !pathname?.startsWith("/login")
        ) {
          router.push("/login");
        }
        setChecked(true);
        return;
      }

      // Token exists - fetch user data
      try {
        const userData = await getCurrentUser();
        
        // Check if user has appropriate role for dashboard
        if (!ALLOWED_ROLES.includes(userData.role)) {
          clearAuthToken();
          setUser(null);
          setIsLoading(false);
          setChecked(true);
          if (!pathname?.startsWith("/login")) {
            router.push("/login");
          }
          return;
        }
        
        setUser(userData);

        // If on login page with valid session, redirect to app
        if (pathname?.startsWith("/login")) {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        setUser(null);
        if (!pathname?.startsWith("/login")) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
        setChecked(true);
      }
    }

    loadUser();
  }, [checked, pathname, router]);

  const loginWithCredentials = async (
    credentials: LoginCredentials
  ): Promise<AuthTokenResponse> => {
    try {
      const response = await apiLogin(credentials);
      const userData = await getCurrentUser();
      
      // Check if user has appropriate role for dashboard
      if (!ALLOWED_ROLES.includes(userData.role)) {
        clearAuthToken();
        throw new Error("Access denied. This dashboard is for coordinators and administrators only.");
      }
      
      setUser(userData);
      router.push("/");
      return response;
    } catch (error) {
      console.error("Failed to login:", error);
      throw error;
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    router.push("/login");
  };

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithCredentials,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
