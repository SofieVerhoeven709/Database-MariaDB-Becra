DROP DATABASE IF EXISTS app_db;

CREATE DATABASE app_db;

USE app_db;

CREATE TABLE
    `Role` (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        level INT NOT NULL,
        createdAt DATETIME NOT NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    `Function` (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    Department (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    Title (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    DocumentStructure (
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
        aditionalInfo TEXT,
        referenceDocId CHAR(36),
        roleId CHAR(36),
        FOREIGN KEY (referenceDocId) REFERENCES DocumentStructure (id) ON DELETE SET NULL,
        FOREIGN KEY (roleId) REFERENCES Role (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    Employee (
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
        roleId CHAR(36),
        functionId CHAR(36),
        departmentId CHAR(36),
        titleId CHAR(36),
        pictureId CHAR(36),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (roleId) REFERENCES `Role` (id) ON DELETE RESTRICT,
        FOREIGN KEY (functionId) REFERENCES `Function` (id) ON DELETE RESTRICT,
        FOREIGN KEY (departmentId) REFERENCES Department (id) ON DELETE RESTRICT,
        FOREIGN KEY (titleId) REFERENCES Title (id) ON DELETE RESTRICT,
        FOREIGN KEY (pictureId) REFERENCES DocumentStructure (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    `Session` (
        id CHAR(36) NOT NULL PRIMARY KEY,
        activeFrom DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        activeUntil DATETIME NOT NULL,
        employeeId CHAR(36) NOT NULL,
        FOREIGN KEY (employeeId) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    TargetType (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    `Target` (
        id CHAR(36) NOT NULL PRIMARY KEY,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        targetTypeId CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetTypeId) REFERENCES TargetType (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

ALTER TABLE Role ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_role_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE `Function` ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_function_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE Title ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_title_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE Department ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_department_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE DocumentStructure ADD createdBy CHAR(36) NOT NULL,
ADD CONSTRAINT fk_documentStructure_createdBy FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE DocumentStructure ADD revisedById CHAR(36) NOT NULL,
ADD CONSTRAINT fk_documentStructure_revisedBy FOREIGN KEY (revisedById) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE DocumentStructure ADD managedById CHAR(36) NOT NULL,
ADD CONSTRAINT fk_documentStructure_managedBy FOREIGN KEY (managedById) REFERENCES Employee (id) ON DELETE RESTRICT;

ALTER TABLE DocumentStructure ADD targetId CHAR(36) NOT NULL,
ADD CONSTRAINT fk_documentStructure_target FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT;

CREATE TABLE
    EmergencyContact (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        relationship VARCHAR(100) NOT NULL,
        mail VARCHAR(100) NOT NULL,
        phoneNumber VARCHAR(100) NOT NULL,
        employeeId CHAR(36) NOT NULL,
        FOREIGN KEY (employeeId) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Company (
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
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Contact (
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
        departmentId CHAR(36) NULL,
        titleId CHAR(36) NULL,
        businessCardId CHAR(36) NULL,
        targetId CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (functionId) REFERENCES `Function` (id) ON DELETE SET NULL,
        FOREIGN KEY (departmentId) REFERENCES Department (id) ON DELETE SET NULL,
        FOREIGN KEY (titleId) REFERENCES Title (id) ON DELETE SET NULL,
        FOREIGN KEY (businessCardId) REFERENCES DocumentStructure (id) ON DELETE SET NULL,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    CompanyAdress (
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
        FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    CompanyContact (
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
        FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    ProjectType (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    CertificateType (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    UrgencyType (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    `Status` (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    FollowUpType (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    InvoiceType (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    HourType (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        info TEXT,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Project (
        id CHAR(36) NOT NULL PRIMARY KEY,
        projectNumber VARCHAR(100) NOT NULL,
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
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    `Certificate` (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `description` TEXT,
        descriptionShort TEXT,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        certificateTypeId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (certificateTypeId) REFERENCES CertificateType (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    TrainingStandard (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `description` TEXT,
        descriptionShort TEXT,
        `location` VARCHAR(100),
        createdAt DATETIME NOT NULL,
        `certificate` BOOLEAN NOT NULL DEFAULT 1,
        `repeat` BOOLEAN NOT NULL DEFAULT 0,
        createdBy CHAR(36) NOT NULL,
        certificateId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (certificateId) REFERENCES `Certificate` (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    TrainingDocument (
        id CHAR(36) NOT NULL PRIMARY KEY,
        documentId CHAR(36) NOT NULL,
        trainingStandardId CHAR(36) NOT NULL,
        FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
        FOREIGN KEY (trainingStandardId) REFERENCES TrainingStandard (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    WorkOrder (
        id CHAR(36) NOT NULL PRIMARY KEY,
        workOrderNumber VARCHAR(100),
        `description` TEXT,
        aditionalInfo TEXT,
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
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    TimeRegistry (
        id CHAR(36) NOT NULL PRIMARY KEY,
        activityDescription TEXT,
        aditionalInfo TEXT,
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
        hourtypeId CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (hourtypeId) REFERENCES HourType (id) ON DELETE RESTRICT,
        FOREIGN KEY (workOrderId) REFERENCES WorkOrder (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    TimeRegistryEmployee (
        id CHAR(36) NOT NULL PRIMARY KEY,
        employeeId CHAR(36) NOT NULL,
        timeRegistryId CHAR(36) NOT NULL,
        FOREIGN KEY (employeeId) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (timeRegistryId) REFERENCES TimeRegistry (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    ProjectContact (
        id CHAR(36) NOT NULL PRIMARY KEY,
        `description` TEXT,
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
        FOREIGN KEY (contactId) REFERENCES Contact (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Training (
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
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    TrainingContact (
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
        FOREIGN KEY (trainingId) REFERENCES Training (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

-- CHECK BELOW ONCE MATERIAL HAS JOINED!!!!!!!!!!!!!
CREATE TABLE
    WorkOrderStructure (
        id CHAR(36) NOT NULL PRIMARY KEY,
        clientNumber VARCHAR(100),
        tag VARCHAR(100),
        quantity INT,
        aditionalInfo TEXT,
        shortDesciption VARCHAR(100),
        longDescription TEXT,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        workOrderId CHAR(36) NOT NULL,
        materialId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        FOREIGN KEY (workOrderId) REFERENCES WorkOrder (id) ON DELETE RESTRICT,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (materialId) REFERENCES Training (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    InvoiceOut (
        id CHAR(36) NOT NULL PRIMARY KEY,
        invoiceNumber VARCHAR(100),
        invoiceDate DATETIME NOT NULL,
        `expireDate` DATETIME NOT NULL,
        payDate DATETIME,
        invoiceReference VARCHAR(100),
        invoiceInAttachement VARCHAR(100),
        deliveryNote TEXT,
        purchaseOrder TEXT,
        transactionNumber VARCHAR(100),
        deliveryInvoiceInfo TEXT,
        aditionalInfo TEXT,
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
        workOrderId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        FOREIGN KEY (invoiceTypeId) REFERENCES InvoiceType (id) ON DELETE RESTRICT,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (workOrderId) REFERENCES WorkOrder (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    InvoiceIn (
        id CHAR(36) NOT NULL PRIMARY KEY,
        invoiceNumber VARCHAR(100),
        invoiceDate DATETIME NOT NULL,
        `expireDate` DATETIME NOT NULL,
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
        `private` BOOLEAN NOT NULL DEFAULT 0,
        createdBy CHAR(36) NOT NULL,
        invoiceTypeId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        FOREIGN KEY (invoiceTypeId) REFERENCES InvoiceType (id) ON DELETE RESTRICT,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    InvoiceInTarget (
        id CHAR(36) NOT NULL PRIMARY KEY,
        invoiceInId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        FOREIGN KEY (invoiceInId) REFERENCES InvoiceIn (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    FollowUp (
        id CHAR(36) NOT NULL PRIMARY KEY,
        activityDescription TEXT,
        aditionalInfo TEXT,
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
        FOREIGN KEY (statusId) REFERENCES `Status` (id) ON DELETE RESTRICT,
        FOREIGN KEY (executedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (followUpTypeId) REFERENCES FollowUpType (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    FollowUpStructure (
        id CHAR(36) NOT NULL PRIMARY KEY,
        activityDescription TEXT,
        aditionalInfo TEXT,
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
        FOREIGN KEY (statusId) REFERENCES `Status` (id) ON DELETE RESTRICT,
        FOREIGN KEY (executedBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (followUpId) REFERENCES FollowUp (id) ON DELETE RESTRICT,
        FOREIGN KEY (documentId) REFERENCES DocumentStructure (id) ON DELETE RESTRICT,
        FOREIGN KEY (contactId) REFERENCES Contact (id) ON DELETE RESTRICT,
        FOREIGN KEY (taskFor) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    VisibilityForRole (
        id CHAR(36) NOT NULL PRIMARY KEY,
        visible BOOLEAN NOT NULL DEFAULT 0,
        roleId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        FOREIGN KEY (roleId) REFERENCES `Role` (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    FollowUpTarget (
        id CHAR(36) NOT NULL PRIMARY KEY,
        followUpId CHAR(36) NOT NULL,
        targetId CHAR(36) NOT NULL,
        FOREIGN KEY (followUpId) REFERENCES FollowUp (id) ON DELETE RESTRICT,
        FOREIGN KEY (targetId) REFERENCES `Target` (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    TestProcedure (
        id CHAR(36) PRIMARY KEY NOT NULL,
        name VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    DocumentPlace (
        id CHAR(36) PRIMARY KEY NOT NULL,
        placeA VARCHAR(255) NOT NULL,
        placeB VARCHAR(255) NOT NULL,
        placeC VARCHAR(255) NOT NULL,
        placeD VARCHAR(255) NOT NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    DocumentGroup (
        id CHAR(36) PRIMARY KEY NOT NULL,
        groupA VARCHAR(255) NOT NULL,
        groupB VARCHAR(255) NOT NULL,
        groupC VARCHAR(255) NOT NULL,
        groupD VARCHAR(255) NOT NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    Phantom (
        id CHAR(36) PRIMARY KEY NOT NULL,
        description VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        valid BOOLEAN NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Part (
        id CHAR(36) PRIMARY KEY NOT NULL,
        name VARCHAR(255) NOT NULL,
        abbreviation VARCHAR(255) NOT NULL,
        devision VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        beNumber VARCHAR(255),
        brandName VARCHAR(255) NOT NULL,
        reject BOOLEAN NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Inventory (
        id CHAR(36) PRIMARY KEY NOT NULL,
        place VARCHAR(255) NOT NULL,
        beNumber INT NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        serialNumber VARCHAR(255) NOT NULL,
        quantityInStock INT NOT NULL,
        minimumStock INT NOT NULL,
        maximumStock INT NOT NULL,
        information VARCHAR(255) NOT NULL,
        valid BOOLEAN NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Unit (
        id CHAR(36) PRIMARY KEY NOT NULL,
        name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        abbreviation VARCHAR(50) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        valid BOOLEAN NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Material (
        id CHAR(36) PRIMARY KEY NOT NULL,
        name VARCHAR(255) NOT NULL,
        brandOrder_number VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        preferedSupplier VARCHAR(255) NOT NULL,
        supplierInformation VARCHAR(255) NOT NULL,
        brandName VARCHAR(255) NOT NULL,
        documentationPlace VARCHAR(255) NOT NULL,
        bePartDoc VARCHAR(255) NOT NULL,
        reject BOOLEAN NOT NULL,
        unitId CHAR(36) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (unitId) REFERENCES Unit (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    SerialTracked (
        id CHAR(36) PRIMARY KEY NOT NULL,
        serialNumber VARCHAR(255) NOT NULL,
        material_id CHAR(36) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (material_id) REFERENCES Material (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    WarehousePlace (
        id CHAR(36) PRIMARY KEY NOT NULL,
        place VARCHAR(255) NOT NULL,
        shelve VARCHAR(255) NOT NULL,
        col VARCHAR(255) NOT NULL,
        layer VARCHAR(255) NOT NULL,
        layerPlace VARCHAR(255) NOT NULL,
        information VARCHAR(255) NOT NULL,
        volume DECIMAL(10, 2) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    InventoryPlace (
        id CHAR(36) PRIMARY KEY NOT NULL,
        abbreviation VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        additionalInformation VARCHAR(255) NOT NULL,
        quantityInStock INT NOT NULL,
        coordinates BOOLEAN NOT NULL,
        coordinatesX DECIMAL(10, 2) NOT NULL,
        coordinatesY DECIMAL(10, 2) NOT NULL,
        coordinatesZ DECIMAL(10, 2) NOT NULL,
        placeName VARCHAR(255) NOT NULL,
        placeNameA VARCHAR(255) NOT NULL,
        placeNameB VARCHAR(255) NOT NULL,
        placeNameC VARCHAR(255) NOT NULL,
        serialTrackedId CHAR(36) NOT NULL,
        inventoryId CHAR(36) NOT NULL,
        warehousePlaceId CHAR(36) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (inventoryId) REFERENCES Inventory (id),
        FOREIGN KEY (warehousePlaceId) REFERENCES WarehousePlace (id),
        FOREIGN KEY (serialTrackedId) REFERENCES SerialTracked (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE PurchaseOrderBecra (
    id CHAR(36) PRIMARY KEY NOT NULL
    
) ENGINE=InnoDB;

CREATE TABLE
    InventoryStructure (
        id CHAR(36) PRIMARY KEY NOT NULL,
        place VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        beNumber VARCHAR(255) NOT NULL,
        purchaseOrderBecra INT,
        partSupplierNumber VARCHAR(255) NOT NULL,
        partDescription VARCHAR(255) NOT NULL,
        coordinates BOOLEAN NOT NULL,
        coordinatesX DECIMAL(10, 2) NOT NULL,
        coordinatesY DECIMAL(10, 2) NOT NULL,
        coordinatesZ DECIMAL(10, 2) NOT NULL,
        inventoryPlaceId CHAR(36) NOT NULL,
        materialId CHAR(36) NOT NULL,
        forProject BOOLEAN NOT NULL,
        projectId CHAR(36) NOT NULL,
        forInventory BOOLEAN NOT NULL,
        materialActive BOOLEAN NOT NULL,
        warehousePlaceId CHAR(36) NOT NULL,
        active BOOLEAN NOT NULL,
        additionalInformation VARCHAR(255) NOT NULL,
        minimumStock INT NOT NULL,
        maximumStock INT NOT NULL,
        quantityInStock INT NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        unitPrice DECIMAL(10, 2) NOT NULL,
        unitId CHAR(36) NOT NULL,
        valid BOOLEAN NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (inventoryPlaceId) REFERENCES InventoryPlace (id),
        FOREIGN KEY (materialId) REFERENCES Material (id),
        FOREIGN KEY (unitId) REFERENCES Unit (id),
        FOREIGN KEY (warehousePlaceId) REFERENCES WarehousePlace (id),
        FOREIGN KEY (projectId) REFERENCES Project (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    InventoryOrder (
        id CHAR(36) PRIMARY KEY NOT NULL,
        storePlace VARCHAR(255) NOT NULL,
        companyId CHAR(36) NOT NULL,
        inventoryId CHAR(36),
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        additionalInformation VARCHAR(255) NOT NULL,
        valid BOOLEAN NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (inventoryId) REFERENCES Inventory (id),
        FOREIGN KEY (companyId) REFERENCES Company (id) ON DELETE RESTRICT,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE TransactionType(
    id CHAR(36) PRIMARY KEY NOT NULL
)ENGINE = InnoDB;

CREATE TABLE
    InventoryChange (
        id CHAR(36) PRIMARY KEY NOT NULL,
        inventoryId CHAR(36) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        additionalInformation VARCHAR(255) NOT NULL,
        transactionDate DATETIME NOT NULL,
        fromLocation VARCHAR(255) NOT NULL,
        toLocation VARCHAR(255) NOT NULL,
        inventoryQuantityOld INT NOT NULL,
        transactionType VARCHAR(255) NOT NULL,
        quantityInStock INT NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (inventoryId) REFERENCES Inventory (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    InventoryOrderStructure (
        id CHAR(36) PRIMARY KEY NOT NULL,
        inventoryStructureId CHAR(36),
        inventoryOrderId CHAR(36),
        beNumber VARCHAR(255) NOT NULL,
        beNumberParentPart VARCHAR(255) NOT NULL,
        serialCode VARCHAR(255) NOT NULL,
        inventoryPlaceId CHAR(36),
        projectId CHAR(36),
        quoteSupplier VARCHAR(255) NOT NULL,
        partSupplierNumber VARCHAR(255) NOT NULL,
        partDescription VARCHAR(255) NOT NULL,
        quantityRequired DECIMAL(10, 2) NOT NULL,
        quantityReserved DECIMAL(10, 2) NOT NULL,
        quantityIssued DECIMAL(10, 2) NOT NULL,
        unitId CHAR(36),
        unitPieces DECIMAL(10, 2) NOT NULL,
        unitPrice DECIMAL(10, 2) NOT NULL,
        docId CHAR(36),
        pobId CHAR(36),
        active BOOLEAN NOT NULL,
        forInventory BOOLEAN NOT NULL,
        forProject BOOLEAN NOT NULL,
        priceTotal DECIMAL(10, 2) NOT NULL,
        additionalInformation VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (inventoryStructureId) REFERENCES InventoryStructure (id) ON DELETE SET NULL,
        FOREIGN KEY (inventoryOrderId) REFERENCES InventoryOrder (id) ON DELETE SET NULL,
        FOREIGN KEY (inventoryPlaceId) REFERENCES InventoryPlace (id) ON DELETE SET NULL,
        FOREIGN KEY (unitId) REFERENCES Unit (id) ON DELETE SET NULL,
        FOREIGN KEY (docId) REFERENCES DocumentStructure (id) ON DELETE SET NULL,
        FOREIGN KEY (pobId) REFERENCES PurchaseOrderBecra (id) ON DELETE SET NULL,
        FOREIGN KEY (projectId) REFERENCES Project (id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialPrice (
        id CHAR(36) PRIMARY KEY NOT NULL,
        orderNumber VARCHAR(255) NOT NULL,
        beNumber VARCHAR(255) NOT NULL,
        quoteId VARCHAR(255) NOT NULL,
        supplierOrderNumber VARCHAR(255) NOT NULL,
        brandOrderNumber VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        additionalInformation VARCHAR(255) NOT NULL,
        brandName VARCHAR(255) NOT NULL,
        rejected BOOLEAN NOT NULL,
        unitPrice DECIMAL(10, 2) NOT NULL,
        quantityPrice DECIMAL(10, 2) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialStructure (
        id CHAR(36) PRIMARY KEY NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        beNumber VARCHAR(255) NOT NULL,
        expiredDate DATETIME NOT NULL,
        docRevision VARCHAR(255) NOT NULL,
        additionalInformation VARCHAR(255) NOT NULL,
        valid BOOLEAN NOT NULL,
        management VARCHAR(255) NOT NULL,
        referenceDocId CHAR(36) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (referenceDocId) REFERENCES DocumentStructure (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialDimension (
        id CHAR(36) PRIMARY KEY NOT NULL,
        materialId CHAR(36) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (materialId) REFERENCES Material (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialFamily (
        id CHAR(36) PRIMARY KEY NOT NULL,
        name VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialSpecification (
        id CHAR(36) PRIMARY KEY NOT NULL,
        name VARCHAR(255) NOT NULL,
        materialDimensionId CHAR(36) NOT NULL,
        materialFamilyId CHAR(36) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (materialDimensionId) REFERENCES MaterialDimension (id),
        FOREIGN KEY (materialFamilyId) REFERENCES MaterialFamily (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialPerformance (
        id CHAR(36) PRIMARY KEY NOT NULL,
        materialSpecificationId CHAR(36) NOT NULL,
        materialFamilyId CHAR(36) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (materialFamilyId) REFERENCES MaterialFamily (id),
        FOREIGN KEY (materialSpecificationId) REFERENCES MaterialSpecification (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialMovement (
        id CHAR(36) PRIMARY KEY NOT NULL,
        beNumber VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        serieId VARCHAR(255) NOT NULL,
        transactionTypeId CHAR(36),
        fromLocation VARCHAR(255) NOT NULL,
        toLocation VARCHAR(255) NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        additionalInformation VARCHAR(255) NOT NULL,
        brandName VARCHAR(255) NOT NULL,
        rejected BOOLEAN NOT NULL,
        brandNameNumber VARCHAR(255) NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (transactionTypeId) REFERENCES TransactionType (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialCode (
        id CHAR(36) PRIMARY KEY NOT NULL,
        materialId CHAR(36),
        code VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (materialId) REFERENCES Material (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialOther (
        id CHAR(36) PRIMARY KEY NOT NULL,
        materialId CHAR(36),
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (materialId) REFERENCES Material (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialAssembly (
        id CHAR(36) PRIMARY KEY NOT NULL,
        materialId CHAR(36),
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (materialId) REFERENCES Material (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialGroup (
        id CHAR(36) PRIMARY KEY NOT NULL,
        groupA VARCHAR(255) NOT NULL,
        groupB VARCHAR(255) NULL,
        groupC VARCHAR(255) NULL,
        groupD VARCHAR(255) NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    WarehouseManagement (
        id CHAR(36) PRIMARY KEY NOT NULL,
        beNumber VARCHAR(255) NOT NULL,
        orderNumber VARCHAR(255) NOT NULL,
        quantityInStock INT NOT NULL,
        brandOrderNumber VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        materialGroupId CHAR(36),
        preferedSupplier VARCHAR(255) NOT NULL,
        unitId CHAR(36),
        rejected BOOLEAN NOT NULL,
        additionalInformation VARCHAR(255) NOT NULL,
        documentationPlace VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (materialGroupId) REFERENCES MaterialGroup (id),
        FOREIGN KEY (unitId) REFERENCES Unit (id)
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialSerialTracked (
        id CHAR(36) PRIMARY KEY NOT NULL,
        beNumber VARCHAR(255) NOT NULL,
        brandName VARCHAR(255) NOT NULL,
        manager VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        brandOrderNumber VARCHAR(255) NOT NULL,
        companyId CHAR(36) NOT NULL,
        transactionTypeId CHAR(36) NOT NULL,
        fromLocation VARCHAR(255) NOT NULL,
        toLocation VARCHAR(255) NOT NULL,
        additionalInformation VARCHAR(255) NOT NULL,
        preferedSupplier VARCHAR(255) NOT NULL,
        rejected BOOLEAN NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        projectId CHAR(36),
        becraCode VARCHAR(255) NOT NULL,
        materialGroupId CHAR(36),
        materialId CHAR(36),
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (materialGroupId) REFERENCES MaterialGroup (id),
        FOREIGN KEY (materialId) REFERENCES Material (id),
        FOREIGN KEY (companyId) REFERENCES Company (id),
        FOREIGN KEY (projectId) REFERENCES Project (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    MaterialSerialTrackedStructure (
        id CHAR(36) PRIMARY KEY NOT NULL,
        materialSerialTrackedId CHAR(36) ,
        becraCode VARCHAR(255) NOT NULL,
        certificateId CHAR(36),
        materialSpecificationId CHAR(36),
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        manager VARCHAR(255) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiredDate DATETIME NOT NULL,
        docRevision VARCHAR(255) NOT NULL,
        documentPlaceId CHAR(36),
        valid BOOLEAN NOT NULL,
        referenceDocId CHAR(36),
        additionalInformation VARCHAR(255) NOT NULL,
        beNumber VARCHAR(255) NOT NULL,
        serialCode VARCHAR(255) NOT NULL,
        tag VARCHAR(255) NOT NULL,
        brandName VARCHAR(255) NOT NULL,
        brandOrderNumber VARCHAR(255) NOT NULL,
        materialFamilyId CHAR(36),
        documentId CHAR(36),
        unitId CHAR(36),
        unitPieces INT NOT NULL,
        rejected BOOLEAN NOT NULL,
        createdAt DATETIME NOT NULL,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (materialSerialTrackedId) REFERENCES MaterialSerialTracked (id),
        FOREIGN KEY (materialSpecificationId) REFERENCES MaterialSpecification (id),
        FOREIGN KEY (materialFamilyId) REFERENCES MaterialFamily (id),
        FOREIGN KEY (unitId) REFERENCES Unit (id),
        FOREIGN KEY (documentPlaceId) REFERENCES DocumentPlace (id),
        FOREIGN KEY (documentId) REFERENCES DocumentStructure (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Accounting (
        id CHAR(36) PRIMARY KEY NOT NULL,
        transactionTypeId CHAR(36),
        beNumber VARCHAR(255) NOT NULL,
        costPrice DECIMAL(10, 2) NOT NULL,
        sellingPrice DECIMAL(10, 2) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (transactionTypeId) REFERENCES TransactionType (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    InvestingCode (
        id CHAR(36) PRIMARY KEY NOT NULL,
        code VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        valid BOOLEAN NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    DeliveryNote (
        id CHAR(36) PRIMARY KEY NOT NULL,
        companyId CHAR(36),
        referenceDocId CHAR(36),
        additionalInformation VARCHAR(255) NOT NULL,
        beNumber VARCHAR(255) NOT NULL,
        createdAt DATETIME,
        createdBy CHAR(36) NOT NULL,
        FOREIGN KEY (companyId) REFERENCES Company (id),
        FOREIGN KEY (referenceDocId) REFERENCES DocumentStructure (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Product (
        id CHAR(36) PRIMARY KEY NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription VARCHAR(255) NOT NULL,
        costPrice DECIMAL(10, 2) NOT NULL,
        profit DECIMAL(10, 2) NOT NULL,
        sellingUnitQuantity INT NOT NULL,
        sellingPrice DECIMAL(10, 2) NOT NULL,
        status VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    Sale (
        id CHAR(36) PRIMARY KEY NOT NULL,
        statusPaymentMethod VARCHAR(255) NOT NULL,
        customerName VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    SaleOrderDetail (
        id CHAR(36) PRIMARY KEY NOT NULL,
        saleId CHAR(36),
        productId CHAR(36),
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (saleId) REFERENCES Sale (id),
        FOREIGN KEY (productId) REFERENCES Product (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE Purchase(
    id CHAR(36) PRIMARY KEY NOT NULL
)ENGINE = InnoDB;

CREATE TABLE
    PurchaseDetail (
        id CHAR(36) PRIMARY KEY NOT NULL,
        purchaseId CHAR(36),
        productId CHAR(36),
        quantity INT NOT NULL,
        beNumber VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        totalCost DECIMAL(10, 2) NOT NULL,
        status VARCHAR(255) NOT NULL,
        additionalInformation VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (purchaseId) REFERENCES Purchase (id),
        FOREIGN KEY (productId) REFERENCES Product (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;

CREATE TABLE
    PurchasePriceRequest (
        id CHAR(36) PRIMARY KEY NOT NULL,
        orderNumber VARCHAR(255) NOT NULL,
        brandOrderNumber VARCHAR(255) NOT NULL,
        shortDescription VARCHAR(255) NOT NULL,
        longDescription TEXT,
        brandName VARCHAR(255) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        addMaterialActive BOOLEAN NOT NULL,
        ready BOOLEAN NOT NULL,
        active BOOLEAN NOT NULL,
        purchaseDetailId CHAR(36),
        preferredSupplier VARCHAR(255) NOT NULL,
        createdBy CHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (purchaseDetailId) REFERENCES PurchaseDetail (id),
        FOREIGN KEY (createdBy) REFERENCES Employee (id) ON DELETE RESTRICT
    ) ENGINE = InnoDB;