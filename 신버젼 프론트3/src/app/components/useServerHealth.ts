import { useState, useEffect, useCallback, useRef } from "react";
import { DOMAIN, servicesData } from "./services-data";

export type HealthStatus = "reachable" | "unreachable" | "checking" | "network-error";

const PING_TIMEOUT = 5000; // 5 seconds
const REFRESH_INTERVAL = 30000; // 30 seconds

// port → domain path lookup
const portPathMap: Record<number, string> = {};
servicesData.forEach((s) => { portPathMap[s.port] = s.path; });

async function pingPort(port: number): Promise<"reachable" | "unreachable"> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

  const path = portPathMap[port];
  const url = path ? `${DOMAIN}${path}` : `http://203.242.139.254:${port}`;

  try {
    await fetch(url, {
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

export function useServerHealth(ports: number[]) {
  const [healthMap, setHealthMap] = useState<Record<number, HealthStatus>>({});
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState<boolean | null>(null);
  const portsRef = useRef(ports);
  portsRef.current = ports;

  const checkAll = useCallback(async () => {
    const currentPorts = portsRef.current;
    if (currentPorts.length === 0) return;

    setIsChecking(true);

    // Set all to checking
    setHealthMap(() => {
      const next: Record<number, HealthStatus> = {};
      currentPorts.forEach((p) => (next[p] = "checking"));
      return next;
    });

    // Check all in parallel
    const results = await Promise.all(
      currentPorts.map(async (port) => {
        const status = await pingPort(port);
        return { port, status };
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
