USE BecraBV;

-- ============================================================
-- Idempotent migration for WarehousePlace changes.
-- Safe to run multiple times on both old and fresh databases.
-- Each ALTER is guarded by an information_schema check so it
-- only executes when the change has not been applied yet.
-- ============================================================

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


DROP PROCEDURE IF EXISTS _migration_rename_volume;
DELIMITER $$
CREATE PROCEDURE _migration_rename_volume()
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'BecraBV'
          AND TABLE_NAME   = 'PurchaseDetail'
          AND COLUMN_NAME  = 'volume'
    ) THEN
        ALTER TABLE PurchaseDetail
            CHANGE COLUMN `volume` `quantityInStock` INT NOT NULL;
    END IF;
END$$
DELIMITER ;
CALL _migration_rename_volume();
DROP PROCEDURE IF EXISTS _migration_rename_volume;

-- ------------------------------------------------------------
-- 6. Change column type: MaterialPrice.unitPrice INT -> DECIMAL(10,2)
--    Guard: only run when the column is still INT.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS _migration_unitprice_decimal_MaterialPrice;
DELIMITER $$
CREATE PROCEDURE _migration_unitprice_decimal_MaterialPrice()
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'BecraBV'
          AND TABLE_NAME   = 'MaterialPrice'
          AND COLUMN_NAME  = 'unitPrice'
          AND DATA_TYPE    = 'int'
    ) THEN
        ALTER TABLE MaterialPrice
            MODIFY COLUMN `unitPrice` DECIMAL(10, 2);
    END IF;
END$$
DELIMITER ;
CALL _migration_unitprice_decimal_MaterialPrice();
DROP PROCEDURE IF EXISTS _migration_unitprice_decimal_MaterialPrice;

-- ------------------------------------------------------------
-- 7. Change column type: PurchaseDetail.unitPrice INT -> DECIMAL(10,2)
--    Guard: only run when the column is still INT.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS _migration_unitprice_decimal_PurchaseDetail;
DELIMITER $$
CREATE PROCEDURE _migration_unitprice_decimal_PurchaseDetail()
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'BecraBV'
          AND TABLE_NAME   = 'PurchaseDetail'
          AND COLUMN_NAME  = 'unitPrice'
          AND DATA_TYPE    = 'int'
    ) THEN
        ALTER TABLE PurchaseDetail
            MODIFY COLUMN `unitPrice` DECIMAL(10, 2);
    END IF;
END$$
DELIMITER ;
CALL _migration_unitprice_decimal_PurchaseDetail();
DROP PROCEDURE IF EXISTS _migration_unitprice_decimal_PurchaseDetail;

-- ------------------------------------------------------------
-- 8. Change column type: PurchaseDetail.totalCost INT -> DECIMAL(10,2)
--    Guard: only run when the column is still INT.
--    Note: if your live column is named totalPrice, change COLUMN_NAME
--    and MODIFY COLUMN name below to match.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS _migration_totalcost_decimal_PurchaseDetail;
DELIMITER $$
CREATE PROCEDURE _migration_totalcost_decimal_PurchaseDetail()
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'BecraBV'
          AND TABLE_NAME   = 'PurchaseDetail'
          AND COLUMN_NAME  = 'totalCost'
          AND DATA_TYPE    = 'int'
    ) THEN
        ALTER TABLE PurchaseDetail
            MODIFY COLUMN `totalCost` DECIMAL(10, 2);
    END IF;
END$$
DELIMITER ;
CALL _migration_totalcost_decimal_PurchaseDetail();
DROP PROCEDURE IF EXISTS _migration_totalcost_decimal_PurchaseDetail;