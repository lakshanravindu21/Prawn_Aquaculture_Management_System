-- CreateTable
CREATE TABLE "Pond" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ph" REAL NOT NULL,
    "dissolvedOxygen" REAL NOT NULL,
    "temperature" REAL NOT NULL,
    "turbidity" REAL NOT NULL,
    "ammonia" REAL NOT NULL,
    "salinity" REAL,
    "pondId" INTEGER NOT NULL,
    CONSTRAINT "SensorReading_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "pondId" INTEGER NOT NULL,
    CONSTRAINT "Alert_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Actuator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isOn" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    "pondId" INTEGER NOT NULL,
    CONSTRAINT "Actuator_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
