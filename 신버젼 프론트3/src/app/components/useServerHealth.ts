import { useState, useEffect, useCallback, useRef } from "react";
import { DOMAIN } from "./services-data";

export type HealthStatus = "reachable" | "unreachable" | "checking" | "network-error";

export interface PortInfo {
  port: number;
  path?: string;
}

const PING_TIMEOUT = 8000; // 8 seconds
const REFRESH_INTERVAL = 30000; // 30 seconds

async function pingPort(port: number, path?: string): Promise<"reachable" | "unreachable"> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

  const url = path ? `${DOMAIN}${path}` : `http://203.242.139.254:${port}`;

  try {
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    });
    return "reachable";
  } catch {
    return "unreachable";
  } finally {
    clearTimeout(timeoutId);
  }
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

    // Check all in parallel, passing path for domain-based health check
    const results = await Promise.all(
      current.map(async (info) => {
        const status = await pingPort(info.port, info.path);
        return { port: info.port, status };
      })
    );

    // If ALL ports are unreachable, likely the network/server itself is not accessible
    const reachableCount = results.filter((r) => r.status === "reachable").length;
    const allUnreachable = reachableCount === 0 && results.length > 0;
    setNetworkAvailable(!allUnreachable);

    setHealthMap(() => {
      const next: Record<number, HealthStatus> = {};
      results.forEach(({ port, status }) => {
        next[port] = allUnreachable ? "network-error" : status;
      });
      return next;
    });

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
