import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api/admin/services/overrides";

export interface ServiceOverride {
  name?: string;
  description?: string;
  port?: number;
  path?: string;
  category?: string;
  iconName?: string;
}

export function useServiceOverrides() {
  const [overrides, setOverrides] = useState<Record<string, ServiceOverride>>({});

  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.json())
      .then((data: Record<string, ServiceOverride>) => setOverrides(data))
      .catch(() => {
        try {
          const stored = localStorage.getItem("ec21rnc-service-overrides");
          if (stored) setOverrides(JSON.parse(stored));
        } catch { /* empty */ }
      });
  }, []);

  const updateOverride = useCallback(async (id: string, updates: ServiceOverride) => {
    try {
      await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch {
      // Save to localStorage as fallback
      const next = { ...overrides, [id]: { ...overrides[id], ...updates } };
      localStorage.setItem("ec21rnc-service-overrides", JSON.stringify(next));
    }
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  }, [overrides]);

  const getOverriddenName = useCallback((id: string, defaultName: string) => {
    return overrides[id]?.name || defaultName;
  }, [overrides]);

  const getOverriddenDescription = useCallback((id: string, defaultDesc: string) => {
    return overrides[id]?.description || defaultDesc;
  }, [overrides]);

  return { overrides, updateOverride, getOverriddenName, getOverriddenDescription };
}
