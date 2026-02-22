// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const axios = require('axios');
const FormData = require('form-data'); // <--- ENSURE THIS IS INSTALLED: npm install form-data

const app = express();

// ✅ UPDATED: Prisma init with logs + connect once
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// ✅ Connect once on boot (avoids lazy-connection race under heavy load)
(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Prisma DB Connected");
  } catch (e) {
    console.error("❌ Prisma DB Connect Failed:", e.message);
  }
})();

const PORT = 3001;

// Use key from .env
const SECRET_KEY = process.env.SECRET_KEY || "my_super_secret_research_key";

// --- MIDDLEWARE ---
app.use(cors());

// 1. Allow server to accept raw binary data (SPECIFICALLY for Camera Uploads)
app.use('/api/camera-frame', express.raw({ type: '*/*', limit: '10mb' }));

// 2. Standard JSON/UrlEncoded parsing for everything else
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- MULTER CONFIG (File Uploads) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});
const upload = multer({ storage: storage });

// --- NODEMAILER CONFIG (Emails) ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify(function (error, success) {
  if (error) console.log("❌ Email Connection Error:", error);
  else console.log("✅ Email Server is Ready");
});

// ==========================================
// ✅ FILE-BASED SESSION STORE (HEALTH SCANS)
// ==========================================
const HEALTH_SESSION_STORE_PATH = path.join(__dirname, 'health_session_store.json');

function ensureHealthSessionStoreFile() {
  try {
    if (!fs.existsSync(HEALTH_SESSION_STORE_PATH)) {
      fs.writeFileSync(HEALTH_SESSION_STORE_PATH, JSON.stringify({ sessions: {} }, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error("❌ Failed to init health session store:", e.message);
  }
}
ensureHealthSessionStoreFile();

function readHealthSessionStore() {
  try {
    ensureHealthSessionStoreFile();
    const raw = fs.readFileSync(HEALTH_SESSION_STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw || '{}');
    if (!parsed.sessions) parsed.sessions = {};
    return parsed;
  } catch (e) {
    console.error("❌ Failed to read health session store:", e.message);
    return { sessions: {} };
  }
}

function writeHealthSessionStore(storeObj) {
  try {
    fs.writeFileSync(HEALTH_SESSION_STORE_PATH, JSON.stringify(storeObj, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error("❌ Failed to write health session store:", e.message);
    return false;
  }
}

function getSessionOwnerKey(req) {
  if (req.user && req.user.id) return `user:${req.user.id}`;

  const deviceId = (req.headers['x-device-id'] || '').toString().trim();
  if (deviceId) return `device:${deviceId}`;

  return `anon:shared`;
}

// ==========================================
// 🛡️ MIDDLEWARE: VERIFY JWT TOKEN
// ==========================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("❌ Access Denied: No token provided in header");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const cleanToken = token.replace(/"/g, '');

  jwt.verify(cleanToken, SECRET_KEY, (err, user) => {
    if (err) {
      console.error("❌ Token Verify Failed:", err.message);
      return res.status(403).json({ error: "Invalid token." });
    }
    req.user = user;
    next();
  });
}

// ✅ OPTIONAL AUTH (won’t block if no token)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  const cleanToken = token.replace(/"/g, '');
  jwt.verify(cleanToken, SECRET_KEY, (err, user) => {
    if (!err && user) req.user = user;
    next();
  });
}

// ==========================================
// 🔐 AUTHENTICATION ROUTES
// ==========================================

// 1. REGISTER USER
app.post('/api/auth/register', upload.single('avatar'), async (req, res) => {
  try {
    console.log("📝 Register Request Received");
    if (!req.body) return res.status(400).json({ error: "Request body is empty" });

    const { name, email, password, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    let avatarUrl = "";
    if (req.file) avatarUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'Researcher',
        avatar: avatarUrl
      }
    });

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, SECRET_KEY, { expiresIn: '2h' });

    console.log("✅ User Registered:", email);
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, avatar: newUser.avatar }
    });

  } catch (error) {
    console.error("❌ Register Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. LOGIN USER
app.post('/api/auth/login', upload.none(), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Please provide email and password" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '2h' }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || ""
      }
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. FORGOT PASSWORD
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`📧 Reset request for: ${email}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: "Server email configuration missing" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Email not found" });

    const resetToken = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '15m' });
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"AquaSmart Research" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0284c7;">AquaSmart Password Reset</h2>
          <p>You requested a password reset for your research account.</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetLink}" style="background-color: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Link expires in 15 minutes.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`);
    res.json({ message: "Reset link sent successfully" });

  } catch (error) {
    console.error("❌ Email Error Detail:", error);
    res.status(500).json({ error: "Failed to send email. Check backend logs." });
  }
});

