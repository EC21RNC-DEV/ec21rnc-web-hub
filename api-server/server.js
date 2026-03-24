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
  for (const hostname of UPSTREAM_HOSTS) {
    // First try with ec21rnc-agent.com ($host) - preferred for Streamlit/WebSocket
    const withHost = await httpProbe(hostname, port, "ec21rnc-agent.com");
    if (withHost >= 200 && withHost < 400) {
      return { upstream: hostname, hostHeader: "$host" };
    }
    // Then try with proxy_host style (hostname:port) - for services with own nginx
    const withProxy = await httpProbe(hostname, port, `${hostname}:${port}`);
    if (withProxy >= 200 && withProxy < 400) {
      return { upstream: hostname, hostHeader: "$proxy_host" };
    }
    // If we got any response (even 4xx), this host is reachable - use $proxy_host
    if (withHost > 0 || withProxy > 0) {
      return { upstream: hostname, hostHeader: "$proxy_host" };
    }
  }
  return { upstream: UPSTREAM_HOSTS[0], hostHeader: "$host" }; // fallback
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

  const blocks = withPath.map((s, i) => {
    const p = s.path.replace(/\/+$/, ""); // strip trailing slash
    const { upstream, hostHeader } = resolved[i];

    // ── SPA mode: serve iframe wrapper page ──
    // React/Vue SPA는 client-side router가 window.location.pathname을 읽어서
    // subpath 배포 시 경로를 인식 못 함. iframe으로 감싸면 앱은 "/"에서 실행되므로
    // 앱 코드 수정 없이 동작함.
    if (s.spaMode) {
      // SPA iframe: proxy entire app under __app__/ subpath
      // iframe loads from same HTTPS domain to avoid mixed content
      // All requests inside iframe go through __app__/ proxy
      const title = s.name.replace(/'/g, "\\'");
      return `# Custom (SPA iframe): ${s.name} → ${upstream}:${s.port}
location ${p} {
    return 301 $scheme://$host${p}/;
}
location = ${p}/ {
    add_header Content-Type text/html;
    return 200 '<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>${title}</title><style>*{margin:0;padding:0}html,body{height:100%;overflow:hidden}iframe{width:100%;height:100%;border:none}</style></head><body><iframe src="${p}/__app__/"></iframe></body></html>';
}
location ${p}/__app__/ {
    proxy_pass http://${upstream}:${s.port}/;
    proxy_set_header Host ${hostHeader};
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
    sub_filter_once off;
    sub_filter_types text/html;
    sub_filter 'src="/' 'src="${p}/__app__/';
    sub_filter "src='/" "src='${p}/__app__/";
    sub_filter 'href="/' 'href="${p}/__app__/';
    sub_filter "href='/" "href='${p}/__app__/";
    sub_filter 'action="/' 'action="${p}/__app__/';
    sub_filter "action='/" "action='${p}/__app__/";
    proxy_set_header Accept-Encoding "";
}`;
    }

    // ── Normal mode: proxy with optional URL rewriting ──
    const jsSnippet = `!function(){if(window.__pathRewritten)return;window.__pathRewritten=1;var b='${p}';function r(u){return typeof u==='string'&&'/'===u[0]&&0!==u.indexOf(b)?b+u:u}var f=window.fetch;window.fetch=function(u,o){return f.call(this,r(u),o)};var x=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(){arguments[1]=r(arguments[1]);return x.apply(this,arguments)};var E=window.EventSource;E&&(window.EventSource=function(u,o){return new E(r(u),o)});var wo=window.open;window.open=function(){arguments[0]=r(arguments[0]);return wo.apply(this,arguments)};var hp=history.pushState;history.pushState=function(s,t,u){return hp.call(this,s,t,r(u))};var hr=history.replaceState;history.replaceState=function(s,t,u){return hr.call(this,s,t,r(u))};if(navigator.sendBeacon){var sb=navigator.sendBeacon.bind(navigator);navigator.sendBeacon=function(u,d){return sb(r(u),d)}}var WS=window.WebSocket;WS&&(window.WebSocket=function(u,p2){return p2?new WS(r(u),p2):new WS(r(u))});var Wk=window.Worker;Wk&&(window.Worker=function(u,o){return new Wk(r(u),o)});if(window.jQuery){var aj=jQuery.ajax;jQuery.ajax=function(u,s2){if(typeof u==='string'){u=r(u)}else if(u&&u.url){u.url=r(u.url)}return aj.call(this,u,s2)}}if(window.axios){var ai=window.axios.interceptors;ai&&ai.request&&ai.request.use(function(c){if(c.url)c.url=r(c.url);return c})}}();`;
    const rewrite = s.preservePath ? `
    proxy_redirect / ${p}/;
    sub_filter_once off;
    sub_filter_types text/html application/javascript text/css;
    sub_filter 'href="/' 'href="${p}/';
    sub_filter "href='/" "href='${p}/";
    sub_filter 'src="/' 'src="${p}/';
    sub_filter "src='/" "src='${p}/";
    sub_filter 'action="/' 'action="${p}/';
    sub_filter "action='/" "action='${p}/";
    sub_filter 'url(/' 'url(${p}/';
    sub_filter '"/api/' '"${p}/api/';
    sub_filter "'/api/" "'${p}/api/";
    sub_filter "fetch('/" "fetch('${p}/";
    sub_filter 'fetch("/' 'fetch("${p}/';
    sub_filter "location.href = '/" "location.href = '${p}/";
    sub_filter 'location.href = "/' 'location.href = "${p}/';
    sub_filter "location.href='/" "location.href='${p}/";
    sub_filter 'location.href="/' 'location.href="${p}/';
    sub_filter "location.replace('/" "location.replace('${p}/";
    sub_filter 'location.replace("/' 'location.replace("${p}/';
    sub_filter "location.assign('/" "location.assign('${p}/";
    sub_filter 'location.assign("/' 'location.assign("${p}/';
    sub_filter "location = '/" "location = '${p}/";
    sub_filter 'location = "/' 'location = "${p}/';
    sub_filter "location.pathname = '/" "location.pathname = '${p}/";
    sub_filter 'location.pathname = "/' 'location.pathname = "${p}/';
    sub_filter "window.open('/" "window.open('${p}/";
    sub_filter 'window.open("/' 'window.open("${p}/';
    sub_filter "axios.get('/" "axios.get('${p}/";
    sub_filter 'axios.get("/' 'axios.get("${p}/';
    sub_filter "axios.post('/" "axios.post('${p}/";
    sub_filter 'axios.post("/' 'axios.post("${p}/';
    sub_filter "axios.put('/" "axios.put('${p}/";
    sub_filter 'axios.put("/' 'axios.put("${p}/';
    sub_filter "axios.delete('/" "axios.delete('${p}/";
    sub_filter 'axios.delete("/' 'axios.delete("${p}/';
    sub_filter "</head>" "<script>${jsSnippet}</script></head>";
    proxy_set_header Accept-Encoding "";` : "";
    const readTimeout = s.preservePath ? "300s" : "60s";
    return `# Custom: ${s.name} → ${upstream}:${s.port} (Host: ${hostHeader}${s.preservePath ? ", rewriteUrls" : ""})
location ${p} {
    return 301 $scheme://$host${p}/;
}
location ${p}/ {
    proxy_pass http://${upstream}:${s.port}/;
    proxy_set_header Host ${hostHeader};
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-Prefix ${p};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout ${readTimeout};
    proxy_buffering off;${rewrite}
}`;
  });

  const conf = blocks.length > 0
    ? `# Auto-generated by admin API - DO NOT EDIT\n\n${blocks.join("\n\n")}\n`
    : "# No custom services with paths\n";

  fs.writeFileSync(path.join(NGINX_CONF_DIR, "custom-services.conf"), conf);
  // Signal nginx to reload
  fs.writeFileSync(path.join(NGINX_CONF_DIR, ".reload"), Date.now().toString());
  console.log(`[nginx] Generated config for ${blocks.length} custom service(s)`);
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

// =====================
// Custom Services API
// =====================

app.get("/api/admin/services/custom", (_req, res) => {
  const services = readJSON("custom-services.json", []);
  res.json(services);
});

app.post("/api/admin/services/custom", async (req, res) => {
  const services = readJSON("custom-services.json", []);
  const { name, description, port, path: svcPath, defaultStatus, iconName, category, preservePath, spaMode } = req.body;

  if (!name || !port) {
    return res.status(400).json({ error: "name and port are required" });
  }

  // Auto-detect preservePath if not explicitly set
  let autoPreservePath = false;
  let detectedType = "generic";
  if (preservePath === undefined) {
    try {
      const detected = await detectService(UPSTREAM_HOSTS[0], Number(port));
      autoPreservePath = detected.needsPreservePath;
      detectedType = detected.detectedType;
      console.log(`[detect] port ${port}: type=${detectedType}, preservePath=${autoPreservePath}`);
    } catch (e) {
      console.error(`[detect] port ${port} failed:`, e.message);
    }
  }

  const newService = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    description: description || "",
    port: Number(port),
    ...(svcPath ? { path: svcPath } : {}),
    defaultStatus: defaultStatus || "online",
    iconName: iconName || "Server",
    category: category || "tools",
    preservePath: preservePath !== undefined ? !!preservePath : autoPreservePath,
    spaMode: !!spaMode,
    detectedType,
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

  const { name, description, port, path: svcPath, defaultStatus, iconName, category, preservePath, spaMode } = req.body;
  if (name !== undefined) services[idx].name = name;
  if (description !== undefined) services[idx].description = description;
  if (port !== undefined) services[idx].port = Number(port);
  if (svcPath !== undefined) services[idx].path = svcPath || undefined;
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
    const req = https.request(
      {
        hostname: "proxy",
        port: 443,
        path: svcPath,
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
