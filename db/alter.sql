USE BecraBV;

-- ============================================================
-- Idempotent migrations.
-- Safe to run multiple times on both old and fresh databases.
-- Uses MariaDB 11 native IF EXISTS / IF NOT EXISTS DDL --
-- no stored procedures or DELIMITER required.
-- ============================================================

-- 1. WarehousePlace: volume -> quantityInStock
ALTER TABLE WarehousePlace CHANGE COLUMN IF EXISTS `volume` `quantityInStock` INT NOT NULL;

-- 2. WarehousePlace: add abbreviation column
ALTER TABLE WarehousePlace ADD COLUMN IF NOT EXISTS `abbreviation` VARCHAR(255) NOT NULL AFTER `id`;

-- 3. WarehousePlace: add beNumber column
ALTER TABLE WarehousePlace ADD COLUMN IF NOT EXISTS `beNumber` VARCHAR(255) AFTER `abbreviation`;

-- 4a. WarehousePlace: add serialTrackedId column
ALTER TABLE WarehousePlace ADD COLUMN IF NOT EXISTS `serialTrackedId` CHAR(36) AFTER `beNumber`;

-- 4b. WarehousePlace: add FK fk_warehouseplace_serialtrack (skip if already exists)
ALTER TABLE WarehousePlace DROP FOREIGN KEY IF EXISTS fk_warehouseplace_serialtrack;
ALTER TABLE WarehousePlace ADD CONSTRAINT fk_warehouseplace_serialtrack
    FOREIGN KEY (`serialTrackedId`) REFERENCES MaterialSerialTrack (`id`) ON DELETE SET NULL;

-- 5. PurchaseDetail: volume -> quantityInStock
ALTER TABLE PurchaseDetail CHANGE COLUMN IF EXISTS `volume` `quantityInStock` INT NOT NULL;

-- 6. MaterialPrice: unitPrice INT -> DECIMAL(10,2)
ALTER TABLE MaterialPrice MODIFY COLUMN IF EXISTS `unitPrice` DECIMAL(10, 2);

-- 7. PurchaseDetail: unitPrice INT -> DECIMAL(10,2)
ALTER TABLE PurchaseDetail MODIFY COLUMN IF EXISTS `unitPrice` DECIMAL(10, 2);

-- 8. PurchaseDetail: totalCost INT -> DECIMAL(10,2)
ALTER TABLE PurchaseDetail MODIFY COLUMN IF EXISTS `totalCost` DECIMAL(10, 2);

-- 9. Inventory: serieNumber -> serialNumber
ALTER TABLE Inventory CHANGE COLUMN IF EXISTS `serieNumber` `serialNumber` VARCHAR(255) NOT NULL;

-- 10. Purchase: preferedSupplier -> preferredSupplier
ALTER TABLE Purchase CHANGE COLUMN IF EXISTS `preferedSupplier` `preferredSupplier` VARCHAR(255);

-- 11. Company: prefferedSupplier -> preferredSupplier
ALTER TABLE Company CHANGE COLUMN IF EXISTS `prefferedSupplier` `preferredSupplier` BOOLEAN NOT NULL DEFAULT 0;

-- 12. Contact: trough -> through
ALTER TABLE Contact CHANGE COLUMN IF EXISTS `trough` `through` VARCHAR(100);

-- 13. ProjectContact: moddifiedAt -> modifiedAt
ALTER TABLE ProjectContact CHANGE COLUMN IF EXISTS `moddifiedAt` `modifiedAt` DATETIME;

-- 14. ProjectContact: moddifiedBy -> modifiedBy (drop old FK, rename column, re-add FK)
ALTER TABLE ProjectContact DROP FOREIGN KEY IF EXISTS ProjectContact_ibfk_3;
ALTER TABLE ProjectContact CHANGE COLUMN IF EXISTS `moddifiedBy` `modifiedBy` CHAR(36) NOT NULL;
ALTER TABLE ProjectContact DROP FOREIGN KEY IF EXISTS fk_projectcontact_modifiedBy;
ALTER TABLE ProjectContact ADD CONSTRAINT fk_projectcontact_modifiedBy
    FOREIGN KEY (`modifiedBy`) REFERENCES Employee (`id`) ON DELETE RESTRICT;

-- 15. ProjectContact: idValid -> isValid
ALTER TABLE ProjectContact CHANGE COLUMN IF EXISTS `idValid` `isValid` BOOLEAN NOT NULL DEFAULT 1;

-- 16. InvoiceOut: invoiceInAttachement -> invoiceInAttachment
ALTER TABLE InvoiceOut CHANGE COLUMN IF EXISTS `invoiceInAttachement` `invoiceInAttachment` VARCHAR(100);

-- 17. InvoiceIn: invoiceOutAttachement -> invoiceOutAttachment
ALTER TABLE InvoiceIn CHANGE COLUMN IF EXISTS `invoiceOutAttachement` `invoiceOutAttachment` VARCHAR(100);

-- 18. QouteBecra -> QuoteBecra
RENAME TABLE IF EXISTS QouteBecra TO QuoteBecra;

-- 19. MaterialPrice: supllierOrderNr -> supplierOrderNr
ALTER TABLE MaterialPrice CHANGE COLUMN IF EXISTS `supllierOrderNr` `supplierOrderNr` VARCHAR(255);

-- 20. MaterialSerialTrack: preferedSupplier -> preferredSupplier
ALTER TABLE MaterialSerialTrack CHANGE COLUMN IF EXISTS `preferedSupplier` `preferredSupplier` VARCHAR(255);

-- 21. MaterialSerialTrackedStructure: preferedSupplier -> preferredSupplier
ALTER TABLE MaterialSerialTrackedStructure CHANGE COLUMN IF EXISTS `preferedSupplier` `preferredSupplier` VARCHAR(255);