import { useState, useEffect, useCallback, useRef } from "react";

export type HealthStatus = "reachable" | "unreachable" | "checking" | "network-error";

const REFRESH_INTERVAL = 30000; // 30 seconds

async function batchCheck(ports: number[]): Promise<Record<number, boolean>> {
  const res = await fetch("/api/admin/health-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ports }),
  });
  const data: { port: number; reachable: boolean }[] = await res.json();
  const map: Record<number, boolean> = {};
  data.forEach((r) => (map[r.port] = r.reachable));
  return map;
}

export function useServerHealth(ports: number[]) {
  const [healthMap, setHealthMap] = useState<Record<number, HealthStatus>>({});
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState<boolean | null>(null);
  const portsRef = useRef(ports);
  portsRef.current = ports;
  const isFirstCheck = useRef(true);

  const checkAll = useCallback(async () => {
    const current = portsRef.current;
    if (current.length === 0) return;

    setIsChecking(true);

    // Only show "checking" on first load; subsequent checks keep previous values
    if (isFirstCheck.current) {
      setHealthMap(() => {
        const next: Record<number, HealthStatus> = {};
        current.forEach((port) => (next[port] = "checking"));
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
        current.forEach((port) => {
          next[port] = allUnreachable
            ? "network-error"
            : results[port]
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
        current.forEach((port) => (next[port] = "network-error"));
        return next;
      });
    }

    setLastChecked(new Date());
    setIsChecking(false);
  }, []);

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [checkAll]);

  const getHealth = useCallback(
    (port: number): HealthStatus => healthMap[port] ?? "checking",
    [healthMap]
  );

  return { healthMap, getHealth, checkAll, lastChecked, isChecking, networkAvailable };
}
