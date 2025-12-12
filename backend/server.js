// server.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 3001; // Front-end will likely run on 3000 or 5173

// Middleware
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Parse JSON bodies

// --- ROUTES ---

// 1. GET ALL PONDS (To list them on Dashboard)
app.get('/api/ponds', async (req, res) => {
  const ponds = await prisma.pond.findMany({
    include: { actuators: true } // Include actuator status
  });
  res.json(ponds);
});

// 2. POST SENSOR DATA (This is what the Mini PC will call)
app.post('/api/readings', async (req, res) => {
  const { ph, do: dissolvedOxygen, temp, turbidity, ammonia, salinity, pondId } = req.body;
  
  try {
    const reading = await prisma.sensorReading.create({
      data: {
        ph: parseFloat(ph),
        dissolvedOxygen: parseFloat(dissolvedOxygen),
        temperature: parseFloat(temp),
        turbidity: parseFloat(turbidity),
        ammonia: parseFloat(ammonia),
        salinity: salinity ? parseFloat(salinity) : 0.0,
        pond: { connect: { id: parseInt(pondId) } }
      }
    });
    console.log(`📡 New Data Received for Pond ${pondId}: DO=${dissolvedOxygen}`);
    res.json(reading);
  } catch (error) {
    console.error("Error saving reading:", error);
    res.status(500).json({ error: "Failed to save reading" });
  }
});

// 3. GET HISTORY (For Dashboard Charts)
app.get('/api/readings/:pondId', async (req, res) => {
  const { pondId } = req.params;
  const readings = await prisma.sensorReading.findMany({
    where: { pondId: parseInt(pondId) },
    orderBy: { timestamp: 'desc' },
    take: 50 // Get last 50 readings
  });
  res.json(readings);
});

// 4. TOGGLE ACTUATOR (For Remote Control buttons)
app.post('/api/actuators/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { isOn } = req.body;
  
  try {
    const actuator = await prisma.actuator.update({
      where: { id: parseInt(id) },
      data: { isOn }
    });
    res.json(actuator);
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle actuator" });
  }
});

// 5. SEED ROUTE (Run once to create a default pond)
app.post('/api/seed', async (req, res) => {
  const pond = await prisma.pond.create({
    data: {
      name: "Research Pond 01",
      location: "Faculty Premises",
      actuators: {
        create: [
          { name: "Main Aerator", isOn: false },
          { name: "Water Pump", isOn: false }
        ]
      }
    }
  });
  res.json(pond);
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});