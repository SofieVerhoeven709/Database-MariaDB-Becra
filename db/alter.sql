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
 
-- 18. QouteBecra -> QuoteBecra
RENAME TABLE IF EXISTS QouteBecra TO QuoteBecra;
 
-- 19. MaterialPrice: supllierOrderNr -> supplierOrderNr
ALTER TABLE MaterialPrice CHANGE COLUMN IF EXISTS `supllierOrderNr` `supplierOrderNr` VARCHAR(255);
 
-- 20. MaterialSerialTrack: preferedSupplier -> preferredSupplier
ALTER TABLE MaterialSerialTrack CHANGE COLUMN IF EXISTS `preferedSupplier` `preferredSupplier` VARCHAR(255);
 
-- 21. MaterialSerialTrackedStructure: preferedSupplier -> preferredSupplier
ALTER TABLE MaterialSerialTrackedStructure CHANGE COLUMN IF EXISTS `preferedSupplier` `preferredSupplier` VARCHAR(255);
 
-- 22. FollowUp.documentId: NOT NULL -> nullable, FK RESTRICT -> SET NULL
ALTER TABLE FollowUp
    DROP FOREIGN KEY IF EXISTS FollowUp_ibfk_5,
    MODIFY COLUMN `documentId` CHAR(36) NULL,
    ADD CONSTRAINT FOREIGN KEY (`documentId`) REFERENCES DocumentStructure (`id`) ON DELETE SET NULL;
 
-- 23. FollowUpStructure.documentId: NOT NULL -> nullable, FK RESTRICT -> SET NULL
ALTER TABLE FollowUpStructure
    DROP FOREIGN KEY IF EXISTS FollowUpStructure_ibfk_6,
    MODIFY COLUMN `documentId` CHAR(36) NULL,
    ADD CONSTRAINT FOREIGN KEY (`documentId`) REFERENCES DocumentStructure (`id`) ON DELETE SET NULL;
 
-- 24. RoleLevel: extract roleLevelId from Employee into junction table
CREATE TABLE IF NOT EXISTS RoleLevelEmployee (
    id CHAR(36) NOT NULL PRIMARY KEY,
    employeeId CHAR(36) NOT NULL,
    roleLevelId CHAR(36) NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (roleLevelId) REFERENCES RoleLevel (id) ON DELETE RESTRICT
) ENGINE = InnoDB;
 
-- 25. Migrate existing roleLevelId data from Employee into RoleLevelEmployee (only if column still exists)
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Employee'
    AND COLUMN_NAME = 'roleLevelId'
);
 
SET @sql = IF(@col_exists > 0,
  'INSERT INTO RoleLevelEmployee (id, employeeId, roleLevelId)
   SELECT UUID(), e.id, e.roleLevelId
   FROM Employee e
   WHERE e.roleLevelId IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM RoleLevelEmployee rle
       WHERE rle.employeeId = e.id
         AND rle.roleLevelId = e.roleLevelId
     )',
  'SELECT ''Skipping step 25: roleLevelId already dropped'''
);
 
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
 
-- 26. Drop FK on Employee.roleLevelId (look up actual constraint name) then drop column
SET @fk_name = (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Employee'
    AND COLUMN_NAME = 'roleLevelId'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
 
SET @sql = IF(@fk_name IS NOT NULL,
  CONCAT('ALTER TABLE Employee DROP FOREIGN KEY `', @fk_name, '`'),
  'SELECT ''No FK to drop on Employee.roleLevelId'''
);
 
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
 
ALTER TABLE Employee DROP COLUMN IF EXISTS roleLevelId;
 
-- 27a. MaterialPrice: add companyId column
ALTER TABLE MaterialPrice
    ADD COLUMN IF NOT EXISTS `companyId` CHAR(36) NOT NULL AFTER `id`;
 
-- 27b. MaterialPrice: add FK fk_materialprice_company (skip if already exists)
SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'MaterialPrice'
    AND CONSTRAINT_NAME = 'fk_materialprice_company'
);
 
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE MaterialPrice ADD CONSTRAINT fk_materialprice_company FOREIGN KEY (`companyId`) REFERENCES Company (`id`) ON DELETE RESTRICT',
  'SELECT ''Skipping: fk_materialprice_company already exists'''
);
 
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
 
-- 28. TimeRegistry: add stayOver column
ALTER TABLE TimeRegistry ADD COLUMN IF NOT EXISTS stayOver BOOLEAN NOT NULL DEFAULT 0;
 
-- 29. TrainingContact: clientNumber -> attendeeNumber
ALTER TABLE TrainingContact CHANGE COLUMN IF EXISTS `clientNumber` `attendeeNumber` VARCHAR(100);
 
-- 30. Material.bePartDoc: ensure VARCHAR(255) NULL, without dropping data
ALTER TABLE Material
    MODIFY COLUMN IF EXISTS `bePartDoc` VARCHAR(255) NULL;
 
ALTER TABLE Material
    ADD COLUMN IF NOT EXISTS `bePartDoc` VARCHAR(255) NULL;
 
-- 31. Material: split old single materialGroupId into A/B/C/D
ALTER TABLE Material
    ADD COLUMN IF NOT EXISTS `materialGroupIdA` CHAR(36) NULL,
    ADD COLUMN IF NOT EXISTS `materialGroupIdB` CHAR(36) NULL,
    ADD COLUMN IF NOT EXISTS `materialGroupIdC` CHAR(36) NULL,
    ADD COLUMN IF NOT EXISTS `materialGroupIdD` CHAR(36) NULL;

-- 31a. Material: ensure longLeadTime exists for Prisma model compatibility
ALTER TABLE Material
  ADD COLUMN IF NOT EXISTS `longLeadTime` BOOLEAN NULL;
 
-- 31b. Copy existing single materialGroupId into materialGroupIdA (only if column still exists)
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Material'
    AND COLUMN_NAME = 'materialGroupId'
);
 
SET @sql = IF(@col_exists > 0,
  'UPDATE Material
   SET materialGroupIdA = materialGroupId
   WHERE materialGroupId IS NOT NULL
     AND materialGroupIdA IS NULL',
  'SELECT ''Skipping copy: old materialGroupId column not present'''
);
 
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
 
-- 31c. Recreate new foreign keys on materialGroupIdA/B/C/D safely
ALTER TABLE Material DROP FOREIGN KEY IF EXISTS fk_material_group_a;
ALTER TABLE Material DROP FOREIGN KEY IF EXISTS fk_material_group_b;
ALTER TABLE Material DROP FOREIGN KEY IF EXISTS fk_material_group_c;
ALTER TABLE Material DROP FOREIGN KEY IF EXISTS fk_material_group_d;
 
