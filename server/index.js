import express from "express";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import crypto from "crypto";
import os from "os";
import { spawn } from "child_process";
import pty from "node-pty";
import { welcomeEmail, passwordResetEmail, orderReceiptEmail, newsletterEmail, orderStatusUpdateEmail, adminNewOrderEmail } from "./emailTemplates.js";
import { custom } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load shared root .env first, then override with server/.env
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, ".env") });

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Initialize Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ''), // Rimuove spazi dalla password
  },
});

// Verifica connessione SMTP
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Errore configurazione email:', error);
    } else {
      console.log('✅ Server email pronto per inviare messaggi');
    }
  });
} else {
  console.warn('⚠️ GMAIL_USER / GMAIL_APP_PASSWORD non impostate: invio email disabilitato');
}

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

if (!stripe) {
  console.warn("⚠️ STRIPE_SECRET_KEY non impostata: endpoint checkout Stripe disabilitati");
}

function ensureStripeConfigured(res) {
  if (!stripe) {
    res.status(503).json({
      error: "Stripe is not configured on server",
      missingEnv: "STRIPE_SECRET_KEY",
    });
    return false;
  }
  return true;
}

const app = express();
const PORT = Number(process.env.PORT || 3001);
const hostIp = process.env.VITE_HOST_IP || getLocalIP();
const httpsPort = Number(process.env.VITE_HTTPS_PORT || 443);
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `https://${hostIp}${httpsPort === 443 ? "" : `:${httpsPort}`}`;

// Backend URL - usa la variabile d'ambiente o costruisci con l'IP locale
const BACKEND_URL = process.env.BACKEND_URL || `http://${hostIp}:${PORT}`;
const publicURL = process.env.BACKEND_URL || `http://${hostIp}:${PORT}`;

// Helper function to convert relative image URLs to full URLs
function convertImageUrl(url) {
  if (!url) return url;
  // Se l'URL è già completo (inizia con http:// o https://), restituiscilo così com'è
  if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  // Se l'URL inizia con /uploads/, aggiungi il BACKEND_URL
  if (typeof url === 'string' && url.startsWith('/uploads/')) {
    return `${publicBaseUrl}${url}`;
  }
  return url;
}

// Helper function to convert image URLs in an object
function convertImageUrls(item, fields = []) {
  if (!item) return item;
  const converted = { ...item };
  fields.forEach(field => {
    if (converted[field]) {
      converted[field] = convertImageUrl(converted[field]);
    }
  });
  return converted;
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

// Middleware
// CORS configuration - allow requests from frontend domains
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://legochris.ideovision.com',
      'https://api.ideovision.com',
      process.env.FRONTEND_URL,
      process.env.PUBLIC_BASE_URL,
    ].filter(Boolean);
    
    // Check if origin matches any allowed origin or is a local development URL
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.includes('192.168.')) {
      callback(null, true);
    } else {
      console.log('[CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// Serve public folder for email assets (logo, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Initialize LowDB database
const dbPath = path.join(__dirname, "data.json");
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, { 
  team: [], 
  staff: [], 
  events: [],
  schedule: [],
  team_plus_schedule: [],
  products: [], 
  playlists: [], 
  videos: [], 
  newsletter: [], 
  orders: [],
  passwordResetTokens: [],
  profiles: [],
  bot_modules: {},
  bot_builder_flows: [],
  bot_config: {}
});

await db.read();
db.data ||= { 
  team: [], 
  staff: [], 
  events: [],
  schedule: [],
  team_plus_schedule: [],
  products: [], 
  playlists: [], 
  videos: [], 
  newsletter: [], 
  orders: [],
  passwordResetTokens: [],
  profiles: [],
  bot_modules: {},
  bot_builder_flows: [],
  bot_config: {}
};
db.data.bot_modules ||= {};
db.data.bot_builder_flows ||= [];
db.data.bot_config ||= {};
await db.write();

// Discord Bot Control Panel - foundation
const defaultBotRootPath = path.resolve(process.env.BOT_ROOT_PATH || "/home/gabrycoso/LegoChrisBot_V2");
const defaultBotEntryScript = process.env.BOT_ENTRY_SCRIPT || "src/index.js";
const defaultBotRuntimeCommand = process.env.BOT_RUNTIME_COMMAND || process.env.BOT_NODE_COMMAND || "node";
const defaultPm2ProcessName = process.env.BOT_PM2_PROCESS_NAME || "lc-bot";
const maxTerminalOutputBytes = Number(process.env.BOT_TERMINAL_OUTPUT_LIMIT || 200000);
const commandTimeoutMs = Number(process.env.BOT_COMMAND_TIMEOUT_MS || 60000);
const terminalSessionIdleMs = Number(process.env.BOT_TERMINAL_SESSION_IDLE_MS || 20 * 60 * 1000);
const terminalSessionBufferLimit = Number(process.env.BOT_TERMINAL_SESSION_BUFFER_LIMIT || 400000);
const terminalMaxSessions = Number(process.env.BOT_TERMINAL_MAX_SESSIONS || 3);

const botLogBuffer = [];
const botLogSubscribers = new Set();
const botTerminalSessions = new Map();

function getTerminalShellCommand() {
  if (process.platform === "win32") {
    return {
      command: process.env.BOT_TERMINAL_SHELL || "powershell.exe",
      args: process.env.BOT_TERMINAL_SHELL_ARGS
        ? process.env.BOT_TERMINAL_SHELL_ARGS.split(" ").filter(Boolean)
        : ["-NoLogo"],
    };
  }

  const shell = process.env.BOT_TERMINAL_SHELL || process.env.SHELL || "/bin/bash";
  return {
    command: shell,
    args: process.env.BOT_TERMINAL_SHELL_ARGS
      ? process.env.BOT_TERMINAL_SHELL_ARGS.split(" ").filter(Boolean)
      : ["-l"],
  };
}

function closeTerminalSession(sessionId, reason = "closed") {
  const session = botTerminalSessions.get(sessionId);
  if (!session) return;

  session.closed = true;
  session.closeReason = reason;

  try {
    session.ptyProcess.kill();
  } catch {
    // noop
  }

  for (const res of session.subscribers) {
    try {
      res.write(`data: ${JSON.stringify({ type: "exit", reason, code: session.exitCode ?? null })}\n\n`);
      res.end();
    } catch {
      // noop
    }
  }

  session.subscribers.clear();
  botTerminalSessions.delete(sessionId);
}

function writeTerminalEvent(session, event) {
  for (const res of session.subscribers) {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // noop
    }
  }
}

function appendTerminalChunk(session, chunk) {
  if (!chunk) return;

  session.lastActivity = Date.now();
  session.buffer += chunk;
  if (session.buffer.length > terminalSessionBufferLimit) {
    session.buffer = session.buffer.slice(-terminalSessionBufferLimit);
  }

  writeTerminalEvent(session, { type: "data", chunk });
}

function createTerminalSession(config, cwdRelative = ".", cols = 120, rows = 32) {
  if (botTerminalSessions.size >= terminalMaxSessions) {
    throw new Error(`Limite sessioni terminal raggiunto (${terminalMaxSessions}). Chiudi una sessione esistente.`);
  }

  const cwd = resolveSandboxPath(config, cwdRelative);
  const safeCols = Math.max(40, Math.min(300, Number(cols) || 120));
  const safeRows = Math.max(12, Math.min(120, Number(rows) || 32));
  const shell = getTerminalShellCommand();
  const shellLabel = [shell.command, ...shell.args].join(" ").trim();

  console.log("[PTY] Spawning shell:", shellLabel, "in", cwd, "cols:", safeCols, "rows:", safeRows);

  let ptyProcess;
  try {
    ptyProcess = pty.spawn(shell.command, shell.args, {
      name: "xterm-256color",
      cols: safeCols,
      rows: safeRows,
      cwd,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        COLORTERM: "truecolor",
        FORCE_COLOR: "1",
      },
    });
    console.log("[PTY] Successfully spawned PTY process");
  } catch (err) {
    console.error("[PTY] Error spawning PTY:", err.message);
    throw new Error(`Failed to spawn terminal: ${err.message}`);
  }

  const id = crypto.randomUUID();
  const session = {
    id,
    cwd,
    cwdRelative: relFromBotRoot(config, cwd),
    ptyProcess,
    subscribers: new Set(),
    buffer: "",
    createdAt: Date.now(),
    lastActivity: Date.now(),
    closed: false,
    closeReason: null,
    exitCode: null,
    shell: shellLabel,
  };

  ptyProcess.onData((data) => {
    console.log("[PTY] onData event, chunk size:", data.length);
    appendTerminalChunk(session, data);
  });

  ptyProcess.onExit(({ exitCode }) => {
    console.log("[PTY] onExit event, code:", exitCode);
    session.closed = true;
    session.exitCode = exitCode;
    writeTerminalEvent(session, { type: "exit", code: exitCode ?? null, reason: "process-exit" });
  });

  ptyProcess.onError?.((err) => {
    console.error("[PTY] onError event:", err.message);
    session.closed = true;
    writeTerminalEvent(session, { type: "error", message: err.message });
  });

  botTerminalSessions.set(id, session);
  console.log("[PTY] Session created:", id);
  return session;
}

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of botTerminalSessions.entries()) {
    if (session.closed && now - session.lastActivity > 30_000) {
      closeTerminalSession(id, "closed");
      continue;
    }
    if (!session.closed && now - session.lastActivity > terminalSessionIdleMs) {
      closeTerminalSession(id, "idle-timeout");
    }
  }
}, 30_000);

function pushBotLog(level, message) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message: String(message || "").trimEnd(),
  };
  botLogBuffer.push(entry);
  if (botLogBuffer.length > 2000) {
    botLogBuffer.shift();
  }
  for (const res of botLogSubscribers) {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  }
}

function getBotConfig() {
  const saved = db.data?.bot_config || {};
  const runtimeCommand = saved.runtimeCommand || saved.pythonCommand || defaultBotRuntimeCommand;
  return {
    rootPath: path.resolve(saved.rootPath || defaultBotRootPath),
    entryScript: saved.entryScript || defaultBotEntryScript,
    runtimeCommand,
    pythonCommand: runtimeCommand,
    pm2ProcessName: saved.pm2ProcessName || defaultPm2ProcessName,
  };
}

function ensureBotRootExists(config) {
  if (!fs.existsSync(config.rootPath)) {
    throw new Error(`BOT root not found: ${config.rootPath}`);
  }
}

function resolveSandboxPath(config, relativePath = ".") {
  ensureBotRootExists(config);
  const normalized = String(relativePath || ".").replace(/\\/g, "/");
  const resolved = path.resolve(config.rootPath, normalized);
  if (resolved !== config.rootPath && !resolved.startsWith(`${config.rootPath}${path.sep}`)) {
    throw new Error("Path escapes bot root sandbox");
  }
  return resolved;
}

function relFromBotRoot(config, absolutePath) {
  const rel = path.relative(config.rootPath, absolutePath).replace(/\\/g, "/");
  return rel === "" ? "." : rel;
}

function runCommand(command, args = [], options = {}) {
  const cwd = options.cwd || process.cwd();
  const timeout = options.timeoutMs || commandTimeoutMs;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: true,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeout);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > maxTerminalOutputBytes) {
        stdout = `${stdout.slice(-maxTerminalOutputBytes)}\n...[truncated]`;
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > maxTerminalOutputBytes) {
        stderr = `${stderr.slice(-maxTerminalOutputBytes)}\n...[truncated]`;
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout, stderr, timedOut });
    });
  });
}

function extractPm2Json(stdout) {
  const start = stdout.indexOf("[");
  const end = stdout.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    return [];
  }
  const raw = stdout.slice(start, end + 1);
  return JSON.parse(raw);
}

async function getPm2ProcessInfo(config) {
  const result = await runCommand("pm2", ["jlist"], { cwd: config.rootPath, timeoutMs: 15000 });
  if (result.code !== 0) {
    return {
      pm2Available: false,
      pm2Error: result.stderr || result.stdout || "pm2 command failed",
      process: null,
    };
  }

  let list = [];
  try {
    list = extractPm2Json(result.stdout || "[]");
  } catch {
    list = [];
  }

  const processInfo = list.find((p) => p.name === config.pm2ProcessName) || null;
  return {
    pm2Available: true,
    pm2Error: null,
    process: processInfo,
  };
}

