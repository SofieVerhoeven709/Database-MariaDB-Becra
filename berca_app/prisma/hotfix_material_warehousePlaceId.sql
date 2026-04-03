-- Idempotent hotfix for environments where Material.warehousePlaceId is missing.
ALTER TABLE `Material`
  ADD COLUMN IF NOT EXISTS `warehousePlaceId` CHAR(36) NULL;

-- Keep lookup performance consistent with schema index.
CREATE INDEX IF NOT EXISTS `warehousePlaceId` ON `Material` (`warehousePlaceId`);

-- Note: no FK is added here to avoid duplicate-constraint-name failures on legacy databases.

