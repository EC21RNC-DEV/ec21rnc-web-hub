import { useState, useEffect, useCallback } from "react";
import type { ServiceStatus } from "./ServiceCard";

const STORAGE_KEY = "ec21rnc-custom-services";
const CATEGORY_MAP_KEY = "ec21rnc-custom-category-map";

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

export function useCustomServices() {
  const [customServices, setCustomServices] = useState<CustomServiceData[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [customCategoryMap, setCustomCategoryMap] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem(CATEGORY_MAP_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customServices));
      // Rebuild category map
      const newMap: Record<string, string[]> = {};
      customServices.forEach((svc) => {
        if (!newMap[svc.category]) newMap[svc.category] = [];
        newMap[svc.category].push(svc.id);
      });
      setCustomCategoryMap(newMap);
      localStorage.setItem(CATEGORY_MAP_KEY, JSON.stringify(newMap));
    } catch {
      // storage full
    }
  }, [customServices]);

  const addService = useCallback((service: Omit<CustomServiceData, "id" | "createdAt">) => {
    const newService: CustomServiceData = {
      ...service,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setCustomServices((prev) => [...prev, newService]);
    return newService.id;
  }, []);

  const removeService = useCallback((id: string) => {
    setCustomServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateService = useCallback((id: string, updates: Partial<Omit<CustomServiceData, "id" | "createdAt">>) => {
    setCustomServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  return {
    customServices,
    customCategoryMap,
    addService,
    removeService,
    updateService,
  };
}
