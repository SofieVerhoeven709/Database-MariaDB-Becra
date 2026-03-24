export interface MappedMaterial {
  id: string
  beNumber: string
  name: string | null
  brandOrderNr: string | null
  shortDescription: string
  longDescription: string | null
  preferredSupplierCompanyId: string | null
  preferredSupplierCompanyName: string | null
  preferredSupplierOrderId: string | null
  preferredSupplierShortDescription: string | null
  supplierCompanyIds: string[]
  supplierCompanyNames: string[]
  parentBeNumbers: string[]
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
  warehousePlaceId: string | null
  warehousePlaceLabel: string | null
  unitId: string
  unitName: string
  unitAbbreviation: string
  createdBy: string
  createdByName: string
  createdAt: string | null
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}
