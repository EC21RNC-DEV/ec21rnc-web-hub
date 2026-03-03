import { useState, useCallback, useEffect, useRef } from "react";

const SESSION_KEY = "ec21rnc-site-session";
const SESSION_EXPIRY_KEY = "ec21rnc-site-expiry";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${hash.toString(36)}`;
}

const SITE_PASSWORD_HASH = simpleHash("movefast");

function isSessionValid(): boolean {
  try {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!sessionToken || !expiryStr) return false;

    const expiry = Number(expiryStr);
    if (Date.now() > expiry) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function setSession() {
  try {
    const token = `site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, token);
    localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
  } catch { /* empty */ }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch { /* empty */ }
}

function getRemainingMs(): number {
  try {
    const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiryStr) return 0;
    return Math.max(0, Number(expiryStr) - Date.now());
  } catch {
    return 0;
  }
}

export function useSiteAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isSessionValid());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const remaining = getRemainingMs();
    if (remaining <= 0) {
      setIsAuthenticated(false);
      clearSession();
      return;
    }

    timerRef.current = setTimeout(() => {
      setIsAuthenticated(false);
      clearSession();
    }, remaining);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated]);

  const login = useCallback((password: string): boolean => {
    const passwordHash = simpleHash(password);
    if (passwordHash === SITE_PASSWORD_HASH) {
      setIsAuthenticated(true);
      setSession();
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    clearSession();
  }, []);

  return { isAuthenticated, login, logout };
}
