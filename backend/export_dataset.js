const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function exportDataset() {
  console.log("🚀 Starting Complete Dataset Export...");

  // 1. Create Folders
  const rootDir = path.join(__dirname, 'dataset_export');
  const imagesDir = path.join(rootDir, 'images');

  if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir);
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

  console.log(`📂 Output Folder: ${rootDir}`);

  // ==================================================
  // 📸 PART 1: EXPORT IMAGES (Optimized One-by-One)
  // ==================================================
  console.log("\n📸 Fetching Image List...");
  
  // Fetch IDs first (Save RAM)
  const allLogs = await prisma.cameraLog.findMany({
    select: { id: true, timestamp: true, pondId: true }, 
    orderBy: { timestamp: 'desc' }
  });

  console.log(`✅ Found ${allLogs.length} images. Downloading...`);

  // Prepare CSV for Image Labels
  const labelsCsvPath = path.join(rootDir, 'image_labels.csv');
  fs.writeFileSync(labelsCsvPath, "image_id,timestamp,filename,pond_id\n");

  let successCount = 0;

  for (let i = 0; i < allLogs.length; i++) {
    const meta = allLogs[i];

    try {
      // Fetch full data for JUST this record
      const fullLog = await prisma.cameraLog.findUnique({ where: { id: meta.id } });

      if (!fullLog || !fullLog.url || !fullLog.url.startsWith('data:image')) {
        process.stdout.write("x"); // Skip invalid
        continue;
      }

      // Convert Base64 -> File
      const base64Data = fullLog.url.split(';base64,').pop();
      const fileName = `img_${meta.id}_pond${meta.pondId}.bmp`;
      const filePath = path.join(imagesDir, fileName);

      fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

      // Append to CSV
      const csvRow = `${meta.id},${meta.timestamp.toISOString()},${fileName},${meta.pondId}\n`;
      fs.appendFileSync(labelsCsvPath, csvRow);

      process.stdout.write("."); // Progress dot
      successCount++;

    } catch (err) {
      console.error(`❌ Err ID ${meta.id}`);
    }
  }
  console.log(`\n✅ Saved ${successCount} images to /images folder.`);

  // ==================================================
  // 📡 PART 2: EXPORT SENSOR READINGS
  // ==================================================
  console.log("\n📡 Fetching Sensor Readings...");
  
  const readings = await prisma.sensorReading.findMany({
    orderBy: { timestamp: 'asc' }
  });

  console.log(`✅ Found ${readings.length} sensor records. Writing CSV...`);

  const sensorCsvPath = path.join(rootDir, 'sensor_readings.csv');
  let csvContent = "id,timestamp,pond_id,temp,ph,do,ammonia,turbidity,salinity\n";

  readings.forEach(r => {
    csvContent += `${r.id},${r.timestamp.toISOString()},${r.pondId},${r.temperature},${r.ph},${r.dissolvedOxygen},${r.ammonia},${r.turbidity},${r.salinity}\n`;
  });

  fs.writeFileSync(sensorCsvPath, csvContent);
  console.log(`✅ Sensor data saved to: sensor_readings.csv`);

  console.log("\n🎉 EXPORT COMPLETE! You can now zip the 'dataset_export' folder.");
}

exportDataset()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });