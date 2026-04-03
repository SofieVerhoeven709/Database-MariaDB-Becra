-- Idempotent hotfix for environments where Material.warehousePlaceId is missing.
ALTER TABLE `Material`
  ADD COLUMN IF NOT EXISTS `warehousePlaceId` CHAR(36) NULL;

-- Keep lookup performance consistent with schema index.
CREATE INDEX IF NOT EXISTS `warehousePlaceId` ON `Material` (`warehousePlaceId`);

-- Add FK only when it is not already present.
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Material'
    AND COLUMN_NAME = 'warehousePlaceId'
    AND REFERENCED_TABLE_NAME = 'WarehousePlace'
);

SET @fk_sql := IF(
  @fk_exists = 0,
  'ALTER TABLE `Material` ADD CONSTRAINT `Material_ibfk_5` FOREIGN KEY (`warehousePlaceId`) REFERENCES `WarehousePlace`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT',
  'SELECT 1'
);

PREPARE fk_stmt FROM @fk_sql;
EXECUTE fk_stmt;
DEALLOCATE PREPARE fk_stmt;

