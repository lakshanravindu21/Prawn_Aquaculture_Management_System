-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Researcher',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Actuator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isOn" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    "pondId" INTEGER NOT NULL,
    CONSTRAINT "Actuator_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Actuator" ("id", "isOn", "name", "pondId", "updatedAt") SELECT "id", "isOn", "name", "pondId", "updatedAt" FROM "Actuator";
DROP TABLE "Actuator";
ALTER TABLE "new_Actuator" RENAME TO "Actuator";
CREATE TABLE "new_Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "pondId" INTEGER NOT NULL,
    CONSTRAINT "Alert_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("id", "isResolved", "level", "message", "pondId", "timestamp") SELECT "id", "isResolved", "level", "message", "pondId", "timestamp" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE TABLE "new_SensorReading" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ph" REAL NOT NULL,
    "dissolvedOxygen" REAL NOT NULL,
    "temperature" REAL NOT NULL,
    "turbidity" REAL NOT NULL,
    "ammonia" REAL NOT NULL,
    "salinity" REAL,
    "pondId" INTEGER NOT NULL,
    CONSTRAINT "SensorReading_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SensorReading" ("ammonia", "dissolvedOxygen", "id", "ph", "pondId", "salinity", "temperature", "timestamp", "turbidity") SELECT "ammonia", "dissolvedOxygen", "id", "ph", "pondId", "salinity", "temperature", "timestamp", "turbidity" FROM "SensorReading";
DROP TABLE "SensorReading";
ALTER TABLE "new_SensorReading" RENAME TO "SensorReading";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
