import { useState, useEffect, useCallback } from "react";
import type { ServiceStatus } from "./ServiceCard";

const STORAGE_KEY = "ec21rnc-service-status";

export type StatusOverrides = Record<string, ServiceStatus>;

export function useServiceStatus() {
  const [overrides, setOverrides] = useState<StatusOverrides>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // storage full or unavailable
    }
  }, [overrides]);

  const setStatus = useCallback((id: string, status: ServiceStatus) => {
    setOverrides((prev) => ({ ...prev, [id]: status }));
  }, []);

  const resetStatus = useCallback((id: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setOverrides({});
  }, []);

  const getStatus = useCallback(
    (id: string, defaultStatus: ServiceStatus): ServiceStatus => {
      return overrides[id] ?? defaultStatus;
    },
    [overrides]
  );

  return { overrides, setStatus, resetStatus, resetAll, getStatus };
}