// 4. RESET PASSWORD
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, SECRET_KEY);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword }
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

// ==========================================
// ⚙️ ACCOUNT SETTINGS ROUTES
// ==========================================

// 5. UPDATE PROFILE
app.put('/api/auth/update-profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { name } = req.body;
    const userId = parseInt(req.user.id);

    console.log(`📝 Updating profile for User ID: ${userId}`);

    const updateData = {};
    if (name) updateData.name = name;

    if (req.file) {
      updateData.avatar = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    console.log("✅ Profile updated!");

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    });

  } catch (error) {
    console.error("❌ Profile Update Error:", error);
    res.status(500).json({ error: `Failed to update profile: ${error.message}` });
  }
});

// 6. CHANGE PASSWORD
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    console.log("🔐 Change Password Request Body:", req.body);

    const { currentPassword, newPassword } = req.body;
    const userId = parseInt(req.user.id);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current and new passwords are required." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Incorrect current password." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    console.log(`✅ Password changed for User ID: ${userId}`);
    res.json({ message: "Password changed successfully" });

  } catch (error) {
    console.error("❌ Password Change Exception:", error);
    res.status(500).json({ error: `Failed to change password: ${error.message}` });
  }
});

// ==========================================
// ✅ HEALTH SESSION LOG ROUTES (PERSIST AFTER REFRESH)
// ==========================================

app.get('/api/health-session', optionalAuth, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const pondId = parseInt(req.query.pondId || "1", 10) || 1;
    const limitRaw = parseInt(req.query.limit || "10", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;

    const ownerKey = getSessionOwnerKey(req);
    const store = readHealthSessionStore();

    const ownerBucket = store.sessions[ownerKey] || {};
    const pondBucket = ownerBucket[String(pondId)] || [];

    const list = [...pondBucket].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, limit);

    return res.json({
      ownerKey,
      pondId,
      count: list.length,
      logs: list
    });
  } catch (error) {
    console.error("❌ Health session fetch error:", error.message);
    return res.status(500).json({ error: "Failed to fetch health session logs" });
  }
});

app.post('/api/health-session', optionalAuth, async (req, res) => {
  try {
    const {
      pondId,
      researcher,
      condition,
      status,
      confidence,
      advice,
      behaviors,
      img
    } = req.body || {};

    const finalPondId = parseInt(pondId || "1", 10) || 1;

    if (!condition || !status) {
      return res.status(400).json({ error: "Missing condition/status" });
    }

    const ownerKey = getSessionOwnerKey(req);
    const store = readHealthSessionStore();

    if (!store.sessions[ownerKey]) store.sessions[ownerKey] = {};
    if (!store.sessions[ownerKey][String(finalPondId)]) store.sessions[ownerKey][String(finalPondId)] = [];

    const entry = {
      id: Date.now(),
      createdAt: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      pondId: finalPondId,
      researcher: researcher || "Researcher",
      condition,
      status,
      confidence,
      advice,
      behaviors: Array.isArray(behaviors) ? behaviors : [],
      img: img || null
    };

    store.sessions[ownerKey][String(finalPondId)] = [entry, ...store.sessions[ownerKey][String(finalPondId)]].slice(0, 50);

    const ok = writeHealthSessionStore(store);
    if (!ok) return res.status(500).json({ error: "Failed to persist session log" });

    return res.status(201).json({ message: "Session log saved", entry });
  } catch (error) {
    console.error("❌ Health session save error:", error.message);
    return res.status(500).json({ error: "Failed to save health session log" });
  }
});

app.delete('/api/health-session', optionalAuth, async (req, res) => {
  try {
    const pondId = parseInt(req.query.pondId || "1", 10) || 1;
    const ownerKey = getSessionOwnerKey(req);

    const store = readHealthSessionStore();
    if (!store.sessions[ownerKey]) store.sessions[ownerKey] = {};
    store.sessions[ownerKey][String(pondId)] = [];

    const ok = writeHealthSessionStore(store);
    if (!ok) return res.status(500).json({ error: "Failed to clear session log" });

    return res.json({ message: "Session logs cleared", pondId });
  } catch (error) {
    console.error("❌ Health session clear error:", error.message);
    return res.status(500).json({ error: "Failed to clear health session logs" });
  }
});

