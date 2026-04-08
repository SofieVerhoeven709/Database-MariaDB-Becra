export interface MappedMaterialDemand {
  id: string
  materialId: string
  materialBeNumber: string | null
  materialName: string | null
  materialShortDescription: string | null
  totalRequiredQty: number
  reservedQty: number
  createdAt: string
  sourceCount: number
  quoteLineCount: number
}

export interface MaterialDemandMaterialOption {
  id: string
  beNumber: string | null
  name: string | null
  shortDescription: string | null
}

