CREATE TABLE
      IF NOT EXISTS Phantom (
            id CHAR(36) NOT NULL PRIMARY KEY,
            description VARCHAR(255),
            date TIMESTAMP,
            valid BOOLEAN,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS TestProcedure (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS QuoteSupplier (
            id CHAR(36) NOT NULL PRIMARY KEY,
            description TEXT,
            projectId CHAR(36),
            rejected BOOLEAN NOT NULL,
            additionalInfo VARCHAR(255),
            link VARCHAR(255),
            documentPlaceId CHAR(36),
            payementCondition VARCHAR(255),
            acceptedForPOB BOOLEAN,
            validUntill DATETIME,
            deliveryTimeDays INT,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT,
            FOREIGN KEY (documentPlaceId) REFERENCES DocumentPlace (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Part (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            part VARCHAR(255),
            abbreviation VARCHAR(255),
            devision VARCHAR(255),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            additionalInfo VARCHAR(255),
            date TIMESTAMP,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS QuoteBecra (
            id CHAR(36) NOT NULL PRIMARY KEY,
            description TEXT,
            validDate BOOLEAN NOT NULL,
            date DATETIME,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS PurchaseOrderBecra (
            id CHAR(36) NOT NULL PRIMARY KEY,
            description TEXT,
            date DATETIME,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DeliveryNoteSupplier (
            id CHAR(36) NOT NULL PRIMARY KEY,
            companyId CHAR(36),
            supplierNN VARCHAR(255),
            information VARCHAR(255),
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS SupplierDeliveryNoteFollowUp (
            id CHAR(36) NOT NULL PRIMARY KEY,
            deliveryNoteSupplierId CHAR(36) NOT NULL,
            workOrderStructureId CHAR(36) NOT NULL,
            quantityDelivered INT,
            information VARCHAR(255),
            deliveryDate DATETIME,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (deliveryNoteSupplierId) REFERENCES DeliveryNoteSupplier (id) ON DELETE RESTRICT,
            FOREIGN KEY (workOrderStructureId) REFERENCES WorkOrderStructure (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Purchase (
            id CHAR(36) NOT NULL PRIMARY KEY,
            projectId CHAR(36),
            purchaseDate DATETIME,
            materialGroupId CHAR(36),
            orderNumber VARCHAR(255),
            companyId CHAR(36),
            brandName VARCHAR(255),
            brandOrderNumber VARCHAR(255),
            status VARCHAR(255),
            shortDescription VARCHAR(255),
            description VARCHAR(255),
            preferredSupplier VARCHAR(255),
            additionalInfo VARCHAR(255),
            updatedAt DATETIME,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT,
            FOREIGN KEY (materialGroupId) REFERENCES MaterialGroup (id) ON DELETE RESTRICT,
            FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS PurchaseDetail (
            id CHAR(36) NOT NULL PRIMARY KEY,
            projectId CHAR(36),
            purchaseId CHAR(36),
            beNumber VARCHAR(255),
            unitPrice Decimal(10,2),
            quantity INT,
            totalCost Decimal(10,2),
            status VARCHAR(255),
            additionalInfo VARCHAR(255),
            updatedAt DATETIME,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT,
            FOREIGN KEY (purchaseId) REFERENCES Purchase (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Product (
            id CHAR(36) NOT NULL PRIMARY KEY,
            materialId CHAR(36),
            shortDescription VARCHAR(255),
            description VARCHAR(255),
            costPrice INT,
            profit INT,
            sellingUnitQuantity INT,
            sellingPrice INT,
            status VARCHAR(255),
            updatedAt TIMESTAMP,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;
