import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api/admin/admin-only";

/**
 * 관리자 전용 서비스 관리
 * - adminOnly로 설정된 서비스는 관리자 로그인 상태에서만 대시보드에 표시
 * - 일반 사용자(비로그인)에게는 숨김 처리
 */
export function useAdminOnly() {
  const [adminOnlyIds, setAdminOnlyIds] = useState<Set<string>>(new Set());

  // Fetch from API on mount
  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.json())
      .then((data: string[]) => setAdminOnlyIds(new Set(data)))
      .catch(() => {
        try {
          const stored = localStorage.getItem("ec21rnc-admin-only-services");
          if (stored) setAdminOnlyIds(new Set(JSON.parse(stored)));
        } catch { /* empty */ }
      });
  }, []);

  const toggleAdminOnly = useCallback(async (id: string) => {
    setAdminOnlyIds((prev) => {
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

  const isAdminOnly = useCallback(
    (id: string): boolean => adminOnlyIds.has(id),
    [adminOnlyIds]
  );

  return { adminOnlyIds, toggleAdminOnly, isAdminOnly };
}
