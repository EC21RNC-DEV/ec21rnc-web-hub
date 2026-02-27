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
  const checkedPortsRef = useRef<Set<number>>(new Set());

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

      checkedPortsRef.current = new Set(current.map((p) => p.port));

      setHealthMap((prev) => {
        const next: Record<number, HealthStatus> = { ...prev };
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
      setHealthMap((prev) => {
        const next: Record<number, HealthStatus> = { ...prev };
        current.forEach((info) => (next[info.port] = "network-error"));
        return next;
      });
    }

    setLastChecked(new Date());
    setIsChecking(false);
  }, []);

  // Incremental check for only new ports (not already checked)
  const checkNew = useCallback(async (newPorts: PortInfo[]) => {
    if (newPorts.length === 0) return;
    try {
      const results = await batchCheck(newPorts);
      newPorts.forEach((p) => checkedPortsRef.current.add(p.port));
      setHealthMap((prev) => {
        const next = { ...prev };
        newPorts.forEach((info) => {
          next[info.port] = results[info.port] ? "reachable" : "unreachable";
        });
        return next;
      });
    } catch {
      // silently fail; next full check will pick them up
    }
  }, []);

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [checkAll]);

  // When port list changes, only check newly added ports
  useEffect(() => {
    const newPorts = portInfos.filter((p) => !checkedPortsRef.current.has(p.port));
    if (newPorts.length > 0) {
      checkNew(newPorts);
    }
  }, [portInfos, checkNew]);

  const getHealth = useCallback(
    (port: number): HealthStatus => healthMap[port] ?? "checking",
    [healthMap]
  );

  return { healthMap, getHealth, checkAll, lastChecked, isChecking, networkAvailable };
}
