DROP DATABASE IF EXISTS app_db;

CREATE DATABASE IF NOT EXISTS app_db;

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
            additionalInfo TEXT,
            referenceDocId CHAR(36),
            roleId CHAR(36),
            FOREIGN KEY (referenceDocId) REFERENCES DocumentStructure (id) ON DELETE SET NULL,
            FOREIGN KEY (roleId) REFERENCES Role (id) ON DELETE SET NULL,
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
            roleLevelId CHAR(36),
            titleId CHAR(36),
            pictureId CHAR(36),
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (roleLevelId) REFERENCES RoleLevel (id) ON DELETE RESTRICT,
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
            physicalQuantity INT NOT NULL,
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
            brandOrderNr INT NOT NULL,
            shortDescription VARCHAR(255) NOT NULL,
            longDescription TEXT,
            preferredSupplier VARCHAR(255),
            brandName VARCHAR(255),
            documentationPlace VARCHAR(255),
            bePartDoc INT,
            rejected BOOLEAN DEFAULT FALSE,
            materialGroupId CHAR(36) NOT NULL,
            unitId CHAR(36) NOT NULL,
            createdBy CHAR(36) NOT NULL,
            CONSTRAINT uq_material_beNumber UNIQUE (beNumber),
            FOREIGN KEY (materialGroupId) REFERENCES MaterialGroup (id) ON DELETE RESTRICT,
            FOREIGN KEY (unitId) REFERENCES Unit (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
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

ALTER TABLE DocumentStructure ADD revisedById CHAR(36) NOT NULL,
ADD CONSTRAINT fk_documentStructure_revisedBy FOREIGN KEY (revisedById) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE DocumentStructure ADD managedById CHAR(36) NOT NULL,
ADD CONSTRAINT fk_documentStructure_managedBy FOREIGN KEY (managedById) REFERENCES Employee (id) ON DELETE RESTRICT;

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
ADD CONSTRAINT fk_documentStructure_deletedBy FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE RESTRICT;


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
            name VARCHAR(100) NOT NULL,
            number VARCHAR(100) NOT NULL,
            mail VARCHAR(100),
            businessPhone VARCHAR(100),
            website VARCHAR(100),
            vatNumber VARCHAR(100),
            bankNumber VARCHAR(100),
            iban VARCHAR(100),
            bic VARCHAR(100),
            becraCustomerNumber VARCHAR(100),
            becraWebsiteLogin VARCHAR(100),
            supplier BOOLEAN NOT NULL DEFAULT 0,
            prefferedSupplier BOOLEAN NOT NULL DEFAULT 0,
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
            trough VARCHAR(100),
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
      IF NOT EXISTS CompanyAdress (
            id CHAR(36) NOT NULL PRIMARY KEY,
            street VARCHAR(100),
            houseNumber VARCHAR(100),
            busNumber VARCHAR(100),
            zipCode VARCHAR(100),
            place VARCHAR(100),
            createdAt DATETIME NOT NULL,
            typeAdress VARCHAR(100),
            createdBy CHAR(36) NOT NULL,
            companyId CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE CASCADE,
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
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (contactId) REFERENCES Contact (id) ON DELETE RESTRICT,
            FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
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
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
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
            workOrderNumber VARCHAR(100),
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
            createdBy CHAR(36) NOT NULL,
            workOrderId CHAR(36) NOT NULL,
            hourTypeId CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (hourTypeId) REFERENCES HourType (id) ON DELETE RESTRICT,
            FOREIGN KEY (workOrderId) REFERENCES WorkOrder (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
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
            moddifiedAt DATETIME,
            idValid BOOLEAN NOT NULL DEFAULT 1,
            createdBy CHAR(36) NOT NULL,
            moddifiedBy CHAR(36) NOT NULL,
            projectId CHAR(36) NOT NULL,
            contactId CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE RESTRICT,
            FOREIGN KEY (moddifiedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
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
            clientNumber VARCHAR(100),
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
            clientNumber VARCHAR(100),
            tag VARCHAR(100),
            quantity INT,
            additionalInfo TEXT,
            shortDescription VARCHAR(100),
            longDescription TEXT,
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
            workOrderId CHAR(36) NOT NULL,
            materialId CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            FOREIGN KEY (workOrderId) REFERENCES WorkOrder (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (materialId) REFERENCES Material (id) ON DELETE RESTRICT,
            FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS InvoiceOut (
            id CHAR(36) NOT NULL PRIMARY KEY,
            invoiceNumber VARCHAR(100),
            invoiceDate DATETIME NOT NULL,
            expireDate DATETIME NOT NULL,
            payDate DATETIME,
            invoiceReference VARCHAR(100),
            invoiceInAttachement VARCHAR(100),
            deliveryNote TEXT,
            purchaseOrder TEXT,
            transactionNumber VARCHAR(100),
            deliveryInvoiceInfo TEXT,
            additionalInfo TEXT,
            info TEXT,
            deliveryInvoiceCode VARCHAR(100),
            vatMargin FLOAT NOT NULL,
            amountWithoutVat FLOAT NOT NULL,
            sentDate DATETIME,
            createdAt DATETIME NOT NULL,
            materialCost BOOLEAN NOT NULL DEFAULT 0,
            completed BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            invoiceTypeId CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            FOREIGN KEY (invoiceTypeId) REFERENCES InvoiceType (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            UNIQUE (invoiceNumber)
      ) ENGINE = InnoDB;

CREATE TABLE
      IF NOT EXISTS InvoiceIn (
            id CHAR(36) NOT NULL PRIMARY KEY,
            invoiceNumber VARCHAR(100),
            invoiceDate DATETIME NOT NULL,
            expireDate DATETIME NOT NULL,
            payDate DATETIME,
            invoiceReference VARCHAR(100),
            invoiceOutAttachement VARCHAR(100),
            deliveryNote TEXT,
            purchaseOrder TEXT,
            transactionNumber VARCHAR(100),
            info TEXT,
            deliveryInvoiceCode VARCHAR(100),
            vatMargin FLOAT NOT NULL,
            amountWithoutVat FLOAT NOT NULL,
            deliveryBonDate DATETIME,
            deliveryBon VARCHAR(100),
            remark TEXT,
            createdAt DATETIME NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0,
            masterCard BOOLEAN NOT NULL DEFAULT 0,
            cash BOOLEAN NOT NULL DEFAULT 0,
            bankContact BOOLEAN NOT NULL DEFAULT 0,
            expectedInvoice BOOLEAN NOT NULL DEFAULT 0,
            private BOOLEAN NOT NULL DEFAULT 0,
            createdBy CHAR(36) NOT NULL,
            invoiceTypeId CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            FOREIGN KEY (invoiceTypeId) REFERENCES InvoiceType (id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (targetId) REFERENCES Target (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL,
            UNIQUE (invoiceNumber)
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
            FOREIGN KEY (invoiceOutId) REFERENCES InvoiceOut (id) ON DELETE RESTRICT,
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
            documentId CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            followUpTypeId CHAR(36) NOT NULL,
            FOREIGN KEY (urgencyTypeId) REFERENCES UrgencyType (id) ON DELETE RESTRICT,
            FOREIGN KEY (ownedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (statusId) REFERENCES Status (id) ON DELETE RESTRICT,
            FOREIGN KEY (executedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
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
            documentId CHAR(36) NOT NULL,
            contactId CHAR(36) NOT NULL,
            taskFor CHAR(36) NOT NULL,
            targetId CHAR(36) NOT NULL,
            FOREIGN KEY (urgencyTypeId) REFERENCES UrgencyType (id) ON DELETE RESTRICT,
            FOREIGN KEY (ownedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (statusId) REFERENCES Status (id) ON DELETE RESTRICT,
            FOREIGN KEY (executedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            FOREIGN KEY (followUpId) REFERENCES FollowUp (id) ON DELETE RESTRICT,
            FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
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
            serieNumber VARCHAR(255) NOT NULL,
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
      IF NOT EXISTS WarehousePlace (
            id CHAR(36) NOT NULL PRIMARY KEY,
            place VARCHAR(255),
            shelf VARCHAR(255),
            `column` VARCHAR(255),
            layer VARCHAR(255),
            layerPlace VARCHAR(255),
            information VARCHAR(255),
            volume INT NOT NULL,
            createdAt DATETIME NOT NULL,
            createdBy CHAR(36) NOT NULL,
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
            supllierOrderNr VARCHAR(255),
            brandOrderNr VARCHAR(255),
            shortDescription VARCHAR(255),
            longDescription TEXT,
            brandName VARCHAR(255),
            updatedAt DATETIME,
            rejected BOOLEAN,
            additionalInfo VARCHAR(255),
            unitPrice INT,
            quantityPrice INT,
            createdBy CHAR(36) NOT NULL,
            FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
            deleted BOOLEAN NOT NULL DEFAULT 0,
            deletedAt DATETIME,
            deletedBy CHAR(36),
            FOREIGN KEY (deletedBy) REFERENCES Employee (id) ON DELETE SET NULL
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
            preferedSupplier VARCHAR(255),
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
            preferedSupplier VARCHAR(255),
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
      IF NOT EXISTS QouteBecra (
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
            preferedSupplier VARCHAR(255),
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
            unitPrice INT,
            quantity INT,
            totalCost INT,
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

-- Select below then right click and run selected query
SHOW TABLE STATUS