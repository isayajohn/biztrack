import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "../services/authApi";
import { AUTH_TOKEN_KEY } from "../services/apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  businessRole?: "OWNER" | "MANAGER" | "CASHIER" | "INVENTORY" | "ACCOUNTANT" | "CUSTOM";
  permissions?: string[];
  branch?: { id: string; name: string } | null;
  businessName: string;
  businessId?: string;
  currency: string;
  country?: string;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  businessName: string;
  currency: string;
  country?: string;
  packageId?: string;
};

export type RegisterResult = {
  user: User;
  requiresEmailVerification: boolean;
  verificationEmailSent: boolean;
  verificationEmailError?: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

// ─── Storage keys ─────────────────────────────────────────────────────────────

const TOKEN_KEY = AUTH_TOKEN_KEY;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || isJwtUsable(token)) return token;
  localStorage.removeItem(TOKEN_KEY);
  return null;
}

function persistToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
}

function isJwtUsable(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as {
      exp?: number;
    };
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [isLoading, setIsLoading] = useState(() => Boolean(readStoredToken()));

  const saveAuth = (newUser: User, newToken: string) => {
    persistToken(newToken);
    setUser(newUser);
    setToken(newToken);
  };

  const refreshUser = useCallback(async () => {
    const storedToken = readStoredToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      return;
    }
    const profile = await authApi.getProfile();
    setUser(profile);
    setToken(storedToken);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await authApi.login(email, password);
    saveAuth(loggedInUser, readStoredToken() ?? "");
    return loggedInUser;
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const loggedInUser = await authApi.loginWithGoogle(credential);
    saveAuth(loggedInUser, readStoredToken() ?? "");
    return loggedInUser;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const result = await authApi.register(data);
    if (result.requiresEmailVerification) {
      clearAuth();
      setUser(null);
      setToken(null);
    } else {
      saveAuth(result.user, result.token);
    }
    return {
      user: result.user,
      requiresEmailVerification: result.requiresEmailVerification,
      verificationEmailSent: result.verificationEmailSent,
      verificationEmailError: result.verificationEmailError,
    };
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setToken(null);
    setIsLoading(false);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, ...data };
      return updated;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const storedToken = readStoredToken();

    if (!storedToken) {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoading(true);
    authApi
      .getProfile()
      .then((profile) => {
        if (!isMounted) return;
        setUser(profile);
        setToken(storedToken);
      })
      .catch(() => {
        if (!isMounted) return;
        logout();
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [logout]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener("biztrack:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("biztrack:unauthorized", handleUnauthorized);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        loginWithGoogle,
        register,
        updateUser,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