ALTER TABLE Material
    ADD CONSTRAINT fk_material_group_a
        FOREIGN KEY (`materialGroupIdA`) REFERENCES MaterialGroup (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT fk_material_group_b
        FOREIGN KEY (`materialGroupIdB`) REFERENCES MaterialGroup (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT fk_material_group_c
        FOREIGN KEY (`materialGroupIdC`) REFERENCES MaterialGroup (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT fk_material_group_d
        FOREIGN KEY (`materialGroupIdD`) REFERENCES MaterialGroup (`id`) ON DELETE SET NULL;
 
-- 31d. Drop old FK on Material.materialGroupId (look up actual constraint name)
SET @old_fk_name = (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Material'
    AND COLUMN_NAME = 'materialGroupId'
    AND REFERENCED_TABLE_NAME = 'MaterialGroup'
  LIMIT 1
);
 
SET @sql = IF(@old_fk_name IS NOT NULL,
  CONCAT('ALTER TABLE Material DROP FOREIGN KEY `', @old_fk_name, '`'),
  'SELECT ''No old FK to drop on Material.materialGroupId'''
);
 
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
 
-- 31e. Drop old single materialGroupId column
ALTER TABLE Material
    DROP COLUMN IF EXISTS `materialGroupId`;
 
-- 32. Material: add preferredSupplierCompanyId column
ALTER TABLE `Material` ADD COLUMN IF NOT EXISTS `preferredSupplierCompanyId` CHAR(36) NULL;
 
-- 32b. Material: add index on preferredSupplierCompanyId (skip if already exists)
SET @idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Material'
    AND INDEX_NAME = 'preferredSupplierCompanyId'
);
 
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX `preferredSupplierCompanyId` ON `Material`(`preferredSupplierCompanyId`)',
  'SELECT ''Index preferredSupplierCompanyId already exists'''
);
 
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
 
-- 32c. Material: add FK on preferredSupplierCompanyId (skip if already exists)
SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Material'
    AND CONSTRAINT_NAME IN ('fk_material_preferredSupplierCompanyId', 'Material_ibfk_5')
);
 
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `Material` ADD CONSTRAINT `fk_material_preferredSupplierCompanyId` FOREIGN KEY (`preferredSupplierCompanyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL',
  'SELECT ''FK for Material.preferredSupplierCompanyId already exists'''
);
 
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 32d. MaterialLeadTime: add per-material lead time value and unit
CREATE TABLE IF NOT EXISTS MaterialLeadTime (
  id CHAR(36) NOT NULL PRIMARY KEY,
  materialId CHAR(36) NOT NULL,
  leadTimeValue INT NOT NULL,
  leadTimeUnit VARCHAR(10) NOT NULL,
  UNIQUE (materialId),
  FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- 33. Material: add document type boolean columns for tracking linked documents
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `hasAtex` BOOLEAN NOT NULL DEFAULT 0 AFTER `longLeadTime`;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `hasCE` BOOLEAN NOT NULL DEFAULT 0 AFTER `hasAtex`;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `hasROHS` BOOLEAN NOT NULL DEFAULT 0 AFTER `hasCE`;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `hasDS` BOOLEAN NOT NULL DEFAULT 0 AFTER `hasROHS`;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `hasDoc` BOOLEAN NOT NULL DEFAULT 0 AFTER `hasDS`;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `has3DCAD` BOOLEAN NOT NULL DEFAULT 0 AFTER `hasDoc`;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `has2DCAD` BOOLEAN NOT NULL DEFAULT 0 AFTER `has3DCAD`;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `hasBDOC` BOOLEAN NOT NULL DEFAULT 0 AFTER `has2DCAD`;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `hasINSP` BOOLEAN NOT NULL DEFAULT 0 AFTER `hasBDOC`;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `partApproved` BOOLEAN NOT NULL DEFAULT 0 AFTER `hasINSP`;
 
-- 33. Add MaterialSupplier junction table (material <-> company many-to-many)
CREATE TABLE
      IF NOT EXISTS MaterialSupplier (
            id CHAR(36) NOT NULL PRIMARY KEY,
            materialId CHAR(36) NOT NULL,
            companyId CHAR(36) NOT NULL,
            CONSTRAINT uq_materialSupplier_material_company UNIQUE (materialId, companyId),
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE CASCADE,
            FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;
 
-- 34. Material: brandOrderNr INT -> VARCHAR(255)
ALTER TABLE Material MODIFY COLUMN IF EXISTS `brandOrderNr` VARCHAR(255);
 
-- 35. Add Country table
CREATE TABLE
      IF NOT EXISTS Country (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            createdBy CHAR(36) NOT NULL,
            deletedBy CHAR(36) NULL,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;
 
-- 36a. CompanyAdress: add countryId column
ALTER TABLE CompanyAddress ADD COLUMN IF NOT EXISTS `countryId` CHAR(36) NULL;
 
-- 36b. CompanyAdress: add FK fk_companyadress_country (skip if already exists)
ALTER TABLE CompanyAddress DROP FOREIGN KEY IF EXISTS fk_companyaddress_country;
ALTER TABLE CompanyAddress ADD CONSTRAINT fk_companyaddress_country
    FOREIGN KEY (`countryId`) REFERENCES Country (`id`) ON DELETE SET NULL;

-- 37a. MaterialSupplier: add supplierOrderNr column
ALTER TABLE MaterialSupplier ADD COLUMN IF NOT EXISTS `supplierOrderNr` VARCHAR(255) NULL;

-- 37b. MaterialSupplier: add shortDescription column
ALTER TABLE MaterialSupplier ADD COLUMN IF NOT EXISTS `shortDescription` VARCHAR(255) NULL;

-- 37c. MaterialSupplier: add isPreferred column
ALTER TABLE MaterialSupplier ADD COLUMN IF NOT EXISTS `isPreferred` BOOLEAN NOT NULL DEFAULT 0;

-- 37d. Migrate existing preferredSupplierOrderId and preferredSupplierShortDescription from Material to MaterialSupplier (for preferred suppliers only)
SET @col_order_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Material'
    AND COLUMN_NAME = 'preferredSupplierOrderId'
);

SET @col_desc_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Material'
    AND COLUMN_NAME = 'preferredSupplierShortDescription'
);

SET @sql = IF(@col_order_exists > 0 OR @col_desc_exists > 0,
  'UPDATE MaterialSupplier ms
   INNER JOIN Material m ON ms.materialId = m.id AND ms.companyId = m.preferredSupplierCompanyId
   SET ms.supplierOrderNr = IF(@col_order_exists > 0, m.preferredSupplierOrderId, null),
       ms.shortDescription = IF(@col_desc_exists > 0, m.preferredSupplierShortDescription, null),
       ms.isPreferred = 1
   WHERE m.preferredSupplierCompanyId IS NOT NULL',
  'SELECT ''Skipping step 37d: old columns already dropped'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 37e. Drop old preferredSupplierOrderId column from Material
ALTER TABLE Material DROP COLUMN IF EXISTS `preferredSupplierOrderId`;

-- 37f. Drop old preferredSupplierShortDescription column from Material
ALTER TABLE Material DROP COLUMN IF EXISTS `preferredSupplierShortDescription`;

-- 38. Company: add idOld column
ALTER TABLE Company ADD COLUMN IF NOT EXISTS `idOld` VARCHAR(255) NULL;

-- 39a. Drop old tables (disable FK checks to avoid constraint errors)
-- SET FOREIGN_KEY_CHECKS = 0;

-- DROP TABLE IF EXISTS InvoiceOutContact;
-- DROP TABLE IF EXISTS InvoiceOut;

-- SET FOREIGN_KEY_CHECKS = 1;
-- 39b. Create new supporting tables (required before InvoiceOut/InvoiceIn reference them)
CREATE TABLE IF NOT EXISTS VatMargin (
      id CHAR(36) NOT NULL PRIMARY KEY,
      vat FLOAT NOT NULL,
      createdAt DATETIME NOT NULL,
      createdBy CHAR(36) NOT NULL,
      FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
      deleted BOOLEAN NOT NULL DEFAULT 0,
      deletedAt DATETIME,
      deletedBy CHAR(36),
      FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS InvoiceStatus (
      id CHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      createdAt DATETIME NOT NULL,
      createdBy CHAR(36) NOT NULL,
      FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
      deleted BOOLEAN NOT NULL DEFAULT 0,
      deletedAt DATETIME,
      deletedBy CHAR(36),
      FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS InvoiceSentType (
      id CHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      createdAt DATETIME NOT NULL,
      createdBy CHAR(36) NOT NULL,
      FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
      deleted BOOLEAN NOT NULL DEFAULT 0,
      deletedAt DATETIME,
      deletedBy CHAR(36),
      FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS PaymentMethod (
      id CHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      createdAt DATETIME NOT NULL,
      createdBy CHAR(36) NOT NULL,
      FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
      deleted BOOLEAN NOT NULL DEFAULT 0,
      deletedAt DATETIME,
      deletedBy CHAR(36),
      FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- 41. Create PriceList table
CREATE TABLE
      IF NOT EXISTS PriceList (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            repeatUse BOOLEAN NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            targetId CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

-- 42. Create PriceListItem table
CREATE TABLE 
      IF NOT EXISTS PriceListItem (
            id CHAR(36) NOT NULL PRIMARY KEY,
            priceListId CHAR(36) NOT NULL,
            description VARCHAR(255) NOT NULL,
            unit VARCHAR(100) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            isCostMargin BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (priceListId) REFERENCES PriceList (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

-- 39c. Create new InvoiceOut
CREATE TABLE
      IF NOT EXISTS InvoiceOut (
            id CHAR(36) NOT NULL PRIMARY KEY,
            invoiceNumber VARCHAR(255) NOT NULL,
            poNumber VARCHAR(255),
            clientReference VARCHAR(255),
            invoiceDate DATETIME NOT NULL,
            createdAt DATETIME NOT NULL,
            dueDate DATETIME NOT NULL,
            sentDate DATETIME,
            deletedAt DATETIME,
            modifiedAt DATETIME,
            reminderSent BOOLEAN NOT NULL DEFAULT 0,
            outstanding BOOLEAN NOT NULL DEFAULT 1,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedBy CHAR(36),
            createdBy CHAR(36) NOT NULL,
            modifiedBy CHAR(36),
            invoiceTypeId CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            paymentMethodId CHAR(36) NOT NULL,
            invoiceSentTypeId CHAR(36) NOT NULL,
            invoiceStatusId CHAR(36) NOT NULL,
            vatMarginId CHAR(36) NOT NULL,
            priceListId CHAR(36),
            FOREIGN KEY (invoiceTypeId) REFERENCES InvoiceType (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (modifiedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (paymentMethodId) REFERENCES PaymentMethod (id) ON DELETE RESTRICT,
            FOREIGN KEY (invoiceSentTypeId) REFERENCES InvoiceSentType (id) ON DELETE RESTRICT,
            FOREIGN KEY (invoiceStatusId) REFERENCES InvoiceStatus (id) ON DELETE RESTRICT,
            FOREIGN KEY (vatMarginId) REFERENCES VatMargin (id) ON DELETE RESTRICT,
            FOREIGN KEY (priceListId) REFERENCES PriceList (id) ON DELETE RESTRICT,
            UNIQUE (invoiceNumber)
      ) ENGINE = InnoDB;

-- 39d. Create new InvoiceIn
CREATE TABLE IF NOT EXISTS InvoiceIn (
      id CHAR(36) NOT NULL PRIMARY KEY,
      invoiceNumber VARCHAR(255) NOT NULL,
      poNumber VARCHAR(255),
      clientInvoiceNumber VARCHAR(255),
      invoiceDate DATETIME NOT NULL,
      createdAt DATETIME NOT NULL,
      dueDate DATETIME NOT NULL,
      deletedAt DATETIME,
      modifiedAt DATETIME,
      reminderSent BOOLEAN NOT NULL DEFAULT 0,
      outstanding BOOLEAN NOT NULL DEFAULT 0,
      deleted BOOLEAN NOT NULL DEFAULT 0,
      deletedBy CHAR(36),
      createdBy CHAR(36) NOT NULL,
      modifiedBy CHAR(36),
      invoiceTypeId CHAR(36) NOT NULL,
      targetId CHAR(36) NOT NULL,
      paymentMethodId CHAR(36) NOT NULL,
      invoiceSentTypeId CHAR(36) NOT NULL,
      invoiceStatusId CHAR(36) NOT NULL,
      vatMarginId CHAR(36) NOT NULL,
      companyId CHAR(36) NOT NULL,
      FOREIGN KEY (invoiceTypeId) REFERENCES InvoiceType (id) ON DELETE RESTRICT,
      FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
      FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
      FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
      FOREIGN KEY (modifiedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
      FOREIGN KEY (paymentMethodId) REFERENCES PaymentMethod (id) ON DELETE RESTRICT,
      FOREIGN KEY (invoiceSentTypeId) REFERENCES InvoiceSentType (id) ON DELETE RESTRICT,
      FOREIGN KEY (invoiceStatusId) REFERENCES InvoiceStatus (id) ON DELETE RESTRICT,
      FOREIGN KEY (vatMarginId) REFERENCES VatMargin (id) ON DELETE RESTRICT,
      FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT,
      UNIQUE (invoiceNumber)
) ENGINE = InnoDB;

-- 39e. Recreate InvoiceOutContact
CREATE TABLE IF NOT EXISTS InvoiceOutContact (
      id CHAR(36) NOT NULL PRIMARY KEY,
      contactId CHAR(36) NOT NULL,
      invoiceOutId CHAR(36) NOT NULL,
      FOREIGN KEY (contactId) REFERENCES Contact (id) ON DELETE RESTRICT,
      FOREIGN KEY (invoiceOutId) REFERENCES InvoiceOut (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS PriceListCompany (
      id CHAR(36) NOT NULL PRIMARY KEY,
      priceListId CHAR(36) NOT NULL,
      companyId CHAR(36) NOT NULL,
      FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE CASCADE,
      FOREIGN KEY (priceListId) REFERENCES PriceList (id) ON DELETE RESTRICT
) ENGINE = InnoDB;

-- 40. Company: add officialName column
-- Step 1: Add column as nullable (won't break existing rows)
ALTER TABLE Company ADD COLUMN IF NOT EXISTS officialName VARCHAR(255) NULL;

-- Step 2: Fill in existing rows (copy from 'name' as a sensible default)
UPDATE Company SET officialName = name WHERE officialName IS NULL;

-- Step 3: Now enforce NOT NULL since all rows are filled
ALTER TABLE Company MODIFY COLUMN officialName VARCHAR(255) NOT NULL;


-- Keep beNumber for compatibility; skip destructive drop here.
-- ALTER TABLE MaterialSerialTrack DROP COLUMN IF EXISTS beNumber;

-- Add the materialId column (nullable)
ALTER TABLE MaterialSerialTrack
ADD COLUMN IF NOT EXISTS materialId CHAR(36) NULL;

-- FK is standardized later in one canonical block to avoid conflicting names/actions.

-- Add a serial tracked boolean to the materials
ALTER TABLE Material
ADD COLUMN IF NOT EXISTS isSerialTracked BOOLEAN NOT NULL DEFAULT 0;

-- Keep materialGroupId on MaterialSerialTrack; do not drop it in this earlier block.
-- Remove materialGroupId from MaterialSerialTrackedStructure safely
SET @fk_name2 = (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'MaterialSerialTrackedStructure'
    AND COLUMN_NAME = 'materialGroupId'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @sql2 = IF(@fk_name2 IS NOT NULL,
  CONCAT('ALTER TABLE MaterialSerialTrackedStructure DROP FOREIGN KEY `', @fk_name2, '`'),
  'SELECT ''No FK to drop on MaterialSerialTrackedStructure.materialGroupId'''
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
ALTER TABLE MaterialSerialTrackedStructure DROP COLUMN IF EXISTS materialGroupId;

-- 43b. Project: add FK fk_project_pricelist (skip if already exists)
ALTER TABLE Project DROP FOREIGN KEY IF EXISTS fk_project_pricelist;
ALTER TABLE Project DROP COLUMN IF EXISTS `priceListId`;

-- 44. CompanyAddress: rename table from CompanyAdress (safe, only if old exists and new does not)
SET @old_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
      AND table_name = 'CompanyAdress'
);

SET @new_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
      AND table_name = 'CompanyAddress'
);

SET @sql = IF(@old_exists = 1 AND @new_exists = 0,
    'RENAME TABLE CompanyAdress TO CompanyAddress;',
    'SELECT "No rename needed";'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE CompanyAddress CHANGE COLUMN IF EXISTS `typeAdress` `typeAddress` VARCHAR(100);

-- 45a. CompanyContact: add companyAdressId column
ALTER TABLE CompanyContact ADD COLUMN IF NOT EXISTS `companyAddressId` CHAR(36) NULL;

-- 45b. CompanyContact: add FK fk_companyContact_companyAddress (skip if already exists)
ALTER TABLE CompanyContact DROP FOREIGN KEY IF EXISTS fk_companyContact_companyAddress;
ALTER TABLE CompanyContact ADD CONSTRAINT fk_companyContact_companyAddress
    FOREIGN KEY (`companyAddressId`) REFERENCES CompanyAddress (`id`) ON DELETE SET NULL;

-- 46a. hourtype & material: add targetId column
ALTER TABLE HourType ADD COLUMN IF NOT EXISTS `targetId` CHAR(36) NULL;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS `targetId` CHAR(36) NULL;

-- 46b. hourtype: add FK fk_hourType_target (skip if already exists)
ALTER TABLE HourType DROP FOREIGN KEY IF EXISTS fk_hourType_target;
ALTER TABLE HourType ADD CONSTRAINT fk_hourType_target
    FOREIGN KEY (`targetId`) REFERENCES Target (`id`) ON DELETE RESTRICT;

-- 46c. material: add FK fk_material_target (skip if already exists)
ALTER TABLE Material DROP FOREIGN KEY IF EXISTS fk_material_target;
ALTER TABLE Material ADD CONSTRAINT fk_material_target
    FOREIGN KEY (`targetId`) REFERENCES Target (`id`) ON DELETE RESTRICT;

CREATE TABLE
      IF NOT EXISTS PriceListItemTarget (
            id CHAR(36) NOT NULL PRIMARY KEY,
            priceListItemId CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            FOREIGN KEY (priceListItemId) REFERENCES PriceListItem (id) ON DELETE RESTRICT,
            FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
            UNIQUE (priceListItemId)
      ) ENGINE = InnoDB;

ALTER TABLE WorkOrder CHANGE COLUMN IF EXISTS `workOrderNumber` `workOrderNumber` VARCHAR(255) NOT NULL;

-- 46b. hourtype: add FK fk_hourType_target (skip if already exists)
ALTER TABLE HourType DROP FOREIGN KEY IF EXISTS fk_hourType_target;
ALTER TABLE HourType CHANGE COLUMN IF EXISTS `targetId` `targetId` CHAR(36) NOT NULL;
ALTER TABLE HourType ADD CONSTRAINT fk_hourType_target
    FOREIGN KEY (`targetId`) REFERENCES Target (`id`) ON DELETE RESTRICT;

-- 46c. material: add FK fk_material_target (skip if already exists)
ALTER TABLE Material DROP FOREIGN KEY IF EXISTS fk_material_target;
ALTER TABLE Material CHANGE COLUMN IF EXISTS `targetId` `targetId` CHAR(36) NOT NULL;
ALTER TABLE Material ADD CONSTRAINT fk_material_target
    FOREIGN KEY (`targetId`) REFERENCES Target (`id`) ON DELETE RESTRICT;

ALTER TABLE MaterialSerialTrack CHANGE COLUMN IF EXISTS `serialTrackedId` `serialTrackedId` CHAR(36) NULL;
SET @tbl_exists = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'MaterialSerialTrackStructure'
);
 
SET @sql = IF(@tbl_exists > 0,
      'ALTER TABLE MaterialSerialTrackStructure CHANGE COLUMN IF EXISTS `beNumber` `beNumber`  VARCHAR(255) NULL;',
      'SELECT ''Skipping: MaterialSerialTrackStructure does not exist'''
);
 
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- SET FOREIGN_KEY_CHECKS = 0;

-- DROP TABLE IF EXISTS DocumentPlace;
-- DROP TABLE IF EXISTS DocumentGroupA;
-- DROP TABLE IF EXISTS DocumentGroupB;
-- DROP TABLE IF EXISTS DocumentGroupC;
-- DROP TABLE IF EXISTS DocumentGroupD;
-- DROP TABLE IF EXISTS DocumentGroup;
-- DROP TABLE IF EXISTS DocumentStructure;

-- SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE
      IF NOT EXISTS DocumentPlace (
            id CHAR(36) NOT NULL PRIMARY KEY,
            headFolder VARCHAR(255) NOT NULL,
            subFolder VARCHAR(255),
            createdBy CHAR(36) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DocumentGroupA (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            createdBy CHAR(36) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DocumentGroupB (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            createdBy CHAR(36) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;
      
CREATE TABLE
      IF NOT EXISTS DocumentGroupC (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            createdBy CHAR(36) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DocumentGroupD (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            createdBy CHAR(36) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DocumentStructure (
            id CHAR(36) NOT NULL PRIMARY KEY,
            documentNumber VARCHAR(100) NOT NULL,
            description TEXT,
            descriptionShort VARCHAR(100) NOT NULL,
            createdAt DATETIME NOT NULL,
            expiryDate DATETIME,
            revisionNumber INT,
            revisionDetail TEXT,
            valid BOOLEAN NOT NULL DEFAULT 1,
            process BOOLEAN NOT NULL DEFAULT 0,
            canCopy BOOLEAN NOT NULL DEFAULT 0,
            additionalInfo TEXT,
            referenceDocId CHAR(36),
            FOREIGN KEY (referenceDocId) REFERENCES DocumentStructure (id) ON DELETE SET NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            UNIQUE (documentNumber)
      ) ENGINE = InnoDB;


-- DocumentStructure.createdBy
ALTER TABLE DocumentStructure 
    ADD COLUMN IF NOT EXISTS createdBy CHAR(36) NOT NULL;

ALTER TABLE DocumentStructure 
    DROP FOREIGN KEY IF EXISTS fk_documentStructure_createdBy;

ALTER TABLE DocumentStructure 
    ADD CONSTRAINT fk_documentStructure_createdBy
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;


-- DocumentStructure.revisedById
ALTER TABLE DocumentStructure 
    ADD COLUMN IF NOT EXISTS revisedById CHAR(36) NULL;

ALTER TABLE DocumentStructure 
    DROP FOREIGN KEY IF EXISTS fk_documentStructure_revisedBy;

ALTER TABLE DocumentStructure 
    ADD CONSTRAINT fk_documentStructure_revisedBy
    FOREIGN KEY (revisedById) REFERENCES Employee (id) ON DELETE SET NULL;


-- DocumentStructure.managedById
ALTER TABLE DocumentStructure 
    ADD COLUMN IF NOT EXISTS managedById CHAR(36) NULL;

ALTER TABLE DocumentStructure 
    DROP FOREIGN KEY IF EXISTS fk_documentStructure_managedBy;

ALTER TABLE DocumentStructure 
    ADD CONSTRAINT fk_documentStructure_managedBy
    FOREIGN KEY (managedById) REFERENCES Employee (id) ON DELETE SET NULL;


-- DocumentStructure.targetId
ALTER TABLE DocumentStructure 
    ADD COLUMN IF NOT EXISTS targetId CHAR(36) NOT NULL;

ALTER TABLE DocumentStructure 
    DROP FOREIGN KEY IF EXISTS fk_documentStructure_target;

ALTER TABLE DocumentStructure 
    ADD CONSTRAINT fk_documentStructure_target
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT;


-- DocumentStructure.deletedBy
ALTER TABLE DocumentStructure 
    ADD COLUMN IF NOT EXISTS deletedBy CHAR(36) NULL;

ALTER TABLE DocumentStructure 
    DROP FOREIGN KEY IF EXISTS fk_documentStructure_deletedBy;

ALTER TABLE DocumentStructure 
    ADD CONSTRAINT fk_documentStructure_deletedBy
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL;

CREATE TABLE
      IF NOT EXISTS DocumentStructureTarget (
            id CHAR(36) NOT NULL PRIMARY KEY,
            documentStructureId CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            FOREIGN KEY (documentStructureId) REFERENCES DocumentStructure (id) ON DELETE CASCADE,
            FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DocumentGroup (
            id CHAR(36) NOT NULL PRIMARY KEY,
            groupAId VARCHAR(255),
            groupBId VARCHAR(255),
            groupCId VARCHAR(255),
            groupDId VARCHAR(255),
            FOREIGN KEY (groupAId) REFERENCES DocumentGroupA (id) ON DELETE RESTRICT,
            FOREIGN KEY (groupBId) REFERENCES DocumentGroupB (id) ON DELETE SET NULL,
            FOREIGN KEY (groupCId) REFERENCES DocumentGroupC (id) ON DELETE SET NULL,
            FOREIGN KEY (groupDId) REFERENCES DocumentGroupD (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DocumentStatus (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            createdBy CHAR(36) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DocumentRevision (
            id CHAR(36) NOT NULL PRIMARY KEY,
            documentId CHAR(36) NOT NULL,
            shortDescription VARCHAR(255),
            longDescription TEXT,
            createdBy CHAR(36) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;



-- 4. documentGroupDId
ALTER TABLE DocumentStructure 
    ADD COLUMN IF NOT EXISTS documentGroupId CHAR(36) NULL;

ALTER TABLE DocumentStructure 
    DROP FOREIGN KEY IF EXISTS fk_documentStructure_documentGroup;

ALTER TABLE DocumentStructure 
    ADD CONSTRAINT fk_documentStructure_documentGroup
    FOREIGN KEY (documentGroupId) REFERENCES DocumentGroup (id) ON DELETE SET NULL;

-- 5. documentPlaceId
ALTER TABLE DocumentStructure 
    ADD COLUMN IF NOT EXISTS documentPlaceId CHAR(36) NULL;

ALTER TABLE DocumentStructure 
    DROP FOREIGN KEY IF EXISTS fk_documentStructure_documentPlace;

ALTER TABLE DocumentStructure
    ADD CONSTRAINT fk_documentStructure_documentPlace
    FOREIGN KEY (documentPlaceId) REFERENCES DocumentPlace (id) ON DELETE SET NULL;

ALTER TABLE DocumentStructure 
    ADD COLUMN IF NOT EXISTS documentStatusId CHAR(36) NULL;
ALTER TABLE MaterialSerialTrack CHANGE COLUMN IF EXISTS `serialTrackedId` `serialTrackedId` CHAR(36) NULL;
SET @tbl_exists = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'MaterialSerialTrackStructure'
);

SET @sql = IF(@tbl_exists > 0,
      'ALTER TABLE MaterialSerialTrackStructure CHANGE COLUMN IF EXISTS `beNumber` `beNumber`  VARCHAR(255) NULL;',
      'SELECT ''Skipping: MaterialSerialTrackStructure does not exist'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE DocumentStructure 
    DROP FOREIGN KEY IF EXISTS fk_documentStructure_documentStatus;

ALTER TABLE DocumentStructure 
    ADD CONSTRAINT fk_documentStructure_documentStatus
    FOREIGN KEY (documentStatusId) REFERENCES DocumentStatus (id) ON DELETE SET NULL;
ALTER TABLE Material
ADD COLUMN IF NOT EXISTS `isSerialTracked` BOOLEAN NOT NULL DEFAULT 0;

ALTER TABLE MaterialSerialTrack
    ADD COLUMN IF NOT EXISTS `materialId` CHAR(36) NULL;

ALTER TABLE MaterialSerialTrack
    MODIFY COLUMN IF EXISTS `materialId` CHAR(36) NULL;

ALTER TABLE MaterialSerialTrack
    DROP FOREIGN KEY IF EXISTS fk_materialSerialTrack_materialId;

ALTER TABLE MaterialSerialTrack
    DROP FOREIGN KEY IF EXISTS fk_material_serialtrack_materialId;

ALTER TABLE MaterialSerialTrack
    ADD CONSTRAINT fk_materialSerialTrack_materialId
    FOREIGN KEY (`materialId`) REFERENCES Material (`id`) ON DELETE RESTRICT;

-- Add beNumber and materialGroupId to MaterialSerialTrack
ALTER TABLE MaterialSerialTrack
  ADD COLUMN IF NOT EXISTS `beNumber` VARCHAR(255) AFTER `materialId`,
  ADD COLUMN IF NOT EXISTS `materialGroupId` CHAR(36) NULL AFTER `beNumber`;

ALTER TABLE MaterialSerialTrack
  DROP FOREIGN KEY IF EXISTS fk_materialSerialTrack_materialGroupId;

ALTER TABLE MaterialSerialTrack
  ADD CONSTRAINT fk_materialSerialTrack_materialGroupId
  FOREIGN KEY (`materialGroupId`) REFERENCES MaterialGroup(`id`) ON DELETE SET NULL;
  
  
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
  'ALTER TABLE `Material` ADD CONSTRAINT `fk_material_warehousePlaceId` FOREIGN KEY (`warehousePlaceId`) REFERENCES `WarehousePlace`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT',
  'SELECT 1'
);

PREPARE fk_stmt FROM @fk_sql;
EXECUTE fk_stmt;
DEALLOCATE PREPARE fk_stmt;

-- Serial tracked inspection planning fields
ALTER TABLE MaterialSerialTrack
  ADD COLUMN IF NOT EXISTS `lastInspectionDate` DATE NULL,
  ADD COLUMN IF NOT EXISTS `inspectionIntervalValue` INT NULL,
  ADD COLUMN IF NOT EXISTS `inspectionIntervalUnit` ENUM('DAY','WEEK','MONTH','YEAR') NULL,
  ADD COLUMN IF NOT EXISTS `nextInspectionDate` DATE NULL;

-- Backfill from legacy days column if it still exists
SET @has_old_interval_days = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'MaterialSerialTrack'
    AND COLUMN_NAME = 'inspectionIntervalDays'
);

SET @backfill_sql = IF(
  @has_old_interval_days > 0,
  'UPDATE MaterialSerialTrack
   SET inspectionIntervalValue = COALESCE(inspectionIntervalValue, inspectionIntervalDays),
       inspectionIntervalUnit = COALESCE(inspectionIntervalUnit, ''DAY'')
   WHERE inspectionIntervalDays IS NOT NULL',
  'SELECT ''Skipping backfill: legacy inspectionIntervalDays not found'''
);

PREPARE backfill_stmt FROM @backfill_sql;
EXECUTE backfill_stmt;
DEALLOCATE PREPARE backfill_stmt;

ALTER TABLE MaterialSerialTrack
  DROP CONSTRAINT IF EXISTS chk_materialSerialTrack_inspection_interval_positive;

ALTER TABLE MaterialSerialTrack
  DROP CONSTRAINT IF EXISTS chk_materialSerialTrack_inspection_interval_valid;

ALTER TABLE MaterialSerialTrack
  ADD CONSTRAINT chk_materialSerialTrack_inspection_interval_valid
  CHECK (
    (`inspectionIntervalValue` IS NULL AND `inspectionIntervalUnit` IS NULL)
    OR
    (`inspectionIntervalValue` > 0 AND `inspectionIntervalUnit` IS NOT NULL)
  );

-- Recalculate next inspection date for rows that have a schedule but no computed next date yet.
UPDATE MaterialSerialTrack
SET nextInspectionDate = CASE
  WHEN inspectionIntervalUnit = 'DAY' THEN DATE_ADD(lastInspectionDate, INTERVAL inspectionIntervalValue DAY)
  WHEN inspectionIntervalUnit = 'WEEK' THEN DATE_ADD(lastInspectionDate, INTERVAL inspectionIntervalValue WEEK)
  WHEN inspectionIntervalUnit = 'MONTH' THEN DATE_ADD(lastInspectionDate, INTERVAL inspectionIntervalValue MONTH)
  WHEN inspectionIntervalUnit = 'YEAR' THEN DATE_ADD(lastInspectionDate, INTERVAL inspectionIntervalValue YEAR)
  ELSE nextInspectionDate
END
WHERE nextInspectionDate IS NULL
  AND lastInspectionDate IS NOT NULL
  AND inspectionIntervalValue IS NOT NULL
  AND inspectionIntervalUnit IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_materialSerialTrack_nextInspectionDate
  ON MaterialSerialTrack (nextInspectionDate);

CREATE OR REPLACE VIEW vw_materialSerialTrackInspectionAlerts AS
SELECT
  mst.id,
  mst.materialId,
  mst.beNumber,
  mst.shortDescription,
  mst.nextInspectionDate,
  DATEDIFF(mst.nextInspectionDate, CURDATE()) AS daysUntilInspection,
  (DATEDIFF(mst.nextInspectionDate, CURDATE()) BETWEEN 0 AND 30) AS remindMonthBefore,
  (DATEDIFF(mst.nextInspectionDate, CURDATE()) BETWEEN 0 AND 7) AS remindWeekBefore,
  (DATEDIFF(mst.nextInspectionDate, CURDATE()) BETWEEN 0 AND 1) AS remindDayBefore,
  (DATEDIFF(mst.nextInspectionDate, CURDATE()) < 0) AS isOverdue
FROM MaterialSerialTrack mst
WHERE mst.deleted = 0
  AND mst.nextInspectionDate IS NOT NULL;

CREATE OR REPLACE VIEW vw_materialSerialTrackDueCurrentMonth AS
SELECT
  mst.id,
  mst.materialId,
  mst.beNumber,
  mst.shortDescription,
  mst.nextInspectionDate,
  DATEDIFF(mst.nextInspectionDate, CURDATE()) AS daysUntilInspection
FROM MaterialSerialTrack mst
WHERE mst.deleted = 0
  AND mst.nextInspectionDate IS NOT NULL
  AND YEAR(mst.nextInspectionDate) = YEAR(CURDATE())
  AND MONTH(mst.nextInspectionDate) = MONTH(CURDATE());

  -- InventoryOrder.requestedQty
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS requestedQty INT NOT NULL DEFAULT 1;

-- InventoryOrder.approved
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT 0;

-- InventoryOrder.approvedAt
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS approvedAt DATETIME NULL;

-- InventoryOrder.approvedBy
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS approvedBy CHAR(36) NULL;

ALTER TABLE InventoryOrder
    DROP FOREIGN KEY IF EXISTS fk_inventoryOrder_approvedBy;

ALTER TABLE InventoryOrder
    ADD CONSTRAINT fk_inventoryOrder_approvedBy
    FOREIGN KEY (approvedBy) REFERENCES Employee (id) ON DELETE SET NULL;
-- InventoryOrder.requestedQty
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS requestedQty INT NOT NULL DEFAULT 1;

-- InventoryOrder.approved
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT 0;

-- InventoryOrder.approvedAt
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS approvedAt DATETIME NULL;

-- InventoryOrder.approvedBy
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS approvedBy CHAR(36) NULL;

ALTER TABLE InventoryOrder
    DROP FOREIGN KEY IF EXISTS fk_inventoryOrder_approvedBy;

ALTER TABLE InventoryOrder
    ADD CONSTRAINT fk_inventoryOrder_approvedBy
    FOREIGN KEY (approvedBy) REFERENCES Employee (id) ON DELETE SET NULL;


CREATE TABLE
      IF NOT EXISTS ProjectBOM (
            id CHAR(36) NOT NULL PRIMARY KEY,
            projectBomNumber VARCHAR(255) NOT NULL,
            projectBomId CHAR(36),
            additionalInfo VARCHAR(255),
            description VARCHAR(255),
            shortDescription VARCHAR(255) NOT NULL,
            startDate DATETIME NOT NULL,
            endDate DATETIME,
            createdAt DATETIME NOT NULL,
            deletedAt DATETIME,
            closed BOOLEAN NOT NULL DEFAULT 0,
            materialClosed BOOLEAN NOT NULL DEFAULT 0,
            readyForPurchase BOOLEAN NOT NULL DEFAULT 0,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            projectId CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            deletedBy CHAR(36),
            FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (projectBomId) REFERENCES ProjectBOM (id) ON DELETE SET NULL,
            FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS ProjectBOMStructure (
            id CHAR(36) NOT NULL PRIMARY KEY,
            shortDescription VARCHAR(255),
            additionalInfo VARCHAR(255),
            description VARCHAR(255),
            tag VARCHAR(255),
            createdAt DATETIME NOT NULL,
            readyForPurchaseDate DATETIME,
            deletedAt DATETIME,
            readyForPurchase BOOLEAN NOT NULL DEFAULT 0,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            materialId CHAR(36) NOT NULL,
            projectBOMId CHAR(36) NOT NULL,
            parentStructureId CHAR(36),
            deletedBy CHAR(36),
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (projectBOMId) REFERENCES ProjectBOM (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (parentStructureId) REFERENCES ProjectBOMStructure (id) ON DELETE CASCADE
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS PurchaseBOM (
            id CHAR(36) NOT NULL PRIMARY KEY,
            purchaseBomNumber VARCHAR(255) NOT NULL,
            purchaseBomId CHAR(36),
            additionalInfo VARCHAR(255),
            description VARCHAR(255),
            shortDescription VARCHAR(255) NOT NULL,
            startDate DATETIME NOT NULL,
            endDate DATETIME,
            createdAt DATETIME NOT NULL,
            deletedAt DATETIME,
            closed BOOLEAN NOT NULL DEFAULT 0,
            materialClosed BOOLEAN NOT NULL DEFAULT 0,
            approvedForQuote BOOLEAN NOT NULL DEFAULT 0,
            purchased BOOLEAN NOT NULL DEFAULT 0,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            projectId CHAR(36) NOT NULL,
            projectBOMId CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            deletedBy CHAR(36),
            FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (projectBOMId) REFERENCES ProjectBOM (id) ON DELETE RESTRICT,
            FOREIGN KEY (purchaseBomId) REFERENCES PurchaseBOM (id) ON DELETE SET NULL,
            FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
            UNIQUE(projectBOMId)
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS PurchaseBOMStructure (
            id CHAR(36) NOT NULL PRIMARY KEY,
            shortDescription VARCHAR(255),
            additionalInfo VARCHAR(255),
            description VARCHAR(255),
            tag VARCHAR(255),
            createdAt DATETIME NOT NULL,
            readyForPurchaseDate DATETIME,
            deletedAt DATETIME,
            purchased BOOLEAN NOT NULL DEFAULT 0,
            approvedForQuote BOOLEAN NOT NULL DEFAULT 0,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            materialId CHAR(36) NOT NULL,
            purchaseBOMId CHAR(36) NOT NULL,
            projectBOMStructureId CHAR(36) NOT NULL,
            purchaseBOMStructureId CHAR(36),
            deletedBy CHAR(36),
            quoteSupplierLineId CHAR(36),
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (purchaseBOMId) REFERENCES PurchaseBOM (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (projectBOMStructureId) REFERENCES ProjectBOMStructure (id) ON DELETE RESTRICT,
            FOREIGN KEY (purchaseBOMStructureId) REFERENCES PurchaseBOMStructure (id) ON DELETE CASCADE,
            UNIQUE(purchaseBOMId, projectBOMStructureId)
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS BOMExecution (
            id CHAR(36) NOT NULL PRIMARY KEY,
            requiredQuantity INT NOT NULL,
            stockReservedQuantity INT DEFAULT 0,
            issuedQuantity INT DEFAULT 0,
            purchaseOrderedQuantity INT DEFAULT 0,
            purchaseReceivedQuantity INT DEFAULT 0,
            createdAt DATETIME NOT NULL,
            completedDate DATETIME,
            deletedAt DATETIME,
            notDeliverable BOOLEAN NOT NULL DEFAULT 0,
            notCorrect BOOLEAN NOT NULL DEFAULT 0,
            notCorrectReason VARCHAR(255),
            deleted BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            projectBOMStructureId CHAR(36) NOT NULL,
            deletedBy CHAR(36),
            FOREIGN KEY (projectBOMStructureId) REFERENCES ProjectBOMStructure (id) ON DELETE CASCADE,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            UNIQUE(projectBOMStructureId)
      ) ENGINE = InnoDB;

CREATE TABLE 
      IF NOT EXISTS MaterialDemand (
            id CHAR(36) PRIMARY KEY,
            materialId CHAR(36) NOT NULL,
            totalRequiredQty INT NOT NULL,
            reservedQty INT DEFAULT 0,
            createdAt DATETIME NOT NULL,
            FOREIGN KEY (materialId) REFERENCES Material(id) ON DELETE RESTRICT,
            UNIQUE(materialId)
      )ENGINE = InnoDB;

CREATE TABLE 
      IF NOT EXISTS MaterialDemandSourceType (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(50) NOT NULL, 
            description VARCHAR(255),
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee(id) ON DELETE RESTRICT,
            UNIQUE(name)
      ) ENGINE=InnoDB;

CREATE TABLE 
      IF NOT EXISTS MaterialDemandSource (
            id CHAR(36) NOT NULL PRIMARY KEY,
            materialDemandId CHAR(36) NOT NULL,
            sourceTypeId CHAR(36) NOT NULL,
            sourceReferenceId CHAR(36),
            requiredQty INT NOT NULL,
            reservedQty INT DEFAULT 0,
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (materialDemandId) REFERENCES MaterialDemand(id) ON DELETE CASCADE,
            FOREIGN KEY (sourceTypeId) REFERENCES MaterialDemandSourceType(id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB;

CREATE TABLE
      IF NOT EXISTS PaymentCondition(
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL,
            deletedAt DATETIME,
            createdBy CHAR(36) NOT NULL,
            deletedBy CHAR(36),
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

-- SET FOREIGN_KEY_CHECKS = 0;

-- DROP TABLE IF EXISTS QuoteSupplier;

-- SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE
      IF NOT EXISTS QuoteSupplier (
            id CHAR(36) NOT NULL PRIMARY KEY,
            quoteNumber VarChar(255) NOT NULL,
            quotationNumber VarChar(255),
            description TEXT,
            companyId CHAR(36) NOT NULL,
            rejected BOOLEAN NOT NULL DEFAULT 0,
            rejectedAt DATETIME,
            rejectedBy CHAR(36),
            acceptedForPOB BOOLEAN NOT NULL DEFAULT 0,
            approvedAt DATETIME,
            approvedBy CHAR(36),
            sent BOOLEAN NOT NULL DEFAULT 0,
            sentAt DATETIME,
            sentBy CHAR(36),
            received BOOLEAN NOT NULL DEFAULT 0,
            receivedAt DATETIME,
            receivedBy CHAR(36),
            additionalInfo VARCHAR(255),
            documentId CHAR(36),
            validUntil DATETIME,
            deliveryTimeDays INT,
            createdBy CHAR(36) NOT NULL,
            paymentConditionId CHAR(36),
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT,
            FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (paymentConditionId) REFERENCES PaymentCondition (id) ON DELETE RESTRICT,
            FOREIGN KEY (rejectedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (approvedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (sentBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (receivedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS QuoteSupplierLine (
            id CHAR(36) PRIMARY KEY,
            quoteSupplierId CHAR(36) NOT NULL,
            materialId CHAR(36) NOT NULL,
            materialDemandId CHAR(36),
            quantity INT NOT NULL,
            unitPrice DECIMAL(10,2) NOT NULL,
            minQuantity INT,
            selected BOOLEAN DEFAULT 0,
            notDeliverable BOOLEAN NOT NULL DEFAULT 0,
            FOREIGN KEY (quoteSupplierId) REFERENCES QuoteSupplier(id) ON DELETE RESTRICT,
            FOREIGN KEY (materialId) REFERENCES Material(id) ON DELETE RESTRICT,
            FOREIGN KEY (materialDemandId) REFERENCES MaterialDemand(id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS IncomingDelivery (
            id CHAR(36) NOT NULL PRIMARY KEY,
            incomingDeliveryNumber VARCHAR(255) NOT NULL,
            purchaseId CHAR(36),
            additionalInfo VARCHAR(255),
            description VARCHAR(255),
            status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
            deliveryDate DATETIME NOT NULL,
            receivedAt DATETIME,
            createdAt DATETIME NOT NULL,
            deletedAt DATETIME,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            deletedBy CHAR(36),
            FOREIGN KEY (purchaseId) REFERENCES Purchase (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            UNIQUE(incomingDeliveryNumber)
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS IncomingDeliveryLine (
            id CHAR(36) NOT NULL PRIMARY KEY,
            incomingDeliveryId CHAR(36) NOT NULL,
            purchaseDetailId CHAR(36),
            materialId CHAR(36) NOT NULL,
            orderedQty INT NOT NULL,
            deliveredQty INT NOT NULL,
            acceptedQty INT NOT NULL,
            rejectedQty INT NOT NULL DEFAULT 0,
            backorderQty INT NOT NULL DEFAULT 0,
            unitPrice DECIMAL(10,2),
            lineStatus VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
            notCorrect BOOLEAN NOT NULL DEFAULT 0,
            notCorrectReason TEXT,
            createdAt DATETIME NOT NULL,
            deletedAt DATETIME,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            deletedBy CHAR(36),
            FOREIGN KEY (incomingDeliveryId) REFERENCES IncomingDelivery (id) ON DELETE CASCADE,
            FOREIGN KEY (purchaseDetailId) REFERENCES PurchaseDetail (id) ON DELETE RESTRICT,
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS IncomingDeliveryLineAllocation (
            id CHAR(36) NOT NULL PRIMARY KEY,
            incomingDeliveryLineId CHAR(36) NOT NULL,
            materialDemandSourceId CHAR(36) NOT NULL,
            allocatedQty INT NOT NULL,
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (incomingDeliveryLineId) REFERENCES IncomingDeliveryLine (id) ON DELETE CASCADE,
            FOREIGN KEY (materialDemandSourceId) REFERENCES MaterialDemandSource (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            UNIQUE (incomingDeliveryLineId, materialDemandSourceId)
      ) ENGINE = InnoDB;


-- PurchaseBOMStructure.quoteSupplierLineId
ALTER TABLE PurchaseBOMStructure
    ADD COLUMN IF NOT EXISTS quoteSupplierLineId CHAR(36) NULL;

ALTER TABLE PurchaseBOMStructure
    DROP FOREIGN KEY IF EXISTS fk_quoteSupplierLine_purchaseBomStructure;

ALTER TABLE PurchaseBOMStructure
    ADD CONSTRAINT fk_quoteSupplierLine_purchaseBomStructure
    FOREIGN KEY (quoteSupplierLineId) REFERENCES QuoteSupplierLine (id) ON DELETE RESTRICT;


-- InventoryOrder.rejected
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS rejected BOOLEAN NOT NULL DEFAULT 0;

-- InventoryOrder.rejectedAt
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS rejectedAt DATETIME NULL;

-- InventoryOrder.rejectedBy
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS rejectedBy CHAR(36) NULL;

ALTER TABLE InventoryOrder
    DROP FOREIGN KEY IF EXISTS fk_inventoryOrder_rejectedBy;

ALTER TABLE InventoryOrder
    ADD CONSTRAINT fk_inventoryOrder_rejectedBy
    FOREIGN KEY (rejectedBy) REFERENCES Employee (id) ON DELETE SET NULL;

-- ============================================
-- ALTER version for existing database migration
-- inventoryId -> materialId + FK switch
-- ============================================

-- 1) Add new materialId column
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS materialId CHAR(36) NULL;

-- 2) Backfill materialId from existing inventoryId
SET @hasInventoryId := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'InventoryOrder'
    AND COLUMN_NAME = 'inventoryId'
);

SET @sql := IF(
  @hasInventoryId > 0,
  'UPDATE InventoryOrder io
   JOIN Inventory i ON i.id = io.inventoryId
   SET io.materialId = i.materialId
   WHERE io.materialId IS NULL',
  'SELECT ''Skip backfill: inventoryId does not exist'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 3) Ensure required fields exist (safe for older DBs)
ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS rejected BOOLEAN NOT NULL DEFAULT 0;

ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS rejectedAt DATETIME NULL;

ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS rejectedBy CHAR(36) NULL;

-- 4) Drop old FK(s) tied to inventoryId (name can vary by DB)
ALTER TABLE InventoryOrder
    DROP FOREIGN KEY IF EXISTS InventoryOrder_ibfk_1;

ALTER TABLE InventoryOrder
    DROP FOREIGN KEY IF EXISTS fk_inventoryOrder_inventoryId;

-- 5) Add/refresh rejectedBy FK
ALTER TABLE InventoryOrder
    DROP FOREIGN KEY IF EXISTS fk_inventoryOrder_rejectedBy;

ALTER TABLE InventoryOrder
    ADD CONSTRAINT fk_inventoryOrder_rejectedBy
    FOREIGN KEY (rejectedBy) REFERENCES Employee (id) ON DELETE SET NULL;

-- 6) Make materialId required after backfill
ALTER TABLE InventoryOrder
    MODIFY COLUMN materialId CHAR(36) NOT NULL;

-- 7) Add/refresh material FK
ALTER TABLE InventoryOrder
    DROP FOREIGN KEY IF EXISTS fk_inventoryOrder_materialId;

ALTER TABLE InventoryOrder
    ADD CONSTRAINT fk_inventoryOrder_materialId
    FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT;

-- 8) Optional: remove old inventoryId column once app no longer uses it
ALTER TABLE InventoryOrder
    DROP COLUMN IF EXISTS inventoryId;

-- SET FOREIGN_KEY_CHECKS = 0;

-- DROP TABLE IF EXISTS PurchaseDetail;
-- DROP TABLE IF EXISTS Purchase;

-- SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE
      IF NOT EXISTS Purchase (
            id CHAR(36) NOT NULL PRIMARY KEY,
            purchaseNumber VARCHAR(255) NOT NULL,
            purchaseDate DATETIME NOT NULL,
            companyId CHAR(36) NOT NULL,
            quoteSupplierId CHAR(36),
            paymentConditionId CHAR(36),
            status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
            shortDescription VARCHAR(255),
            description TEXT,
            additionalInfo VARCHAR(255),
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            createdBy CHAR(36) NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT,
            FOREIGN KEY (quoteSupplierId) REFERENCES QuoteSupplier (id) ON DELETE SET NULL,
            FOREIGN KEY (paymentConditionId) REFERENCES PaymentCondition (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            UNIQUE (purchaseNumber)
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS PurchaseDetail (
            id CHAR(36) NOT NULL PRIMARY KEY,
            purchaseId CHAR(36) NOT NULL,
            quoteSupplierLineId CHAR(36),
            materialId CHAR(36) NOT NULL,
            materialDemandId CHAR(36),
            quantity INT NOT NULL,
            unitPrice DECIMAL(10,2) NOT NULL,
            minQuantity INT,
            notDeliverable BOOLEAN NOT NULL DEFAULT 0,
            lineStatus VARCHAR(50) NOT NULL DEFAULT 'OPEN',
            additionalInfo VARCHAR(255),
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            createdBy CHAR(36) NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (purchaseId) REFERENCES Purchase (id) ON DELETE CASCADE,
            FOREIGN KEY (quoteSupplierLineId) REFERENCES QuoteSupplierLine (id) ON DELETE SET NULL,
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (materialDemandId) REFERENCES MaterialDemand (id) ON DELETE SET NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS InventoryOrder (
            id CHAR(36) NOT NULL PRIMARY KEY,
            materialId CHAR(36) NOT NULL,
            orderNumber VARCHAR(255) NOT NULL,
            requestedQty INT NOT NULL DEFAULT 1,
            orderDate DATETIME NOT NULL,
            shortDescription VARCHAR(255) NOT NULL,
            longDescription TEXT,
            approved BOOLEAN NOT NULL DEFAULT 0,
            approvedAt DATETIME,
            approvedBy CHAR(36),
            rejected BOOLEAN NOT NULL DEFAULT 0,
            rejectedAt DATETIME,
            rejectedBy CHAR(36),
            notDeliverable BOOLEAN NOT NULL DEFAULT 0,
            notCorrect BOOLEAN NOT NULL DEFAULT 0,
            notCorrectReason TEXT,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            createdBy CHAR(36) NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (approvedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (rejectedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS IncomingDelivery (
            id CHAR(36) NOT NULL PRIMARY KEY,
            incomingDeliveryNumber VARCHAR(255) NOT NULL,
            purchaseId CHAR(36),
            additionalInfo VARCHAR(255),
            description VARCHAR(255),
            status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
            deliveryDate DATETIME NOT NULL,
            receivedAt DATETIME,
            createdAt DATETIME NOT NULL,
            deletedAt DATETIME,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            deletedBy CHAR(36),
            FOREIGN KEY (purchaseId) REFERENCES Purchase (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            UNIQUE(incomingDeliveryNumber)
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS IncomingDeliveryLine (
            id CHAR(36) NOT NULL PRIMARY KEY,
            incomingDeliveryId CHAR(36) NOT NULL,
            purchaseDetailId CHAR(36),
            materialId CHAR(36) NOT NULL,
            orderedQty INT NOT NULL,
            deliveredQty INT NOT NULL,
            acceptedQty INT NOT NULL,
            rejectedQty INT NOT NULL DEFAULT 0,
            backorderQty INT NOT NULL DEFAULT 0,
            unitPrice DECIMAL(10,2),
            lineStatus VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
            notCorrect BOOLEAN NOT NULL DEFAULT 0,
            notCorrectReason TEXT,
            createdAt DATETIME NOT NULL,
            deletedAt DATETIME,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            deletedBy CHAR(36),
            FOREIGN KEY (incomingDeliveryId) REFERENCES IncomingDelivery (id) ON DELETE CASCADE,
            FOREIGN KEY (purchaseDetailId) REFERENCES PurchaseDetail (id) ON DELETE RESTRICT,
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS IncomingDeliveryLineAllocation (
            id CHAR(36) NOT NULL PRIMARY KEY,
            incomingDeliveryLineId CHAR(36) NOT NULL,
            materialDemandSourceId CHAR(36) NOT NULL,
            allocatedQty INT NOT NULL,
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (incomingDeliveryLineId) REFERENCES IncomingDeliveryLine (id) ON DELETE CASCADE,
            FOREIGN KEY (materialDemandSourceId) REFERENCES MaterialDemandSource (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            UNIQUE (incomingDeliveryLineId, materialDemandSourceId)
      ) ENGINE = InnoDB;

ALTER TABLE InventoryOrder
    ADD COLUMN IF NOT EXISTS notDeliverable BOOLEAN NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notCorrect BOOLEAN NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notCorrectReason TEXT NULL,
    ADD COLUMN IF NOT EXISTS snapshotTakenAt DATETIME NULL;

-- SET FOREIGN_KEY_CHECKS = 0;

-- DROP TABLE IF EXISTS MaterialDemandSource;

-- SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE
      IF NOT EXISTS MaterialDemandSource (
            id CHAR(36) NOT NULL PRIMARY KEY,
            materialDemandId CHAR(36) NOT NULL,
            sourceTypeId CHAR(36) NOT NULL,
            sourceReferenceId CHAR(36),
            requiredQty INT NOT NULL,
            reservedQty INT DEFAULT 0,
            fulfilled BOOLEAN NOT NULL DEFAULT 0,
            fulfilledAt DATETIME,
            fulfilledBy CHAR(36),
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (materialDemandId) REFERENCES MaterialDemand (id) ON DELETE CASCADE,
            FOREIGN KEY (sourceTypeId) REFERENCES MaterialDemandSourceType (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (fulfilledBy) REFERENCES Employee (id) ON DELETE SET NULL,
            INDEX (materialDemandId),
            INDEX (sourceTypeId),
            INDEX (createdBy),
            INDEX (fulfilledBy)
      ) ENGINE = InnoDB;

-- 1) Ensure VatMargin table has countryId column
ALTER TABLE VatMargin
ADD COLUMN IF NOT EXISTS countryId CHAR(36) NULL;

-- 2) Drop old FK(s) if they exist
ALTER TABLE VatMargin
DROP FOREIGN KEY IF EXISTS fk_vatMargin_countryId;

-- 3) Add/refresh countryId FK
ALTER TABLE VatMargin
ADD CONSTRAINT fk_vatMargin_countryId
FOREIGN KEY (countryId) REFERENCES Country (id) ON UPDATE RESTRICT ON DELETE RESTRICT;

-- 4) Ensure required fields exist on WorkOrderStructure (safe for older DBs)
ALTER TABLE WorkOrderStructure
ADD COLUMN IF NOT EXISTS vatMarginId CHAR(36) NULL;

-- 5) Drop old FK(s) tied to vatMarginId
ALTER TABLE WorkOrderStructure
DROP FOREIGN KEY IF EXISTS fk_workOrderStructure_vatMarginId;

-- 6) Add/refresh vatMarginId FK
ALTER TABLE WorkOrderStructure
ADD CONSTRAINT fk_workOrderStructure_vatMarginId
FOREIGN KEY (vatMarginId) REFERENCES VatMargin (id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE InvoiceOut
DROP COLUMN IF EXISTS vatMarginId;

ALTER TABLE InvoiceOut
DROP INDEX IF EXISTS vatMarginId;

ALTER TABLE TimeRegistry
ADD COLUMN IF NOT EXISTS vatMarginId CHAR(36) NULL;

ALTER TABLE TimeRegistry
DROP FOREIGN KEY IF EXISTS fk_timeRegistry_vatMarginId;

ALTER TABLE TimeRegistry
ADD CONSTRAINT fk_timeRegistry_vatMarginId
FOREIGN KEY (vatMarginId) REFERENCES VatMargin (id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE Training
ADD COLUMN IF NOT EXISTS vatMarginId CHAR(36) NULL;

ALTER TABLE Training
DROP FOREIGN KEY IF EXISTS fk_training_vatMarginId;

ALTER TABLE Training
ADD CONSTRAINT fk_training_vatMarginId
FOREIGN KEY (vatMarginId) REFERENCES VatMargin (id) ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Purchase customer references (PO customer + BOC)
ALTER TABLE Purchase
ADD COLUMN IF NOT EXISTS customerPoNumber VARCHAR(255) NULL AFTER purchaseNumber;

ALTER TABLE Purchase
ADD COLUMN IF NOT EXISTS bocNumber VARCHAR(255) NULL AFTER customerPoNumber;

ALTER TABLE Purchase
ADD COLUMN IF NOT EXISTS bocCustomerName VARCHAR(255) NULL AFTER bocNumber;

ALTER TABLE Purchase
ADD COLUMN IF NOT EXISTS bocDescription TEXT NULL AFTER bocCustomerName;

ALTER TABLE Purchase
ADD COLUMN IF NOT EXISTS bocCreatedAt DATETIME NULL AFTER bocDescription;

ALTER TABLE Purchase
ADD COLUMN IF NOT EXISTS bocStatus VARCHAR(50) NULL AFTER bocCreatedAt;

-- Prisma sync: older DBs can miss this Unit column
ALTER TABLE Unit
ADD COLUMN IF NOT EXISTS quantityValue DECIMAL(10,3) NULL AFTER physicalQuantity;


ALTER TABLE InvoiceIn
    CHANGE COLUMN IF EXISTS `humanId` `clientInvoiceNumber` VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS description TEXT NULL,
    MODIFY COLUMN IF EXISTS poNumber CHAR(36) NULL;

ALTER TABLE InvoiceIn
    DROP FOREIGN KEY IF EXISTS fk_invoicein_po;

ALTER TABLE InvoiceIn
    ADD CONSTRAINT fk_invoicein_po
    FOREIGN KEY (poNumber) REFERENCES Purchase (id) ON DELETE RESTRICT;

ALTER TABLE TimeRegistry
    ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT 0;

CREATE TABLE
    IF NOT EXISTS BillOfQuantitiesType (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        deletedAt DATETIME,
        deletedBy CHAR(36),
        FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS BillOfQuantitiesStatus (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        deletedAt DATETIME,
        deletedBy CHAR(36),
        FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS BillOfQuantitiesSentType (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        deletedAt DATETIME,
        deletedBy CHAR(36),
        FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS BillOfQuantities (
        id CHAR(36) NOT NULL PRIMARY KEY,
        boqNumber VARCHAR(255) NOT NULL,
        poNumber VARCHAR(255),
        clientReference VARCHAR(255),
        boqDate DATETIME NOT NULL,
        createdAt DATETIME NOT NULL,
        dueDate DATETIME NOT NULL,
        sentDate DATETIME,
        deletedAt DATETIME,
        modifiedAt DATETIME,
        reminderSent BOOLEAN NOT NULL DEFAULT 0,
        outstanding BOOLEAN NOT NULL DEFAULT 1,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        deletedBy CHAR(36),
        createdBy CHAR(36) NOT NULL,
        modifiedBy CHAR(36),
        boqTypeId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        paymentMethodId CHAR(36) NOT NULL,
        boqSentTypeId CHAR(36) NOT NULL,
        boqStatusId CHAR(36) NOT NULL,
        priceListId CHAR(36),
        FOREIGN KEY (boqTypeId) REFERENCES BillOfQuantitiesType (id) ON DELETE RESTRICT,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
        FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
        FOREIGN KEY (modifiedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (paymentMethodId) REFERENCES PaymentMethod (id) ON DELETE RESTRICT,
        FOREIGN KEY (boqSentTypeId) REFERENCES BillOfQuantitiesSentType (id) ON DELETE RESTRICT,
        FOREIGN KEY (boqStatusId) REFERENCES BillOfQuantitiesStatus (id) ON DELETE RESTRICT,
        FOREIGN KEY (priceListId) REFERENCES PriceList (id) ON DELETE RESTRICT,
        UNIQUE (boqNumber)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS BoqContact (
        id CHAR(36) NOT NULL PRIMARY KEY,
        contactId CHAR(36) NOT NULL,
        billOfQuantitiesId CHAR(36) NOT NULL,
        FOREIGN KEY (contactId) REFERENCES Contact (id) ON DELETE RESTRICT,
        FOREIGN KEY (billOfQuantitiesId) REFERENCES BillOfQuantities (id) ON DELETE CASCADE
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS WorkOrderBoQ (
        id CHAR(36) NOT NULL PRIMARY KEY,
        billOfQuantitiesId CHAR(36) NOT NULL,
        workOrderId CHAR(36) NOT NULL,
        FOREIGN KEY (billOfQuantitiesId) REFERENCES BillOfQuantities (id) ON DELETE CASCADE,
        FOREIGN KEY (workOrderId) REFERENCES WorkOrder (id) ON DELETE RESTRICT,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        deletedAt DATETIME,
        deletedBy CHAR(36),
        FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE 
    IF NOT EXISTS QuoteSupplierMiscLine (
        id  CHAR(36) PRIMARY KEY,
        quoteSupplierId CHAR(36) NOT NULL,
        description VARCHAR(255) NOT NULL,
        unitPrice DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (quoteSupplierId) REFERENCES QuoteSupplier(id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS VisibilityForDepartment (
        id CHAR(36) NOT NULL PRIMARY KEY,
        visible BOOLEAN NOT NULL DEFAULT 0,
        departmentId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        FOREIGN KEY (departmentId) REFERENCES Department (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId)     REFERENCES Target (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS ProjectEmployee (
        id CHAR(36) NOT NULL PRIMARY KEY,
        employeeId CHAR(36) NOT NULL,
        projectId CHAR(36) NOT NULL,
        additionalInfo VARCHAR(255),
        manager BOOLEAN NOT NULL DEFAULT 0,
        supervisor BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (employeeId) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

ALTER TABLE InvoiceOut ADD COLUMN IF NOT EXISTS boqId CHAR(36) NULL;

ALTER TABLE InvoiceOut
    DROP FOREIGN KEY IF EXISTS fk_invoiceout_boq;

ALTER TABLE InvoiceOut
    ADD CONSTRAINT fk_invoiceout_boq
    FOREIGN KEY (boqId) REFERENCES BillOfQuantities (id) ON DELETE RESTRICT;

ALTER TABLE InvoiceOut CHANGE COLUMN IF EXISTS `humanId` `clientReference` VARCHAR(255) NULL;
--HR Schedule meetings

CREATE TABLE
IF NOT EXISTS ScheduleMeeting (
  id CHAR(36) NOT NULL PRIMARY KEY,
  employeeId CHAR(36) NOT NULL,
  conversationType VARCHAR(100) NOT NULL,
  startAt DATETIME NOT NULL,
  endAt DATETIME NOT NULL,
  place VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'planned',
  notes TEXT NULL,
  completedAt DATETIME NULL,
  createdAt DATETIME NOT NULL,
  createdBy CHAR(36) NOT NULL,
  updatedAt DATETIME NULL,
  deleted BOOLEAN NOT NULL DEFAULT false,
  deletedAt DATETIME NULL,
  deletedBy CHAR(36) NULL,

  INDEX employeeId (employeeId),
  INDEX createdBy (createdBy),
  INDEX deletedBy (deletedBy),

CONSTRAINT ScheduleMeeting_ibfk_1
  FOREIGN KEY (deletedBy) REFERENCES Employee(id) ON DELETE SET NULL,
CONSTRAINT ScheduleMeeting_ibfk_2
  FOREIGN KEY (createdBy) REFERENCES Employee(id) ON DELETE RESTRICT,
CONSTRAINT ScheduleMeeting_ibfk_3
  FOREIGN KEY (employeeId) REFERENCES Employee(id) ON DELETE RESTRICT

) ENGINE = InnoDB;
ALTER TABLE ProjectBOM ADD COLUMN IF NOT EXISTS canCopy BOOLEAN NOT NULL DEFAULT 0;

-- HR Recruitment

CREATE TABLE
IF NOT EXISTS RecruitmentApplicant (
  id CHAR(36) NOT NULL PRIMARY KEY,
  candidateName VARCHAR(255) NOT NULL,
  profile TEXT NULL,
  contactDate DATETIME NULL,
  interviewDate DATETIME NULL,
  contactType VARCHAR(50) NOT NULL,
  description TEXT NULL,
  cvPath VARCHAR(500) NULL,
  potential BOOLEAN NOT NULL DEFAULT 0,
  retained BOOLEAN NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL,
  createdBy CHAR(36) NOT NULL,
  updatedAt DATETIME NULL,
  deleted BOOLEAN NOT NULL DEFAULT 0,
  deletedAt DATETIME NULL,
  deletedBy CHAR(36) NULL,

  INDEX createdBy (createdBy),
  INDEX deletedBy (deletedBy),

CONSTRAINT RecruitmentApplicant_ibfk_1
  FOREIGN KEY (createdBy) REFERENCES Employee(id) ON DELETE RESTRICT,
CONSTRAINT RecruitmentApplicant_ibfk_2
  FOREIGN KEY (deletedBy) REFERENCES Employee(id) ON DELETE SET NULL

) ENGINE = InnoDB;

CREATE TABLE
IF NOT EXISTS RecruitmentVacancy (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  department VARCHAR(100) NOT NULL,
  contractType VARCHAR(50) NOT NULL,
  workRegime VARCHAR(50) NOT NULL,
  salaryMin DECIMAL(10,2) NULL,
  salaryMax DECIMAL(10,2) NULL,
  publishWebsite BOOLEAN NOT NULL DEFAULT 0,
  publishVdab BOOLEAN NOT NULL DEFAULT 0,
  publishOther BOOLEAN NOT NULL DEFAULT 0,
  publishLinkedIn BOOLEAN NOT NULL DEFAULT 0,
  publishTempAgencies BOOLEAN NOT NULL DEFAULT 0,
  publishRecruitmentAgencies BOOLEAN NOT NULL DEFAULT 0,
  otherPublication VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL,
  createdBy CHAR(36) NOT NULL,
  updatedAt DATETIME NULL,
  deleted BOOLEAN NOT NULL DEFAULT false,
  deletedAt DATETIME NULL,
  deletedBy CHAR(36) NULL,

  INDEX createdBy (createdBy),
  INDEX deletedBy (deletedBy),

CONSTRAINT RecruitmentVacancy_ibfk_1
  FOREIGN KEY (createdBy) REFERENCES Employee(id) ON DELETE RESTRICT,
CONSTRAINT RecruitmentVacancy_ibfk_2
  FOREIGN KEY (deletedBy) REFERENCES Employee(id) ON DELETE SET NULL

) ENGINE = InnoDB;
ALTER TABLE Employee
ADD COLUMN IF NOT EXISTS photoFileId VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS bankAccountNumber VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS rrn VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS idExpirationDate DATETIME NULL,
ADD COLUMN IF NOT EXISTS driversLicense BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS maritalStatus VARCHAR(100),
ADD COLUMN IF NOT EXISTS dependents INT NULL,
ADD COLUMN IF NOT EXISTS employmentStatus VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS contractType VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS contractDuration VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS grossSalary VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS mealVouchers BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ecoVouchers BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS companyCar BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS companyCarDescription VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS fuelCard BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bikeLease BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS mobilePhone BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS laptop BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS fixedExpenseAllowance BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS homeWorkInternetAllowance BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS extraLegalBenefits TEXT NULL;

CREATE TABLE IF NOT EXISTS EmployeeContractStatusOption (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        deletedAt DATETIME NULL,
        deletedBy CHAR(36) NULL,
        INDEX createdBy (createdBy),
        INDEX deletedBy (deletedBy),
        FOREIGN KEY (deletedBy) REFERENCES Employee(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee(id) ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS EmployeeContractTypeOption (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        deletedAt DATETIME NULL,
        deletedBy CHAR(36) NULL,
        INDEX createdBy (createdBy),
        INDEX deletedBy (deletedBy),
        FOREIGN KEY (deletedBy) REFERENCES Employee(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee(id) ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS EmployeeBenefitOption (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        deletedAt DATETIME NULL,
        deletedBy CHAR(36) NULL,
        INDEX createdBy (createdBy),
        INDEX deletedBy (deletedBy),
        FOREIGN KEY (deletedBy) REFERENCES Employee(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee(id) ON DELETE RESTRICT
) ENGINE = InnoDB;
