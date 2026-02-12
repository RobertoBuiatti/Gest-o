-- CreateTable
CREATE TABLE "SalonServiceRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salonServiceId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    CONSTRAINT "SalonServiceRequirement_salonServiceId_fkey" FOREIGN KEY ("salonServiceId") REFERENCES "SalonService" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalonServiceRequirement_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "categoryId" TEXT,
    "system" TEXT NOT NULL DEFAULT 'salao',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("createdAt", "email", "id", "name", "notes", "phone", "system", "updatedAt") SELECT "createdAt", "email", "id", "name", "notes", "phone", "system", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");
CREATE TABLE "new_SalonService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,
    "system" TEXT NOT NULL DEFAULT 'salao',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalonService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SalonService" ("createdAt", "description", "duration", "id", "isActive", "name", "price", "system", "updatedAt") SELECT "createdAt", "description", "duration", "id", "isActive", "name", "price", "system", "updatedAt" FROM "SalonService";
DROP TABLE "SalonService";
ALTER TABLE "new_SalonService" RENAME TO "SalonService";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SalonServiceRequirement_salonServiceId_ingredientId_key" ON "SalonServiceRequirement"("salonServiceId", "ingredientId");
