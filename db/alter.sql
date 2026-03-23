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
 
-- 32c. Material: add FK Material_ibfk_5 on preferredSupplierCompanyId (skip if already exists)
SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Material'
    AND CONSTRAINT_NAME = 'Material_ibfk_5'
);
 
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `Material` ADD CONSTRAINT `Material_ibfk_5` FOREIGN KEY (`preferredSupplierCompanyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL',
  'SELECT ''FK Material_ibfk_5 already exists'''
);
 
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
 
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
ALTER TABLE CompanyAdress ADD COLUMN IF NOT EXISTS `countryId` CHAR(36) NULL;
 
-- 36b. CompanyAdress: add FK fk_companyadress_country (skip if already exists)
ALTER TABLE CompanyAdress DROP FOREIGN KEY IF EXISTS fk_companyadress_country;
ALTER TABLE CompanyAdress ADD CONSTRAINT fk_companyadress_country
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
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS InvoiceOutContact;
DROP TABLE IF EXISTS InvoiceOut;
DROP TABLE IF EXISTS InvoiceIn;

SET FOREIGN_KEY_CHECKS = 1;
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

-- 39c. Create new InvoiceOut
CREATE TABLE IF NOT EXISTS InvoiceOut (
      id CHAR(36) NOT NULL PRIMARY KEY,
      invoiceNumber VARCHAR(255) NOT NULL,
      poNumber VARCHAR(255),
      humanId VARCHAR(255),
      invoiceDate DATETIME NOT NULL,
      createdAt DATETIME NOT NULL,
      dueDate DATETIME NOT NULL,
      sentDate DATETIME,
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
      FOREIGN KEY (invoiceTypeId) REFERENCES InvoiceType (id) ON DELETE RESTRICT,
      FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
      FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
      FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
      FOREIGN KEY (modifiedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
      FOREIGN KEY (paymentMethodId) REFERENCES PaymentMethod (id) ON DELETE RESTRICT,
      FOREIGN KEY (invoiceSentTypeId) REFERENCES InvoiceSentType (id) ON DELETE RESTRICT,
      FOREIGN KEY (invoiceStatusId) REFERENCES InvoiceStatus (id) ON DELETE RESTRICT,
      FOREIGN KEY (vatMarginId) REFERENCES VatMargin (id) ON DELETE RESTRICT,
      UNIQUE (invoiceNumber)
) ENGINE = InnoDB;

-- 39d. Create new InvoiceIn
CREATE TABLE IF NOT EXISTS InvoiceIn (
      id CHAR(36) NOT NULL PRIMARY KEY,
      invoiceNumber VARCHAR(255) NOT NULL,
      poNumber VARCHAR(255),
      humanId VARCHAR(255),
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
      FOREIGN KEY (invoiceOutId) REFERENCES InvoiceOut (id) ON DELETE RESTRICT
) ENGINE = InnoDB;

-- 40. Company: add officialName column
-- Step 1: Add column as nullable (won't break existing rows)
ALTER TABLE Company ADD COLUMN IF NOT EXISTS officialName VARCHAR(255) NULL;

-- Step 2: Fill in existing rows (copy from 'name' as a sensible default)
UPDATE Company SET officialName = name WHERE officialName IS NULL;

-- Step 3: Now enforce NOT NULL since all rows are filled
ALTER TABLE Company MODIFY COLUMN officialName VARCHAR(255) NOT NULL;