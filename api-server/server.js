const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, "data");

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

// =====================
// Custom Services API
// =====================

app.get("/api/admin/services/custom", (_req, res) => {
  const services = readJSON("custom-services.json", []);
  res.json(services);
});

app.post("/api/admin/services/custom", (req, res) => {
  const services = readJSON("custom-services.json", []);
  const { name, description, port, path: svcPath, defaultStatus, iconName, category } = req.body;

  if (!name || !port) {
    return res.status(400).json({ error: "name and port are required" });
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
    createdAt: new Date().toISOString(),
  };

  services.push(newService);
  writeJSON("custom-services.json", services);
  res.status(201).json(newService);
});

app.put("/api/admin/services/custom/:id", (req, res) => {
  const services = readJSON("custom-services.json", []);
  const idx = services.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "service not found" });

  const { name, description, port, path: svcPath, defaultStatus, iconName, category } = req.body;
  if (name !== undefined) services[idx].name = name;
  if (description !== undefined) services[idx].description = description;
  if (port !== undefined) services[idx].port = Number(port);
  if (svcPath !== undefined) services[idx].path = svcPath || undefined;
  if (defaultStatus !== undefined) services[idx].defaultStatus = defaultStatus;
  if (iconName !== undefined) services[idx].iconName = iconName;
  if (category !== undefined) services[idx].category = category;

  writeJSON("custom-services.json", services);
  res.json(services[idx]);
});

app.delete("/api/admin/services/custom/:id", (req, res) => {
  let services = readJSON("custom-services.json", []);
  const before = services.length;
  services = services.filter((s) => s.id !== req.params.id);
  if (services.length === before) return res.status(404).json({ error: "service not found" });

  writeJSON("custom-services.json", services);
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

// Health check
app.get("/api/admin/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Admin API server running on port ${PORT}`);
});
