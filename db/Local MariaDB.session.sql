DROP DATABASE IF EXISTS app_db;
CREATE DATABASE app_db;
USE app_db;
CREATE TABLE
      IF NOT EXISTS Role (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Function (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Title (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME
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

 CREATE TABLE
      IF NOT EXISTS SubRole (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            level INT NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME
      ) ENGINE = InnoDB;     

CREATE TABLE
      IF NOT EXISTS RoleLevel(
            id CHAR(36) NOT NULL PRIMARY KEY,
            roleId CHAR(36) NOT NULL,
            subRoleId CHAR(36) NOT NULL,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            FOREIGN KEY (roleId) REFERENCES Role (id) ON DELETE RESTRICT,
            FOREIGN KEY (subRoleId) REFERENCES SubRole (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;    

CREATE TABLE
      IF NOT EXISTS Employee (
            id CHAR(36) NOT NULL PRIMARY KEY,
            firstName VARCHAR(100) NOT NULL,
            lastName VARCHAR(100) NOT NULL,
            mail VARCHAR(100),
            password_hash VARCHAR(255) NOT NULL,
            phoneNumber VARCHAR(100),
            startDate DATETIME NOT NULL,
            endDate DATETIME,
            info TEXT,
            birthDate DATETIME,
            street VARCHAR(100),
            houseNumber VARCHAR(100),
            busNumber VARCHAR(100),
            zipCode VARCHAR(100),
            place VARCHAR(100),
            username VARCHAR(100) NOT NULL,
            createdAt DATETIME NOT NULL,
            permanentEmployee BOOLEAN NOT NULL DEFAULT 0,
            checkInfo BOOLEAN NOT NULL DEFAULT 0,
            newYearCard BOOLEAN NOT NULL DEFAULT 0,
            active BOOLEAN NOT NULL DEFAULT 1,
            passwordCreatedAt DATETIME NOT NULL,
            createdBy CHAR(36),
            titleId CHAR(36),
            pictureId CHAR(36),
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (titleId) REFERENCES Title (id) ON DELETE RESTRICT,
            FOREIGN KEY (pictureId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Department (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            color VARCHAR(10),
            icon VARCHAR(255),
            description VARCHAR(255),
            number INT,
            createdAt DATETIME NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            createdBy CHAR(36) NOT NULL,
            deletedBy CHAR(36) NULL,
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS DepartmentExtern (
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
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Material (
            id CHAR(36) NOT NULL PRIMARY KEY,
            beNumber VARCHAR(255),
            name VARCHAR(255),
            brandOrderNr VARCHAR(255),
            shortDescription VARCHAR(255) NOT NULL,
            longDescription TEXT,
            preferredSupplier VARCHAR(255),
            brandName VARCHAR(255),
            warehousePlaceId CHAR(36),
            rejected BOOLEAN DEFAULT FALSE,
            isSerialTracked BOOLEAN NOT NULL DEFAULT 0,
            materialGroupIdA CHAR(36) NULL,
            materialGroupIdB CHAR(36) NULL,
            materialGroupIdC CHAR(36) NULL,
            materialGroupIdD CHAR(36) NULL,
            preferredSupplierCompanyId CHAR(36) NULL,
            unitId CHAR(36) NOT NULL,
            longLeadTime BOOLEAN,
            hasAtex BOOLEAN NOT NULL DEFAULT 0,
            hasCE BOOLEAN NOT NULL DEFAULT 0,
            hasROHS BOOLEAN NOT NULL DEFAULT 0,
            hasDS BOOLEAN NOT NULL DEFAULT 0,
            hasDoc BOOLEAN NOT NULL DEFAULT 0,
            has3DCAD BOOLEAN NOT NULL DEFAULT 0,
            has2DCAD BOOLEAN NOT NULL DEFAULT 0,
            hasBDOC BOOLEAN NOT NULL DEFAULT 0,
            hasINSP BOOLEAN NOT NULL DEFAULT 0,
            partApproved BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            CONSTRAINT uq_material_beNumber UNIQUE (beNumber),
            FOREIGN KEY (materialGroupIdA) REFERENCES MaterialGroup (id) ON DELETE SET NULL,
            FOREIGN KEY (materialGroupIdB) REFERENCES MaterialGroup (id) ON DELETE SET NULL,
            FOREIGN KEY (materialGroupIdC) REFERENCES MaterialGroup (id) ON DELETE SET NULL,
            FOREIGN KEY (materialGroupIdD) REFERENCES MaterialGroup (id) ON DELETE SET NULL,
            FOREIGN KEY (warehousePlaceId) REFERENCES WarehousePlace (id) ON DELETE SET NULL,
            FOREIGN KEY (unitId) REFERENCES Unit (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS MaterialLeadTime (
            id CHAR(36) NOT NULL PRIMARY KEY,
            materialId CHAR(36) NOT NULL,
            leadTimeValue INT NOT NULL,
            leadTimeUnit VARCHAR(10) NOT NULL,
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE CASCADE,
            UNIQUE (materialId)
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS Session (
            id CHAR(36) NOT NULL PRIMARY KEY,
            activeFrom DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            activeUntil DATETIME NOT NULL,
            employeeId CHAR(36) NOT NULL,
            FOREIGN KEY (employeeId) REFERENCES Employee (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS TargetType (
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
      IF NOT EXISTS Target (
            id CHAR(36) NOT NULL PRIMARY KEY,
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            targetTypeId CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (targetTypeId) REFERENCES TargetType (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

ALTER TABLE Role ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_role_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE SubRole ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_subRole_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE RoleLevel ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_roleLevel_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE Function ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_function_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE Title ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_title_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE DocumentStructure ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_documentStructure_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE DocumentStructure ADD revisedById CHAR(36) NULL,
ADD CONSTRAINT fk_documentStructure_revisedBy FOREIGN KEY (revisedById) REFERENCES Employee (id) ON DELETE SET NULL;

ALTER TABLE DocumentStructure ADD managedById CHAR(36) NULL,
ADD CONSTRAINT fk_documentStructure_managedBy FOREIGN KEY (managedById) REFERENCES Employee (id) ON DELETE SET NULL;

ALTER TABLE DocumentStructure ADD targetId CHAR(36) NOT NULL,
ADD CONSTRAINT fk_documentStructure_target FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT;

ALTER TABLE Department ADD targetId CHAR(36) NOT NULL,
ADD CONSTRAINT fk_department_target FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT;

ALTER TABLE DepartmentExtern ADD targetId CHAR(36) NOT NULL,
ADD CONSTRAINT fk_departmentextern_target FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT;

ALTER TABLE Role ADD deletedBy CHAR(36) NULL,
ADD CONSTRAINT fk_role_deletedBy FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE SubRole ADD deletedBy CHAR(36) NULL,
ADD CONSTRAINT fk_subRole_deletedBy FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE RoleLevel ADD deletedBy CHAR(36) NULL,
ADD CONSTRAINT fk_roleLevel_deletedBy FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE Function ADD deletedBy CHAR(36) NULL,
ADD CONSTRAINT fk_function_deletedBy FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE Title ADD deletedBy CHAR(36) NULL,
ADD CONSTRAINT fk_title_deletedBy FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE DocumentStructure ADD deletedBy CHAR(36) NULL,
ADD CONSTRAINT fk_documentStructure_deletedBy FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL;

ALTER TABLE Material ADD targetId CHAR(36) NOT NULL,
ADD CONSTRAINT fk_material_target FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT;


CREATE TABLE
    IF NOT EXISTS EmergencyContact (
                                       id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    mail VARCHAR(100) NOT NULL,
    phoneNumber VARCHAR(100) NOT NULL,
    employeeId CHAR(36) NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS Company (
                              id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    officialName VARCHAR(255) NOT NULL,
    number VARCHAR(255) NOT NULL,
    idOld VARCHAR(255),
    mail VARCHAR(255),
    businessPhone VARCHAR(255),
    website VARCHAR(255),
    vatNumber VARCHAR(100),
    bankNumber VARCHAR(100),
    iban VARCHAR(100),
    bic VARCHAR(100),
    becraCustomerNumber VARCHAR(100),
    becraWebsiteLogin VARCHAR(100),
    supplier BOOLEAN NOT NULL DEFAULT 0,
    preferredSupplier BOOLEAN NOT NULL DEFAULT 0,
    companyActive BOOLEAN NOT NULL DEFAULT 1,
    newsLetter BOOLEAN NOT NULL DEFAULT 0,
    customer BOOLEAN NOT NULL DEFAULT 0,
    potentialCustomer BOOLEAN NOT NULL DEFAULT 0,
    headQuarters BOOLEAN NOT NULL DEFAULT 0,
    potentialSubContractor BOOLEAN NOT NULL DEFAULT 0,
    subContractor BOOLEAN NOT NULL DEFAULT 0,
    notes TEXT,
    createdAt DATETIME NOT NULL,
    createdBy CHAR(36) NOT NULL,
    companyId CHAR(36) NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE SET NULL,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

ALTER TABLE Material ADD CONSTRAINT fk_material_preferredSupplierCompanyId FOREIGN KEY (preferredSupplierCompanyId) REFERENCES Company (id) ON DELETE SET NULL;

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

CREATE TABLE
    IF NOT EXISTS CompanyAddress (
                                     id CHAR(36) NOT NULL PRIMARY KEY,
    street VARCHAR(100),
    houseNumber VARCHAR(100),
    busNumber VARCHAR(100),
    zipCode VARCHAR(100),
    place VARCHAR(100),
    createdAt DATETIME NOT NULL,
    typeAddress VARCHAR(100),
    createdBy CHAR(36) NOT NULL,
    companyId CHAR(36) NOT NULL,
    countryId CHAR(36) NULL,
    FOREIGN KEY (countryId) REFERENCES Country (id) ON DELETE SET NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE CASCADE,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS Contact (
                              id CHAR(36) NOT NULL PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    mail1 VARCHAR(100),
    mail2 VARCHAR(100),
    mail3 VARCHAR(100),
    generalPhone VARCHAR(100),
    homePhone VARCHAR(100),
    mobilePhone VARCHAR(100),
    info TEXT,
    birthDate DATETIME,
    through VARCHAR(100),
    description TEXT,
    createdAt DATETIME NOT NULL,
    infoCorrect BOOLEAN NOT NULL DEFAULT 0,
    checkInfo BOOLEAN NOT NULL DEFAULT 0,
    newYearCard BOOLEAN NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT 1,
    newsLetter BOOLEAN NOT NULL DEFAULT 0,
    mailing BOOLEAN NOT NULL DEFAULT 0,
    trainingAdvice BOOLEAN NOT NULL DEFAULT 0,
    contactForTrainingAndAdvice BOOLEAN NOT NULL DEFAULT 0,
    customerTrainingAndAdvice BOOLEAN NOT NULL DEFAULT 0,
    potentialCustomerTrainingAndAdvice BOOLEAN NOT NULL DEFAULT 0,
    potentialTeacherTrainingAndAdvice BOOLEAN NOT NULL DEFAULT 0,
    teacherTrainingAndAdvice BOOLEAN NOT NULL DEFAULT 0,
    participantTrainingAndAdvice BOOLEAN NOT NULL DEFAULT 0,
    createdBy CHAR(36) NOT NULL,
    functionId CHAR(36) NULL,
    departmentExternId CHAR(36) NULL,
    titleId CHAR(36) NULL,
    businessCardId CHAR(36) NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (functionId) REFERENCES Function (id) ON DELETE SET NULL,
    FOREIGN KEY (departmentExternId) REFERENCES DepartmentExtern (id) ON DELETE SET NULL,
    FOREIGN KEY (titleId) REFERENCES Title (id) ON DELETE SET NULL,
    FOREIGN KEY (businessCardId) REFERENCES DocumentStructure (id) ON DELETE SET NULL,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS CompanyContact (
                                     id CHAR(36) NOT NULL PRIMARY KEY,
    startedDate DATETIME NOT NULL,
    endDate DATETIME,
    roleWithCompany VARCHAR(100),
    createdAt DATETIME NOT NULL,
    contactId CHAR(36) NOT NULL,
    companyId CHAR(36) NOT NULL,
    createdBy CHAR(36) NOT NULL,
    companyAddressId CHAR(36),
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (contactId) REFERENCES Contact (id) ON DELETE RESTRICT,
    FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
    FOREIGN KEY (companyAddressId) REFERENCES CompanyAddress (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

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
    IF NOT EXISTS ProjectType (
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
    IF NOT EXISTS CertificateType (
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
    IF NOT EXISTS UrgencyType (
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
    IF NOT EXISTS Status (
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
    IF NOT EXISTS FollowUpType (
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
    IF NOT EXISTS InvoiceType (
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
    IF NOT EXISTS HourType (
                               id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    createdAt DATETIME NOT NULL,
    info TEXT,
    createdBy CHAR(36) NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS Project (
                              id CHAR(36) NOT NULL PRIMARY KEY,
    projectNumber VARCHAR(255) NOT NULL,
    projectName VARCHAR(255) NOT NULL,
    description TEXT,
    extraInfo TEXT,
    startDate DATETIME,
    endDate DATETIME,
    closingDate DATETIME,
    engineeringStartDate DATETIME,
    createdAt DATETIME NOT NULL,
    isMainProject BOOLEAN NOT NULL DEFAULT 1,
    isIntern BOOLEAN NOT NULL DEFAULT 0,
    isOpen BOOLEAN NOT NULL DEFAULT 1,
    isClosed BOOLEAN NOT NULL DEFAULT 0,
    createdBy CHAR(36) NOT NULL,
    companyId CHAR(36) NOT NULL,
    projectTypeId CHAR(36) NOT NULL,
    parentProjectId CHAR(36) NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT,
    FOREIGN KEY (projectTypeId) REFERENCES ProjectType (id) ON DELETE RESTRICT,
    FOREIGN KEY (parentProjectId) REFERENCES Project (id) ON DELETE SET NULL,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
    UNIQUE (projectNumber)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS Certificate (
                                  id CHAR(36) NOT NULL PRIMARY KEY,
    description TEXT,
    descriptionShort TEXT,
    createdAt DATETIME NOT NULL,
    createdBy CHAR(36) NOT NULL,
    certificateTypeId CHAR(36) NOT NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (certificateTypeId) REFERENCES CertificateType (id) ON DELETE RESTRICT,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS TrainingStandard (
                                       id CHAR(36) NOT NULL PRIMARY KEY,
    description TEXT,
    descriptionShort TEXT,
    location VARCHAR(100),
    createdAt DATETIME NOT NULL,
    certificate BOOLEAN NOT NULL DEFAULT 1,
    `repeat` BOOLEAN NOT NULL DEFAULT 0,
    createdBy CHAR(36) NOT NULL,
    certificateId CHAR(36) NOT NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (certificateId) REFERENCES Certificate (id) ON DELETE RESTRICT,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS TrainingDocument (
                                       id CHAR(36) NOT NULL PRIMARY KEY,
    documentId CHAR(36) NOT NULL,
    trainingStandardId CHAR(36) NOT NULL,
    FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
    FOREIGN KEY (trainingStandardId) REFERENCES TrainingStandard (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS WorkOrder (
                                id CHAR(36) NOT NULL PRIMARY KEY,
    workOrderNumber VARCHAR(255) NOT NULL,
    description TEXT,
    additionalInfo TEXT,
    startDate DATETIME NOT NULL,
    endDate DATETIME,
    createdAt DATETIME NOT NULL,
    hoursMaterialClosed BOOLEAN NOT NULL DEFAULT 0,
    invoiceSent BOOLEAN NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT 0,
    createdBy CHAR(36) NOT NULL,
    projectId CHAR(36) NOT NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
    UNIQUE (workOrderNumber)
    ) ENGINE = InnoDB;

CREATE TABLE 
    IF NOT EXISTS VatMargin (
        id CHAR(36) NOT NULL PRIMARY KEY,
        vat FLOAT NOT NULL,
        countryId CHAR(36) NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        deletedAt DATETIME NULL,
        deletedBy CHAR(36) NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON UPDATE RESTRICT,
        FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON UPDATE RESTRICT,
        FOREIGN KEY (countryId) REFERENCES Country (id) ON UPDATE RESTRICT ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS TimeRegistry (
                                   id CHAR(36) NOT NULL PRIMARY KEY,
    activityDescription TEXT,
    additionalInfo TEXT,
    invoiceInfo TEXT,
    startTime DATETIME NOT NULL,
    endTime DATETIME,
    workDate DATETIME NOT NULL,
    startBreak DATETIME,
    endBreak DATETIME,
    createdAt DATETIME NOT NULL,
    invoiceTime BOOLEAN NOT NULL DEFAULT 0,
    onSite BOOLEAN NOT NULL DEFAULT 0,
    stayOver BOOLEAN NOT NULL DEFAULT 0,
    createdBy CHAR(36) NOT NULL,
    workOrderId CHAR(36) NOT NULL,
    vatMarginId CHAR(36) NULL,
    hourTypeId CHAR(36) NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (hourTypeId) REFERENCES HourType (id) ON DELETE RESTRICT,
    FOREIGN KEY (workOrderId) REFERENCES WorkOrder (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
    FOREIGN KEY (vatMarginId) REFERENCES VatMargin (id) ON UPDATE RESTRICT ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS TimeRegistryEmployee (
                                           id CHAR(36) NOT NULL PRIMARY KEY,
    employeeId CHAR(36) NOT NULL,
    timeRegistryId CHAR(36) NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (timeRegistryId) REFERENCES TimeRegistry (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS ProjectContact (
                                     id CHAR(36) NOT NULL PRIMARY KEY,
    description TEXT,
    extraInfo TEXT,
    createdAt DATETIME NOT NULL,
    modifiedAt DATETIME,
    isValid BOOLEAN NOT NULL DEFAULT 1,
    createdBy CHAR(36) NOT NULL,
    modifiedBy CHAR(36) NOT NULL,
    projectId CHAR(36) NOT NULL,
    contactId CHAR(36) NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT,
    FOREIGN KEY (modifiedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (contactId) REFERENCES Contact (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS Training (
                               id CHAR(36) NOT NULL PRIMARY KEY,
    trainingNumber VARCHAR(100),
    trainingDate DATETIME NOT NULL,
    createdAt DATETIME NOT NULL,
    closed BOOLEAN NOT NULL DEFAULT 1,
    createdBy CHAR(36) NOT NULL,
    workOrderId CHAR(36) NOT NULL,
    trainingStandardId CHAR(36) NOT NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (workOrderId) REFERENCES WorkOrder (id) ON DELETE RESTRICT,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (trainingStandardId) REFERENCES TrainingStandard (id) ON DELETE RESTRICT,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
    UNIQUE (trainingNumber)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS TrainingContact (
                                      id CHAR(36) NOT NULL PRIMARY KEY,
    attendeeNumber VARCHAR(100),
    certSentDate DATETIME,
    createdAt DATETIME NOT NULL,
    succeeded BOOLEAN NOT NULL DEFAULT 0,
    attended BOOLEAN NOT NULL DEFAULT 0,
    certificateSent BOOLEAN NOT NULL DEFAULT 0,
    createdBy CHAR(36) NOT NULL,
    contactId CHAR(36) NOT NULL,
    trainingId CHAR(36) NOT NULL,
    FOREIGN KEY (contactId) REFERENCES Contact (id) ON DELETE RESTRICT,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (trainingId) REFERENCES Training (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE 
    IF NOT EXISTS WorkOrderStructure (
        id CHAR(36) NOT NULL PRIMARY KEY,
        clientNumber VARCHAR(100) NULL,
        tag VARCHAR(100) NULL,
        quantity INT NULL,
        additionalInfo TEXT NULL,
        shortDescription VARCHAR(100) NULL,
        longDescription TEXT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        workOrderId CHAR(36) NOT NULL,
        materialId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        vatMarginId CHAR(36) NULL,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        deletedAt DATETIME NULL,
        deletedBy CHAR(36) NULL,
        FOREIGN KEY (workOrderId) REFERENCES WorkOrder (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON UPDATE RESTRICT,
        FOREIGN KEY (materialId) REFERENCES Material (id) ON UPDATE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES Target (id) ON UPDATE RESTRICT,
        FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON UPDATE RESTRICT ON DELETE SET NULL,
        FOREIGN KEY (vatMarginId) REFERENCES VatMargin (id) ON UPDATE RESTRICT ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS InvoiceStatus (
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
    IF NOT EXISTS InvoiceSentType (
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
    IF NOT EXISTS PaymentMethod (
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

CREATE TABLE
    IF NOT EXISTS PriceListItemTarget (
                                          id CHAR(36) NOT NULL PRIMARY KEY,
    priceListItemId CHAR(36) NOT NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (priceListItemId) REFERENCES PriceListItem (id) ON DELETE RESTRICT,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    UNIQUE (priceListItemId)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS InvoiceOut (
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

CREATE TABLE
    IF NOT EXISTS InvoiceIn (
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

CREATE TABLE
    IF NOT EXISTS InvoiceOutContact (
                                        id CHAR(36) NOT NULL PRIMARY KEY,
    contactId CHAR(36) NOT NULL,
    invoiceOutId CHAR(36) NOT NULL,
    FOREIGN KEY (contactId) REFERENCES Contact (id) ON DELETE RESTRICT,
    FOREIGN KEY (invoiceOutId) REFERENCES InvoiceOut (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS PriceListCompany (
                                       id CHAR(36) NOT NULL PRIMARY KEY,
    priceListId CHAR(36) NOT NULL,
    companyId CHAR(36) NOT NULL,
    FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE CASCADE,
    FOREIGN KEY (priceListId) REFERENCES PriceList (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS InvoiceInTarget (
                                      id CHAR(36) NOT NULL PRIMARY KEY,
    invoiceInId CHAR(36) NOT NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (invoiceInId) REFERENCES InvoiceIn (id) ON DELETE RESTRICT,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS WorkOrderInvoice (
                                       id CHAR(36) NOT NULL PRIMARY KEY,
    invoiceOutId CHAR(36) NOT NULL,
    workOrderId CHAR(36) NOT NULL,
    FOREIGN KEY (invoiceOutId) REFERENCES InvoiceOut (id) ON DELETE CASCADE,
    FOREIGN KEY (workOrderId) REFERENCES WorkOrder (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS FollowUp (
                               id CHAR(36) NOT NULL PRIMARY KEY,
    activityDescription TEXT,
    additionalInfo TEXT,
    actionAgenda DATETIME,
    closedAgenda DATETIME,
    recurringCallDays INT,
    createdAt DATETIME NOT NULL,
    itemClosed BOOLEAN NOT NULL DEFAULT 0,
    salesFollowUp BOOLEAN NOT NULL DEFAULT 0,
    nonConform BOOLEAN NOT NULL DEFAULT 0,
    periodicControl BOOLEAN NOT NULL DEFAULT 0,
    recurringActive BOOLEAN NOT NULL DEFAULT 0,
    review BOOLEAN NOT NULL DEFAULT 0,
    createdBy CHAR(36) NOT NULL,
    ownedBy CHAR(36) NOT NULL,
    statusId CHAR(36) NOT NULL,
    executedBy CHAR(36) NOT NULL,
    urgencyTypeId CHAR(36) NOT NULL,
    documentId CHAR(36),
    targetId CHAR(36) NOT NULL,
    followUpTypeId CHAR(36) NOT NULL,
    FOREIGN KEY (urgencyTypeId) REFERENCES UrgencyType (id) ON DELETE RESTRICT,
    FOREIGN KEY (ownedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (statusId) REFERENCES Status (id) ON DELETE RESTRICT,
    FOREIGN KEY (executedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE SET NULL,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (followUpTypeId) REFERENCES FollowUpType (id) ON DELETE RESTRICT,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS FollowUpStructure (
                                        id CHAR(36) NOT NULL PRIMARY KEY,
    activityDescription TEXT,
    additionalInfo TEXT,
    actionAgenda DATETIME,
    closedAgenda DATETIME,
    recurringItem VARCHAR(100),
    item VARCHAR(100),
    contactDate DATETIME NOT NULL,
    taskDescription TEXT,
    taskStartDate DATETIME,
    taskCompleteDate DATETIME,
    createdAt DATETIME NOT NULL,
    recurringActive BOOLEAN NOT NULL DEFAULT 0,
    createdBy CHAR(36) NOT NULL,
    ownedBy CHAR(36) NOT NULL,
    statusId CHAR(36) NOT NULL,
    executedBy CHAR(36) NOT NULL,
    urgencyTypeId CHAR(36) NOT NULL,
    followUpId CHAR(36) NOT NULL,
    documentId CHAR(36),
    contactId CHAR(36) NOT NULL,
    taskFor CHAR(36) NOT NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (urgencyTypeId) REFERENCES UrgencyType (id) ON DELETE RESTRICT,
    FOREIGN KEY (ownedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (statusId) REFERENCES Status (id) ON DELETE RESTRICT,
    FOREIGN KEY (executedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (followUpId) REFERENCES FollowUp (id) ON DELETE RESTRICT,
    FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE SET NULL,
    FOREIGN KEY (contactId) REFERENCES Contact (id) ON DELETE RESTRICT,
    FOREIGN KEY (taskFor) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS VisibilityForRole (
                                        id CHAR(36) NOT NULL PRIMARY KEY,
    visible BOOLEAN NOT NULL DEFAULT 0,
    roleLevelId CHAR(36) NOT NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (roleLevelId) REFERENCES RoleLevel (id) ON DELETE RESTRICT,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS FollowUpTarget (
                                     id CHAR(36) NOT NULL PRIMARY KEY,
    followUpId CHAR(36) NOT NULL,
    targetId CHAR(36) NOT NULL,
    FOREIGN KEY (followUpId) REFERENCES FollowUp (id) ON DELETE RESTRICT,
    FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
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

ALTER TABLE DocumentStructure ADD documentGroupId CHAR(36) NULL,
      ADD CONSTRAINT fk_documentStructure_documentGroup FOREIGN KEY (documentGroupId) REFERENCES DocumentGroup (id) ON DELETE SET NULL;
ALTER TABLE DocumentStructure ADD documentPlaceId CHAR(36) NULL,
      ADD CONSTRAINT fk_documentStructure_documentPlace FOREIGN KEY (documentPlaceId) REFERENCES DocumentPlace (id) ON DELETE SET NUll;
ALTER TABLE DocumentStructure ADD documentStatusId CHAR(36) NULL,
      ADD CONSTRAINT fk_documentStructure_documentStatus FOREIGN KEY (documentStatusId) REFERENCES DocumentStatus (id) ON DELETE SET NUll;

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
    materialId CHAR(36) NULL,
    beNumber VARCHAR(255),
    lastInspectionDate DATE,
    inspectionIntervalValue INT,
    inspectionIntervalUnit ENUM('DAY','WEEK','MONTH','YEAR'),
    nextInspectionDate DATE,
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
    FOREIGN KEY (materialGroupId) REFERENCES MaterialGroup (id) ON DELETE SET NULL,
    FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT,
    FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
    deleted BOOLEAN NOT NULL DEFAULT 0,
    deletedAt DATETIME,
    deletedBy CHAR(36),
    FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

ALTER TABLE WarehousePlace
    ADD CONSTRAINT fk_warehouseplace_serialtrack
        FOREIGN KEY (serialTrackedId) REFERENCES MaterialSerialTrack (id) ON DELETE SET NULL;

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
    warehousePlaceId CHAR(36),
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
    FOREIGN KEY (warehousePlaceId) REFERENCES WarehousePlace (id) ON DELETE RESTRICT,
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
            lineStatus VARCHAR(50) NOT NULL DEFAULT 'OPEN',
            additionalInfo VARCHAR(255),
            notDeliverable BOOLEAN NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            createdBy CHAR(36) NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (purchaseId) REFERENCES Purchase (id) ON DELETE CASCADE,
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
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

CREATE TABLE
    IF NOT EXISTS RoleLevelEmployee (
                                        id CHAR(36) NOT NULL PRIMARY KEY,
    employeeId CHAR(36) NOT NULL,
    roleLevelId CHAR(36) NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES Employee (id) ON DELETE RESTRICT,
    FOREIGN KEY (roleLevelId) REFERENCES RoleLevel (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

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
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            UNIQUE(name)
      ) ENGINE = InnoDB;


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

ALTER TABLE PurchaseBOMStructure ADD CONSTRAINT fk_quoteSupplierLine_purchaseBomStructure FOREIGN KEY (quoteSupplierLineId) REFERENCES QuoteSupplierLine(id) ON DELETE RESTRICT;
ALTER TABLE PurchaseDetail ADD CONSTRAINT fk_quoteSupplierLine_purchaseDetail FOREIGN KEY (quoteSupplierLineId) REFERENCES QuoteSupplierLine(id) ON DELETE SET NULL;
ALTER TABLE Purchase ADD CONSTRAINT fk_quoteSupplier_purchase FOREIGN KEY (quoteSupplierId) REFERENCES QuoteSupplier(id) ON DELETE SET NULL;
ALTER TABLE PurchaseDetail ADD CONSTRAINT fk_materialDemand_purchaseDetail FOREIGN KEY (materialDemandId) REFERENCES MaterialDemand(id) ON DELETE SET NULL;
ALTER TABLE Purchase ADD CONSTRAINT fk_paymentCondition_purchase FOREIGN KEY (paymentConditionId) REFERENCES PaymentCondition (id) ON DELETE RESTRICT;


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
