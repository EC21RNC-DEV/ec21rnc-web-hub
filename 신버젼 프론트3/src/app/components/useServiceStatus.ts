import { useState, useEffect, useCallback } from "react";
import type { ServiceStatus } from "./ServiceCard";

const API_BASE = "/api/admin/status";

export type StatusOverrides = Record<string, ServiceStatus>;

export function useServiceStatus() {
  const [overrides, setOverrides] = useState<StatusOverrides>({});

  // Fetch from API on mount
  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.json())
      .then((data: StatusOverrides) => setOverrides(data))
      .catch(() => {
        try {
          const stored = localStorage.getItem("ec21rnc-service-status");
          if (stored) setOverrides(JSON.parse(stored));
        } catch { /* empty */ }
      });
  }, []);

  const setStatus = useCallback(async (id: string, status: ServiceStatus) => {
    setOverrides((prev) => ({ ...prev, [id]: status }));
    try {
      await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch { /* offline */ }
  }, []);

  const resetStatus = useCallback(async (id: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    } catch { /* offline */ }
  }, []);

  const resetAll = useCallback(async () => {
    setOverrides({});
    try {
      await fetch(API_BASE, { method: "DELETE" });
    } catch { /* offline */ }
  }, []);

  const getStatus = useCallback(
    (id: string, defaultStatus: ServiceStatus): ServiceStatus => {
      return overrides[id] ?? defaultStatus;
    },
    [overrides]
  );

  return { overrides, setStatus, resetStatus, resetAll, getStatus };
}
