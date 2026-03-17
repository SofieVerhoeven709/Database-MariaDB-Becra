import type {MappedVisibilityForRole} from '@/types/visibilityForRole'

// ─── Certificate Type ─────────────────────────────────────────────────────────

export interface MappedCertificateType {
  id: string
  name: string
  createdAt: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedByName: string | null
}

// ─── Certificate ──────────────────────────────────────────────────────────────

export interface MappedCertificate {
  id: string
  description: string | null
  descriptionShort: string | null
  createdAt: string
  createdByName: string
  certificateTypeId: string
  certificateTypeName: string
  targetId: string
  deleted: boolean
  deletedAt: string | null
  deletedByName: string | null
  visibilityForRoles: MappedVisibilityForRole[]
}

export interface CertificateDetailData extends MappedCertificate {
  trainingStandards: MappedCertificateTrainingStandard[]
}

export interface MappedCertificateTrainingStandard {
  id: string
  descriptionShort: string | null
  location: string | null
  repeat: boolean
  certificate: boolean
  createdAt: string
  deleted: boolean
}

// ─── Training Standard ────────────────────────────────────────────────────────

export interface MappedTrainingStandard {
  id: string
  description: string | null
  descriptionShort: string | null
  location: string | null
  certificate: boolean
  repeat: boolean
  createdAt: string
  createdByName: string
  certificateId: string
  certificateName: string | null
  targetId: string
  deleted: boolean
  deletedAt: string | null
  deletedByName: string | null
  visibilityForRoles: MappedVisibilityForRole[]
}

export interface TrainingStandardDetailData extends MappedTrainingStandard {
  trainings: MappedStandardTraining[]
  documents: MappedStandardDocument[]
}

export interface MappedStandardTraining {
  id: string
  trainingNumber: string | null
  trainingDate: string
  closed: boolean
  deleted: boolean
  createdAt: string
  createdByName: string
}

export interface MappedStandardDocument {
  id: string
  documentId: string
  deleted: boolean
  deletedAt: string | null
  deletedByName: string | null
}

// ─── Training ─────────────────────────────────────────────────────────────────

export interface MappedTraining {
  id: string
  trainingNumber: string | null
  trainingDate: string
  closed: boolean
  createdAt: string
  createdByName: string
  workOrderId: string
  workOrderNumber: string | null
  trainingStandardId: string
  trainingStandardDescriptionShort: string | null
  targetId: string
  deleted: boolean
  deletedAt: string | null
  deletedByName: string | null
  visibilityForRoles: MappedVisibilityForRole[]
}

export interface TrainingDetailData extends MappedTraining {
  trainingStandard: {
    id: string
    description: string | null
    descriptionShort: string | null
    location: string | null
    certificate: boolean
    repeat: boolean
    certificateName: string | null
  }
  contacts: MappedTrainingContact[]
}

// ─── Training Contact ─────────────────────────────────────────────────────────

export interface MappedTrainingContact {
  id: string
  attendeeNumber: string | null
  succeeded: boolean
  attended: boolean
  certificateSent: boolean
  certSentDate: string | null
  createdAt: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedByName: string | null
  contact: {
    id: string
    firstName: string
    lastName: string
    functionName: string | null
    currentCompanyName: string | null
  }
}
