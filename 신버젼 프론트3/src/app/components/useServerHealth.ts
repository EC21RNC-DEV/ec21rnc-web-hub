import { useState, useEffect, useCallback, useRef } from "react";

export type HealthStatus = "reachable" | "unreachable" | "checking" | "network-error";

export interface PortInfo {
  port: number;
  path?: string;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

async function batchCheck(portInfos: PortInfo[]): Promise<Record<number, boolean>> {
  const res = await fetch("/api/admin/health-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ portInfos }),
  });
  const data: { port: number; reachable: boolean }[] = await res.json();
  const map: Record<number, boolean> = {};
  data.forEach((r) => (map[r.port] = r.reachable));
  return map;
}

export function useServerHealth(portInfos: PortInfo[]) {
  const [healthMap, setHealthMap] = useState<Record<number, HealthStatus>>({});
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState<boolean | null>(null);
  const portInfosRef = useRef(portInfos);
  portInfosRef.current = portInfos;
  const isFirstCheck = useRef(true);

  const checkAll = useCallback(async () => {
    const current = portInfosRef.current;
    if (current.length === 0) return;

    setIsChecking(true);

    // Only show "checking" on first load; subsequent checks keep previous values
    if (isFirstCheck.current) {
      setHealthMap(() => {
        const next: Record<number, HealthStatus> = {};
        current.forEach((info) => (next[info.port] = "checking"));
        return next;
      });
      isFirstCheck.current = false;
    }

    try {
      const results = await batchCheck(current);

      const reachableCount = Object.values(results).filter(Boolean).length;
      const allUnreachable = reachableCount === 0 && current.length > 0;
      setNetworkAvailable(!allUnreachable);

      setHealthMap(() => {
        const next: Record<number, HealthStatus> = {};
        current.forEach((info) => {
          next[info.port] = allUnreachable
            ? "network-error"
            : results[info.port]
              ? "reachable"
              : "unreachable";
        });
        return next;
      });
    } catch {
      // API server itself unreachable
      setNetworkAvailable(false);
      setHealthMap(() => {
        const next: Record<number, HealthStatus> = {};
        current.forEach((info) => (next[info.port] = "network-error"));
        return next;
      });
    }

    setLastChecked(new Date());
    setIsChecking(false);
  }, []);

  // Track port keys to detect newly added ports
  const prevPortKeyRef = useRef("");

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [checkAll]);

  // Re-check when new ports are added (e.g. custom services loaded async)
  useEffect(() => {
    const key = portInfos.map((p) => p.port).sort().join(",");
    if (prevPortKeyRef.current && key !== prevPortKeyRef.current) {
      checkAll();
    }
    prevPortKeyRef.current = key;
  }, [portInfos, checkAll]);

  const getHealth = useCallback(
    (port: number): HealthStatus => healthMap[port] ?? "checking",
    [healthMap]
  );

  return { healthMap, getHealth, checkAll, lastChecked, isChecking, networkAvailable };
}
