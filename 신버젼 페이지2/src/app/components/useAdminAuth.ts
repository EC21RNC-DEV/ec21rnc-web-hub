import { useState, useCallback, useEffect, useRef } from "react";

const PASSWORD_KEY = "ec21rnc-admin-password";
const SESSION_KEY = "ec21rnc-admin-session";
const SESSION_EXPIRY_KEY = "ec21rnc-admin-expiry";
const DEFAULT_PASSWORD = "Itmaya2009!";
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${hash.toString(36)}`;
}

function getStoredPasswordHash(): string {
  try {
    const stored = localStorage.getItem(PASSWORD_KEY);
    if (stored) return stored;
  } catch { /* empty */ }
  const defaultHash = simpleHash(DEFAULT_PASSWORD);
  try {
    localStorage.setItem(PASSWORD_KEY, defaultHash);
  } catch { /* empty */ }
  return defaultHash;
}

function isSessionValid(): boolean {
  try {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!sessionToken || !expiryStr) return false;

    // Check expiry
    const expiry = Number(expiryStr);
    if (Date.now() > expiry) {
      // Expired — clear
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      return false;
    }

    // Check password hash match
    const currentHash = getStoredPasswordHash();
    return sessionToken === currentHash;
  } catch {
    return false;
  }
}

function setSession() {
  try {
    const currentHash = getStoredPasswordHash();
    localStorage.setItem(SESSION_KEY, currentHash);
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

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isSessionValid());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-logout when session expires
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
    const inputHash = simpleHash(password);
    const storedHash = getStoredPasswordHash();
    if (inputHash === storedHash) {
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

  const changePassword = useCallback((currentPassword: string, newPassword: string): boolean => {
    const currentHash = simpleHash(currentPassword);
    const storedHash = getStoredPasswordHash();
    if (currentHash !== storedHash) return false;
    const newHash = simpleHash(newPassword);
    try {
      localStorage.setItem(PASSWORD_KEY, newHash);
    } catch { /* empty */ }
    setSession();
    return true;
  }, []);

  return { isAuthenticated, login, logout, changePassword };
}
