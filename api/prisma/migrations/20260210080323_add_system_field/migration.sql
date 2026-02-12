-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "system" TEXT NOT NULL DEFAULT 'salao',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "SalonService" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("clientId", "createdAt", "date", "id", "notes", "serviceId", "status", "updatedAt", "userId") SELECT "clientId", "createdAt", "date", "id", "notes", "serviceId", "status", "updatedAt", "userId" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE TABLE "new_CashRegister" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openingAmount" REAL NOT NULL,
    "closingAmount" REAL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "openedBy" TEXT NOT NULL,
    "closedBy" TEXT,
    "system" TEXT NOT NULL DEFAULT 'restaurante',
    "notes" TEXT
);
INSERT INTO "new_CashRegister" ("closedAt", "closedBy", "closingAmount", "id", "notes", "openedAt", "openedBy", "openingAmount") SELECT "closedAt", "closedBy", "closingAmount", "id", "notes", "openedAt", "openedBy", "openingAmount" FROM "CashRegister";
DROP TABLE "CashRegister";
ALTER TABLE "new_CashRegister" RENAME TO "CashRegister";
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "system" TEXT NOT NULL DEFAULT 'restaurante',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Category" ("createdAt", "description", "id", "isActive", "name", "type") SELECT "createdAt", "description", "id", "isActive", "name", "type" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE TABLE "new_FixedCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "system" TEXT NOT NULL DEFAULT 'restaurante',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FixedCost" ("amount", "category", "createdAt", "dueDay", "id", "isActive", "name", "updatedAt") SELECT "amount", "category", "createdAt", "dueDay", "id", "isActive", "name", "updatedAt" FROM "FixedCost";
DROP TABLE "FixedCost";
ALTER TABLE "new_FixedCost" RENAME TO "FixedCost";
CREATE TABLE "new_Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "costPrice" REAL NOT NULL,
    "minStock" REAL NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "system" TEXT NOT NULL DEFAULT 'restaurante',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ingredient_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Ingredient" ("categoryId", "costPrice", "createdAt", "id", "isActive", "minStock", "name", "unit", "updatedAt") SELECT "categoryId", "costPrice", "createdAt", "id", "isActive", "minStock", "name", "unit", "updatedAt" FROM "Ingredient";
DROP TABLE "Ingredient";
ALTER TABLE "new_Ingredient" RENAME TO "Ingredient";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL,
    "tableNumber" INTEGER,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "subtotal" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "ifoodOrderId" TEXT,
    "system" TEXT NOT NULL DEFAULT 'restaurante',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerName", "customerPhone", "discount", "id", "ifoodOrderId", "notes", "orderNumber", "status", "subtotal", "tableNumber", "total", "type", "updatedAt", "userId") SELECT "createdAt", "customerName", "customerPhone", "discount", "id", "ifoodOrderId", "notes", "orderNumber", "status", "subtotal", "tableNumber", "total", "type", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_ifoodOrderId_key" ON "Order"("ifoodOrderId");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "salePrice" REAL NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "system" TEXT NOT NULL DEFAULT 'restaurante',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "StockSector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "createdAt", "description", "id", "imageUrl", "isActive", "name", "salePrice", "sectorId", "updatedAt") SELECT "categoryId", "createdAt", "description", "id", "imageUrl", "isActive", "name", "salePrice", "sectorId", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE TABLE "new_SalonService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "system" TEXT NOT NULL DEFAULT 'salao',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SalonService" ("createdAt", "description", "duration", "id", "isActive", "name", "price", "updatedAt") SELECT "createdAt", "description", "duration", "id", "isActive", "name", "price", "updatedAt" FROM "SalonService";
DROP TABLE "SalonService";
ALTER TABLE "new_SalonService" RENAME TO "SalonService";
CREATE TABLE "new_StockSector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "system" TEXT NOT NULL DEFAULT 'restaurante',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_StockSector" ("createdAt", "description", "id", "name") SELECT "createdAt", "description", "id", "name" FROM "StockSector";
DROP TABLE "StockSector";
ALTER TABLE "new_StockSector" RENAME TO "StockSector";
CREATE UNIQUE INDEX "StockSector_name_key" ON "StockSector"("name");
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "fee" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "category" TEXT,
    "system" TEXT NOT NULL DEFAULT 'restaurante',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "category", "createdAt", "description", "fee", "id", "netAmount", "orderId", "paymentId", "type") SELECT "amount", "category", "createdAt", "description", "fee", "id", "netAmount", "orderId", "paymentId", "type" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_paymentId_key" ON "Transaction"("paymentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
