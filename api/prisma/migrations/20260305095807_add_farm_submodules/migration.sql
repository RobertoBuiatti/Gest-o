-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "ownerId" TEXT,
    "system" TEXT NOT NULL DEFAULT 'fazenda',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Farm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FarmProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "salePrice" REAL NOT NULL,
    "quantityInStock" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "farmId" TEXT NOT NULL,
    "system" TEXT NOT NULL DEFAULT 'fazenda',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FarmProduct_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variety" TEXT,
    "area" REAL,
    "submodule" TEXT NOT NULL DEFAULT 'AGRICULTURA',
    "status" TEXT NOT NULL DEFAULT 'PLANTED',
    "plantedAt" DATETIME,
    "harvestedAt" DATETIME,
    "expectedYield" REAL,
    "notes" TEXT,
    "system" TEXT NOT NULL DEFAULT 'fazenda',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Crop_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "name" TEXT,
    "tag" TEXT,
    "type" TEXT NOT NULL,
    "submodule" TEXT NOT NULL DEFAULT 'PECUARIA',
    "gender" TEXT,
    "weight" REAL,
    "birthDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "system" TEXT NOT NULL DEFAULT 'fazenda',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Animal_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FishTank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" REAL NOT NULL,
    "ph" REAL,
    "temperature" REAL,
    "species" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "system" TEXT NOT NULL DEFAULT 'fazenda',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FishTank_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "animalType" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "system" TEXT NOT NULL DEFAULT 'fazenda',
    CONSTRAINT "FeedRequirement_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FarmActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "submodule" TEXT,
    "referenceId" TEXT,
    "description" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "system" TEXT NOT NULL DEFAULT 'fazenda',
    CONSTRAINT "FarmActivity_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Animal_tag_key" ON "Animal"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "FeedRequirement_animalType_ingredientId_key" ON "FeedRequirement"("animalType", "ingredientId");
