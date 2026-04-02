const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, "data");
const NGINX_CONF_DIR = path.join(__dirname, "dynamic-nginx");

const UPSTREAM_HOSTS = ["172.17.0.1", "203.242.139.254"];

// Built-in services (previously hardcoded in nginx.conf)
// These are always included in subdomain generation
const BUILTIN_SERVICES = [
  { path: "/openwebui", upstream: "172.17.0.1", port: 8598 },
  { path: "/emerics-news", upstream: "172.17.0.1", port: 8501 },
  { path: "/emerics-opinion", upstream: "172.17.0.1", port: 8519 },
  { path: "/emerics-monthly", upstream: "172.17.0.1", port: 8533 },
  { path: "/emerics-trend", upstream: "172.17.0.1", port: 8555 },
  { path: "/aif-newsletter", upstream: "172.17.0.1", port: 8503 },
  { path: "/emerics-inspection", upstream: "172.17.0.1", port: 8542 },
  { path: "/gip-daily", upstream: "172.17.0.1", port: 8525 },
  { path: "/nuclear-bid", upstream: "172.17.0.1", port: 8513 },
  { path: "/globecorpo-auto", upstream: "172.17.0.1", port: 8509 },
  { path: "/cifc-issues", upstream: "172.17.0.1", port: 8540 },
  { path: "/cifc-bidding", upstream: "172.17.0.1", port: 8541 },
  { path: "/agri-export", upstream: "172.17.0.1", port: 8518 },
  { path: "/issue-clustering", upstream: "172.17.0.1", port: 8591 },
  { path: "/csf-tools", upstream: "172.17.0.1", port: 8508 },
  { path: "/ai-tools", upstream: "172.17.0.1", port: 8515 },
  { path: "/interview-translator", upstream: "172.17.0.1", port: 8504 },
  { path: "/report-verification", upstream: "172.17.0.1", port: 8590 },
  { path: "/article-extractor", upstream: "172.17.0.1", port: 8592 },
  { path: "/prompt-hub", upstream: "172.17.0.1", port: 8599 },
  { path: "/pdf-converter", upstream: "172.17.0.1", port: 8593 },
  { path: "/agri-custom-market", upstream: "172.17.0.1", port: 8511 },
  { path: "/agri-custom-compete", upstream: "172.17.0.1", port: 8514 },
  { path: "/pet-market", upstream: "172.17.0.1", port: 8522 },
  { path: "/pet-compete", upstream: "172.17.0.1", port: 8524 },
  { path: "/kocca-law", upstream: "172.17.0.1", port: 8516 },
  { path: "/kocca-content", upstream: "172.17.0.1", port: 8517 },
  { path: "/kocca-overseas", upstream: "172.17.0.1", port: 8520 },
  { path: "/kocca-domestic", upstream: "172.17.0.1", port: 8521 },
];

// Middleware
app.use(cors());
app.use(express.json());

// --- Helpers ---

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(filename, fallback) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filepath)) return fallback;
    return JSON.parse(fs.readFileSync(filepath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJSON(filename, data) {
  ensureDataDir();
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// Simple hash (matches frontend simpleHash)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${hash.toString(36)}`;
}

// Init default admin password if not exists
function ensureAdmin() {
  const admin = readJSON("admin.json", null);
  if (!admin) {
    writeJSON("admin.json", { passwordHash: simpleHash("Itmaya2009!") });
  }
}

ensureDataDir();
ensureAdmin();

// --- Host Resolution ---

// HTTP probe: check if hostname:port responds with given Host header
function httpProbe(hostname, port, hostHeader, timeout = 2000) {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname, port, path: "/", method: "GET", timeout, headers: { Host: hostHeader } },
      (res) => { resolve(res.statusCode); res.resume(); }
    );
    req.on("error", () => resolve(0));
    req.on("timeout", () => { req.destroy(); resolve(0); });
    req.end();
  });
}

