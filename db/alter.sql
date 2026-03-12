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
-- ------------------------------------------------------------
-- 1. Rename column: volume -> quantityInStock fu
--    Guard: only run when 'volume' still exists on the table.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS _migration_rename_volume;
DELIMITER $$
CREATE PROCEDURE _migration_rename_volume()
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'BecraBV'
          AND TABLE_NAME   = 'WarehousePlace'
          AND COLUMN_NAME  = 'volume'
    ) THEN
        ALTER TABLE WarehousePlace
            CHANGE COLUMN `volume` `quantityInStock` INT NOT NULL;
    END IF;
END$$
DELIMITER ;
CALL _migration_rename_volume();
DROP PROCEDURE IF EXISTS _migration_rename_volume;

-- ------------------------------------------------------------
-- 2. Add column: abbreviation VARCHAR(255) NOT NULL
--    Guard: only run when 'abbreviation' does not yet exist.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS _migration_add_abbreviation;
DELIMITER $$
CREATE PROCEDURE _migration_add_abbreviation()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'BecraBV'
          AND TABLE_NAME   = 'WarehousePlace'
          AND COLUMN_NAME  = 'abbreviation'
    ) THEN
        ALTER TABLE WarehousePlace
            ADD COLUMN `abbreviation` VARCHAR(255) NOT NULL AFTER `id`;
    END IF;
END$$
DELIMITER ;
CALL _migration_add_abbreviation();
DROP PROCEDURE IF EXISTS _migration_add_abbreviation;

-- ------------------------------------------------------------
-- 3. Add column: beNumber VARCHAR(255) (nullable)
--    Guard: only run when 'beNumber' does not yet exist.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS _migration_add_beNumber;
DELIMITER $$
CREATE PROCEDURE _migration_add_beNumber()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'BecraBV'
          AND TABLE_NAME   = 'WarehousePlace'
          AND COLUMN_NAME  = 'beNumber'
    ) THEN
        ALTER TABLE WarehousePlace
            ADD COLUMN `beNumber` VARCHAR(255) AFTER `abbreviation`;
    END IF;
END$$
DELIMITER ;
CALL _migration_add_beNumber();
DROP PROCEDURE IF EXISTS _migration_add_beNumber;

-- ------------------------------------------------------------
-- 4a. Add column: serialTrackedId CHAR(36) (nullable)
--     Guard: only run when 'serialTrackedId' does not yet exist.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS _migration_add_serialTrackedId;
DELIMITER $$
CREATE PROCEDURE _migration_add_serialTrackedId()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'BecraBV'
          AND TABLE_NAME   = 'WarehousePlace'
          AND COLUMN_NAME  = 'serialTrackedId'
    ) THEN
        ALTER TABLE WarehousePlace
            ADD COLUMN `serialTrackedId` CHAR(36) AFTER `beNumber`;
    END IF;
END$$
DELIMITER ;
CALL _migration_add_serialTrackedId();
DROP PROCEDURE IF EXISTS _migration_add_serialTrackedId;

-- ------------------------------------------------------------
-- 4b. Add FK: fk_warehouseplace_serialtrack
--     Guard: only run when the constraint does not yet exist.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS _migration_add_serialtrack_fk;
DELIMITER $$
CREATE PROCEDURE _migration_add_serialtrack_fk()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA      = 'BecraBV'
          AND TABLE_NAME        = 'WarehousePlace'
          AND CONSTRAINT_NAME   = 'fk_warehouseplace_serialtrack'
          AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE WarehousePlace
            ADD CONSTRAINT fk_warehouseplace_serialtrack
                FOREIGN KEY (`serialTrackedId`) REFERENCES MaterialSerialTrack (`id`) ON DELETE SET NULL;
    END IF;
END$$
DELIMITER ;
CALL _migration_add_serialtrack_fk();
DROP PROCEDURE IF EXISTS _migration_add_serialtrack_fk;

-- ============================================================
-- Idempotent migration: make documentId nullable on FollowUp
-- and FollowUpStructure, and relax the FK to ON DELETE SET NULL.
-- Safe to run multiple times on both old and fresh databases.
-- FK constraint names are resolved dynamically from
-- information_schema to avoid hardcoding auto-generated names.
-- ============================================================

-- ------------------------------------------------------------
-- 1. FollowUp.documentId: NOT NULL -> nullable
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS _migration_followup_documentid_nullable;
DELIMITER $$
CREATE PROCEDURE _migration_followup_documentid_nullable()
BEGIN
    DECLARE v_fk_name VARCHAR(255) DEFAULT NULL;

    -- Only proceed if the column is still NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'BecraBV'
          AND TABLE_NAME   = 'FollowUp'
          AND COLUMN_NAME  = 'documentId'
          AND IS_NULLABLE  = 'NO'
    ) THEN
        -- Resolve the auto-generated FK name for documentId
        SELECT CONSTRAINT_NAME INTO v_fk_name
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA            = 'BecraBV'
          AND TABLE_NAME              = 'FollowUp'
          AND COLUMN_NAME             = 'documentId'
          AND REFERENCED_TABLE_NAME   = 'DocumentStructure'
        LIMIT 1;

        -- Drop the FK if found
        IF v_fk_name IS NOT NULL THEN
            SET @drop_fk = CONCAT('ALTER TABLE FollowUp DROP FOREIGN KEY `', v_fk_name, '`');
            PREPARE stmt FROM @drop_fk;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;

        -- Make the column nullable
        ALTER TABLE FollowUp
            MODIFY COLUMN `documentId` CHAR(36) NULL;

        -- Re-add FK with SET NULL
        ALTER TABLE FollowUp
            ADD CONSTRAINT FOREIGN KEY (`documentId`)
                REFERENCES DocumentStructure (`id`) ON DELETE SET NULL;
    END IF;
END$$
DELIMITER ;
CALL _migration_followup_documentid_nullable();
DROP PROCEDURE IF EXISTS _migration_followup_documentid_nullable;

-- ------------------------------------------------------------
-- 2. FollowUpStructure.documentId: NOT NULL -> nullable
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS _migration_followupstructure_documentid_nullable;
DELIMITER $$
CREATE PROCEDURE _migration_followupstructure_documentid_nullable()
BEGIN
    DECLARE v_fk_name VARCHAR(255) DEFAULT NULL;

    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'BecraBV'
          AND TABLE_NAME   = 'FollowUpStructure'
          AND COLUMN_NAME  = 'documentId'
          AND IS_NULLABLE  = 'NO'
    ) THEN
        SELECT CONSTRAINT_NAME INTO v_fk_name
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA            = 'BecraBV'
          AND TABLE_NAME              = 'FollowUpStructure'
          AND COLUMN_NAME             = 'documentId'
          AND REFERENCED_TABLE_NAME   = 'DocumentStructure'
        LIMIT 1;

        IF v_fk_name IS NOT NULL THEN
            SET @drop_fk = CONCAT('ALTER TABLE FollowUpStructure DROP FOREIGN KEY `', v_fk_name, '`');
            PREPARE stmt FROM @drop_fk;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;

        ALTER TABLE FollowUpStructure
            MODIFY COLUMN `documentId` CHAR(36) NULL;

        ALTER TABLE FollowUpStructure
            ADD CONSTRAINT FOREIGN KEY (`documentId`)
                REFERENCES DocumentStructure (`id`) ON DELETE SET NULL;
    END IF;
END$$
DELIMITER ;
CALL _migration_followupstructure_documentid_nullable();
DROP PROCEDURE IF EXISTS _migration_followupstructure_documentid_nullable;
