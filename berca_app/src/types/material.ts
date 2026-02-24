export interface MappedMaterial {
  id: string
  beNumber: string
  name: string | null
  brandOrderNr: number
  shortDescription: string
  longDescription: string | null
  preferedSupplier: string | null
  brandName: string | null
  documentationPlace: string | null
  bePartDoc: number | null
  rejected: boolean | null
  materialGroupId: string
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