// Resolve best upstream host AND Host header for a service
// Returns { upstream, hostHeader } where hostHeader is "$host" or "$proxy_host"
async function resolveUpstream(port) {
  let fallbackHost = null;

  for (const hostname of UPSTREAM_HOSTS) {
    const withHost = await httpProbe(hostname, port, "ec21rnc-agent.com");
    if (withHost >= 200 && withHost < 400) {
      return { upstream: hostname, hostHeader: "$host" };
    }
    const withProxy = await httpProbe(hostname, port, `${hostname}:${port}`);
    if (withProxy >= 200 && withProxy < 400) {
      return { upstream: hostname, hostHeader: "$proxy_host" };
    }
    // 4xx/5xx 응답은 fallback 후보로만 저장, 바로 선택하지 않음
    if (!fallbackHost && (withHost > 0 || withProxy > 0)) {
      fallbackHost = hostname;
    }
  }

  // 2xx/3xx 호스트가 없으면 응답이라도 온 호스트 사용, 그것도 없으면 첫번째
  return { upstream: fallbackHost || UPSTREAM_HOSTS[0], hostHeader: "$proxy_host" };
}

// --- Auto-detect Service Type ---

// Probe a backend port to detect if it needs preservePath (URL rewriting)
function detectService(hostname, port, timeout = 5000) {
  return new Promise((resolve) => {
    const result = { needsPreservePath: false, detectedType: "generic" };
    const req = http.request(
      { hostname, port, path: "/", method: "GET", timeout, headers: { Accept: "text/html" } },
      (res) => {
        const status = res.statusCode;
        const server = (res.headers["server"] || "").toLowerCase();
        let body = "";
        res.on("data", (chunk) => { if (body.length < 8000) body += chunk.toString(); });
        res.on("end", () => {
          // Streamlit (TornadoServer)
          if (server.includes("tornadoserver") || body.includes("Streamlit")) {
            result.detectedType = "streamlit";
          }
          // Open WebUI
          else if (body.includes("Open WebUI")) {
            result.detectedType = "openwebui";
          }
          // FastAPI / uvicorn — check for root-relative fetch calls
          else if (server.includes("uvicorn")) {
            result.detectedType = "fastapi";
            if (/fetch\(\s*['"]\//.test(body)) result.needsPreservePath = true;
          }
          // Airflow / redirect-based apps
          else if ([301, 302, 307, 308].includes(status)) {
            result.detectedType = "redirect-app";
            result.needsPreservePath = true;
          }
          // Gradio
          else if (body.includes("gradio") || body.includes("Gradio")) {
            result.detectedType = "gradio";
          }
          // Generic — still check for root-relative fetch/href that would break under subpath
          else if (/fetch\(\s*['"]\//.test(body)) {
            result.needsPreservePath = true;
          }
          resolve(result);
        });
      }
    );
    req.on("error", () => resolve(result));
    req.on("timeout", () => { req.destroy(); resolve(result); });
    req.end();
  });
}

// Expose as API for manual testing
app.get("/api/admin/services/detect/:port", async (req, res) => {
  const port = Number(req.params.port);
  const result = await detectService(UPSTREAM_HOSTS[0], port);
  res.json({ port, ...result });
});

// --- Dynamic Nginx Config Generator ---

async function generateNginxConf() {
  if (!fs.existsSync(NGINX_CONF_DIR)) fs.mkdirSync(NGINX_CONF_DIR, { recursive: true });

  const services = readJSON("custom-services.json", []);
  const withPath = services.filter((s) => s.path && s.port);

  // Resolve upstream host + Host header per service in parallel
  const resolved = await Promise.all(withPath.map((s) => resolveUpstream(s.port)));

  // ── 모든 서비스를 서브도메인으로 연결 (빌트인 + 커스텀) ──
  // path에서 서브도메인 자동 생성: /emerics-news/ → emerics-news.ec21rnc-agent.com

  // Merge builtin + custom services (expand multi-port groups into individual entries)
  const allServices = [
    ...BUILTIN_SERVICES.map((b) => ({ path: b.path, port: b.port, upstream: b.upstream, name: b.path.slice(1) })),
  ];
  for (const s of services) {
    if (s.ports && Array.isArray(s.ports) && s.ports.length > 1) {
      // Multi-port group: each port entry gets its own subdomain
      for (const p of s.ports) {
        const pPath = (p.path || `/${p.label}`).replace(/\/+$/, "");
        const { upstream } = await resolveUpstream(Number(p.port));
        allServices.push({ path: pPath.startsWith("/") ? pPath : `/${pPath}`, port: Number(p.port), upstream, name: p.label });
      }
    } else if (s.path && s.port) {
      const idx = withPath.indexOf(s);
      const upstream = idx >= 0 && resolved[idx] ? resolved[idx].upstream : UPSTREAM_HOSTS[0];
      allServices.push({ path: s.path.replace(/\/+$/, ""), port: s.port, upstream, name: s.name });
    }
  }

  // 1) custom-services.conf: subpath → subdomain 리다이렉트 (커스텀만, 빌트인은 nginx.conf에서 처리)
  const redirectBlocks = withPath.map((s, i) => {
    const p = s.path.replace(/\/+$/, "");
    const subdomain = p.slice(1).replace(/_/g, "-");
    return `# ${s.name} → ${subdomain}.ec21rnc-agent.com
location ${p} {
    return 301 https://${subdomain}.ec21rnc-agent.com/;
}
location ${p}/ {
    return 301 https://${subdomain}.ec21rnc-agent.com/;
}`;
  });

  const conf = redirectBlocks.length > 0
    ? `# Auto-generated by admin API - DO NOT EDIT\n\n${redirectBlocks.join("\n\n")}\n`
    : "# No custom services with paths\n";

  // 기존 파일 읽기 (변경 감지용)
  let prevConf = '', prevSubdomain = '';
  try { prevConf = fs.readFileSync(path.join(NGINX_CONF_DIR, "custom-services.conf"), "utf-8"); } catch {}
  try { prevSubdomain = fs.readFileSync(path.join(NGINX_CONF_DIR, "spa-subdomains.inc"), "utf-8"); } catch {}

  fs.writeFileSync(path.join(NGINX_CONF_DIR, "custom-services.conf"), conf);

  // 2) spa-subdomains.inc: 모든 서비스의 서브도메인 server 블록
  const serverBlocks = allServices.map((s) => {
    const subdomain = s.path.slice(1).replace(/_/g, "-");
    return `# ${s.name} → ${subdomain}.ec21rnc-agent.com → ${s.upstream}:${s.port}
server {
    listen 443 ssl http2;
    server_name ${subdomain}.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://${s.upstream}:${s.port}/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}`;
  });

  const subdomainConf = serverBlocks.length > 0
    ? `# Auto-generated subdomain server blocks\n\n${serverBlocks.join("\n\n")}\n`
    : "# No subdomain services\n";

  fs.writeFileSync(path.join(NGINX_CONF_DIR, "spa-subdomains.inc"), subdomainConf);

  // --- SSL 인증서 자동 갱신 (도메인 목록 변경 시) ---
  const currentDomains = ['ec21rnc-agent.com'];
  allServices.forEach(s => {
    const subdomain = s.path.slice(1).replace(/_/g, '-');
    currentDomains.push(`${subdomain}.ec21rnc-agent.com`);
  });

  const domainsFile = path.join(NGINX_CONF_DIR, '.last-domains');
  let lastDomains = [];
  try { lastDomains = fs.readFileSync(domainsFile, 'utf-8').trim().split('\n'); } catch {}

  if (JSON.stringify([...currentDomains].sort()) !== JSON.stringify([...lastDomains].sort())) {
    const domainArgs = currentDomains.map(d => `-d ${d}`).join(' ');
    fs.writeFileSync(path.join(NGINX_CONF_DIR, '.renew-ssl'), domainArgs);
    fs.writeFileSync(domainsFile, currentDomains.join('\n'));
    console.log(`[ssl] Domain list changed (${currentDomains.length} domains), requesting cert renewal`);
  }

  // 변경된 경우에만 nginx reload
  if (conf !== prevConf || subdomainConf !== prevSubdomain) {
    fs.writeFileSync(path.join(NGINX_CONF_DIR, ".reload"), Date.now().toString());
    console.log(`[nginx] Config changed, reloading (${serverBlocks.length} subdomain services)`);
  } else {
    console.log(`[nginx] No upstream changes detected, skipping reload`);
  }
}

// Debug: show generated nginx config
app.get("/api/admin/nginx-conf", (_req, res) => {
  const confPath = path.join(NGINX_CONF_DIR, "custom-services.conf");
  try {
    const content = fs.readFileSync(confPath, "utf-8");
    res.type("text/plain").send(content);
  } catch {
    res.status(404).send("No config file");
  }
});

// Generate on startup
generateNginxConf();

// 2초마다 upstream 재확인 → 서비스가 늦게 뜨거나 IP 바뀌면 자동 반영
setInterval(() => {
  generateNginxConf().catch(err => console.error('[upstream-recheck] Error:', err.message));
}, 2 * 1000);

// =====================
// Custom Services API
// =====================

app.get("/api/admin/services/custom", (_req, res) => {
  const services = readJSON("custom-services.json", []);
  res.json(services);
});

// 경로/포트 중복 체크 헬퍼
function getExistingPathsAndPorts(excludeId) {
  const services = readJSON("custom-services.json", []);
  const paths = new Set();
  const portsSet = new Set();

  // 빌트인 서비스
  for (const b of BUILTIN_SERVICES) {
    paths.add(b.path.replace(/\/+$/, "").toLowerCase());
    portsSet.add(Number(b.port));
  }

  // 커스텀 서비스 (excludeId는 수정 시 자기 자신 제외)
  for (const s of services) {
    if (excludeId && s.id === excludeId) continue;
    if (s.ports && Array.isArray(s.ports)) {
      for (const p of s.ports) {
        if (p.path) paths.add(p.path.replace(/\/+$/, "").toLowerCase());
        portsSet.add(Number(p.port));
      }
    } else {
      if (s.path) paths.add(s.path.replace(/\/+$/, "").toLowerCase());
      if (s.port) portsSet.add(Number(s.port));
    }
  }
  return { paths, ports: portsSet };
}

function checkDuplicates(newPaths, newPorts, existing) {
  const dupPaths = newPaths.filter(p => existing.paths.has(p.toLowerCase()));
  const dupPorts = newPorts.filter(p => existing.ports.has(p));
  // 추가하려는 항목 내부 중복도 체크
  const selfDupPaths = newPaths.filter((p, i) => newPaths.indexOf(p.toLowerCase()) !== i);
  const selfDupPorts = newPorts.filter((p, i) => newPorts.indexOf(p) !== i);

  const errors = [];
  if (dupPaths.length > 0) errors.push(`경로 중복: ${dupPaths.join(", ")}`);
  if (dupPorts.length > 0) errors.push(`포트 중복: ${dupPorts.join(", ")}`);
  if (selfDupPaths.length > 0) errors.push(`입력 내 경로 중복: ${selfDupPaths.join(", ")}`);
  if (selfDupPorts.length > 0) errors.push(`입력 내 포트 중복: ${selfDupPorts.join(", ")}`);
  return errors;
}

app.post("/api/admin/services/custom", async (req, res) => {
  const services = readJSON("custom-services.json", []);
  const { name, description, port, path: svcPath, ports, defaultStatus, iconName, category, preservePath, spaMode } = req.body;

  if (!name || (!port && (!ports || ports.length === 0))) {
    return res.status(400).json({ error: "name and port (or ports array) are required" });
  }

  // 중복 체크
  const existing = getExistingPathsAndPorts();
  const newPaths = [];
  const newPorts = [];
  if (ports && Array.isArray(ports) && ports.length > 1) {
    for (const p of ports) {
      if (p.path) newPaths.push(p.path.replace(/\/+$/, ""));
      newPorts.push(Number(p.port));
    }
  } else {
    if (svcPath) newPaths.push(svcPath.replace(/\/+$/, ""));
    if (port) newPorts.push(Number(port));
  }
  const dupErrors = checkDuplicates(newPaths, newPorts, existing);
  if (dupErrors.length > 0) {
    return res.status(409).json({ error: dupErrors.join(" / ") });
  }

  const newService = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    description: description || "",
    port: Number(port) || (ports && ports[0] ? Number(ports[0].port) : 0),
    ...(svcPath ? { path: svcPath } : {}),
    ...(ports && ports.length > 1 ? { ports } : {}),
    defaultStatus: defaultStatus || "online",
    iconName: iconName || "Server",
    category: category || "tools",
    preservePath: false,
    spaMode: false,
    createdAt: new Date().toISOString(),
  };

  services.push(newService);
  writeJSON("custom-services.json", services);
  await generateNginxConf();
  res.status(201).json(newService);
});

app.put("/api/admin/services/custom/:id", async (req, res) => {
  const services = readJSON("custom-services.json", []);
  const idx = services.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "service not found" });

  const { name, description, port, path: svcPath, ports, defaultStatus, iconName, category, preservePath, spaMode } = req.body;

  // 중복 체크 (자기 자신 제외)
  const existing = getExistingPathsAndPorts(req.params.id);
  const newPaths = [];
  const newPorts = [];
  if (ports && Array.isArray(ports) && ports.length > 1) {
    for (const p of ports) {
      if (p.path) newPaths.push(p.path.replace(/\/+$/, ""));
      newPorts.push(Number(p.port));
    }
  } else {
    if (svcPath !== undefined ? svcPath : services[idx].path) newPaths.push((svcPath !== undefined ? svcPath : services[idx].path).replace(/\/+$/, ""));
    if (port !== undefined ? port : services[idx].port) newPorts.push(Number(port !== undefined ? port : services[idx].port));
  }
  const dupErrors = checkDuplicates(newPaths, newPorts, existing);
  if (dupErrors.length > 0) {
    return res.status(409).json({ error: dupErrors.join(" / ") });
  }

  if (name !== undefined) services[idx].name = name;
  if (description !== undefined) services[idx].description = description;
  if (port !== undefined) services[idx].port = Number(port);
  if (svcPath !== undefined) services[idx].path = svcPath || undefined;
  if (ports !== undefined) {
    if (Array.isArray(ports) && ports.length > 1) {
      services[idx].ports = ports;
    } else {
      delete services[idx].ports;
    }
  }
  if (defaultStatus !== undefined) services[idx].defaultStatus = defaultStatus;
  if (iconName !== undefined) services[idx].iconName = iconName;
  if (category !== undefined) services[idx].category = category;
  if (preservePath !== undefined) services[idx].preservePath = !!preservePath;
  if (spaMode !== undefined) services[idx].spaMode = !!spaMode;

  writeJSON("custom-services.json", services);
  await generateNginxConf();
  res.json(services[idx]);
});

app.delete("/api/admin/services/custom/:id", async (req, res) => {
  let services = readJSON("custom-services.json", []);
  const before = services.length;
  services = services.filter((s) => s.id !== req.params.id);
  if (services.length === before) return res.status(404).json({ error: "service not found" });

  writeJSON("custom-services.json", services);
  await generateNginxConf();
  res.json({ ok: true });
});

// =====================
// Service Property Overrides API (for built-in services)
// =====================

app.get("/api/admin/services/overrides", (_req, res) => {
  const overrides = readJSON("service-overrides.json", {});
  res.json(overrides);
});

app.put("/api/admin/services/overrides/:id", (req, res) => {
  const overrides = readJSON("service-overrides.json", {});
  const { name, description } = req.body;
  if (!overrides[req.params.id]) overrides[req.params.id] = {};
  if (name !== undefined) overrides[req.params.id].name = name;
  if (description !== undefined) overrides[req.params.id].description = description;
  writeJSON("service-overrides.json", overrides);
  res.json({ ok: true });
});

// =====================
// Status Overrides API
// =====================

app.get("/api/admin/status", (_req, res) => {
  const overrides = readJSON("status-overrides.json", {});
  res.json(overrides);
});

app.put("/api/admin/status/:id", (req, res) => {
  const overrides = readJSON("status-overrides.json", {});
  const { status } = req.body;
  if (!status || !["online", "maintenance", "inactive"].includes(status)) {
    return res.status(400).json({ error: "status must be online, maintenance, or inactive" });
  }

  overrides[req.params.id] = status;
  writeJSON("status-overrides.json", overrides);
  res.json({ ok: true });
});

app.delete("/api/admin/status/:id", (req, res) => {
  const overrides = readJSON("status-overrides.json", {});
  delete overrides[req.params.id];
  writeJSON("status-overrides.json", overrides);
  res.json({ ok: true });
});

app.delete("/api/admin/status", (_req, res) => {
  writeJSON("status-overrides.json", {});
  res.json({ ok: true });
});

// =====================
// Admin Only API
// =====================

app.get("/api/admin/admin-only", (_req, res) => {
  const ids = readJSON("admin-only.json", []);
  res.json(ids);
});

app.put("/api/admin/admin-only/:id", (req, res) => {
  const ids = readJSON("admin-only.json", []);
  const id = req.params.id;
  const idx = ids.indexOf(id);
  if (idx === -1) {
    ids.push(id);
  } else {
    ids.splice(idx, 1);
  }
  writeJSON("admin-only.json", ids);
  res.json({ ok: true, ids });
});

// =====================
// Hidden Services API
// =====================

app.get("/api/admin/hidden", (_req, res) => {
  const ids = readJSON("hidden-services.json", []);
  res.json(ids);
});

app.put("/api/admin/hidden/:id", (req, res) => {
  const ids = readJSON("hidden-services.json", []);
  const id = req.params.id;
  const idx = ids.indexOf(id);
  if (idx === -1) {
    ids.push(id);
  } else {
    ids.splice(idx, 1);
  }
  writeJSON("hidden-services.json", ids);
  res.json({ ok: true, ids });
});

// =====================
// Admin Auth API
// =====================

app.post("/api/admin/auth/verify", (req, res) => {
  const { passwordHash } = req.body;
  if (!passwordHash) return res.status(400).json({ error: "passwordHash is required" });

  const admin = readJSON("admin.json", { passwordHash: simpleHash("Itmaya2009!") });
  const valid = passwordHash === admin.passwordHash;
  res.json({ valid });
});

app.put("/api/admin/auth/password", (req, res) => {
  const { currentHash, newHash } = req.body;
  if (!currentHash || !newHash) {
    return res.status(400).json({ error: "currentHash and newHash are required" });
  }

  const admin = readJSON("admin.json", { passwordHash: simpleHash("Itmaya2009!") });
  if (currentHash !== admin.passwordHash) {
    return res.status(403).json({ error: "current password is incorrect" });
  }

  admin.passwordHash = newHash;
  writeJSON("admin.json", admin);
  res.json({ ok: true });
});

// =====================
// Health Check Proxy
// =====================

// Try all host + Host header combinations in parallel, reachable if ANY returns 2xx/3xx
function probePort(port, timeout = 5000) {
  const probes = [];
  for (const hostname of UPSTREAM_HOSTS) {
    for (const hostHeader of [`${hostname}:${port}`, hostname, "ec21rnc-agent.com", "localhost"]) {
      probes.push(httpProbe(hostname, port, hostHeader, timeout).then((code) => code >= 200 && code < 400));
    }
  }
  return Promise.all(probes).then((results) => results.some(Boolean));
}

// Fallback: check via nginx proxy for Docker-network-only services
function probeViaProxy(svcPath, timeout = 5000) {
  return new Promise((resolve) => {
    const safePath = encodeURI(svcPath);
    const req = https.request(
      {
        hostname: "proxy",
        port: 443,
        path: safePath,
        method: "GET",
        timeout,
        headers: { Host: "ec21rnc-agent.com" },
        rejectUnauthorized: false,
      },
      (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
        res.resume();
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
    req.end();
  });
}

app.post("/api/admin/health-check", async (req, res) => {
  const { portInfos, ports } = req.body;
  const items = portInfos || (ports ? ports.map((p) => ({ port: p })) : null);
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "portInfos or ports array required" });
  }

  const results = await Promise.all(
    items.map(async ({ port, path: svcPath }) => {
      let reachable = await probePort(Number(port));
      if (!reachable && svcPath) {
        reachable = await probeViaProxy(svcPath);
      }
      return { port: Number(port), reachable };
    })
  );

  res.json(results);
});

// Debug: test upstream with different Host headers
app.get("/api/admin/debug-proxy/:port", async (req, res) => {
  const port = Number(req.params.port);
  const results = [];
  for (const hostname of UPSTREAM_HOSTS) {
    const status = await new Promise((resolve) => {
      const r = http.request(
        { hostname, port, path: "/", method: "GET", timeout: 3000 },
        (resp) => { resolve({ hostname, status: resp.statusCode }); resp.resume(); }
      );
      r.on("error", (e) => resolve({ hostname, status: `error: ${e.message}` }));
      r.on("timeout", () => { r.destroy(); resolve({ hostname, status: "timeout" }); });
      r.end();
    });
    results.push(status);
  }
  res.json(results);
});

// Health check
app.get("/api/admin/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Admin API server running on port ${PORT}`);
});
