HOURTYPE!!!!!!!!!!!  Add targetId to ERD!!!!!!!!!!!

CREATE TABLE
      IF NOT EXISTS PriceListItemTarget (
            id CHAR(36) NOT NULL PRIMARY KEY,
            priceListItemId CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            FOREIGN KEY (priceListItemId) REFERENCES PriceListItem (id) ON DELETE RESTRICT,
            FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS MaterialGroup (
            id CHAR(36) NOT NULL PRIMARY KEY,
            groupA VARCHAR(255) NOT NULL,
            groupB VARCHAR(255),
            groupC VARCHAR(255),
            groupD VARCHAR(255),
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Unit (
            id CHAR(36) NOT NULL PRIMARY KEY,
            unitName VARCHAR(255) NOT NULL,
            physicalQuantity VARCHAR(255) NOT NULL,
            abbreviation VARCHAR(255) NOT NULL,
            shortDescription VARCHAR(255),
            longDescription TEXT,
            valid BOOLEAN NOT NULL,
            createdBy CHAR(36) NOT NULL,
            createdAt TIMESTAMP NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Material (
            id CHAR(36) NOT NULL PRIMARY KEY,
            beNumber VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            brandOrderNr VARCHAR(255),
            shortDescription VARCHAR(255) NOT NULL,
            longDescription TEXT,
            preferredSupplier VARCHAR(255),
            brandName VARCHAR(255),
            documentationPlace VARCHAR(255),
            bePartDoc VARCHAR(255) NULL,
            rejected BOOLEAN DEFAULT FALSE,
            materialGroupIdA CHAR(36) NULL,
            materialGroupIdB CHAR(36) NULL,
            materialGroupIdC CHAR(36) NULL,
            materialGroupIdD CHAR(36) NULL,
            preferredSupplierCompanyId CHAR(36) NULL,
            unitId CHAR(36) NOT NULL,
            createdBy CHAR(36) NOT NULL,
            CONSTRAINT uq_material_beNumber UNIQUE (beNumber),
            FOREIGN KEY (materialGroupIdA) REFERENCES MaterialGroup (id) ON DELETE SET NULL,
            FOREIGN KEY (materialGroupIdB) REFERENCES MaterialGroup (id) ON DELETE SET NULL,
            FOREIGN KEY (materialGroupIdC) REFERENCES MaterialGroup (id) ON DELETE SET NULL,
            FOREIGN KEY (materialGroupIdD) REFERENCES MaterialGroup (id) ON DELETE SET NULL,
            FOREIGN KEY (unitId) REFERENCES Unit (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;


ALTER TABLE Material ADD CONSTRAINT fk_material_preferredSupplierCompanyId FOREIGN KEY (preferredSupplierCompanyId) REFERENCES Company (id) ON DELETE SET NULL;
ALTER TABLE Material ADD targetId CHAR(36) NOT NULL,
ADD CONSTRAINT fk_material_target FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT;

CREATE TABLE
      IF NOT EXISTS MaterialSupplier (
            id CHAR(36) NOT NULL PRIMARY KEY,
            materialId CHAR(36) NOT NULL,
            companyId CHAR(36) NOT NULL,
            supplierOrderNr VARCHAR(255) NULL,
            shortDescription VARCHAR(255) NULL,
            isPreferred BOOLEAN NOT NULL DEFAULT 0,
            CONSTRAINT uq_materialSupplier_material_company UNIQUE (materialId, companyId),
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE CASCADE,
            FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Inventory (
            id CHAR(36) NOT NULL PRIMARY KEY,
            materialId CHAR(36) NOT NULL,
            beNumber VARCHAR(255) NOT NULL,
            place VARCHAR(255) NOT NULL,
            shortDescription VARCHAR(255) NOT NULL,
            longDescription TEXT NOT NULL,
            serialNumber VARCHAR(255) NOT NULL,
            quantityInStock INT NOT NULL,
            minQuantityInStock INT NOT NULL,
            maxQuantityInStock INT NOT NULL,
            information TEXT NOT NULL,
            valid BOOLEAN NOT NULL,
            noValidDate DATETIME NOT NULL,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (beNumber) REFERENCES Material (beNumber) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS InventoryChange (
            id CHAR(36) NOT NULL PRIMARY KEY,
            inventoryId CHAR(36) NOT NULL,
            beNumber VARCHAR(255),
            serialTrackedId CHAR(36),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            additionalInformation TEXT,
            fromLocation VARCHAR(255),
            toLocation VARCHAR(255),
            inventoryOldValue INT,
            inventoryNewValue INT,
            changeDescription TEXT NOT NULL,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (inventoryId) REFERENCES Inventory (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS InventoryStructure (
            id CHAR(36) NOT NULL PRIMARY KEY,
            inventoryPlaceId CHAR(36) NOT NULL,
            place VARCHAR(255) NOT NULL,
            shortDescription VARCHAR(255) NOT NULL,
            longDescription TEXT,
            beNumber VARCHAR(255),
            purchaseOrderBecraId CHAR(36),
            projectId CHAR(36),
            partSupplierNumber VARCHAR(255),
            partDescription VARCHAR(255),
            warehousePlaceId CHAR(36),
            information TEXT,
            coordinate BOOLEAN NOT NULL,
            inventoryId CHAR(36) NOT NULL,
            forInventory BOOLEAN NOT NULL,
            forProject BOOLEAN NOT NULL,
            active BOOLEAN NOT NULL,
            materialActive BOOLEAN NOT NULL,
            valid BOOLEAN NOT NULL,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (inventoryId) REFERENCES Inventory (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS InventoryOrder (
            id CHAR(36) NOT NULL PRIMARY KEY,
            inventoryId CHAR(36) NOT NULL,
            orderNumber VARCHAR(255) NOT NULL,
            orderDate DATETIME NOT NULL,
            shortDescription VARCHAR(255) NOT NULL,
            longDescription TEXT,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (inventoryId) REFERENCES Inventory (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS MaterialCode (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            createdBy CHAR(36) NOT NULL,
            createdAt DATETIME NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DocumentPlace (
            id CHAR(36) NOT NULL PRIMARY KEY,
            placeA VARCHAR(255),
            placeB VARCHAR(255),
            placeC VARCHAR(255),
            placeD VARCHAR(255),
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DocumentGroup (
            id CHAR(36) NOT NULL PRIMARY KEY,
            groupA VARCHAR(255),
            groupB VARCHAR(255),
            groupC VARCHAR(255),
            groupD VARCHAR(255),
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS MaterialFamily (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            shortDescription TEXT,
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
      IF NOT EXISTS MaterialDimension (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            createdAt DATETIME,
            createdBy CHAR(36),
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS MaterialSpec (
            id CHAR(36) NOT NULL PRIMARY KEY,
            materialFamilyId CHAR(36),
            name VARCHAR(255),
            materialDimensionId CHAR(36),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            createdAt DATETIME,
            createdBy CHAR(36),
            FOREIGN KEY (materialFamilyId) REFERENCES MaterialFamily (id) ON DELETE RESTRICT,
            FOREIGN KEY (materialDimensionId) REFERENCES MaterialDimension (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS MaterialPrice (
            id CHAR(36) NOT NULL PRIMARY KEY,
            beNumber VARCHAR(255),
            orderNr VARCHAR(255),
            quoteBecra CHAR(36),
            supplierOrderNr VARCHAR(255),
            brandOrderNr VARCHAR(255),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            brandName VARCHAR(255),
            updatedAt DATETIME,
            rejected BOOLEAN,
            additionalInfo VARCHAR(255),
            unitPrice Decimal(10,2),
            quantityPrice INT,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            companyId CHAR(36) NOT NULL,
            FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS MaterialSerialTrack (
            id CHAR(36) NOT NULL PRIMARY KEY,
            beNumber VARCHAR(255),
            brandName VARCHAR(255),
            management VARCHAR(255),
            brandOrderNumber VARCHAR(255),
            companyId CHAR(36),
            orderNumber VARCHAR(255),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            transactionType VARCHAR(255),
            materialGroupId CHAR(36),
            fromLocation VARCHAR(255),
            toLocation VARCHAR(255),
            updatedAt DATETIME,
            preferredSupplier VARCHAR(255),
            rejected BOOLEAN DEFAULT FALSE,
            additionalInfo VARCHAR(255),
            projectId CHAR(36),
            becraCode VARCHAR(255),
            createdBy CHAR(36),
            FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT,
            FOREIGN KEY (materialGroupId) REFERENCES MaterialGroup (id) ON DELETE RESTRICT,
            FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS WarehousePlace (
            id CHAR(36) NOT NULL PRIMARY KEY,
            abbreviation VARCHAR(255) NOT NULL,
            beNumber VARCHAR(255),
            serialTrackedId CHAR(36),
            place VARCHAR(255),
            shelf VARCHAR(255),
            `column` VARCHAR(255),
            layer VARCHAR(255),
            layerPlace VARCHAR(255),
            information VARCHAR(255),
            quantityInStock INT NOT NULL,
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (serialTrackedId) REFERENCES MaterialSerialTrack (id) ON DELETE SET NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

ALTER TABLE Inventory ADD CONSTRAINT uq_inventory_beNumber UNIQUE (beNumber);

CREATE TABLE
      IF NOT EXISTS MaterialStructure (
            id CHAR(36) NOT NULL PRIMARY KEY,
            materialId CHAR(36) NOT NULL,
            beNumber VARCHAR(255) NOT NULL,
            shortDescription VARCHAR(255),
            longDescription TEXT,
            management VARCHAR(255),
            date DATETIME,
            expiredDate DATETIME,
            docRevision INT,
            valid BOOLEAN DEFAULT TRUE,
            additionalInfo VARCHAR(255),
            referenceDocId CHAR(36),
            createdBy CHAR(36),
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (beNumber) REFERENCES Material (beNumber) ON DELETE RESTRICT,
            FOREIGN KEY (referenceDocId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS MaterialPerformance (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            materialSpecId CHAR(36),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            materialFamilyId CHAR(36),
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36),
            FOREIGN KEY (materialSpecId) REFERENCES MaterialSpec (id) ON DELETE RESTRICT,
            FOREIGN KEY (materialFamilyId) REFERENCES MaterialFamily (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS MaterialOther (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255),
            materialId CHAR(36),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS MaterialAssembly (
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
      IF NOT EXISTS MaterialSerialTrackedStructure (
            id CHAR(36) NOT NULL PRIMARY KEY,
            serialTrackedId CHAR(36) NOT NULL,
            certificateId CHAR(36),
            materialSpecId CHAR(36),
            referenceDocId CHAR(36),
            materialGroupId CHAR(36),
            documentId CHAR(36),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            management VARCHAR(255),
            date DATETIME,
            expiredDate DATETIME,
            documentationPlace VARCHAR(255),
            docRevision INT,
            valid BOOLEAN,
            additionalInfo VARCHAR(255),
            beNumber VARCHAR(255),
            beParentPart VARCHAR(255),
            serialCode VARCHAR(255),
            tag VARCHAR(255),
            preferredSupplier VARCHAR(255),
            brandName VARCHAR(255),
            brandOrderNr VARCHAR(255),
            unit VARCHAR(255),
            unitQuantity VARCHAR(255),
            unitPieces INT,
            unitWeightKg INT,
            quantityRequired INT,
            quantityReserved INT,
            quantityIssued INT,
            rejected BOOLEAN DEFAULT FALSE,
            updatedAt DATETIME,
            createdBy CHAR(36),
            FOREIGN KEY (serialTrackedId) REFERENCES MaterialSerialTrack (id) ON DELETE RESTRICT,
            FOREIGN KEY (certificateId) REFERENCES Certificate (id) ON DELETE RESTRICT,
            FOREIGN KEY (materialSpecId) REFERENCES MaterialSpec (id) ON DELETE RESTRICT,
            FOREIGN KEY (referenceDocId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
            FOREIGN KEY (materialGroupId) REFERENCES MaterialGroup (id) ON DELETE RESTRICT,
            FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

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
      IF NOT EXISTS MaterialMovement (
            id CHAR(36) NOT NULL PRIMARY KEY,
            beNumberId VARCHAR(255) NOT NULL,
            shortDescription VARCHAR(255),
            longDescription TEXT,
            serieId CHAR(36),
            transactionType VARCHAR(255),
            brandName VARCHAR(255),
            brandNameNr VARCHAR(255),
            toLocation VARCHAR(255),
            fromLocation VARCHAR(255),
            updatedAt DATETIME,
            rejected BOOLEAN DEFAULT FALSE,
            additionalInfo VARCHAR(255),
            createdBy CHAR(36),
            FOREIGN KEY (beNumberId) REFERENCES Material (beNumber) ON DELETE RESTRICT,
            FOREIGN KEY (serieId) REFERENCES MaterialSerialTrack (id) ON DELETE RESTRICT,
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
