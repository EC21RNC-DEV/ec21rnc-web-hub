import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api/admin/hidden";

/**
 * 숨김 서비스 관리
 * - 관리자가 삭제(숨김) 처리한 빌트인 서비스는 대시보드에서 숨김
 * - 관리자 페이지에서 복원 가능
 */
export function useHiddenServices() {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.json())
      .then((data: string[]) => setHiddenIds(new Set(data)))
      .catch(() => {});
  }, []);

  const toggleHidden = useCallback(async (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    try {
      await fetch(`${API_BASE}/${id}`, { method: "PUT" });
    } catch { /* offline */ }
  }, []);

  const isHidden = useCallback(
    (id: string): boolean => hiddenIds.has(id),
    [hiddenIds]
  );

  return { hiddenIds, toggleHidden, isHidden };
}
