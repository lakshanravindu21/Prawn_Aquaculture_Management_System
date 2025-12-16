/**
 * // Load environment variables FIRST
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

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

// Use key from .env
const SECRET_KEY = process.env.SECRET_KEY || "my_super_secret_research_key";

// --- MIDDLEWARE ---
app.use(cors()); // Allow requests from Frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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
    // Clean filename
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});
const upload = multer({ storage: storage });

// --- NODEMAILER CONFIG (Emails) ---
// Now uses variables loaded from .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Will read rlgalathura@gmail.com
    pass: process.env.EMAIL_PASS  // Will read the app password
  }
});

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
    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let avatarUrl = "";
    if (req.file) {
      avatarUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    }

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
    console.log(`📧 Processing password reset for: ${email}`);

    // Check if env vars are loaded
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ MISSING EMAIL CREDENTIALS IN .ENV FILE");
        return res.status(500).json({ error: "Server email configuration missing" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Email not found" });

    const resetToken = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '15m' });
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `AquaSmart System <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">AquaSmart Password Reset</h2>
          <p>You requested a password reset for your research account.</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This link expires in 15 minutes.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Reset email sent to ${email}`);
    res.json({ message: "Reset link sent to your email" });

  } catch (error) {
    console.error("❌ Email Error Detail:", error);
    res.status(500).json({ error: "Failed to send email. Check server logs." });
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
// 🌊 IOT ROUTES
// ==========================================
app.get('/api/ponds', async (req, res) => {
  try {
    const ponds = await prisma.pond.findMany({ include: { actuators: true } });
    res.json(ponds);
  } catch (error) { res.status(500).json({ error: "Failed to fetch ponds" }); }
});

app.post('/api/readings', async (req, res) => {
  const { ph, do: dissolvedOxygen, temp, turbidity, ammonia, salinity, pondId } = req.body;
  try {
    const reading = await prisma.sensorReading.create({
      data: {
        ph: parseFloat(ph), dissolvedOxygen: parseFloat(dissolvedOxygen),
        temperature: parseFloat(temp), turbidity: parseFloat(turbidity),
        ammonia: parseFloat(ammonia), salinity: parseFloat(salinity || 0),
        pond: { connect: { id: parseInt(pondId) } }
      }
    });
    console.log(`📡 Data Logged: DO=${dissolvedOxygen}`);
    res.status(201).json(reading);
  } catch (error) { res.status(500).json({ error: "Failed to save reading" }); }
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
        name: "Research Pond 01", location: "Faculty",
        actuators: { create: [{ name: "Aerator", isOn: false }] }
      }
    });
    res.json({ message: "Seeded", pond });
  } catch (error) { res.status(500).json({ error: "Seed failed" }); }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AquaSmart Backend running on http://localhost:${PORT}`);
});**/

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

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

// Use key from .env
const SECRET_KEY = process.env.SECRET_KEY || "my_super_secret_research_key";

// --- MIDDLEWARE ---
app.use(cors()); // Allow requests from Frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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
    // Clean filename
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});
const upload = multer({ storage: storage });

// --- NODEMAILER CONFIG (UPDATED FOR STABILITY) ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Explicit Host
  port: 465,              // Explicit Port for SSL
  secure: true,           // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify email connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ Email Connection Error:", error);
  } else {
    console.log("✅ Email Server is Ready");
  }
});

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
    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let avatarUrl = "";
    if (req.file) {
      avatarUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    }

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

    // Check credentials loaded
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
// 🌊 IOT ROUTES
// ==========================================
app.get('/api/ponds', async (req, res) => {
  try {
    const ponds = await prisma.pond.findMany({ include: { actuators: true } });
    res.json(ponds);
  } catch (error) { res.status(500).json({ error: "Failed to fetch ponds" }); }
});

app.post('/api/readings', async (req, res) => {
  const { ph, do: dissolvedOxygen, temp, turbidity, ammonia, salinity, pondId } = req.body;
  try {
    const reading = await prisma.sensorReading.create({
      data: {
        ph: parseFloat(ph), dissolvedOxygen: parseFloat(dissolvedOxygen),
        temperature: parseFloat(temp), turbidity: parseFloat(turbidity),
        ammonia: parseFloat(ammonia), salinity: parseFloat(salinity || 0),
        pond: { connect: { id: parseInt(pondId) } }
      }
    });
    console.log(`📡 Data Logged: DO=${dissolvedOxygen}`);
    res.status(201).json(reading);
  } catch (error) { res.status(500).json({ error: "Failed to save reading" }); }
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
        name: "Research Pond 01", location: "Faculty",
        actuators: { create: [{ name: "Aerator", isOn: false }] }
      }
    });
    res.json({ message: "Seeded", pond });
  } catch (error) { res.status(500).json({ error: "Seed failed" }); }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AquaSmart Backend running on http://localhost:${PORT}`);
});