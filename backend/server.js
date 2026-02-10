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
// 🛡️ MIDDLEWARE: VERIFY JWT TOKEN
// ==========================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  // Extract token: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("❌ Access Denied: No token provided in header");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // Remove extra quotes if they exist
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

    // Check if pond exists
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

app.get('/api/camera-logs', async (req, res) => {
  try {
    const logs = await prisma.cameraLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ==========================================
// 🌊 IOT ROUTES (UPDATED WITH SOFT SENSORS)
// ==========================================
app.get('/api/ponds', async (req, res) => {
  try {
    const ponds = await prisma.pond.findMany({ include: { actuators: true } });
    res.json(ponds);
  } catch (error) { res.status(500).json({ error: "Failed to fetch ponds" }); }
});

// ✅ UPDATED READINGS ROUTE
app.post('/api/readings', async (req, res) => {
  let { ph, do: dissolvedOxygen, temp, turbidity, ammonia, salinity, pondId } = req.body;

  // 1. Salinity Unit Fix (PPM -> PPT)
  let salValue = parseFloat(salinity) || 0;
  if (salValue > 50) {
      salValue = salValue / 1000;
  }

  // 2. Calculate Dissolved Oxygen (DO)
  if (!dissolvedOxygen || parseFloat(dissolvedOxygen) === 0) {
      const t = parseFloat(temp) || 25;
      let calcDO = 14.6 - (0.37 * t) - (0.06 * salValue);
      calcDO = Math.max(0, calcDO);
      if (calcDO > 14) calcDO = 14; 
      dissolvedOxygen = calcDO.toFixed(2);
  }

  // 3. Calculate Ammonia
  if (!ammonia || parseFloat(ammonia) === 0) {
      const turb = parseFloat(turbidity) || 0;
      let calcAmmonia = turb * 0.002;
      ammonia = Math.max(0, calcAmmonia).toFixed(3);
  }

  try {
    const reading = await prisma.sensorReading.create({
      data: {
        ph: parseFloat(ph),
        dissolvedOxygen: parseFloat(dissolvedOxygen), 
        temperature: parseFloat(temp),
        turbidity: parseFloat(turbidity),
        ammonia: parseFloat(ammonia),                 
        salinity: parseFloat(salValue),               
        pond: { connect: { id: parseInt(pondId) } }
      }
    });
    
    console.log(`📡 Logged: Temp=${temp} | Sal=${salValue.toFixed(1)}ppt | DO=${dissolvedOxygen} | NH3=${ammonia}`);
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

// ✅ UPDATED SEED
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
      bmp[pos++] = val; 
      bmp[pos++] = val; 
      bmp[pos++] = val; 
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
      const byte2 = buffer[i+1];
      const val = (byte1 << 8) | byte2; 

      const r = ((val >> 11) & 0x1F) << 3;
      const g = ((val >> 5) & 0x3F) << 2;
      const b = (val & 0x1F) << 3;

      bmp[pos++] = b;
      bmp[pos++] = g;
      bmp[pos++] = r;
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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AquaSmart Backend running on http://localhost:${PORT}`);
  console.log(`🔐 Auth Secret Configured (Len: ${SECRET_KEY.length})`);
});