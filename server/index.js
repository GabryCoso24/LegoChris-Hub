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
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Errore configurazione email:', error);
  } else {
    console.log('✅ Server email pronto per inviare messaggi');
  }
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

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
  passwordResetTokens: []
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
  passwordResetTokens: []
};
await db.write();

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
    // Convert relative image URLs to full URLs
    const withFullUrls = (db.data.playlists || []).map(item => convertImageUrls(item, ['thumbnail']));
    res.json(withFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/playlists", async (req, res) => {
  try {
    await db.read();
    const { title, description, video_ids, youtube_link, thumbnail } = req.body;
    const newPlaylist = {
      id: Date.now(),
      title,
      description: description || null,
      video_ids: video_ids || null,
      youtube_link: youtube_link || null,
      thumbnail: thumbnail || null,
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

app.put("/api/playlists/:id", async (req, res) => {
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

// Videos endpoints
app.get("/api/videos", async (req, res) => {
  try {
    await db.read();
    // Convert relative image URLs to full URLs
    const withFullUrls = (db.data.videos || []).map(item => convertImageUrls(item, ['thumbnail']));
    res.json(withFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/videos", async (req, res) => {
  try {
    await db.read();
    const { title, thumbnail, duration, views, date, video_link } = req.body;
    const newVideo = {
      id: Date.now(),
      title,
      thumbnail: thumbnail || null,
      duration,
      views: views || "",
      date: date || "",
      video_link: video_link || "",
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

app.put("/api/videos/:id", async (req, res) => {
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