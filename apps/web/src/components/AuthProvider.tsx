"use client";

import type { UserDto } from "@rubies/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiRequestError, clientApi } from "@/lib/client-api";
import { applyServerCart, pushLocalCartToServer } from "@/lib/cart";

type AuthContextValue = {
  user: UserDto | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserDto | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await clientApi.me();
      setUser(data.user);
      applyServerCart(await pushLocalCartToServer());
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setUser(null);
        // Still ensure guest cookie + cart exist
        try {
          applyServerCart(await pushLocalCartToServer());
        } catch {
          /* API may be down */
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    await pushLocalCartToServer();
    const data = await clientApi.login({ email, password });
    setUser(data.user);
    if (data.cart) {
      applyServerCart(data.cart);
    } else {
      applyServerCart(await clientApi.getCart());
    }
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      name?: string;
      phone?: string;
    }) => {
      await pushLocalCartToServer();
      const data = await clientApi.register(input);
      setUser(data.user);
      applyServerCart(await clientApi.getCart());
    },
    [],
  );

  const logout = useCallback(async () => {
    await clientApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, login, register, logout, setUser }),
    [user, loading, refresh, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
