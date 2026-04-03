import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api/admin/deleted";

export function useDeletedServices() {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.json())
      .then((data: string[]) => { setDeletedIds(new Set(data)); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const deleteService = useCallback(async (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
    try {
      await fetch(`${API_BASE}/${id}`, { method: "PUT" });
    } catch { /* offline */ }
  }, []);

  const restoreService = useCallback(async (id: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      await fetch(`${API_BASE}/${id}`, { method: "PUT" });
    } catch { /* offline */ }
  }, []);

  const isDeleted = useCallback(
    (id: string): boolean => deletedIds.has(id),
    [deletedIds]
  );

  return { deletedIds, deleteService, restoreService, isDeleted, loaded };
}