async function getBotStatus() {
  const config = getBotConfig();
  const info = await getPm2ProcessInfo(config);
  const proc = info.process;
  const pm2Status = proc?.pm2_env?.status || "stopped";
  const running = pm2Status === "online";

  const processMemoryBytes = Number(proc?.monit?.memory);
  const processCpuPercent = Number(proc?.monit?.cpu);
  const systemTotalMemoryBytes = os.totalmem();
  const systemFreeMemoryBytes = os.freemem();
  const [loadAvg1 = 0, loadAvg5 = 0, loadAvg15 = 0] = os.loadavg();

  return {
    running,
    pid: proc?.pid || proc?.pid_id || null,
    startedAt: proc?.pm2_env?.pm_uptime || null,
    uptimeMs: proc?.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
    cpuPercent: Number.isFinite(processCpuPercent) ? processCpuPercent : null,
    memoryBytes: Number.isFinite(processMemoryBytes) ? processMemoryBytes : null,
    nodeMemoryBytes: process.memoryUsage().rss,
    systemTotalMemoryBytes,
    systemFreeMemoryBytes,
    loadAvg1,
    loadAvg5,
    loadAvg15,
    rootPath: config.rootPath,
    entryScript: config.entryScript,
    runtimeCommand: config.runtimeCommand,
    pythonCommand: config.runtimeCommand,
    pm2ProcessName: config.pm2ProcessName,
    pm2Installed: info.pm2Available,
    pm2Status,
    pm2Error: info.pm2Error,
    processDetected: Boolean(proc),
  };
}

async function startBotProcess() {
  const config = getBotConfig();
  ensureBotRootExists(config);

  const entryPath = resolveSandboxPath(config, config.entryScript);
  if (!fs.existsSync(entryPath)) {
    throw new Error(`Bot entry script not found: ${entryPath}`);
  }

  const status = await getBotStatus();
  if (status.running) {
    return { ...status, alreadyRunning: true };
  }

  const cmdArgs = [
    "start",
    entryPath,
    "--name",
    config.pm2ProcessName,
    "--interpreter",
    config.runtimeCommand,
    "--cwd",
    config.rootPath,
  ];
  const result = await runCommand("pm2", cmdArgs, { cwd: config.rootPath, timeoutMs: 30000 });

  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || "Unable to start process with pm2");
  }

  pushBotLog("info", `PM2 start: ${config.pm2ProcessName}`);
  if (result.stdout) pushBotLog("stdout", result.stdout);

  return getBotStatus();
}

async function stopBotProcess(force = false) {
  const config = getBotConfig();
  const action = force ? "delete" : "stop";
  const result = await runCommand("pm2", [action, config.pm2ProcessName], {
    cwd: config.rootPath,
    timeoutMs: 30000,
  });

  if (result.code !== 0 && !String(result.stderr || "").toLowerCase().includes("not found")) {
    throw new Error(result.stderr || result.stdout || `Unable to ${action} process`);
  }

  pushBotLog("info", `PM2 ${action}: ${config.pm2ProcessName}`);
  if (result.stdout) pushBotLog("stdout", result.stdout);
  return { stopped: true, ...(await getBotStatus()) };
}

async function restartBotProcess() {
  const config = getBotConfig();
  const status = await getBotStatus();

  if (!status.processDetected) {
    return startBotProcess();
  }

  const result = await runCommand("pm2", ["restart", config.pm2ProcessName], {
    cwd: config.rootPath,
    timeoutMs: 30000,
  });
  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || "Unable to restart process with pm2");
  }

  pushBotLog("info", `PM2 restart: ${config.pm2ProcessName}`);
  if (result.stdout) pushBotLog("stdout", result.stdout);
  return getBotStatus();
}

async function getPm2LogEntries(limit = 200) {
  const safeLimit = Math.max(1, Math.min(2000, Number(limit) || 200));
  const config = getBotConfig();

  const status = await getBotStatus();
  if (!status.pm2Installed) {
    return botLogBuffer.slice(-safeLimit);
  }

  const result = await runCommand(
    "pm2",
    ["logs", config.pm2ProcessName, "--lines", String(safeLimit), "--nostream"],
    { cwd: config.rootPath, timeoutMs: 25000 }
  );

  if (result.code !== 0) {
    const stderr = String(result.stderr || result.stdout || "").toLowerCase();
    if (stderr.includes("not found") || stderr.includes("does not exist")) {
      return [];
    }
    return botLogBuffer.slice(-safeLimit);
  }

  const rawLines = String(result.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line && !line.includes("[TAILING]") && !line.includes("timestamp format"));

  const parsed = rawLines.slice(-safeLimit).map((line) => {
    const levelMatch = line.match(/\b(error|warn|warning|info|debug)\b/i);
    const clean = line.replace(/^\d+\|[^|]+\|\s*/, "").trim();
    return {
      ts: new Date().toISOString(),
      level: (levelMatch?.[1] || "info").toLowerCase(),
      message: clean || line,
    };
  });

  return parsed;
}

async function listDirectory(config, relativePath = ".") {
  const dir = resolveSandboxPath(config, relativePath);
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const mapped = await Promise.all(
    entries.map(async (entry) => {
      const abs = path.join(dir, entry.name);
      const stats = await fs.promises.stat(abs);
      return {
        name: entry.name,
        path: relFromBotRoot(config, abs),
        type: entry.isDirectory() ? "dir" : "file",
        size: stats.size,
        mtime: stats.mtime.toISOString(),
      };
    })
  );

  mapped.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return mapped;
}

async function scanCogs(config) {
  const modules = new Set();

  const configuredScanRoots = String(process.env.BOT_MODULE_DIRS || "src/moderation,src/utilities,cogs")
    .split(",")
    .map((value) => value.trim().replace(/\\/g, "/"))
    .filter(Boolean);

  async function walkModuleDir(scanRoot) {
    let absRoot;
    try {
      absRoot = resolveSandboxPath(config, scanRoot);
    } catch {
      return;
    }
    if (!fs.existsSync(absRoot)) return;

    const isLegacyCogs = scanRoot === "cogs";
    const rootSegments = scanRoot.split("/").filter(Boolean);
    const logicalPrefix = isLegacyCogs ? "" : (rootSegments[rootSegments.length - 1] || "");

    async function walk(relativeDir = "") {
      const absDir = path.join(absRoot, relativeDir);
      const files = await fs.promises.readdir(absDir, { withFileTypes: true });
      for (const entry of files) {
        if (entry.name === "__pycache__") continue;
        if (entry.isDirectory()) {
          await walk(path.join(relativeDir, entry.name));
          continue;
        }
        if (!entry.isFile()) continue;

        if (isLegacyCogs) {
          if (!entry.name.endsWith(".py") || entry.name === "__init__.py") continue;
          const noExt = entry.name.replace(/\.py$/, "");
          const rel = path.join(relativeDir, noExt).replace(/\\/g, ".");
          if (rel || noExt) {
            modules.add(rel || noExt);
          }
          continue;
        }

        if (!/\.(js|mjs|cjs)$/i.test(entry.name)) continue;

        const noExt = entry.name.replace(/\.(js|mjs|cjs)$/i, "");
        const relParts = path.join(relativeDir, noExt).replace(/\\/g, "/").split("/").filter(Boolean);
        const normalizedParts = relParts.filter((part, index) => !(part === "index" && index === relParts.length - 1));
        const moduleParts = [logicalPrefix, ...normalizedParts].filter(Boolean);
        if (moduleParts.length > 0) {
          modules.add(moduleParts.join("."));
        }
      }
    }

    await walk("");
  }

  for (const scanRoot of configuredScanRoots) {
    await walkModuleDir(scanRoot);
  }

  return Array.from(modules).sort((a, b) => a.localeCompare(b));
}

function sanitizeCogName(value, fallback = "generated_command") {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || fallback;
}

function normalizeCogRelativePath(relativePath, fallbackName = "generated_command") {
  const fallbackFile = `src/utilities/generated/${sanitizeCogName(fallbackName)}.js`;
  const raw = String(relativePath || "").trim().replace(/\\/g, "/");
  let normalized = raw || fallbackFile;
  normalized = normalized.replace(/^\/+/, "");
  if (!normalized.startsWith("cogs/") && !normalized.startsWith("src/")) {
    normalized = `src/${normalized}`;
  }
  if (normalized.startsWith("cogs/")) {
    if (!normalized.endsWith(".py")) {
      normalized = `${normalized}.py`;
    }
  } else if (!/\.(js|mjs|cjs)$/i.test(normalized)) {
    normalized = `${normalized}.js`;
  }
  normalized = normalized.replace(/\/+/g, "/");
  if (normalized.endsWith("/__init__.py") || normalized === "cogs/__init__.py") {
    throw new Error("Il builder non puo salvare su __init__.py");
  }
  return normalized;
}

function relativeCogPathToModuleName(relativePath) {
  const normalized = String(relativePath || "").replace(/\\/g, "/");
  if (normalized.startsWith("cogs/") && normalized.endsWith(".py")) {
    const withoutPrefix = normalized.slice("cogs/".length, -".py".length);
    if (!withoutPrefix || withoutPrefix.endsWith("/__init__")) {
      return null;
    }
    return withoutPrefix.split("/").filter(Boolean).join(".");
  }
  if (!normalized.startsWith("src/")) {
    return null;
  }

  const withoutPrefix = normalized.slice("src/".length).replace(/\.(js|mjs|cjs)$/i, "");
  const parts = withoutPrefix.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const [group, ...rest] = parts;
  const normalizedRest = rest.filter((part, index) => !(part === "index" && index === rest.length - 1));
  return [group, ...normalizedRest].filter(Boolean).join(".");
}

function generateNodeBody(node) {
  const config = typeof node?.config === "object" && node.config ? node.config : {};
  const value = String(node.payload || "").replace(/"""/g, "'''");
  switch (node.type) {
    case "log_console":
      return `print(self._render_template("""${value || "log"}""", variables))\n`;
    case "variable_set": {
      const variableName = String(config.variableName || value || "new_variable").replace(/"""/g, "'''");
      const variableType = String(config.valueType || "string").replace(/"""/g, "'''");
      const variableValue = String(config.value || "").replace(/"""/g, "'''");
      return `variables["""${variableName}"""] = self._coerce_literal("""${variableValue}""", """${variableType}""", variables)\n`;
    }
    case "json_save": {
      const filePath = String(config.filePath || value || "data/settings.json").replace(/"""/g, "'''");
      const variableName = String(config.variableName || "").replace(/"""/g, "'''");
      return `json_target = variables.get("""${variableName}""") if """${variableName}""" else variables\nawait self._save_json(self._render_template("""${filePath}""", variables), json_target)\n`;
    }
    case "json_load": {
      const filePath = String(config.filePath || value || "data/settings.json").replace(/"""/g, "'''");
      const targetVariable = String(config.targetVariable || "loaded_data").replace(/"""/g, "'''");
      return `variables["""${targetVariable}"""] = await self._load_json(self._render_template("""${filePath}""", variables))\n`;
    }
    case "send_message":
      return `await self._send_text(target, self._render_template("""${value || "message"}""", variables))\n`;
    case "send_embed": {
      const description = String(config.description || value || "embed").replace(/"""/g, "'''");
      const title = String(config.title || "").replace(/"""/g, "'''");
      const color = String(config.color || "").replace(/"""/g, "'''");
      const footer = String(config.footer || "").replace(/"""/g, "'''");
      const footerIcon = String(config.footerIconUrl || "").replace(/"""/g, "'''");
      const authorName = String(config.authorName || "").replace(/"""/g, "'''");
      const authorIcon = String(config.authorIconUrl || "").replace(/"""/g, "'''");
      const thumbnailUrl = String(config.thumbnailUrl || "").replace(/"""/g, "'''");
      const imageUrl = String(config.imageUrl || "").replace(/"""/g, "'''");
      const componentMode = String(config.componentMode || "none").replace(/"""/g, "'''");
      const buttonsJson = String(config.buttonsJson || "[]").replace(/"""/g, "'''");
      const selectPlaceholder = String(config.selectPlaceholder || "Scegli un'opzione").replace(/"""/g, "'''");
      const selectOptionsJson = String(config.selectOptionsJson || "[]").replace(/"""/g, "'''");
      const selectMinValues = String(config.selectMinValues || "1").replace(/"""/g, "'''");
      const selectMaxValues = String(config.selectMaxValues || "1").replace(/"""/g, "'''");
      const fieldsJson = String(config.fieldsJson || "[]").replace(/"""/g, "'''");
      const timestampMode = String(config.timestampMode || (String(config.timestamp || "false").toLowerCase() === "true" ? "auto" : "none")).replace(/"""/g, "'''");
      const timestampValue = String(config.timestampValue || "").replace(/"""/g, "'''");
      return `embed = discord.Embed(\n    title=self._render_template("""${title}""", variables) or None,\n    description=self._render_template("""${description}""", variables) or None,\n    color=self._parse_embed_color(self._render_template("""${color}""", variables)),\n)\nmedia_files = self._apply_embed_media(embed, variables, """${authorIcon}""", """${footerIcon}""", """${thumbnailUrl}""", """${imageUrl}""")\nself._apply_embed_author(embed, variables, """${authorName}""")\nself._apply_embed_footer(embed, variables, """${footer}""")\nself._apply_embed_fields(embed, variables, """${fieldsJson}""")\nself._apply_embed_timestamp(embed, variables, """${timestampMode}""", """${timestampValue}""")\nview = self._build_embed_view(target, variables, """${componentMode}""", """${buttonsJson}""", """${selectPlaceholder}""", """${selectOptionsJson}""", """${selectMinValues}""", """${selectMaxValues}""")\nawait self._send_embed(target, embed, media_files, view=view)\n`;
    }
    case "add_role":
    case "remove_role": {
      const action = node.type === "add_role" ? "add_roles" : "remove_roles";
      const roleName = String(config.roleName || value || "role").replace(/"""/g, "'''");
      const targetType = String(config.targetType || "author").replace(/"""/g, "'''");
      const targetVariable = String(config.targetVariable || "").replace(/"""/g, "'''");
      return `role_name = self._render_template("""${roleName}""", variables)\nguild = self._get_guild(target)\nmember = await self._resolve_member_target(target, variables, """${targetType}""", """${targetVariable}""")\nrole = self._resolve_role(guild, role_name)\nif role and member:\n    await member.${action}(role)\n`;
    }
    case "condition_text_contains":
      return `content = self._get_content(target)\nif self._render_template("""${value || ""}""", variables) not in content:\n    return\n`;
    case "condition_select": {
      const options = value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);
      if (options.length === 0) {
        return "";
      }
      const clauses = options
        .map((item, index) => {
          const escaped = item.replace(/"""/g, "'''");
          return index === 0
            ? `if self._render_template("""${escaped}""", variables) in content:\n    pass\n`
            : `elif self._render_template("""${escaped}""", variables) in content:\n    pass\n`;
        })
        .join("");
      return `content = self._get_content(target)\n${clauses}else:\n    return\n`;
    }
    case "loop_count": {
      const parsed = Number.parseInt(value, 10);
      const count = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 25) : 3;
      return `for _ in range(${count}):\n    await self._send_text(target, self._render_template("""Loop step""", variables))\n`;
    }
    case "function_call": {
      const functionName = (value || "custom_flow")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "") || "custom_flow";
      const assignTo = String(config.assignTo || "").replace(/"""/g, "'''");
      return `fn = getattr(self, "${functionName}", None)\nif callable(fn):\n    result = await fn(target, variables)\n    self._store_return_values(variables, """${assignTo}""", result)\n`;
    }
    case "function_define":
      return "";
    case "return_values": {
      const values = String(config.values || value || "").replace(/"""/g, "'''");
      return `return self._resolve_return_values("""${values}""", variables)\n`;
    }
    case "call_existing_command": {
      const commandName = (value || "help")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "") || "help";
      return `invoked = await self._invoke_prefixed_command(target, "${commandName}")\nif not invoked:\n    await self._send_text(target, """Il comando ${commandName} richiede un contesto prefix""")\n`;
    }
    default:
      return "";
  }
}

