import { useState, useCallback } from "react";

const SESSION_KEY = "ec21rnc-admin-session";
const API_BASE = "/api/admin/auth";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${hash.toString(36)}`;
}

function isSessionValid(): boolean {
  try {
    return !!localStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}

function setSession() {
  try {
    const token = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, token);
  } catch { /* empty */ }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch { /* empty */ }
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isSessionValid());

  const login = useCallback(async (password: string): Promise<boolean> => {
    const passwordHash = simpleHash(password);
    try {
      const res = await fetch(`${API_BASE}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordHash }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
        setSession();
        return true;
      }
      return false;
    } catch {
      // API unreachable — fall back to default password check
      const defaultHash = simpleHash("Itmaya2009!");
      if (passwordHash === defaultHash) {
        setIsAuthenticated(true);
        setSession();
        return true;
      }
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    clearSession();
  }, []);

  return { isAuthenticated, login, logout };
}
