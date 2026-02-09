// export_dataset.js (Optimized for Large Data)
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function exportImages() {
  console.log("🚀 Starting Safe Dataset Export...");

  // 1. Create Folder
  const datasetDir = path.join(__dirname, 'dataset_export');
  if (!fs.existsSync(datasetDir)) {
    fs.mkdirSync(datasetDir);
  }

  // 2. Get ONLY the IDs first (Super fast)
  console.log("📡 Fetching image list...");
  const allLogs = await prisma.cameraLog.findMany({
    select: { id: true, timestamp: true, pondId: true }, // Don't fetch the huge image URL yet
    orderBy: { timestamp: 'desc' },
    take: 1000
  });

  console.log(`✅ Found ${allLogs.length} images. Starting download...`);

  // 3. Download One by One
  let successCount = 0;
  
  for (let i = 0; i < allLogs.length; i++) {
    const logMeta = allLogs[i];
    
    try {
      // Fetch the full image data for JUST THIS ONE record
      const fullLog = await prisma.cameraLog.findUnique({
        where: { id: logMeta.id }
      });

      if (!fullLog || !fullLog.url || !fullLog.url.startsWith('data:image')) {
        process.stdout.write("x"); // Skip invalid
        continue;
      }

      // Convert and Save
      const base64Data = fullLog.url.split(';base64,').pop();
      const fileName = `pond${logMeta.pondId}_${new Date(logMeta.timestamp).getTime()}.bmp`;
      const filePath = path.join(datasetDir, fileName);

      fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

      // Progress Bar
      process.stdout.write("✅"); 
      successCount++;

    } catch (err) {
      console.error(`\n❌ Error on ID ${logMeta.id}`);
    }
  }

  console.log(`\n\n🎉 Export Complete!`);
  console.log(`📁 Saved ${successCount} images to: ${datasetDir}`);
}

exportImages()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());