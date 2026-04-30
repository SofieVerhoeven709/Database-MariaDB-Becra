export interface HrFacilityEmployeeOption {
  id: string
  name: string
}

export interface HrFacilitySerialTrackedOption {
  id: string
  label: string
}

export interface HrFacilityFuelCardRow {
  id: string
  vehicleId: string | null
  employeeId: string | null
  employeeName: string | null
  cardNumber: string
  provider: string | null
  monthlyBudget: string | null
  currentMonthSpend: string
  active: boolean
  notes: string | null
}

export interface HrFacilityFineRow {
  id: string
  vehicleId: string | null
  employeeId: string | null
  employeeName: string | null
  fineDate: string
  amount: string
  referenceNumber: string | null
  description: string | null
  paidByEmployee: boolean
  paidAt: string | null
}

export interface HrFacilityVehicleRow {
  id: string
  serialTrackedId: string | null
  serialTrackedLabel: string | null
  assignedEmployeeId: string | null
  assignedEmployeeName: string | null
  licensePlate: string | null
  brand: string | null
  model: string | null
  vin: string | null
  status: string
  conditionStatus: string | null
  signedVehicleDocument: boolean
  signedDocumentFileId: string | null
  monthlyFuelBudget: string | null
  notes: string | null
  fuelCards: HrFacilityFuelCardRow[]
  fines: HrFacilityFineRow[]
}
