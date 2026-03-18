export interface MappedMaterial {
  id: string
  beNumber: string
  name: string | null
  brandOrderNr: string
  shortDescription: string
  longDescription: string | null
  preferredSupplierCompanyId: string | null
  preferredSupplierName: string | null
  supplierCompanyIds: string[]
  supplierCompanyNames: string[]
  brandName: string | null
  documentationPlace: string | null
  bePartDoc: number | null
  rejected: boolean | null
  materialGroupIdA: string | null
  materialGroupIdB: string | null
  materialGroupIdC: string | null
  materialGroupIdD: string | null
  materialGroupLabelA: string
  materialGroupLabelB: string
  materialGroupLabelC: string
  materialGroupLabelD: string
  materialGroupLabel: string
  unitId: string
  unitName: string
  unitAbbreviation: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}