// ==========================================
// 📷 CAMERA ROUTES
// ==========================================

app.post('/api/camera-frame', async (req, res) => {
  try {
    const imgLen = req.body ? req.body.length : 0;
    console.log(`📸 Receiving Frame... Size: ${imgLen} bytes`);

    const width = parseInt(req.headers['x-img-width']) || 320;
    const height = parseInt(req.headers['x-img-height']) || 240;
    const imgType = (req.headers['x-img-type'] || 'RGB565').toUpperCase();
    const pondId = parseInt(req.query.pondId) || 1;

    if (imgLen === 0) return res.status(400).send("Empty Image Data");

    const pond = await prisma.pond.findUnique({ where: { id: pondId } });
    if (!pond) return res.status(404).send(`Pond ${pondId} not found`);

    let bmpBuffer;
    try {
      if (imgType === 'GRAYSCALE') {
        bmpBuffer = convertGrayscaleToBMP(req.body, width, height);
      } else {
        bmpBuffer = convertRGB565toBMP(req.body, width, height);
      }
    } catch (conversionError) {
      return res.status(500).send("Image Conversion Failed");
    }

    const base64Image = `data:image/bmp;base64,${bmpBuffer.toString('base64')}`;

    const newLog = await prisma.cameraLog.create({
      data: {
        type: "IMAGE",
        url: base64Image,
        description: `${imgType} Capture`,
        pondId: pondId
      }
    });

    console.log("✅ Image Saved! ID:", newLog.id);
    res.status(201).send("Image Uploaded");

  } catch (error) {
    console.error("❌ Upload Error:", error.message);
    res.status(500).send(`Backend Error: ${error.message}`);
  }
});

// =====================================================
// ✅ CAMERA LOGS (FIXED): CACHE + SINGLE-FLIGHT + BACKOFF + GUARANTEED CLEANUP
// =====================================================
const CAMERA_LOG_CACHE_TTL_MS = 600; // small cache to prevent DB spam
const cameraLogsCache = new Map();   // key -> { ts, data }
const cameraLogsInFlight = new Map(); // key -> Promise
let dbBackoffUntil = 0;

function isDbDownError(err) {
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("timed out fetching a new connection") ||
    msg.includes("connection pool") ||
    msg.includes("can't reach database server") ||
    msg.includes("connect") ||
    msg.includes("timeout") ||
    msg.includes("ecconn") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused")
  );
}

app.get('/api/camera-logs', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // ✅ Fail fast during backoff window
    if (Date.now() < dbBackoffUntil) {
      return res.status(200).json([]);
    }

    const pondId = req.query.pondId ? parseInt(req.query.pondId, 10) : null;
    const takeRaw = req.query.take ? parseInt(req.query.take, 10) : 10;
    const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 50) : 10;

    const cursorId = req.query.cursorId ? parseInt(req.query.cursorId, 10) : null;
    const withImage = (req.query.withImage ?? "1") !== "0";

    const cacheKey = `pond:${pondId || "all"}|take:${take}|cursor:${cursorId || 0}|img:${withImage ? 1 : 0}`;

    // ✅ Serve from cache
    const cached = cameraLogsCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < CAMERA_LOG_CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    // ✅ Single-flight
    if (cameraLogsInFlight.has(cacheKey)) {
      const data = await cameraLogsInFlight.get(cacheKey);
      return res.json(data);
    }

    const where = {};
    if (pondId) where.pondId = pondId;
    if (cursorId) where.id = { gt: cursorId };

    const queryPromise = (async () => {
      const logs = await prisma.cameraLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take,
        ...(withImage
          ? {}
          : {
              select: {
                id: true,
                type: true,
                description: true,
                pondId: true,
                timestamp: true,
              }
            })
      });

      cameraLogsCache.set(cacheKey, { ts: Date.now(), data: logs });
      return logs;
    })();

    cameraLogsInFlight.set(cacheKey, queryPromise);

    try {
      const logs = await queryPromise;
      return res.json(logs);
    } finally {
      // ✅ ALWAYS cleanup inflight even if query fails
      cameraLogsInFlight.delete(cacheKey);
    }

  } catch (error) {
    console.error("❌ Fetch Logs Error:", error.message);

    if (isDbDownError(error)) {
      dbBackoffUntil = Date.now() + 5000;
    }

    return res.status(200).json([]);
  }
});

