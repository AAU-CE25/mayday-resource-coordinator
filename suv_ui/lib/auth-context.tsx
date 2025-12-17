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
  User,
  LoginCredentials,
  RegisterData,
  AuthTokenResponse,
} from "./types";
import {
  getCurrentUser,
  logout as apiLogout,
  getAuthToken,
  login as apiLogin,
  register as apiRegister,
} from "./api-client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithCredentials: (
    credentials: LoginCredentials
  ) => Promise<AuthTokenResponse>;
  registerUser: (data: RegisterData) => Promise<User>;
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
          !pathname?.startsWith("/login") &&
          !pathname?.startsWith("/register")
        ) {
          router.push("/login");
        }
        setChecked(true);
        return;
      }

      // Token exists - fetch user data
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        // If on auth pages with valid session, redirect to app
        if (
          pathname?.startsWith("/login") ||
          pathname?.startsWith("/register")
        ) {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        setUser(null);
        if (
          !pathname?.startsWith("/login") &&
          !pathname?.startsWith("/register")
        ) {
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
      setUser(userData);
      router.push("/");
      return response;
    } catch (error) {
      console.error("Failed to login:", error);
      // Transform API errors into user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          throw new Error("Incorrect email or password");
        }
        if (error.message.includes("403") || error.message.includes("Forbidden")) {
          throw new Error("Access denied");
        }
        if (error.message.includes("Network") || error.message.includes("fetch")) {
          throw new Error("Unable to connect to server. Please try again.");
        }
        // Pass through if already a friendly message
        throw error;
      }
      throw new Error("Login failed. Please try again.");
    }
  };

  const registerUser = async (data: RegisterData): Promise<User> => {
    try {
      const user = await apiRegister(data);
      // After registration, log in automatically
      await apiLogin({ email: data.email, password: data.password });
      const userData = await getCurrentUser();
      setUser(userData);
      router.push("/");
      return user;
    } catch (error) {
      console.error("Failed to register:", error);
      throw error;
    }
  };

  const login = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      router.push("/");
    } catch (error) {
      console.error("Failed to get user after login:", error);
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
        registerUser,
        login,
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
