-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingredientId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "system" TEXT NOT NULL DEFAULT 'restaurante',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockBalance_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockBalance_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "StockSector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StockBalance" ("id", "ingredientId", "quantity", "sectorId", "updatedAt") SELECT "id", "ingredientId", "quantity", "sectorId", "updatedAt" FROM "StockBalance";
DROP TABLE "StockBalance";
ALTER TABLE "new_StockBalance" RENAME TO "StockBalance";
CREATE UNIQUE INDEX "StockBalance_ingredientId_sectorId_key" ON "StockBalance"("ingredientId", "sectorId");
CREATE TABLE "new_StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingredientId" TEXT NOT NULL,
    "fromSectorId" TEXT,
    "toSectorId" TEXT,
    "quantity" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "system" TEXT NOT NULL DEFAULT 'restaurante',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_fromSectorId_fkey" FOREIGN KEY ("fromSectorId") REFERENCES "StockSector" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_toSectorId_fkey" FOREIGN KEY ("toSectorId") REFERENCES "StockSector" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" ("createdAt", "fromSectorId", "id", "ingredientId", "quantity", "reason", "toSectorId", "type") SELECT "createdAt", "fromSectorId", "id", "ingredientId", "quantity", "reason", "toSectorId", "type" FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