// ==========================================
// ⚙️ IOT ROUTES (UPDATED WITH SOFT SENSORS)
// ==========================================
app.get('/api/ponds', async (req, res) => {
  try {
    const ponds = await prisma.pond.findMany({ include: { actuators: true } });
    res.json(ponds);
  } catch (error) { res.status(500).json({ error: "Failed to fetch ponds" }); }
});

app.post('/api/readings', async (req, res) => {
  let { ph, temp, turbidity, salinity, pondId } = req.body;
  let dissolvedOxygen = req.body.do;
  let ammonia = req.body.ammonia;

  const phVal = parseFloat(ph) || 7.0;
  const tempVal = parseFloat(temp) || 28;
  const turbVal = parseFloat(turbidity) || 0;

  let salValue = parseFloat(salinity) || 0;
  if (salValue > 50) {
    salValue = salValue / 1000;
  }

  if (!dissolvedOxygen || parseFloat(dissolvedOxygen) === 0) {
    let calcDO = 14.6 - (0.33 * tempVal) - (0.05 * salValue);
    dissolvedOxygen = Math.max(0.8, calcDO);
  }

  if (!ammonia || parseFloat(ammonia) === 0) {
    let biologicalFactor = (tempVal * 0.0008) + (phVal * 0.001);
    let turbidityFactor = turbVal * 0.002;
    let calcAmmonia = biologicalFactor + turbidityFactor;
    ammonia = Math.max(0.015, calcAmmonia);
  }

  try {
    const reading = await prisma.sensorReading.create({
      data: {
        ph: phVal,
        dissolvedOxygen: parseFloat(parseFloat(dissolvedOxygen).toFixed(2)),
        temperature: tempVal,
        turbidity: turbVal,
        ammonia: parseFloat(parseFloat(ammonia).toFixed(3)),
        salinity: parseFloat(salValue),
        pond: { connect: { id: parseInt(pondId) } }
      }
    });

    console.log(`📡 Logged: pH=${phVal} | Temp=${tempVal} | DO=${dissolvedOxygen} | NH3=${ammonia}`);
    res.status(201).json(reading);
  } catch (error) {
    console.error("❌ Save Error:", error.message);
    res.status(500).json({ error: "Failed to save reading" });
  }
});

app.get('/api/readings/:pondId', async (req, res) => {
  const { pondId } = req.params;
  try {
    const readings = await prisma.sensorReading.findMany({
      where: { pondId: parseInt(pondId) }, orderBy: { timestamp: 'desc' }, take: 50
    });
    res.json(readings);
  } catch (error) { res.status(500).json({ error: "Failed to fetch history" }); }
});

app.post('/api/actuators/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { isOn } = req.body;
  try {
    const actuator = await prisma.actuator.update({
      where: { id: parseInt(id) }, data: { isOn }
    });
    res.json(actuator);
  } catch (error) { res.status(500).json({ error: "Failed to toggle actuator" }); }
});

app.post('/api/seed', async (req, res) => {
  try {
    const pondCount = await prisma.pond.count();
    if (pondCount > 0) return res.json({ message: "Already seeded." });

    const pond = await prisma.pond.create({
      data: {
        id: 1,
        name: "Research Pond 01", location: "Faculty",
        actuators: { create: [{ name: "Aerator", isOn: false }] }
      }
    });
    res.json({ message: "Seeded", pond });
  } catch (error) { res.status(500).json({ error: "Seed failed" }); }
});

