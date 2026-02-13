DROP DATABASE IF EXISTS BecraLocal;

CREATE DATABASE BecraLocal;

USE BecraLocal;

CREATE TABLE `Role`(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `level` INT NOT NULL,
  createdAt DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `Function`(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Department(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Title(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE DocumentStructure(
  id BINARY(16) NOT NULL PRIMARY KEY,
  documentNumber VARCHAR(100) NOT NULL,
  `description` TEXT,
  descriptionShort VARCHAR (100) NOT NULL,
  createdAt DATETIME NOT NULL,
  expiryDate DATETIME,
  revisionNumber INT,
  revisionDetail TEXT,
  valid BOOLEAN NOT NULL DEFAULT 1,
  process BOOLEAN NOT NULL DEFAULT 0,
  aditionalInfo TEXT,

  referenceDocId BINARY(16),
  roleId BINARY(16),

  FOREIGN KEY (referenceDocId)
        REFERENCES DocumentStructure(id)
        ON DELETE SET NULL,
  FOREIGN KEY (roleId)
        REFERENCES `Role`(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE Employee (
  id BINARY(16) NOT NULL PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  mail VARCHAR(100),
  password_hash VARCHAR(100) NOT NULL,
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

  createdBy BINARY(16),
  roleId BINARY(16),
  functionId BINARY(16),
  departmentId BINARY(16),
  titleId BINARY(16),
  pictureId BINARY(16),

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (roleId)
        REFERENCES `Role`(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (functionId)
        REFERENCES `Function`(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (departmentId)
        REFERENCES Department(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (titleId)
        REFERENCES Title(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (pictureId)
        REFERENCES DocumentStructure(id)
        ON DELETE SET NULL
)ENGINE=InnoDB;

CREATE TABLE `Session`(
      id BINARY(16) NOT NULL PRIMARY KEY,
      activeFrom DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      activeUntil DATETIME NOT NULL,

      employeeId BINARY(16) NOT NULL,

      FOREIGN KEY (employeeId)
        REFERENCES Employee(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE TargetType(
      id BINARY(16) NOT NULL PRIMARY KEY,
      `name` VARCHAR(100) NOT NULL,
      createdAt DATETIME NOT NULL,

      createdBy BINARY(16) NOT NULL,

      FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE `Target`(
      id BINARY(16) NOT NULL PRIMARY KEY,
      createdAt DATETIME NOT NULL,

      createdBy BINARY(16) NOT NULL,
      targetTypeId BINARY(16) NOT NULL,

      FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
      FOREIGN KEY (targetTypeId)
        REFERENCES TargetType(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

ALTER TABLE `Role`
ADD createdBy BINARY(16) NOT NULL,
ADD CONSTRAINT fk_role_createdBy
FOREIGN KEY (createdBy)
REFERENCES Employee(id)
ON DELETE RESTRICT;

ALTER TABLE `Function`
ADD createdBy BINARY(16) NOT NULL,
ADD CONSTRAINT fk_function_createdBy
FOREIGN KEY (createdBy)
REFERENCES Employee(id)
ON DELETE RESTRICT;

ALTER TABLE Title
ADD createdBy BINARY(16) NOT NULL,
ADD CONSTRAINT fk_title_createdBy
FOREIGN KEY (createdBy)
REFERENCES Employee(id)
ON DELETE RESTRICT;

ALTER TABLE Department
ADD createdBy BINARY(16) NOT NULL,
ADD CONSTRAINT fk_department_createdBy
FOREIGN KEY (createdBy)
REFERENCES Employee(id)
ON DELETE RESTRICT;

ALTER TABLE DocumentStructure
ADD createdBy BINARY(16) NOT NULL,
ADD CONSTRAINT fk_documentStructure_createdBy
FOREIGN KEY (createdBy)
REFERENCES Employee(id)
ON DELETE RESTRICT;

ALTER TABLE DocumentStructure
ADD revisedById BINARY(16) NOT NULL,
ADD CONSTRAINT fk_documentStructure_revisedBy
FOREIGN KEY (revisedById)
REFERENCES Employee(id)
ON DELETE RESTRICT;

ALTER TABLE DocumentStructure
ADD managedById BINARY(16) NOT NULL,
ADD CONSTRAINT fk_documentStructure_managedBy
FOREIGN KEY (managedById)
REFERENCES Employee(id)
ON DELETE RESTRICT;

ALTER TABLE DocumentStructure
ADD targetId BINARY(16) NOT NULL,
ADD CONSTRAINT fk_documentStructure_target
FOREIGN KEY (targetId)
REFERENCES `Target`(id)
ON DELETE RESTRICT;

CREATE TABLE EmergencyContact(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  mail VARCHAR(100) NOT NULL,
  phoneNumber VARCHAR(100) NOT NULL,

  employeeId BINARY(16) NOT NULL,

  FOREIGN KEY (employeeId)
        REFERENCES Employee(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE Company(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `number` VARCHAR(100) NOT NULL,
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

  createdBy BINARY(16) NOT NULL,
  companyId BINARY(16) NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (companyId)
        REFERENCES Company(id)
        ON DELETE SET NULL,
        
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE Contact (
  id BINARY(16) NOT NULL PRIMARY KEY,
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
  `description` TEXT,
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

  createdBy BINARY(16) NOT NULL,
  functionId BINARY(16) NULL,
  departmentId BINARY(16) NULL,
  titleId BINARY(16) NULL,
  businessCardId BINARY(16) NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (functionId)
        REFERENCES `Function`(id)
        ON DELETE SET NULL,
  FOREIGN KEY (departmentId)
        REFERENCES Department(id)
        ON DELETE SET NULL,
  FOREIGN KEY (titleId)
        REFERENCES Title(id)
        ON DELETE SET NULL,
  FOREIGN KEY (businessCardId)
        REFERENCES DocumentStructure(id)
        ON DELETE SET NULL,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE CompanyAdress(
  id BINARY(16) NOT NULL PRIMARY KEY,
  street VARCHAR(100),
  houseNumber VARCHAR(100),
  busNumber VARCHAR(100),
  zipCode VARCHAR(100),
  place VARCHAR(100),
  createdAt DATETIME NOT NULL,

  typeAdress VARCHAR(100),

  createdBy BINARY(16) NOT NULL,
  companyId BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (companyId)
        REFERENCES Company(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE CompanyContact(
  id BINARY(16) NOT NULL PRIMARY KEY,
  startedDate DATETIME NOT NULL,
  endDate DATETIME,
  roleWithCompany VARCHAR(100),
  createdAt DATETIME NOT NULL,

  contactId BINARY(16) NOT NULL,
  companyId BINARY(16) NOT NULL,
  createdBy BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (contactId)
        REFERENCES Contact(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (companyId)
        REFERENCES Company(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE ProjectType(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL,

  createdBy BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE CertificateType(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL,

  createdBy BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE UrgencyType(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL,

  createdBy BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE `Status`(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL,

  createdBy BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE FollowUpType(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL,

  createdBy BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE InvoiceType(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL,

  createdBy BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE HourType(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL,
  info TEXT,

  createdBy BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Project(
  id BINARY(16) NOT NULL PRIMARY KEY,
  projectNumber VARCHAR(100) NOT NULL,
  `description` TEXT,
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

  createdBy BINARY(16) NOT NULL,
  companyId BINARY(16) NOT NULL,
  projectTypeId BINARY(16) NOT NULL,
  parentProjectId BINARY(16) NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (companyId)
        REFERENCES Company(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (projectTypeId)
        REFERENCES ProjectType(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (parentProjectId)
        REFERENCES Project(id)
        ON DELETE SET NULL,
        
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE `Certificate`(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `description` TEXT,
  descriptionShort TEXT,
  createdAt DATETIME NOT NULL,

  createdBy BINARY(16) NOT NULL,
  certificateTypeId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (certificateTypeId)
        REFERENCES CertificateType(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE TrainingStandard(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `description` TEXT,
  descriptionShort TEXT,
  `location` VARCHAR(100),
  createdAt DATETIME NOT NULL,

  `certificate` BOOLEAN NOT NULL DEFAULT 1,
  `repeat` BOOLEAN NOT NULL DEFAULT 0,

  createdBy BINARY(16) NOT NULL,
  certificateId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (certificateId)
        REFERENCES `Certificate`(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE TrainingDocument(
  id BINARY(16) NOT NULL PRIMARY KEY,

  documentId BINARY(16) NOT NULL,
  trainingStandardId BINARY(16) NOT NULL,

  FOREIGN KEY (documentId)
        REFERENCES DocumentStructure(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (trainingStandardId)
        REFERENCES TrainingStandard(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE WorkOrder(
  id BINARY(16) NOT NULL PRIMARY KEY,
  workOrderNumber VARCHAR(100),
  `description` TEXT,
  aditionalInfo TEXT,
  startDate DATETIME NOT NULL,
  endDate DATETIME,
  createdAt DATETIME NOT NULL,

  hoursMaterialClosed BOOLEAN NOT NULL DEFAULT 0,
  invoiceSent BOOLEAN NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT 0,

  createdBy BINARY(16) NOT NULL,
  projectId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (projectId)
        REFERENCES Project(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE TimeRegistry(
  id BINARY(16) NOT NULL PRIMARY KEY,
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

  createdBy BINARY(16) NOT NULL,
  workOrderId BINARY(16) NOT NULL,
  hourtypeId BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (hourtypeId)
        REFERENCES HourType(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (workOrderId)
        REFERENCES WorkOrder(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE TimeRegistryEmployee(
  id BINARY(16) NOT NULL PRIMARY KEY,

  employeeId BINARY(16) NOT NULL,
  timeRegistryId BINARY(16) NOT NULL,

  FOREIGN KEY (employeeId)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (timeRegistryId)
        REFERENCES TimeRegistry(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE ProjectContact(
  id BINARY(16) NOT NULL PRIMARY KEY,
  `description` TEXT,
  extraInfo TEXT,
  createdAt DATETIME NOT NULL,
  moddifiedAt DATETIME,

  idValid BOOLEAN NOT NULL DEFAULT 1,

  createdBy BINARY(16) NOT NULL,
  moddifiedBy BINARY(16) NOT NULL,
  projectId BINARY(16) NOT NULL,
  contactId BINARY(16) NOT NULL,

  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (projectId)
        REFERENCES Project(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (moddifiedBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (contactId)
        REFERENCES Contact(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATe TABLE Training(
  id BINARY(16) NOT NULL PRIMARY KEY,
  trainingNumber VARCHAR(100),
  trainingDate DATETIME NOT NULL,
  createdAt DATETIME NOT NULL,

  closed BOOLEAN NOT NULL DEFAULT 1,

  createdBy BINARY(16) NOT NULL,
  workOrderId BINARY(16) NOT NULL,
  trainingStandardId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (workOrderId)
        REFERENCES WorkOrder(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (trainingStandardId)
        REFERENCES TrainingStandard(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE TrainingContact(
  id BINARY(16) NOT NULL PRIMARY KEY,
  clientNumber VARCHAR(100),
  certSentDate DATETIME,
  createdAt DATETIME NOT NULL,

  succeeded BOOLEAN NOT NULL DEFAULT 0,
  attended BOOLEAN NOT NULL DEFAULT 0,
  certificateSent BOOLEAN NOT NULL DEFAULT 0,

  createdBy BINARY(16) NOT NULL,
  contactId BINARY(16) NOT NULL,
  trainingId BINARY(16) NOT NULL,

  FOREIGN KEY (contactId)
        REFERENCES Contact(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (trainingId)
        REFERENCES Training(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

-- CHECK BELOW ONCE MATERIAL HAS JOINED!!!!!!!!!!!!!
CREATE TABLE WorkOrderStructure(
  id BINARY(16) NOT NULL PRIMARY KEY,
  clientNumber VARCHAR(100),
  tag VARCHAR(100),
  quantity INT,
  aditionalInfo TEXT,
  shortDesciption VARCHAR(100),
  longDescription TEXT,
  createdAt DATETIME NOT NULL,

  createdBy BINARY(16) NOT NULL,
  workOrderId BINARY(16) NOT NULL,
  materialId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (workOrderId)
        REFERENCES WorkOrder(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (materialId) 
        REFERENCES Training(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE InvoiceOut(
    id BINARY(16) NOT NULL PRIMARY KEY,
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

  createdBy BINARY(16) NOT NULL,
  invoiceTypeId BINARY(16) NOT NULL,
  workOrderId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (invoiceTypeId)
        REFERENCES InvoiceType(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (workOrderId)
        REFERENCES WorkOrder(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE InvoiceIn(
  id BINARY(16) NOT NULL PRIMARY KEY,
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

  createdBy BINARY(16) NOT NULL,
  invoiceTypeId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (invoiceTypeId)
        REFERENCES InvoiceType(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE InvoiceInTarget(
  id BINARY(16) NOT NULL PRIMARY KEY,

  invoiceInId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (invoiceInId)
        REFERENCES InvoiceIn(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE FollowUp(
  id BINARY(16) NOT NULL PRIMARY KEY,
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

  createdBy BINARY(16) NOT NULL,
  ownedBy BINARY(16) NOT NULL,
  statusId BINARY(16) NOT NULL,
  executedBy BINARY(16) NOT NULL,
  urgencyTypeId BINARY(16) NOT NULL,
  documentId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,
  followUpTypeId BINARY(16) NOT NULL,

  FOREIGN KEY (urgencyTypeId)
        REFERENCES UrgencyType(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (ownedBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (statusId)
        REFERENCES `Status`(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (executedBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (documentId)
        REFERENCES DocumentStructure(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
      FOREIGN KEY (followUpTypeId)
        REFERENCES FollowUpType(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE FollowUpStructure(
  id BINARY(16) NOT NULL PRIMARY KEY,
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

  createdBy BINARY(16) NOT NULL,
  ownedBy BINARY(16) NOT NULL,
  statusId BINARY(16) NOT NULL,
  executedBy BINARY(16) NOT NULL,
  urgencyTypeId BINARY(16) NOT NULL,
  followUpId BINARY(16) NOT NULL,
  documentId BINARY(16) NOT NULL,
  contactId BINARY(16) NOT NULL,
  taskFor BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (urgencyTypeId)
        REFERENCES UrgencyType(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (ownedBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (statusId)
        REFERENCES `Status`(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (executedBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (followUpId)
        REFERENCES FollowUp(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (documentId)
        REFERENCES DocumentStructure(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (contactId)
        REFERENCES Contact(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (taskFor)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (createdBy)
        REFERENCES Employee(id)
        ON DELETE RESTRICT,

  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE VisibilityForRole(
  id BINARY(16) NOT NULL PRIMARY KEY,
  visible BOOLEAN NOT NULL DEFAULT 0,

  roleId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (roleId)
        REFERENCES `Role`(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;

CREATE TABLE FollowUpTarget(
  id BINARY(16) NOT NULL PRIMARY KEY,

  followUpId BINARY(16) NOT NULL,
  targetId BINARY(16) NOT NULL,

  FOREIGN KEY (followUpId)
        REFERENCES FollowUp(id)
        ON DELETE RESTRICT,
  FOREIGN KEY (targetId)
        REFERENCES `Target`(id)
        ON DELETE RESTRICT
)ENGINE=InnoDB;   


-- Select below then right click and run selected query
SHOW TABLE STATUS