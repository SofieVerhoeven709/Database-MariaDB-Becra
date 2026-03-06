USE BecraBV;

-- Run this ONLY against an existing database that was created before the WarehousePlace changes.
-- Fresh installs from init.sql already have the correct schema and do NOT need this file.

-- WarehousePlace: rename volume -> quantityInStock
ALTER TABLE WarehousePlace
      CHANGE COLUMN `volume` `quantityInStock` INT NOT NULL;

-- WarehousePlace: add abbreviation (required)
ALTER TABLE WarehousePlace
      ADD COLUMN `abbreviation` VARCHAR(255) NOT NULL AFTER `id`;

-- WarehousePlace: add optional beNumber reference
ALTER TABLE WarehousePlace
      ADD COLUMN `beNumber` VARCHAR(255) AFTER `abbreviation`;

-- WarehousePlace: add optional serialTrackedId FK
ALTER TABLE WarehousePlace
      ADD COLUMN `serialTrackedId` CHAR(36) AFTER `beNumber`,
      ADD CONSTRAINT fk_warehouseplace_serialtrack
            FOREIGN KEY (`serialTrackedId`) REFERENCES MaterialSerialTrack (`id`) ON DELETE SET NULL;