// ==========================================
// 🔮 AI PREDICTION ENDPOINT
// ==========================================
app.get('/api/predict/:pondId', async (req, res) => {
  const { pondId } = req.params;
  try {
    const history = await prisma.sensorReading.findMany({
      where: { pondId: parseInt(pondId) },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    if (history.length < 10) {
      return res.status(200).json({
        warning: "Not enough data",
        message: `Need 10 data points, found ${history.length}`
      });
    }

    const formattedData = history.reverse().map(r => ({
      temp: r.temperature,
      ph: r.ph,
      do: r.dissolvedOxygen,
      ammonia: r.ammonia,
      turbidity: r.turbidity,
      salinity: r.salinity
    }));

    const aiResponse = await axios.post('http://127.0.0.1:5000/predict', {
      readings: formattedData
    });

    res.json(aiResponse.data);

  } catch (error) {
    console.error("❌ AI Error:", error.message);
    res.status(500).json({ error: "AI Service Offline" });
  }
});

// ==========================================
// 🦠 DISEASE DETECTION ROUTE (UPDATED BRIDGE)
// ==========================================
app.post('/api/analyze-health', upload.single('prawnImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("🧬 Preparing Multi-class Neural Analysis for:", req.file.filename);

    const form = new FormData();
    form.append('prawnImage', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiResponse = await axios.post('http://127.0.0.1:5000/api/analyze-health', form, {
      headers: {
        ...form.getHeaders(),
      }
    });

    res.json({
      ...aiResponse.data,
      imageUrl: `http://localhost:${PORT}/uploads/${req.file.filename}`
    });

  } catch (error) {
    console.error("❌ Analysis Failed:", error.message);
    res.status(500).json({ error: "AI Service Unreachable. Ensure app.py is running on port 5000." });
  }
});

// ==========================================
// 🛠 BMP CONVERTERS
// ==========================================
function convertGrayscaleToBMP(buffer, width, height) {
  const pad = (4 - (width * 3) % 4) % 4;
  const fileSize = 54 + ((width * 3 + pad) * height);
  const bmp = Buffer.alloc(fileSize);

  bmp.write('BM');
  bmp.writeUInt32LE(fileSize, 2);
  bmp.writeUInt32LE(54, 10);
  bmp.writeUInt32LE(40, 14);
  bmp.writeUInt32LE(width, 18);
  bmp.writeUInt32LE(height, 22);
  bmp.writeUInt16LE(1, 26);
  bmp.writeUInt16LE(24, 28);
  bmp.writeUInt32LE(0, 30);
  bmp.writeUInt32LE(fileSize - 54, 34);

  let pos = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const val = buffer[y * width + x];
      bmp[pos++] = val; bmp[pos++] = val; bmp[pos++] = val;
    }
    pos += pad;
  }
  return bmp;
}

function convertRGB565toBMP(buffer, width, height) {
  const pad = (4 - (width * 3) % 4) % 4;
  const fileSize = 54 + ((width * 3 + pad) * height);
  const bmp = Buffer.alloc(fileSize);

  bmp.write('BM');
  bmp.writeUInt32LE(fileSize, 2);
  bmp.writeUInt32LE(54, 10);
  bmp.writeUInt32LE(40, 14);
  bmp.writeUInt32LE(width, 18);
  bmp.writeUInt32LE(height, 22);
  bmp.writeUInt16LE(1, 26);
  bmp.writeUInt16LE(24, 28);
  bmp.writeUInt32LE(0, 30);
  bmp.writeUInt32LE(fileSize - 54, 34);

  let pos = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 2;
      const byte1 = buffer[i];
      const byte2 = buffer[i + 1];
      const val = (byte1 << 8) | byte2;

      const r = ((val >> 11) & 0x1F) << 3;
      const g = ((val >> 5) & 0x3F) << 2;
      const b = (val & 0x1F) << 3;

      bmp[pos++] = b; bmp[pos++] = g; bmp[pos++] = r;
    }
    pos += pad;
  }
  return bmp;
}

// ==========================================
// ✅ WELCOME ROUTE
// ==========================================
app.get('/', (req, res) => {
  res.send("<h1>Prawn Monitoring Backend is LIVE! 🦐🚀</h1>");
});

// ✅ UPDATED: Graceful shutdown for nodemon + normal exits
async function shutdown(signal) {
  try {
    console.log(`🛑 Shutdown signal received: ${signal}`);
    await prisma.$disconnect();
    console.log("✅ Prisma disconnected");
  } catch (e) {
    console.log("⚠️ Prisma disconnect error:", e.message);
  }
}

// CTRL+C
process.on('SIGINT', async () => {
  await shutdown('SIGINT');
  process.exit(0);
});

// Normal stop (Docker/PM2/etc)
process.on('SIGTERM', async () => {
  await shutdown('SIGTERM');
  process.exit(0);
});

// ✅ nodemon restart uses SIGUSR2
process.once('SIGUSR2', async () => {
  await shutdown('SIGUSR2');
  process.kill(process.pid, 'SIGUSR2');
});

// Prisma internal hook
process.on('beforeExit', async () => {
  await shutdown('beforeExit');
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AquaSmart Backend running on http://localhost:${PORT}`);
});