import { useState, useEffect, useCallback } from "react";

type ServiceOrderMap = Record<string, string[]>;

export function useServiceOrder() {
  const [order, setOrder] = useState<ServiceOrderMap>({});

  useEffect(() => {
    fetch("/api/admin/service-order")
      .then((r) => r.json())
      .then((data) => setOrder(data))
      .catch(() => {});
  }, []);

  const saveOrder = useCallback(async (categoryId: string, orderedIds: string[]) => {
    setOrder((prev) => ({ ...prev, [categoryId]: orderedIds }));
    try {
      await fetch("/api/admin/service-order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, orderedIds }),
      });
    } catch { /* noop */ }
  }, []);

  const applyOrder = useCallback((categoryId: string, defaultIds: string[]): string[] => {
    const saved = order[categoryId];
    if (!saved || saved.length === 0) return defaultIds;
    const ordered = saved.filter((id) => defaultIds.includes(id));
    const remaining = defaultIds.filter((id) => !saved.includes(id));
    return [...ordered, ...remaining];
  }, [order]);

  return { order, saveOrder, applyOrder };
}
