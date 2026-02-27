import { useState, useEffect, useCallback } from "react";
import type { ServiceStatus } from "./ServiceCard";

const API_BASE = "/api/admin/services/custom";

export interface CustomServiceData {
  id: string;
  name: string;
  description: string;
  port: number;
  defaultStatus: ServiceStatus;
  iconName: string; // key to icon map
  category: string; // category id
  createdAt: string;
}

function buildCategoryMap(services: CustomServiceData[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  services.forEach((svc) => {
    if (!map[svc.category]) map[svc.category] = [];
    map[svc.category].push(svc.id);
  });
  return map;
}

export function useCustomServices() {
  const [customServices, setCustomServices] = useState<CustomServiceData[]>([]);
  const [customCategoryMap, setCustomCategoryMap] = useState<Record<string, string[]>>({});

  // Fetch from API on mount
  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.json())
      .then((data: CustomServiceData[]) => {
        setCustomServices(data);
        setCustomCategoryMap(buildCategoryMap(data));
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem("ec21rnc-custom-services");
          if (stored) {
            const parsed = JSON.parse(stored) as CustomServiceData[];
            setCustomServices(parsed);
            setCustomCategoryMap(buildCategoryMap(parsed));
          }
        } catch { /* empty */ }
      });
  }, []);

  const addService = useCallback(async (service: Omit<CustomServiceData, "id" | "createdAt">) => {
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });
      const newService: CustomServiceData = await res.json();
      setCustomServices((prev) => {
        const next = [...prev, newService];
        setCustomCategoryMap(buildCategoryMap(next));
        return next;
      });
      return newService.id;
    } catch {
      const newService: CustomServiceData = {
        ...service,
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setCustomServices((prev) => {
        const next = [...prev, newService];
        setCustomCategoryMap(buildCategoryMap(next));
        return next;
      });
      return newService.id;
    }
  }, []);

  const removeService = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    } catch { /* continue with local removal */ }
    setCustomServices((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setCustomCategoryMap(buildCategoryMap(next));
      return next;
    });
  }, []);

  const updateService = useCallback(async (id: string, updates: Partial<Omit<CustomServiceData, "id" | "createdAt">>) => {
    try {
      await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch { /* continue with local update */ }
    setCustomServices((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setCustomCategoryMap(buildCategoryMap(next));
      return next;
    });
  }, []);

  return {
    customServices,
    customCategoryMap,
    addService,
    removeService,
    updateService,
  };
}
