-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "spent" REAL,
    "remark" TEXT NOT NULL DEFAULT '',
    "relatedId" INTEGER,
    "redeemed" INTEGER,
    "promotionIds" JSONB NOT NULL DEFAULT [],
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "processedBy" TEXT
);
INSERT INTO "new_Transaction" ("amount", "createdBy", "id", "processedBy", "promotionIds", "redeemed", "relatedId", "remark", "spent", "suspicious", "type", "utorid") SELECT "amount", "createdBy", "id", "processedBy", "promotionIds", "redeemed", "relatedId", "remark", "spent", coalesce("suspicious", false) AS "suspicious", "type", "utorid" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