function buildNodeSequence(nodes, edges, startNodeId = null) {
  const byId = new Map((nodes || []).map((n) => [String(n.id), n]));
  const outgoing = new Map();
  for (const edge of edges || []) {
    const from = String(edge.from);
    const to = String(edge.to);
    if (!outgoing.has(from)) outgoing.set(from, []);
    outgoing.get(from).push(to);
  }

  const trigger = startNodeId
    ? byId.get(String(startNodeId))
    : (nodes || []).find((n) => n.type === "trigger_command") || (nodes || [])[0];
  if (!trigger) return [];

  const visited = new Set();
  const sequence = [];
  let current = String(trigger.id);
  while (current && !visited.has(current)) {
    visited.add(current);
    const node = byId.get(current);
    if (!node) break;
    sequence.push(node);
    const nextList = outgoing.get(current) || [];
    current = nextList[0] || "";
  }
  return sequence;
}

async function compileFlowToCog(config, flow, options = {}) {
  const writeToDisk = options.writeToDisk !== false;
  const safeName = sanitizeCogName(flow.name || "generated_command");
  const targetRelativePath = normalizeCogRelativePath(options.outputPath || flow.targetPath, safeName);
  const targetModule = relativeCogPathToModuleName(targetRelativePath);
  const outPath = resolveSandboxPath(config, targetRelativePath);
  if (writeToDisk) {
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  }

  const nodes = Array.isArray(flow.nodes) ? flow.nodes : [];
  const edges = Array.isArray(flow.edges) ? flow.edges : [];
  const sequence = buildNodeSequence(nodes, edges);
  const triggerNode = sequence.find((n) => n.type === "trigger_command");
  const effectiveCommand = String(triggerNode?.payload || flow.command || safeName)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "") || "generated";
  const triggerPrefix = String(triggerNode?.prefix || "/") === "!" ? "!" : "/";
  const commandHandlerName = effectiveCommand
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || "generated";
  const isSlashCommand = triggerPrefix === "/";
  const decorator = isSlashCommand
    ? `@app_commands.command(name="${effectiveCommand}")`
    : `@commands.command(name="${effectiveCommand}")`;
  const commandParameter = isSlashCommand ? "interaction: discord.Interaction" : "ctx";
  const commandTarget = isSlashCommand ? "interaction" : "ctx";

  const bodyFromNodes = sequence
    .filter((n) => n.type !== "trigger_command" && n.type !== "function_define")
    .map((n) => generateNodeBody(n))
    .join("");

  const indentBlock = (code, spaces = 8) => {
    const pad = " ".repeat(spaces);
    return String(code || "")
      .split("\n")
      .map((line) => (line.length ? `${pad}${line}` : ""))
      .join("\n");
  };

  const functionNodes = nodes.filter((n) => n.type === "function_define");
  const functionMethods = functionNodes
    .map((n) => {
      const fnName = String(n.payload || "")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "") || "custom_flow";
      const fnSequence = buildNodeSequence(nodes, edges, n.id)
        .filter((item) => item.id !== n.id && item.type !== "function_define");
      const fnBody = fnSequence.map((item) => generateNodeBody(item)).join("") || "return None\n";
      return `\n    async def ${fnName}(self, target, variables=None):\n        if variables is None:\n            variables = {}\n${indentBlock(fnBody, 8)}\n`;
    })
    .join("");

  const fallbackMessage = String(flow.message || "Command executed").replace(/"""/g, "'''");
  const body = bodyFromNodes || `print("""Avvio comando ${effectiveCommand} avvenuto""")\nawait self._send_text(target, """${fallbackMessage}""")\n`;
  const commandBody = indentBlock(body, 8);

  const className = `${safeName[0].toUpperCase() + safeName.slice(1)}Cog`;
  const runtimeHelpers = `
    async def _send_text(self, target, message):
        if isinstance(target, discord.Interaction):
            if target.response.is_done():
                await target.followup.send(message)
            else:
                await target.response.send_message(message)
            return
        await target.send(message)

    async def _send_embed(self, target, embed, files=None, view=None):
      files = list(files or [])
      if isinstance(target, discord.Interaction):
        if target.response.is_done():
          await target.followup.send(embed=embed, files=files, view=view)
        else:
          await target.response.send_message(embed=embed, files=files, view=view)
        return
      await target.send(embed=embed, files=files, view=view)

    def _get_guild(self, target):
        return getattr(target, "guild", None)

    def _get_author(self, target):
        if isinstance(target, discord.Interaction):
            return getattr(target, "user", None)
        return getattr(target, "author", None)

    def _get_content(self, target):
        message = getattr(target, "message", None)
        if message and getattr(message, "content", None):
            return message.content
        data = getattr(target, "data", None)
        if isinstance(data, dict):
            options = data.get("options") or []
            values = []
            for option in options:
                if isinstance(option, dict) and option.get("value") is not None:
                    values.append(str(option["value"]))
            return " ".join(values)
        return ""

    def _render_template(self, value, variables):
        rendered = str(value or "")
        for key, item in (variables or {}).items():
            rendered = rendered.replace(f"{{{{{key}}}}}", str(item))
        return rendered

    def _parse_embed_color(self, value):
        raw = str(value or "").strip().lstrip("#")
        if not raw:
            return None
        try:
            return discord.Color(int(raw, 16))
        except ValueError:
            return None

    def _apply_embed_footer(self, embed, variables, text_value):
        text = self._render_template(text_value, variables)
        kwargs = {}
        if text:
            kwargs["text"] = text
        if kwargs:
            embed.set_footer(**kwargs)

    def _apply_embed_author(self, embed, variables, name_value):
        name = self._render_template(name_value, variables)
        kwargs = {}
        if name:
            kwargs["name"] = name
        if kwargs:
            embed.set_author(**kwargs)

    def _sanitize_function_name(self, value):
      raw = str(value or "").strip().lower()
      normalized = "".join(ch if ch.isalnum() or ch == "_" else "_" for ch in raw)
      normalized = "_".join(part for part in normalized.split("_") if part)
      return normalized

    async def _run_component_function(self, function_name, interaction, base_variables=None):
      fn_name = self._sanitize_function_name(function_name)
      if not fn_name:
        return None
      fn = getattr(self, fn_name, None)
      if not callable(fn):
        return None
      scoped_variables = dict(base_variables or {})
      scoped_variables["component_user_id"] = getattr(getattr(interaction, "user", None), "id", None)
      scoped_variables["component_custom_id"] = getattr(getattr(interaction, "data", None), "get", lambda *_: None)("custom_id") if isinstance(getattr(interaction, "data", None), dict) else None
      return await fn(interaction, scoped_variables)

    def _button_style_from_value(self, value):
      style = str(value or "primary").strip().lower()
      if style == "secondary":
        return discord.ButtonStyle.secondary
      if style == "success":
        return discord.ButtonStyle.success
      if style == "danger":
        return discord.ButtonStyle.danger
      return discord.ButtonStyle.primary

    def _parse_json_array(self, raw_value):
      rendered = str(raw_value or "").strip()
      if not rendered:
        return []
      try:
        parsed = json.loads(rendered)
      except json.JSONDecodeError:
        return []
      return parsed if isinstance(parsed, list) else []

    def _is_remote_media(self, value):
        lowered = str(value or "").strip().lower()
        return lowered.startswith("http://") or lowered.startswith("https://") or lowered.startswith("attachment://")

    def _resolve_local_media_path(self, value):
        raw = str(value or "").strip()
        if not raw:
            return None
        normalized = os.path.normpath(raw)
        candidates = []
        if os.path.isabs(normalized):
            candidates.append(normalized)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates.extend([
            os.path.abspath(os.path.join(base_dir, normalized)),
            os.path.abspath(os.path.join(base_dir, "..", normalized)),
            os.path.abspath(os.path.join(base_dir, "..", "..", normalized)),
        ])
        for candidate in candidates:
            if os.path.isfile(candidate):
                return candidate
        return None

    def _resolve_embed_media_reference(self, attachments, media_type, media_value):
        value = str(media_value or "").strip()
        if not value:
            return ""
        if self._is_remote_media(value):
            return value
        local_path = self._resolve_local_media_path(value)
        if not local_path:
            return ""
        base_name = os.path.basename(local_path)
        attachment_name = f"{media_type}_{base_name}"
        try:
            file_handle = discord.File(local_path, filename=attachment_name)
        except Exception:
            return ""
        attachments.append(file_handle)
        return f"attachment://{attachment_name}"

    def _apply_embed_media(self, embed, variables, author_icon_value, footer_icon_value, thumbnail_value, image_value):
        attachments = []
        author_icon_url = self._resolve_embed_media_reference(attachments, "author_icon", self._render_template(author_icon_value, variables).strip())
        footer_icon_url = self._resolve_embed_media_reference(attachments, "footer_icon", self._render_template(footer_icon_value, variables).strip())
        thumbnail_url = self._resolve_embed_media_reference(attachments, "thumbnail", self._render_template(thumbnail_value, variables).strip())
        image_url = self._resolve_embed_media_reference(attachments, "image", self._render_template(image_value, variables).strip())

        if thumbnail_url:
            embed.set_thumbnail(url=thumbnail_url)
        if image_url:
            embed.set_image(url=image_url)

        if embed.author:
            author_name = str(getattr(embed.author, "name", "") or "")
          if author_name or author_icon_url:
                kwargs = {}
                if author_name:
                    kwargs["name"] = author_name
                if author_icon_url:
                    kwargs["icon_url"] = author_icon_url
                if kwargs:
                    embed.set_author(**kwargs)

        if embed.footer:
            footer_text = str(getattr(embed.footer, "text", "") or "")
            if footer_text or footer_icon_url:
                kwargs = {}
                if footer_text:
                    kwargs["text"] = footer_text
                if footer_icon_url:
                    kwargs["icon_url"] = footer_icon_url
                if kwargs:
                    embed.set_footer(**kwargs)

        return attachments

          def _build_embed_view(self, target, variables, component_mode, buttons_json, select_placeholder, select_options_json, select_min_values, select_max_values):
            mode = str(component_mode or "none").strip().lower()
            if mode not in ("buttons", "select"):
              return None

            view = discord.ui.View(timeout=300)

            if mode == "buttons":
              buttons = self._parse_json_array(self._render_template(buttons_json, variables))
              for index, item in enumerate(buttons[:5]):
                if not isinstance(item, dict):
                  continue
                label = str(item.get("label") or f"Pulsante {index + 1}").strip()[:80]
                function_name = str(item.get("functionName") or "").strip()
                style = self._button_style_from_value(item.get("style"))
                button = discord.ui.Button(label=label or f"Pulsante {index + 1}", style=style, custom_id=f"wf_btn_{index}_{self._sanitize_function_name(function_name) or 'none'}")

                async def _button_callback(interaction, fn_name=function_name):
                  if not interaction.response.is_done():
                    await interaction.response.defer()
                  await self._run_component_function(fn_name, interaction, variables)

                button.callback = _button_callback
                view.add_item(button)

            elif mode == "select":
              options_raw = self._parse_json_array(self._render_template(select_options_json, variables))
              parsed_options = []
              action_map = {}

              for index, item in enumerate(options_raw[:25]):
                if not isinstance(item, dict):
                  continue
                label = str(item.get("label") or f"Opzione {index + 1}").strip()[:100]
                value = str(item.get("value") or f"option_{index + 1}").strip()[:100]
                description = str(item.get("description") or "").strip()[:100]
                fn_name = str(item.get("functionName") or "").strip()
                if not label or not value:
                  continue
                parsed_options.append(discord.SelectOption(label=label, value=value, description=description or None))
                action_map[value] = fn_name

              if parsed_options:
                max_allowed = len(parsed_options)
                try:
                  parsed_min = int(str(select_min_values or "1") or "1")
                except ValueError:
                  parsed_min = 1
                try:
                  parsed_max = int(str(select_max_values or "1") or "1")
                except ValueError:
                  parsed_max = 1
                min_values = max(1, min(max_allowed, parsed_min))
                max_values = max(min_values, min(max_allowed, parsed_max))

                select = discord.ui.Select(
                  placeholder=str(select_placeholder or "Scegli un'opzione")[:150],
                  min_values=min_values,
                  max_values=max_values,
                  options=parsed_options,
                  custom_id="wf_select",
                )

                async def _select_callback(interaction, mapping=action_map):
                  data = getattr(interaction, "data", None)
                  values = data.get("values") if isinstance(data, dict) else []
                  selected_value = str(values[0]) if values else ""
                  if not interaction.response.is_done():
                    await interaction.response.defer()
                  if selected_value:
                    await self._run_component_function(mapping.get(selected_value, ""), interaction, variables)

                select.callback = _select_callback
                view.add_item(select)

            return view if view.children else None

    def _apply_embed_fields(self, embed, variables, fields_json):
        rendered = self._render_template(fields_json, variables).strip()
        if not rendered:
            return
        try:
            fields = json.loads(rendered)
        except json.JSONDecodeError:
            return
        if not isinstance(fields, list):
            return
        for item in fields[:25]:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name") or "").strip()
            value = str(item.get("value") or "").strip()
            if not name or not value:
                continue
            embed.add_field(name=name, value=value, inline=bool(item.get("inline", False)))

    def _apply_embed_timestamp(self, embed, variables, timestamp_mode, timestamp_value):
        mode = str(timestamp_mode or "none").lower()
        if mode == "auto":
            embed.timestamp = discord.utils.utcnow()
            return
        if mode != "custom":
            return
        rendered = self._render_template(timestamp_value, variables).strip()
        if not rendered:
            return
        parsed = discord.utils.parse_time(rendered)
        if parsed:
            embed.timestamp = parsed

    def _coerce_literal(self, value, value_type, variables):
        rendered = self._render_template(value, variables)
        kind = str(value_type or "string").lower()
        if kind == "number":
            try:
                numeric = float(rendered)
                return int(numeric) if numeric.is_integer() else numeric
            except ValueError:
                return 0
        if kind == "boolean":
            return rendered.strip().lower() in ("true", "1", "yes", "si", "on")
        if kind == "json":
            try:
                return json.loads(rendered)
            except json.JSONDecodeError:
                return {}
        if kind == "list":
            try:
                parsed = json.loads(rendered)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            return [item.strip() for item in rendered.split(",") if item.strip()]
        if kind == "null":
            return None
        return rendered

    def _resolve_return_token(self, token, variables):
        raw = str(token or "").strip()
        if raw in (variables or {}):
            return variables[raw]
        rendered = self._render_template(raw, variables)
        lowered = rendered.lower()
        if lowered in ("none", "null"):
            return None
        if lowered == "true":
            return True
        if lowered == "false":
            return False
        try:
            return json.loads(rendered)
        except json.JSONDecodeError:
            return rendered

    def _resolve_return_values(self, values_csv, variables):
        parts = [item.strip() for item in str(values_csv or "").split(",") if item.strip()]
        if not parts:
            return None
        resolved = tuple(self._resolve_return_token(item, variables) for item in parts)
        return resolved if len(resolved) > 1 else resolved[0]

    def _store_return_values(self, variables, names_csv, result):
        names = [item.strip() for item in str(names_csv or "").split(",") if item.strip()]
        if not names:
            return
        values = result if isinstance(result, tuple) else (result,)
        for index, name in enumerate(names):
            variables[name] = values[index] if index < len(values) else None

    async def _save_json(self, file_path, data):
        directory = os.path.dirname(file_path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as file_handle:
            json.dump(data, file_handle, ensure_ascii=False, indent=2)

    async def _load_json(self, file_path):
        if not os.path.exists(file_path):
            return {}
        with open(file_path, "r", encoding="utf-8") as file_handle:
            return json.load(file_handle)

    async def _invoke_prefixed_command(self, target, command_name):
        if not hasattr(target, "invoke"):
            return False
        cmd = self.bot.get_command(command_name)
        if not cmd:
            return False
        await target.invoke(cmd)
        return True

    def _resolve_role(self, guild, role_value):
        if not guild:
            return None
        raw = str(role_value or "").strip()
        if not raw:
            return None
        try:
            return guild.get_role(int(raw))
        except (TypeError, ValueError):
            return discord.utils.get(guild.roles, name=raw)

    async def _resolve_member_target(self, target, variables, target_type, target_variable):
        guild = self._get_guild(target)
        if not guild:
            return None
        resolved_type = str(target_type or "author").lower()
        if resolved_type == "author":
            author = self._get_author(target)
            return author if isinstance(author, discord.Member) else guild.get_member(getattr(author, "id", 0))
        if resolved_type == "guild_owner":
            return guild.owner
        if resolved_type == "user_id_variable":
            variable_name = str(target_variable or "").strip()
            user_id = (variables or {}).get(variable_name)
            try:
                return guild.get_member(int(user_id))
            except (TypeError, ValueError):
                return None
        return None
`;
  const source = `import json\nimport os\nimport discord\nfrom discord import app_commands\nfrom discord.ext import commands\n\nclass ${className}(commands.Cog):\n    def __init__(self, bot):\n        self.bot = bot\n${runtimeHelpers}\n    ${decorator}\n    async def ${commandHandlerName}(self, ${commandParameter}):\n        target = ${commandTarget}\n        variables = {}\n${commandBody}\n${functionMethods}\nasync def setup(bot):\n    await bot.add_cog(${className}(bot))\n`;

  if (writeToDisk) {
    await fs.promises.writeFile(outPath, source, "utf8");
  }
  return {
    name: safeName,
    module: targetModule || `generated.${safeName}`,
    commandPrefix: triggerPrefix,
    source,
    file: relFromBotRoot(config, outPath),
  };
}

// File upload endpoint
app.post("/api/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    // Return full URL with backend address for network access
    const fileUrl = `${publicBaseUrl}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profile endpoints
app.post("/api/check-nickname", async (req, res) => {
  try {
    const { nickname, userId } = req.body;
    
    if (!nickname) {
      return res.status(400).json({ error: "Nickname non fornito" });
    }

    // Assicuracy che profiles esista
    if (!db.data.profiles) {
      db.data.profiles = [];
      await db.write();
    }

    // Cerca se il nickname esiste (escludendo l'utente attuale)
    const exists = db.data.profiles.some(p => 
      p.nickname.toLowerCase() === nickname.toLowerCase() && 
      p.user_id !== userId
    );

    res.json({ available: !exists });
  } catch (err) {
    console.error("Error checking nickname:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/profile", async (req, res) => {
  try {
    const { user_id, nickname, email } = req.body;
    
    if (!user_id || !nickname) {
      return res.status(400).json({ error: "Dati mancanti" });
    }

    // Assicuracy che profiles esista
    if (!db.data.profiles) {
      db.data.profiles = [];
      await db.write();
    }

    // Controlla se il nickname è già in uso
    const exists = db.data.profiles.some(p => 
      p.nickname.toLowerCase() === nickname.toLowerCase() && 
      p.user_id !== user_id
    );

    if (exists) {
      return res.status(400).json({ error: "Questo nickname è già in uso" });
    }

    // Cerca profilo esistente
    const profileIndex = db.data.profiles.findIndex(p => p.user_id === user_id);

    if (profileIndex >= 0) {
      // Aggiorna
      db.data.profiles[profileIndex] = {
        user_id,
        nickname,
        email,
        updated_at: new Date().toISOString()
      };
    } else {
      // Crea nuovo
      db.data.profiles.push({
        user_id,
        nickname,
        email,
        created_at: new Date().toISOString()
      });
    }

    await db.write();
    res.json({ success: true, nickname });
  } catch (err) {
    console.error("Error saving profile:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID non fornito" });
    }

    // Assicuracy che profiles esista
    if (!db.data.profiles) {
      db.data.profiles = [];
      await db.write();
    }

    // Cerca il profilo dell'utente
    const profile = db.data.profiles.find(p => p.user_id === userId);

    if (!profile) {
      return res.status(404).json({ error: "Profilo non trovato" });
    }

    res.json(profile);
  } catch (err) {
    console.error("Error getting profile:", err);
    res.status(500).json({ error: err.message });
  }
});

// Team endpoints
app.get("/api/team", async (req, res) => {
  try {
    await db.read();
    
    // Initialize display_order for items that don't have it
    let needsUpdate = false;
    db.data.team.forEach((item, index) => {
      if (item.display_order === undefined || item.display_order === null) {
        item.display_order = index + 1;
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      await db.write();
    }
    
    const sorted = (db.data.team || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    // Convert relative image URLs to full URLs
    const withFullUrls = sorted.map(item => convertImageUrls(item, ['avatar']));
    res.json(withFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/team", async (req, res) => {
  try {
    await db.read();
    const { name, role, description, avatar } = req.body;
    const maxOrder = db.data.team.length > 0 ? Math.max(...db.data.team.map(t => t.display_order || 0)) : 0;
    const newTeam = {
      id: Date.now(),
      name,
      role: role || null,
      description: description || null,
      avatar: avatar || null,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    db.data.team.push(newTeam);
    await db.write();
    res.json(newTeam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/team/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    db.data.team = db.data.team.filter((item) => item.id !== id);
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/team/reorder", async (req, res) => {
  try {
    await db.read();
    const { items } = req.body; // Array of { id, display_order }
    items.forEach(({ id, display_order }) => {
      const index = db.data.team.findIndex((item) => item.id === id);
      if (index !== -1) {
        db.data.team[index].display_order = display_order;
      }
    });
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/team/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const index = db.data.team.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Team member not found" });
    }
    db.data.team[index] = { ...db.data.team[index], ...req.body, id };
    await db.write();
    res.json(db.data.team[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff endpoints
app.get("/api/staff", async (req, res) => {
  try {
    await db.read();
    
    // Initialize display_order for items that don't have it
    let needsUpdate = false;
    db.data.staff.forEach((item, index) => {
      if (item.display_order === undefined || item.display_order === null) {
        item.display_order = index + 1;
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      await db.write();
    }
    
    const sorted = (db.data.staff || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    // Convert relative image URLs to full URLs
    const withFullUrls = sorted.map(item => convertImageUrls(item, ['avatar']));
    res.json(withFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/staff", async (req, res) => {
  try {
    await db.read();
    const { name, role, avatar } = req.body;
    const maxOrder = db.data.staff.length > 0 ? Math.max(...db.data.staff.map(s => s.display_order || 0)) : 0;
    const newStaff = {
      id: Date.now(),
      name,
      role,
      avatar: avatar || null,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    db.data.staff.push(newStaff);
    await db.write();
    res.json(newStaff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/staff/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    db.data.staff = db.data.staff.filter((item) => item.id !== id);
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/staff/reorder", async (req, res) => {
  try {
    await db.read();
    const { items } = req.body; // Array of { id, display_order }
    items.forEach(({ id, display_order }) => {
      const index = db.data.staff.findIndex((item) => item.id === id);
      if (index !== -1) {
        db.data.staff[index].display_order = display_order;
      }
    });
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/staff/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const index = db.data.staff.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    db.data.staff[index] = { ...db.data.staff[index], ...req.body, id };
    await db.write();
    res.json(db.data.staff[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Events endpoints
app.get("/api/events", async (req, res) => {
  try {
    await db.read();
    
    // Initialize display_order for items that don't have it
    let needsUpdate = false;
    (db.data.events || []).forEach((item, index) => {
      if (item.display_order === undefined || item.display_order === null) {
        item.display_order = index + 1;
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      await db.write();
    }
    
    const sorted = (db.data.events || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    // Convert relative image URLs to full URLs
    const withFullUrls = sorted.map(item => convertImageUrls(item, ['image']));
    res.json(withFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    await db.read();
    const { title, description, date, location, link, image } = req.body;
    const maxOrder = (db.data.events || []).length > 0 ? Math.max(...(db.data.events || []).map(e => e.display_order || 0)) : 0;
    const newEvent = {
      id: Date.now(),
      title,
      description: description || null,
      date,
      location: location || null,
      link: link || null,
      image: image || null,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    if (!db.data.events) db.data.events = [];
    db.data.events.push(newEvent);
    await db.write();
    res.json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/events/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    db.data.events = (db.data.events || []).filter((item) => item.id !== id);
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/events/reorder", async (req, res) => {
  try {
    await db.read();
    const { items } = req.body;
    items.forEach(({ id, display_order }) => {
      const index = (db.data.events || []).findIndex((item) => item.id === id);
      if (index !== -1) {
        db.data.events[index].display_order = display_order;
      }
    });
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/events/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const index = (db.data.events || []).findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Event not found" });
    }
    db.data.events[index] = { ...db.data.events[index], ...req.body, id };
    await db.write();
    res.json(db.data.events[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Events endpoints
app.get("/api/events", async (req, res) => {
  try {
    await db.read();
    
    // Initialize display_order for items that don't have it
    let needsUpdate = false;
    db.data.events.forEach((item, index) => {
      if (item.display_order === undefined || item.display_order === null) {
        item.display_order = index + 1;
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      await db.write();
    }
    
    const sorted = (db.data.events || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    // Convert relative image URLs to full URLs
    const withFullUrls = sorted.map(item => convertImageUrls(item, ['image']));
    res.json(withFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    await db.read();
    const { title, description, date, location, link, image } = req.body;
    const maxOrder = db.data.events.length > 0 ? Math.max(...db.data.events.map(e => e.display_order || 0)) : 0;
    const newEvent = {
      id: Date.now(),
      title,
      description: description || null,
      date,
      location: location || null,
      link: link || null,
      image: image || null,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    db.data.events.push(newEvent);
    await db.write();
    res.json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/events/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    db.data.events = db.data.events.filter((item) => item.id !== id);
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/events/reorder", async (req, res) => {
  try {
    await db.read();
    const { items } = req.body; // Array of { id, display_order }
    items.forEach(({ id, display_order }) => {
      const index = db.data.events.findIndex((item) => item.id === id);
      if (index !== -1) {
        db.data.events[index].display_order = display_order;
      }
    });
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/events/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const index = db.data.events.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Event not found" });
    }
    db.data.events[index] = { ...db.data.events[index], ...req.body, id };
    await db.write();
    res.json(db.data.events[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedule endpoints
app.get("/api/schedule", async (req, res) => {
  try {
    await db.read();
    
    // Initialize display_order for items that don't have it
    let needsUpdate = false;
    db.data.schedule.forEach((item, index) => {
      if (item.display_order === undefined || item.display_order === null) {
        item.display_order = index + 1;
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      await db.write();
    }
    
    const sorted = (db.data.schedule || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/schedule", async (req, res) => {
  try {
    await db.read();
    const { title, type, day_of_week, time, description, link, thumbnail } = req.body;
    const maxOrder = db.data.schedule.length > 0 ? Math.max(...db.data.schedule.map(s => s.display_order || 0)) : 0;
    const newScheduleItem = {
      id: Date.now(),
      title,
      type,
      day_of_week,
      time,
      description: description || null,
      link: link || null,
      thumbnail: thumbnail || null,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    db.data.schedule.push(newScheduleItem);
    await db.write();
    res.json(newScheduleItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/schedule/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    db.data.schedule = db.data.schedule.filter((item) => item.id !== id);
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/schedule/reorder", async (req, res) => {
  try {
    await db.read();
    const { items } = req.body; // Array of { id, display_order }
    items.forEach(({ id, display_order }) => {
      const index = db.data.schedule.findIndex((item) => item.id === id);
      if (index !== -1) {
        db.data.schedule[index].display_order = display_order;
      }
    });
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/schedule/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const index = db.data.schedule.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Schedule item not found" });
    }
    db.data.schedule[index] = { ...db.data.schedule[index], ...req.body, id };
    await db.write();
    res.json(db.data.schedule[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Team Plus Schedule endpoints
app.get("/api/team-plus-schedule", async (req, res) => {
  try {
    await db.read();
    
    // Initialize display_order for items that don't have it
    let needsUpdate = false;
    db.data.team_plus_schedule.forEach((item, index) => {
      if (item.display_order === undefined || item.display_order === null) {
        item.display_order = index + 1;
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      await db.write();
    }
    
    const sorted = (db.data.team_plus_schedule || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/team-plus-schedule/:userId", async (req, res) => {
  try {
    await db.read();
    const userId = req.params.userId;
    const userSchedule = (db.data.team_plus_schedule || []).filter(item => item.user_id === userId);
    const sorted = userSchedule.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/team-plus-schedule", async (req, res) => {
  try {
    await db.read();
    const { user_id, user_name, title, type, day_of_week, time, description, link, thumbnail } = req.body;
    
    // Get max order for this user's items
    const userItems = (db.data.team_plus_schedule || []).filter(item => item.user_id === user_id);
    const maxOrder = userItems.length > 0 ? Math.max(...userItems.map(s => s.display_order || 0)) : 0;
    
    const newScheduleItem = {
      id: Date.now(),
      user_id,
      user_name,
      title,
      type,
      day_of_week,
      time,
      description: description || null,
      link: link || null,
      thumbnail: thumbnail || null,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    
    db.data.team_plus_schedule.push(newScheduleItem);
    await db.write();
    res.json(newScheduleItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/team-plus-schedule/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    db.data.team_plus_schedule = db.data.team_plus_schedule.filter((item) => item.id !== id);
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/team-plus-schedule/reorder", async (req, res) => {
  try {
    await db.read();
    const { items } = req.body; // Array of { id, display_order }
    items.forEach(({ id, display_order }) => {
      const index = db.data.team_plus_schedule.findIndex((item) => item.id === id);
      if (index !== -1) {
        db.data.team_plus_schedule[index].display_order = display_order;
      }
    });
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/team-plus-schedule/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const index = db.data.team_plus_schedule.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Schedule item not found" });
    }
    db.data.team_plus_schedule[index] = { ...db.data.team_plus_schedule[index], ...req.body, id };
    await db.write();
    res.json(db.data.team_plus_schedule[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products endpoints
app.get("/api/products", async (req, res) => {
  try {
    await db.read();
    // Convert relative image URLs to full URLs
    const withFullUrls = (db.data.products || []).map(item => convertImageUrls(item, ['image']));
    res.json(withFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    await db.read();
    const { title, price, sku, image, description, sizes, stripe_price_id, stripe_product_id, free_shipping } = req.body;
    const newProduct = {
      id: Date.now(),
      title,
      price: parseFloat(price) || 0,
      sku: sku || null,
      image: image || null,
      description: description || null,
      sizes: sizes || null,
      stripe_price_id: (stripe_price_id && stripe_price_id.trim() !== '') ? stripe_price_id.trim() : null,
      stripe_product_id: (stripe_product_id && stripe_product_id.trim() !== '') ? stripe_product_id.trim() : null,
      free_shipping: free_shipping || false,
      created_at: new Date().toISOString(),
    };
    db.data.products.push(newProduct);
    await db.write();
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    db.data.products = db.data.products.filter((item) => item.id !== id);
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const index = db.data.products.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Sanitizza i dati in arrivo
    const updatedData = { ...req.body };
    if (updatedData.price !== undefined) {
      updatedData.price = parseFloat(updatedData.price) || 0;
    }
    if (updatedData.stripe_price_id !== undefined) {
      updatedData.stripe_price_id = (updatedData.stripe_price_id && updatedData.stripe_price_id.trim() !== '') 
        ? updatedData.stripe_price_id.trim() 
        : null;
    }
    if (updatedData.stripe_product_id !== undefined) {
      updatedData.stripe_product_id = (updatedData.stripe_product_id && updatedData.stripe_product_id.trim() !== '') 
        ? updatedData.stripe_product_id.trim() 
        : null;
    }
    if (updatedData.free_shipping !== undefined) {
      updatedData.free_shipping = Boolean(updatedData.free_shipping);
    }
    
    db.data.products[index] = { ...db.data.products[index], ...updatedData, id };
    await db.write();
    res.json(db.data.products[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shop settings endpoints
app.get("/api/shop-settings", async (req, res) => {
  try {
    await db.read();
    const settings = db.data.shop_settings || {
      shipping_cost: 5.0,
      free_shipping_threshold: 50.0
    };
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/shop-settings", async (req, res) => {
  try {
    await db.read();
    const { shipping_cost, free_shipping_threshold } = req.body;
    
    db.data.shop_settings = {
      shipping_cost: parseFloat(shipping_cost) || 5.0,
      free_shipping_threshold: parseFloat(free_shipping_threshold) || 50.0
    };
    
    await db.write();
    res.json(db.data.shop_settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payment endpoints
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    if (!ensureStripeConfigured(res)) return;
    console.log('[CHECKOUT] Starting checkout session creation');
    const { items, customer_email } = req.body; // items = [{ id, quantity }], customer_email = user email
    console.log('[CHECKOUT] Items received:', JSON.stringify(items, null, 2));
    console.log('[CHECKOUT] Customer email:', customer_email);
    
    await db.read();
    console.log('[CHECKOUT] Database products:', JSON.stringify(db.data.products, null, 2));
    
    // Build line items for Stripe
    const lineItems = items.map((item) => {
      const product = db.data.products.find((p) => p.id === item.id);
      if (!product) {
        console.error(`[CHECKOUT] Product with id ${item.id} not found`);
        throw new Error(`Product with id ${item.id} not found`);
      }
      
      console.log(`[CHECKOUT] Processing product:`, product);
      
      // Costruisci il nome del prodotto con taglia e colore
      let productName = product.title;
      const variants = [];
      if (item.size) variants.push(`Taglia: ${item.size}`);
      if (item.color) variants.push(`Colore: ${item.color}`);
      if (variants.length > 0) {
        productName += ` (${variants.join(', ')})`;
      }
      
      // SEMPRE usa prezzi dinamici invece di Price ID per evitare errori con ID non validi
      const priceAmount = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
      console.log(`[CHECKOUT] Creating dynamic price: €${priceAmount} (${Math.round(priceAmount * 100)} cents)`);
      
      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: productName,
            images: product.image ? [`${process.env.FRONTEND_URL || 'http://localhost:5173'}${product.image}`] : [],
          },
          unit_amount: Math.round(priceAmount * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    console.log('[CHECKOUT] Line items created:', JSON.stringify(lineItems, null, 2));

    // Carica impostazioni shop
    const shopSettings = db.data.shop_settings || {
      shipping_cost: 5.0,
      free_shipping_threshold: 50.0
    };
    
    console.log('[CHECKOUT] Shop settings:', shopSettings);

    // Calculate if shipping is free
    const subtotal = items.reduce((sum, item) => {
      const product = db.data.products.find((p) => p.id === item.id);
      if (!product) return sum;
      const priceAmount = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
      return sum + (priceAmount * item.quantity);
    }, 0);

    console.log(`[CHECKOUT] Subtotal: €${subtotal}`);

    // Controlla se almeno un prodotto ha la spedizione gratuita
    const hasFreeShippingProduct = items.some(item => {
      const product = db.data.products.find((p) => p.id === item.id);
      return product && product.free_shipping === true;
    });
    
    console.log(`[CHECKOUT] Has free shipping product: ${hasFreeShippingProduct}`);

    // Add shipping if needed (se threshold è 0, la spedizione è sempre a pagamento)
    const needsShipping = shopSettings.free_shipping_threshold === 0 || subtotal < shopSettings.free_shipping_threshold;
    
    if (needsShipping && shopSettings.shipping_cost > 0 && !hasFreeShippingProduct) {
      console.log(`[CHECKOUT] Adding shipping €${shopSettings.shipping_cost} (threshold: €${shopSettings.free_shipping_threshold})`);
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Spedizione",
          },
          unit_amount: Math.round(shopSettings.shipping_cost * 100), // Convert to cents
        },
        quantity: 1,
      });
    } else {
      if (hasFreeShippingProduct) {
        console.log(`[CHECKOUT] Free shipping (product with free shipping in cart)`);
      } else {
        console.log(`[CHECKOUT] Free shipping (subtotal >= €${shopSettings.free_shipping_threshold})`);
      }
    }

    console.log('[CHECKOUT] Final line items:', JSON.stringify(lineItems, null, 2));
    console.log('[CHECKOUT] Calling Stripe API...');

    // Create Stripe checkout session
    try {
      const sessionConfig = {
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        shipping_address_collection: {
          allowed_countries: ['IT', 'FR', 'DE', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'GB', 'US'],
        },
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true,
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart`,
        metadata: {
          items: JSON.stringify(items),
          order_details: JSON.stringify(items.map(item => {
            const product = db.data.products.find(p => p.id === item.id);
            return {
              product_id: item.id,
              product_name: product?.title || 'Unknown',
              quantity: item.quantity,
              size: item.size || 'N/A',
              color: item.color || 'N/A',
            };
          })),
        },
      };
      
      // Prefilla l'email se l'utente è loggato
      if (customer_email) {
        sessionConfig.customer_email = customer_email;
        console.log('[CHECKOUT] Prefilling customer email:', customer_email);
      }
      
      const session = await stripe.checkout.sessions.create(sessionConfig);

      console.log('[CHECKOUT] Stripe session created:', session.id);
      res.json({ sessionId: session.id, url: session.url });
    } catch (stripeError) {
      // Se l'errore è dovuto a un price recurring, riprova senza usare il Price ID
      if (stripeError.message && stripeError.message.includes('recurring price')) {
        console.log('[CHECKOUT] Detected recurring price, retrying without Stripe Price IDs...');
        
        // Ricrea line items senza usare Stripe Price IDs
        const dynamicLineItems = items.map((item) => {
          const product = db.data.products.find((p) => p.id === item.id);
          const priceAmount = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
          
          // Costruisci il nome del prodotto con taglia e colore
          let productName = product.title;
          const variants = [];
          if (item.size) variants.push(`Taglia: ${item.size}`);
          if (item.color) variants.push(`Colore: ${item.color}`);
          if (variants.length > 0) {
            productName += ` (${variants.join(', ')})`;
          }
          
          return {
            price_data: {
              currency: "eur",
              product_data: {
                name: productName,
                images: product.image ? [`${process.env.FRONTEND_URL || 'http://localhost:5173'}${product.image}`] : [],
              },
              unit_amount: Math.round(priceAmount * 100),
            },
            quantity: item.quantity,
          };
        });
        
        // Riaggiungi spedizione se necessario
        const subtotal = items.reduce((sum, item) => {
          const product = db.data.products.find((p) => p.id === item.id);
          if (!product) return sum;
          const priceAmount = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
          return sum + (priceAmount * item.quantity);
        }, 0);
        
        const needsShipping = shopSettings.free_shipping_threshold === 0 || subtotal < shopSettings.free_shipping_threshold;
        
        if (needsShipping && shopSettings.shipping_cost > 0) {
          dynamicLineItems.push({
            price_data: {
              currency: "eur",
              product_data: { name: "Spedizione" },
              unit_amount: Math.round(shopSettings.shipping_cost * 100),
            },
            quantity: 1,
          });
        }
        
        console.log('[CHECKOUT] Retrying with dynamic prices:', JSON.stringify(dynamicLineItems, null, 2));
        
        const retryConfig = {
          payment_method_types: ["card"],
          line_items: dynamicLineItems,
          mode: "payment",
          shipping_address_collection: {
            allowed_countries: ['IT', 'FR', 'DE', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'GB', 'US'],
          },
          billing_address_collection: 'required',
          phone_number_collection: {
            enabled: true,
          },
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart`,
          metadata: {
            items: JSON.stringify(items),
            order_details: JSON.stringify(items.map(item => {
              const product = db.data.products.find(p => p.id === item.id);
              return {
                product_id: item.id,
                product_name: product?.title || 'Unknown',
                quantity: item.quantity,
                size: item.size || 'N/A',
                color: item.color || 'N/A',
              };
            })),
          },
        };
        
        // Prefilla l'email anche nel retry
        if (customer_email) {
          retryConfig.customer_email = customer_email;
        }
        
        const retrySession = await stripe.checkout.sessions.create(retryConfig);
        
        console.log('[CHECKOUT] Retry successful:', retrySession.id);
        return res.json({ sessionId: retrySession.id, url: retrySession.url });
      }
      
      // Se è un altro tipo di errore, rilancia
      throw stripeError;
    }
  } catch (err) {
    console.error("[CHECKOUT ERROR] Full error:", err);
    console.error("[CHECKOUT ERROR] Error message:", err.message);
    console.error("[CHECKOUT ERROR] Error stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

// Webhook endpoint for Stripe events
app.post("/api/webhook/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  if (!ensureStripeConfigured(res)) return;
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      await db.read();
      
      // Get product details for the items
      const items = JSON.parse(session.metadata.items || '[]');
      const itemsWithProducts = items.map(item => {
        const product = db.data.products.find(p => p.id === item.id);
        return {
          ...item,
          product: product || { title: 'Prodotto', price: 0 }
        };
      });
      
      // Calculate shipping
      const subtotal = itemsWithProducts.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity);
      }, 0);
      const shipping = subtotal < 50 ? 0 : 0;
      
      // Create order record
      const order = {
        id: Date.now(),
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        amount: session.amount_total / 100, // Convert from cents
        currency: session.currency,
        status: session.payment_status,
        order_status: 'new', // Order management status
        items: itemsWithProducts,
        shipping: shipping,
        customer_email: session.customer_details?.email,
        customer_name: session.customer_details?.name,
        customer_phone: session.customer_details?.phone,
        shipping_address: session.shipping_details?.address,
        shipping_name: session.shipping_details?.name,
        created_at: new Date().toISOString(),
      };
      
      db.data.orders.push(order);
      await db.write();
      
      console.log("Order created:", order.id);
      
      // Send order receipt email to customer
      if (session.customer_details?.email) {
        try {
          await transporter.sendMail({
            from: `${process.env.FROM_NAME || 'LegoChris'} <${process.env.GMAIL_USER}>`,
            to: session.customer_details.email,
            subject: `Conferma Ordine #${order.id} - LegoChris Shop`,
            html: orderReceiptEmail(session.customer_details.name, order),
          });
          console.log(`✅ Receipt email sent to: ${session.customer_details.email}`);
        } catch (emailError) {
          console.error("Error sending receipt email:", emailError);
        }
      }
      
      // Send notification email to admin
      const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
      if (adminEmail) {
        try {
          await transporter.sendMail({
            from: `${process.env.FROM_NAME || 'LegoChris'} <${process.env.GMAIL_USER}>`,
            to: adminEmail,
            subject: `Nuovo Ordine #${order.id} - LegoChris Admin`,
            html: adminNewOrderEmail(order),
          });
          console.log(`[ADMIN-NOTIFY] Admin notification sent to: ${adminEmail}`);
        } catch (emailError) {
          console.error("[ADMIN-NOTIFY] Error sending admin notification:", emailError);
        }
      }
    } catch (err) {
      console.error("Error saving order:", err);
    }
  }

  res.json({ received: true });
});

// Get orders (for admin)
app.get("/api/orders", async (req, res) => {
  try {
    await db.read();
    res.json(db.data.orders || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user orders by email
app.get("/api/user-orders", async (req, res) => {
  try {
    const { email } = req.query;
    console.log('[USER-ORDERS] Request for email:', email);
    
    if (!email) {
      console.error('[USER-ORDERS] No email provided');
      return res.status(400).json({ error: "Email is required" });
    }
    
    await db.read();
    console.log('[USER-ORDERS] Total orders in database:', db.data.orders?.length || 0);
    
    // Debug: mostra tutte le email presenti negli ordini
    if (db.data.orders && db.data.orders.length > 0) {
      console.log('[USER-ORDERS] All customer emails in database:');
      db.data.orders.forEach((order, idx) => {
        console.log(`  [${idx}] Order #${order.id}: email="${order.customer_email}", name="${order.customer_name}"`);
      });
    }
    
    const userOrders = (db.data.orders || []).filter(
      (order) => order.customer_email === email
    );
    
    console.log('[USER-ORDERS] Found', userOrders.length, 'orders for email:', email);
    
    // Ordina per data (più recenti prima)
    userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    res.json(userOrders);
  } catch (err) {
    console.error('[USER-ORDERS] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single order
app.get("/api/orders/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const order = db.data.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (for admin)
app.put("/api/orders/:id/status", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const { order_status, tracking_number } = req.body;
    
    const orderIndex = db.data.orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Update order
    db.data.orders[orderIndex] = {
      ...db.data.orders[orderIndex],
      order_status: order_status || db.data.orders[orderIndex].order_status || 'new',
      tracking_number: tracking_number !== undefined ? tracking_number : db.data.orders[orderIndex].tracking_number,
      updated_at: new Date().toISOString(),
    };
    
    await db.write();
    
    console.log(`[ORDER-STATUS] Updated order #${id} to status: ${order_status}`);
    
    res.json(db.data.orders[orderIndex]);
  } catch (err) {
    console.error('[ORDER-STATUS] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Notify customer about order status update
app.post("/api/orders/:id/notify", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    
    const order = db.data.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    if (!order.customer_email) {
      return res.status(400).json({ error: "Order has no customer email" });
    }
    
    console.log(`[ORDER-NOTIFY] Sending notification for order #${id} to ${order.customer_email}`);
    console.log(`[ORDER-NOTIFY] Current status: ${order.order_status || 'new'}`);
    console.log(`[ORDER-NOTIFY] Tracking number: ${order.tracking_number || 'N/A'}`);
    
    // Send notification email
    try {
      await transporter.sendMail({
        from: `${process.env.FROM_NAME || 'LegoChris'} <${process.env.GMAIL_USER}>`,
        to: order.customer_email,
        subject: `Aggiornamento Ordine #${order.id} - LegoChris`,
        html: orderStatusUpdateEmail(order),
      });
      
      console.log(`[ORDER-NOTIFY] ✅ Notification email sent to: ${order.customer_email}`);
      res.json({ success: true, message: "Notification sent" });
    } catch (emailError) {
      console.error('[ORDER-NOTIFY] ❌ Error sending notification email:', emailError);
      res.status(500).json({ error: "Failed to send notification email", details: emailError.message });
    }
  } catch (err) {
    console.error('[ORDER-NOTIFY] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get session details (for success page)
app.get("/api/checkout-session/:sessionId", async (req, res) => {
  try {
    if (!ensureStripeConfigured(res)) return;
    const sessionId = req.params.sessionId;
    console.log('[CHECKOUT-SESSION] Retrieving session:', sessionId);
    
    // Verifica compatibilità session ID e chiave API
    const isLiveSession = sessionId.startsWith('cs_live_');
    const isTestSession = sessionId.startsWith('cs_test_');
    const apiKeyMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test';
    
    console.log('[CHECKOUT-SESSION] Session type:', isLiveSession ? 'LIVE' : (isTestSession ? 'TEST' : 'UNKNOWN'));
    console.log('[CHECKOUT-SESSION] API key mode:', apiKeyMode);
    
    if ((isLiveSession && apiKeyMode === 'test') || (isTestSession && apiKeyMode === 'live')) {
      console.error('[CHECKOUT-SESSION] ❌ MISMATCH: Session type does not match API key mode');
      return res.status(400).json({ 
        error: `Session type (${isLiveSession ? 'live' : 'test'}) does not match API key mode (${apiKeyMode})` 
      });
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer_details']
    });
    console.log('[CHECKOUT-SESSION] ✅ Session retrieved successfully');
    res.json(session);
  } catch (err) {
    console.error('[CHECKOUT-SESSION] ❌ Error retrieving session:', err.message);
    console.error('[CHECKOUT-SESSION] Error type:', err.type);
    console.error('[CHECKOUT-SESSION] Error code:', err.code);
    res.status(500).json({ error: err.message, type: err.type, code: err.code });
  }
});

// Save order from session (fallback quando il webhook non funziona)
app.post("/api/save-order", async (req, res) => {
  try {
    if (!ensureStripeConfigured(res)) return;
    const { sessionId } = req.body;
    
    console.log('[SAVE-ORDER] Request received for session:', sessionId);
    
    if (!sessionId) {
      console.error('[SAVE-ORDER] No session ID provided');
      return res.status(400).json({ error: "Session ID is required" });
    }

    await db.read();

    // Controlla se l'ordine esiste già
    const existingOrder = db.data.orders.find(
      order => order.stripe_session_id === sessionId
    );
    
    if (existingOrder) {
      console.log('[SAVE-ORDER] Order already exists:', existingOrder.id);
      return res.json({ 
        success: true, 
        message: "Order already exists", 
        order: existingOrder 
      });
    }

    console.log('[SAVE-ORDER] Retrieving session from Stripe...');
    // Recupera la sessione da Stripe con i dettagli completi
    
    // Verifica compatibilità session ID e chiave API
    const isLiveSession = sessionId.startsWith('cs_live_');
    const isTestSession = sessionId.startsWith('cs_test_');
    const apiKeyMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test';
    
    console.log('[SAVE-ORDER] Session type:', isLiveSession ? 'LIVE' : (isTestSession ? 'TEST' : 'UNKNOWN'));
    console.log('[SAVE-ORDER] API key mode:', apiKeyMode);
    
    if ((isLiveSession && apiKeyMode === 'test') || (isTestSession && apiKeyMode === 'live')) {
      console.error('[SAVE-ORDER] ❌ MISMATCH: Session type does not match API key mode');
      return res.status(400).json({ 
        error: `Session type (${isLiveSession ? 'live' : 'test'}) does not match API key mode (${apiKeyMode})` 
      });
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer_details']
    });
    
    console.log('[SAVE-ORDER] Session retrieved. Payment status:', session.payment_status);
    console.log('[SAVE-ORDER] Customer email:', session.customer_details?.email);
    console.log('[SAVE-ORDER] Customer name:', session.customer_details?.name);
    console.log('[SAVE-ORDER] Amount total:', session.amount_total);
    console.log('[SAVE-ORDER] Full session object:', JSON.stringify(session, null, 2));
    
    if (session.payment_status !== 'paid') {
      console.warn('[SAVE-ORDER] Payment not completed:', session.payment_status);
      return res.status(400).json({ error: "Payment not completed" });
    }

    // Get product details for the items
    const items = JSON.parse(session.metadata.items || '[]');
    const itemsWithProducts = items.map(item => {
      const product = db.data.products.find(p => p.id === item.id);
      return {
        ...item,
        product: product || { title: 'Prodotto', price: 0 }
      };
    });
    
    // Calculate shipping
    const subtotal = itemsWithProducts.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    const shipping = subtotal < 50 ? 0 : 0;
    
    // Create order record
    const order = {
      id: Date.now(),
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      status: session.payment_status === 'paid' ? 'complete' : session.payment_status,
      order_status: 'new', // Order management status
      items: itemsWithProducts,
      shipping: shipping,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      customer_phone: session.customer_details?.phone,
      shipping_address: session.shipping_details?.address,
      shipping_name: session.shipping_details?.name,
      created_at: new Date().toISOString(),
    };
    
    db.data.orders.push(order);
    await db.write();
    
    console.log("[SAVE-ORDER] ✅ Order saved successfully:");
    console.log("[SAVE-ORDER]   Order ID:", order.id);
    console.log("[SAVE-ORDER]   Customer Email:", order.customer_email);
    console.log("[SAVE-ORDER]   Customer Name:", order.customer_name);
    console.log("[SAVE-ORDER]   Amount:", order.amount, order.currency);
    console.log("[SAVE-ORDER]   Items:", order.items.length);
    console.log("[SAVE-ORDER]   Full order object:", JSON.stringify(order, null, 2));
    
    // Send order receipt email to customer
    if (session.customer_details?.email) {
      try {
        await transporter.sendMail({
          from: `${process.env.FROM_NAME || 'LegoChris'} <${process.env.GMAIL_USER}>`,
          to: session.customer_details.email,
          subject: `Conferma Ordine #${order.id} - LegoChris Shop`,
          html: orderReceiptEmail(session.customer_details.name, order),
        });
        console.log(`[SAVE-ORDER] ✅ Receipt email sent to: ${session.customer_details.email}`);
      } catch (emailError) {
        console.error("[SAVE-ORDER] Error sending receipt email:", emailError);
      }
    }
    
    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
    if (adminEmail) {
      try {
        await transporter.sendMail({
          from: `${process.env.FROM_NAME || 'LegoChris'} <${process.env.GMAIL_USER}>`,
          to: adminEmail,
          subject: `Nuovo Ordine #${order.id} - LegoChris Admin`,
          html: adminNewOrderEmail(order),
        });
        console.log(`[SAVE-ORDER] [ADMIN-NOTIFY] Admin notification sent to: ${adminEmail}`);
      } catch (emailError) {
        console.error("[SAVE-ORDER] [ADMIN-NOTIFY] Error sending admin notification:", emailError);
      }
    }
    
    res.json({ success: true, order });
  } catch (err) {
    console.error("Error saving order:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get Stripe publishable key
app.get("/api/config/stripe", (req, res) => {
  res.json({ 
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY 
  });
});

// Welcome email endpoint
app.post("/api/send-welcome-email", async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    await transporter.sendMail({
      from: `${process.env.FROM_NAME || 'LegoChris'} <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Benvenuto su LegoChris! 🎮",
      html: welcomeEmail(name),
    });

    console.log(`✅ Welcome email sent to: ${email}`);
    res.json({ success: true, message: "Welcome email sent successfully" });
  } catch (err) {
    console.error("Error sending welcome email:", err);
    res.status(500).json({ error: err.message });
  }
});

// Request password reset
app.post("/api/password-reset/request", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    await db.read();

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hour

    // Remove any existing tokens for this email
    db.data.passwordResetTokens = db.data.passwordResetTokens.filter(
      t => t.email !== email || t.expires < Date.now()
    );

    // Save new token
    db.data.passwordResetTokens.push({
      email,
      token,
      expires,
      created_at: new Date().toISOString(),
    });

    await db.write();

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    // Send email
    await transporter.sendMail({
      from: `${process.env.FROM_NAME || 'LegoChris'} <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Reset Password - LegoChris",
      html: passwordResetEmail(email.split('@')[0], resetLink),
    });

    console.log(`✅ Password reset email sent to: ${email}`);
    res.json({ 
      success: true, 
      message: "If an account exists with this email, you will receive a password reset link shortly." 
    });
  } catch (err) {
    console.error("Error requesting password reset:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify password reset token
app.post("/api/password-reset/verify", async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    await db.read();

    const resetToken = db.data.passwordResetTokens.find(
      t => t.token === token && t.expires > Date.now()
    );

    if (!resetToken) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    res.json({ 
      success: true, 
      email: resetToken.email,
      message: "Token is valid" 
    });
  } catch (err) {
    console.error("Error verifying reset token:", err);
    res.status(500).json({ error: err.message });
  }
});

// Complete password reset (delete token after successful reset)
app.post("/api/password-reset/complete", async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    await db.read();

    // Remove the used token
    db.data.passwordResetTokens = db.data.passwordResetTokens.filter(
      t => t.token !== token
    );

    await db.write();

    res.json({ success: true, message: "Password reset completed" });
  } catch (err) {
    console.error("Error completing password reset:", err);
    res.status(500).json({ error: err.message });
  }
});

// Playlists endpoints
app.get("/api/playlists", async (req, res) => {
  try {
    await db.read();
    if (!db.data.playlists) db.data.playlists = [];

    let hasChanges = false;
    db.data.playlists.forEach((item, index) => {
      if (item.display_order === undefined || item.display_order === null) {
        item.display_order = index + 1;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await db.write();
    }

    const sorted = (db.data.playlists || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    // Convert relative image URLs to full URLs
    const withFullUrls = sorted.map(item => convertImageUrls(item, ['thumbnail']));
    res.json(withFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/playlists", async (req, res) => {
  try {
    await db.read();
    if (!db.data.playlists) db.data.playlists = [];
    const { title, description, video_ids, youtube_link, thumbnail } = req.body;
    const maxOrder = db.data.playlists.length > 0 ? Math.max(...db.data.playlists.map(p => p.display_order || 0)) : 0;
    const newPlaylist = {
      id: Date.now(),
      title,
      description: description || null,
      video_ids: video_ids || null,
      youtube_link: youtube_link || null,
      thumbnail: thumbnail || null,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    db.data.playlists.push(newPlaylist);
    await db.write();
    res.json(newPlaylist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/playlists/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    db.data.playlists = db.data.playlists.filter((item) => item.id !== id);
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/playlists/:id(\\d+)", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const index = db.data.playlists.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    db.data.playlists[index] = { ...db.data.playlists[index], ...req.body, id };
    await db.write();
    res.json(db.data.playlists[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/playlists/reorder", async (req, res) => {
  try {
    await db.read();
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    items.forEach(({ id, display_order }) => {
      const index = (db.data.playlists || []).findIndex((item) => item.id === id);
      if (index !== -1) {
        db.data.playlists[index].display_order = display_order;
      }
    });

    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Videos endpoints
app.get("/api/videos", async (req, res) => {
  try {
    await db.read();
    if (!db.data.videos) db.data.videos = [];

    let hasChanges = false;
    db.data.videos.forEach((item, index) => {
      if (item.display_order === undefined || item.display_order === null) {
        item.display_order = index + 1;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await db.write();
    }

    const sorted = (db.data.videos || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    // Convert relative image URLs to full URLs
    const withFullUrls = sorted.map(item => convertImageUrls(item, ['thumbnail']));
    res.json(withFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/videos", async (req, res) => {
  try {
    await db.read();
    if (!db.data.videos) db.data.videos = [];
    const { title, thumbnail, duration, views, date, video_link } = req.body;
    const maxOrder = db.data.videos.length > 0 ? Math.max(...db.data.videos.map(v => v.display_order || 0)) : 0;
    const newVideo = {
      id: Date.now(),
      title,
      thumbnail: thumbnail || null,
      duration,
      views: views || "",
      date: date || "",
      video_link: video_link || "",
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    db.data.videos.push(newVideo);
    await db.write();
    res.json(newVideo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/videos/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    db.data.videos = db.data.videos.filter((item) => item.id !== id);
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/videos/:id(\\d+)", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    const index = db.data.videos.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Video not found" });
    }
    db.data.videos[index] = { ...db.data.videos[index], ...req.body, id };
    await db.write();
    res.json(db.data.videos[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/videos/reorder", async (req, res) => {
  try {
    await db.read();
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    items.forEach(({ id, display_order }) => {
      const index = (db.data.videos || []).findIndex((item) => item.id === id);
      if (index !== -1) {
        db.data.videos[index].display_order = display_order;
      }
    });

    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Newsletter endpoints
app.get("/api/newsletter", async (req, res) => {
  try {
    await db.read();
    const sorted = (db.data.newsletter || []).sort((a, b) => 
      new Date(b.subscribed_at) - new Date(a.subscribed_at)
    );
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/newsletter", async (req, res) => {
  try {
    await db.read();
    const { email, name } = req.body;
    
    // Check if already subscribed
    const existing = db.data.newsletter.find(s => s.email === email);
    if (existing) {
      return res.status(400).json({ error: "Email già iscritto" });
    }
    
    const newSubscriber = {
      id: Date.now(),
      email,
      name: name || "",
      subscribed_at: new Date().toISOString(),
    };
    
    db.data.newsletter.push(newSubscriber);
    await db.write();
    res.json(newSubscriber);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/newsletter/:id", async (req, res) => {
  try {
    await db.read();
    const id = parseInt(req.params.id);
    db.data.newsletter = db.data.newsletter.filter((item) => item.id !== id);
    await db.write();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/newsletter/send", async (req, res) => {
  try {
    await db.read();
    const { subject, message } = req.body;
    const subscribers = db.data.newsletter || [];
    
    if (subscribers.length === 0) {
      return res.status(400).json({ 
        error: "Nessun iscritto alla newsletter" 
      });
    }

    console.log(`\n📧 Invio newsletter a ${subscribers.length} iscritti`);
    console.log(`Subject: ${subject}`);
    
    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // Send emails to all subscribers
    for (const subscriber of subscribers) {
      try {
        await transporter.sendMail({
          from: `${process.env.FROM_NAME || 'LegoChris'} <${process.env.GMAIL_USER}>`,
          to: subscriber.email,
          subject: subject,
          html: newsletterEmail(subscriber.name, message),
        });
        
        sentCount++;
        console.log(`✅ Email inviata a: ${subscriber.email}`);
      } catch (error) {
        failedCount++;
        errors.push({ email: subscriber.email, error: error.message });
        console.error(`❌ Errore invio a ${subscriber.email}:`, error.message);
      }
    }

    console.log(`\n📊 Risultato: ${sentCount} inviate, ${failedCount} fallite`);
    
    res.json({ 
      success: true, 
      sent: sentCount,
      failed: failedCount,
      total: subscribers.length,
      message: `Newsletter inviata con successo a ${sentCount} di ${subscribers.length} iscritti`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error("❌ Errore invio newsletter:", err);
    res.status(500).json({ error: err.message });
  }
});

// Discord bot control endpoints
app.get("/api/bot/config", async (req, res) => {
  try {
    await db.read();
    res.json(getBotConfig());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/bot/config", async (req, res) => {
  try {
    await db.read();
    const current = getBotConfig();
    const payload = req.body || {};

    const updated = {
      rootPath: payload.rootPath ? path.resolve(String(payload.rootPath)) : current.rootPath,
      entryScript: payload.entryScript ? String(payload.entryScript) : current.entryScript,
      runtimeCommand: payload.runtimeCommand
        ? String(payload.runtimeCommand)
        : payload.pythonCommand
          ? String(payload.pythonCommand)
          : current.runtimeCommand,
      pythonCommand: payload.runtimeCommand
        ? String(payload.runtimeCommand)
        : payload.pythonCommand
          ? String(payload.pythonCommand)
          : current.runtimeCommand,
      pm2ProcessName: payload.pm2ProcessName ? String(payload.pm2ProcessName) : current.pm2ProcessName,
    };

    db.data.bot_config = updated;
    await db.write();
    pushBotLog("info", `Bot config updated (root=${updated.rootPath}, pm2=${updated.pm2ProcessName})`);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/bot/status", async (req, res) => {
  try {
    await db.read();
    res.json(await getBotStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/bot/start", async (req, res) => {
  try {
    await db.read();
    const status = await startBotProcess();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/bot/stop", async (req, res) => {
  try {
    await db.read();
    const result = await stopBotProcess(Boolean(req.body?.force));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/bot/restart", async (req, res) => {
  try {
    await db.read();
    const status = await restartBotProcess();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/bot/logs", async (req, res) => {
  try {
    await db.read();
    const limit = Math.max(1, Math.min(2000, Number(req.query.limit || 200)));
    const entries = await getPm2LogEntries(limit);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/bot/logs/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  botLogSubscribers.add(res);
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    botLogSubscribers.delete(res);
  });
});

app.post("/api/bot/terminal/exec", async (req, res) => {
  try {
    const command = String(req.body?.command || "").trim();
    const cwdRelative = String(req.body?.cwd || ".");
    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }

    await db.read();
    const config = getBotConfig();
    const cwd = resolveSandboxPath(config, cwdRelative);
    const result = await runCommand(command, [], { cwd });
    pushBotLog("command", `$ ${command}`);
    if (result.stdout) pushBotLog("stdout", result.stdout);
    if (result.stderr) pushBotLog("stderr", result.stderr);

    res.json({
      ...result,
      cwd: relFromBotRoot(config, cwd),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/bot/terminal/session", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const cwdRelative = String(req.body?.cwd || ".");
    const cols = Number(req.body?.cols || 120);
    const rows = Number(req.body?.rows || 32);
    
    console.log("[API] POST /api/bot/terminal/session: creating new session, cwd:", cwdRelative, "cols:", cols, "rows:", rows);
    
    const session = createTerminalSession(config, cwdRelative, cols, rows);

    pushBotLog("info", `Terminal session opened: ${session.id}`);
    console.log("[API] POST /api/bot/terminal/session: session created successfully, id:", session.id);
    
    res.json({
      id: session.id,
      cwd: session.cwdRelative,
      shell: session.shell,
      cols,
      rows,
    });
  } catch (err) {
    console.error("[API] POST /api/bot/terminal/session error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/bot/terminal/session/:id/stream", (req, res) => {
  const sessionId = String(req.params.id || "");
  console.log("[API] GET /api/bot/terminal/session/:id/stream, sessionId:", sessionId);
  
  const session = botTerminalSessions.get(sessionId);
  if (!session) {
    console.error("[API] Session not found:", sessionId);
    return res.status(404).json({ error: "Terminal session not found" });
  }

  console.log("[API] Session found, setting up SSE headers");
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders?.();

  session.subscribers.add(res);
  session.lastActivity = Date.now();

  console.log("[API] Client connected, subscribers count:", session.subscribers.size, "buffer size:", session.buffer.length);

  if (session.buffer) {
    console.log("[API] Sending initial snapshot, size:", session.buffer.length);
    res.write(`data: ${JSON.stringify({ type: "snapshot", chunk: session.buffer })}\n\n`);
  }
  if (session.closed) {
    console.log("[API] Session is already closed, sending exit event");
    res.write(`data: ${JSON.stringify({ type: "exit", code: session.exitCode ?? null, reason: session.closeReason || "closed" })}\n\n`);
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    } catch {
      // noop
    }
  }, 15000);

  req.on("close", () => {
    console.log("[API] SSE client disconnected");
    clearInterval(heartbeat);
    session.subscribers.delete(res);
    session.lastActivity = Date.now();
  });
});

app.post("/api/bot/terminal/session/:id/input", (req, res) => {
  try {
    const session = botTerminalSessions.get(String(req.params.id || ""));
    if (!session) {
      return res.status(404).json({ error: "Terminal session not found" });
    }
    if (session.closed) {
      return res.status(409).json({ error: "Terminal session is already closed" });
    }

    const data = String(req.body?.data || "");
    if (!data) {
      return res.status(400).json({ error: "Input data is required" });
    }

    session.ptyProcess.write(data);
    session.lastActivity = Date.now();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/bot/terminal/session/:id/resize", (req, res) => {
  try {
    const session = botTerminalSessions.get(String(req.params.id || ""));
    if (!session) {
      return res.status(404).json({ error: "Terminal session not found" });
    }

    const cols = Math.max(40, Math.min(300, Number(req.body?.cols) || 120));
    const rows = Math.max(12, Math.min(120, Number(req.body?.rows) || 32));
    session.ptyProcess.resize(cols, rows);
    session.lastActivity = Date.now();
    res.json({ success: true, cols, rows });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/bot/terminal/session/:id", (req, res) => {
  const id = String(req.params.id || "");
  if (!botTerminalSessions.has(id)) {
    return res.status(404).json({ error: "Terminal session not found" });
  }
  closeTerminalSession(id, "manual-close");
  res.json({ success: true });
});

app.get("/api/bot/files", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const rel = String(req.query.path || ".");
    const files = await listDirectory(config, rel);
    res.json({ path: rel, entries: files });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/bot/file", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const rel = String(req.query.path || "");
    if (!rel) {
      return res.status(400).json({ error: "path query is required" });
    }
    const abs = resolveSandboxPath(config, rel);
    const stats = await fs.promises.stat(abs);
    if (!stats.isFile()) {
      return res.status(400).json({ error: "Path is not a file" });
    }
    const content = await fs.promises.readFile(abs, "utf8");
    res.json({ path: relFromBotRoot(config, abs), content, mtime: stats.mtime.toISOString() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/bot/file", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const rel = String(req.body?.path || "");
    const content = String(req.body?.content || "");
    if (!rel) {
      return res.status(400).json({ error: "path is required" });
    }
    const abs = resolveSandboxPath(config, rel);
    await fs.promises.writeFile(abs, content, "utf8");
    pushBotLog("info", `File updated: ${rel}`);
    res.json({ success: true, path: relFromBotRoot(config, abs) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/bot/file", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const rel = String(req.body?.path || "");
    const type = String(req.body?.type || "file");
    const content = String(req.body?.content || "");
    if (!rel) {
      return res.status(400).json({ error: "path is required" });
    }
    const abs = resolveSandboxPath(config, rel);
    if (type === "dir") {
      await fs.promises.mkdir(abs, { recursive: true });
    } else {
      await fs.promises.mkdir(path.dirname(abs), { recursive: true });
      await fs.promises.writeFile(abs, content, "utf8");
    }
    pushBotLog("info", `Created ${type}: ${rel}`);
    res.json({ success: true, path: relFromBotRoot(config, abs) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/bot/file", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const rel = String(req.query.path || "");
    if (!rel) {
      return res.status(400).json({ error: "path query is required" });
    }
    const abs = resolveSandboxPath(config, rel);
    await fs.promises.rm(abs, { recursive: true, force: true });
    pushBotLog("info", `Deleted path: ${rel}`);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/bot/file/rename", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const oldRel = String(req.body?.oldPath || "");
    const newRel = String(req.body?.newPath || "");
    if (!oldRel || !newRel) {
      return res.status(400).json({ error: "oldPath and newPath are required" });
    }
    const oldAbs = resolveSandboxPath(config, oldRel);
    const newAbs = resolveSandboxPath(config, newRel);
    await fs.promises.mkdir(path.dirname(newAbs), { recursive: true });
    await fs.promises.rename(oldAbs, newAbs);
    pushBotLog("info", `Renamed: ${oldRel} -> ${newRel}`);
    res.json({ success: true, oldPath: oldRel, newPath: newRel });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/bot/modules", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const available = await scanCogs(config);
    const enabledMap = db.data.bot_modules || {};
    const modules = available.map((name) => ({
      name,
      enabled: Boolean(enabledMap[name]),
    }));
    res.json({ modules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/bot/modules", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const enabled = Array.isArray(req.body?.enabled) ? req.body.enabled : [];
    const available = await scanCogs(config);
    const enabledMap = {};
    for (const name of available) {
      enabledMap[name] = enabled.includes(name);
    }
    db.data.bot_modules = enabledMap;
    await db.write();
    pushBotLog("info", `Modules updated: ${enabled.join(", ")}`);
    res.json({ success: true, bot_modules: enabledMap });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/bot/builder/flows", async (req, res) => {
  try {
    await db.read();
    res.json({ flows: db.data.bot_builder_flows || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/bot/builder/flows", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const flowName = String(req.query.name || req.body?.name || "").trim();
    if (!flowName) {
      return res.status(400).json({ error: "name is required" });
    }

    const existing = (db.data.bot_builder_flows || []).find((flow) => flow.name === flowName);
    if (!existing) {
      return res.status(404).json({ error: "Workflow non trovato" });
    }

    const compiledFile = typeof existing.compiled_file === "string" ? existing.compiled_file : "";
    const moduleName = typeof existing.module === "string" ? existing.module : relativeCogPathToModuleName(compiledFile);

    db.data.bot_builder_flows = (db.data.bot_builder_flows || []).filter((flow) => flow.name !== flowName);
    if (moduleName && db.data.bot_modules) {
      delete db.data.bot_modules[moduleName];
    }
    await db.write();

    if (compiledFile) {
      const absPath = resolveSandboxPath(config, compiledFile);
      if (fs.existsSync(absPath)) {
        await fs.promises.rm(absPath, { force: true });
      }
    }

    let restarted = false;
    let restartError = null;
    const status = await getBotStatus();
    if (status.running) {
      try {
        await restartBotProcess();
        restarted = true;
        pushBotLog("info", `Bot restarted after deleting workflow: ${flowName}`);
      } catch (error) {
        restartError = error.message;
        pushBotLog("error", `Auto-restart failed after deleting workflow ${flowName}: ${error.message}`);
      }
    }

    pushBotLog("info", `Workflow deleted: ${flowName}`);
    res.json({ success: true, name: flowName, deletedFile: compiledFile || null, restarted, restartError });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/bot/builder/save-source", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const source = String(req.body?.source || "");
    const targetPath = normalizeCogRelativePath(req.body?.path, req.body?.name || "custom_cog");
    const moduleName = relativeCogPathToModuleName(targetPath);
    const absPath = resolveSandboxPath(config, targetPath);

    await fs.promises.mkdir(path.dirname(absPath), { recursive: true });
    await fs.promises.writeFile(absPath, source, "utf8");

    if (moduleName) {
      db.data.bot_modules ||= {};
      db.data.bot_modules[moduleName] = true;
      await db.write();
    }

    let restarted = false;
    let restartError = null;
    const status = await getBotStatus();
    if (status.running) {
      try {
        await restartBotProcess();
        restarted = true;
        pushBotLog("info", `Bot restarted after saving builder source: ${targetPath}`);
      } catch (error) {
        restartError = error.message;
        pushBotLog("error", `Auto-restart failed after saving builder source ${targetPath}: ${error.message}`);
      }
    }

    pushBotLog("info", `Builder source saved to cog: ${targetPath}`);
    res.json({
      success: true,
      path: targetPath,
      module: moduleName,
      restarted,
      restartError,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/bot/builder/compile", async (req, res) => {
  try {
    await db.read();
    const config = getBotConfig();
    const flow = req.body?.flow;
    const preview = req.body?.preview === true;
    if (!flow || !flow.name) {
      return res.status(400).json({ error: "flow with name is required" });
    }

    const compiled = await compileFlowToCog(config, flow, {
      writeToDisk: !preview,
      outputPath: req.body?.outputPath || flow?.targetPath,
    });
    let restarted = false;
    let restartError = null;
    
    // Se preview=true, non salvare il file fisicamente, solo visualizzare l'anteprima
    if (!preview) {
      const flowRecord = {
        id: Date.now(),
        ...flow,
        compiled_file: compiled.file,
        updated_at: new Date().toISOString(),
      };

      db.data.bot_builder_flows = (db.data.bot_builder_flows || []).filter((f) => f.name !== flow.name && f.compiled_file !== compiled.file);
      db.data.bot_builder_flows.push({
        ...flowRecord,
        module: compiled.module,
      });
      db.data.bot_modules ||= {};
      db.data.bot_modules[compiled.module] = true;
      await db.write();

      pushBotLog("info", `Flow compiled to cog: ${compiled.file} (enabled: ${compiled.module})`);

      const status = await getBotStatus();
      if (status.running) {
        try {
          await restartBotProcess();
          restarted = true;
          pushBotLog("info", `Bot restarted after compiling flow: ${compiled.name}`);
        } catch (error) {
          restartError = error.message;
          pushBotLog("error", `Auto-restart failed after compiling flow ${compiled.name}: ${error.message}`);
        }
      }
    } else {
      pushBotLog("info", `Flow preview compiled (virtual): ${flow.name}`);
    }

    res.json({
      success: true,
      compiled,
      preview,
      restarted,
      restartError,
      flow: { name: flow.name, nodes: flow.nodes, edges: flow.edges },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n📊 JSON Database API server running on:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${hostIp}:${PORT}`);
  console.log(`   - Backend URL: ${BACKEND_URL}`);
  console.log(`\n💡 To access from mobile:`);
  console.log(`   1. Update .env: VITE_API_URL="http://${hostIp}:${PORT}"`);
  console.log(`   2. Restart dev server (npm run dev)`);
  console.log(`   3. Open on mobile: http://${hostIp}:5173\n`);
});
