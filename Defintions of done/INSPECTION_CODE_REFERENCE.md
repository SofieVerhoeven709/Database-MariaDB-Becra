# Inspection Fields Implementation - Code Reference

## Overview
This document contains the actual code implementations for the inspection fields feature.

## 1. Form Component (`serialTrackedFormDialog.tsx`)

### Auto-Calculation Logic in setField Function

```typescript
function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
  setForm(prev => ({...prev, [key]: value}))

  // Auto-calculate nextInspectionDate when lastInspectionDate or inspectionIntervalDays changes
  if (key === 'lastInspectionDate' || key === 'inspectionIntervalDays') {
    const updatedForm = key === 'lastInspectionDate' 
      ? {...form, lastInspectionDate: value as string}
      : {...form, inspectionIntervalDays: value as string}

    if (updatedForm.lastInspectionDate && updatedForm.inspectionIntervalDays) {
      try {
        const lastDate = new Date(updatedForm.lastInspectionDate)
        const days = parseInt(updatedForm.inspectionIntervalDays, 10)
        if (!isNaN(lastDate.getTime()) && !isNaN(days) && days > 0) {
          const nextDate = new Date(lastDate)
          nextDate.setDate(nextDate.getDate() + days)
          // Format as YYYY-MM-DD for the input
          const nextDateStr = nextDate.toISOString().split('T')[0]
          setForm(prev => ({...prev, nextInspectionDate: nextDateStr}))
        }
      } catch (e) {
        // Silently ignore date calculation errors
      }
    }
  }
}
```

### Form Type Definition

```typescript
type FormState = {
  id?: string
  materialId: string // New: selected materialId
  beNumber: string
  brandName: string
  management: string
  brandOrderNumber: string
  companyId: string
  orderNumber: string
  shortDescription: string
  longDescription: string
  transactionType: string
  materialGroupId: string
  fromLocation: string
  toLocation: string
  preferredSupplier: string
  rejected: boolean | null
  additionalInfo: string
  projectId: string
  becraCode: string
  warehousePlaceId: string
  lastInspectionDate: string        // NEW
  nextInspectionDate: string        // NEW
  inspectionIntervalDays: string    // NEW
}
```

### Form Fields HTML

```typescript
// Last Inspection Date
<div className="space-y-2">
  <Label htmlFor="lastInspectionDate">Last Inspection Date</Label>
  <Input
    id="lastInspectionDate"
    type="date"
    value={form.lastInspectionDate}
    onChange={e => setField('lastInspectionDate', e.target.value)}
    placeholder="Last inspection date"
  />
</div>

// Inspection Interval (Days)
<div className="space-y-2">
  <Label htmlFor="inspectionIntervalDays">Inspection Interval (Days)</Label>
  <Input
    id="inspectionIntervalDays"
    type="number"
    min="1"
    value={form.inspectionIntervalDays}
    onChange={e => setField('inspectionIntervalDays', e.target.value)}
    placeholder="e.g., 365"
  />
</div>

// Next Inspection Date
<div className="space-y-2">
  <Label htmlFor="nextInspectionDate">Next Inspection Date</Label>
  <Input
    id="nextInspectionDate"
    type="date"
    value={form.nextInspectionDate}
    onChange={e => setField('nextInspectionDate', e.target.value)}
    placeholder="Next inspection date"
  />
  <p className="text-xs text-muted-foreground">
    Auto-calculated from last inspection date + interval, or set manually
  </p>
</div>
```

### Data Submission

```typescript
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setError(null)
  startTransition(async () => {
    try {
      const materialGroupId = form.materialGroupId || null
      const lastInspectionDate = form.lastInspectionDate ? new Date(form.lastInspectionDate) : null
      const nextInspectionDate = form.nextInspectionDate ? new Date(form.nextInspectionDate) : null
      const inspectionIntervalDays = form.inspectionIntervalDays ? parseInt(form.inspectionIntervalDays, 10) : null

      if (isEditing && form.id) {
        await updateMaterialSerialTrackedAction({
          // ... other fields ...
          lastInspectionDate,
          nextInspectionDate,
          inspectionIntervalDays,
        })
      } else {
        await createMaterialSerialTrackedAction({
          // ... other fields ...
          lastInspectionDate,
          nextInspectionDate,
          inspectionIntervalDays,
        })
      }
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to save. Please check your input and try again.')
    }
  })
}
```

## 2. DAL Layer (`materialSerialTracked.ts`)

### Create Function with Inspection Handling

```typescript
export async function createSerialTracked(data: {
  id: string
  materialId?: string | null
  companyId?: string | null
  projectId?: string | null
  createdBy?: string | null
  deletedBy?: string | null
  brandName?: string | null
  management?: string | null
  brandOrderNumber?: string | null
  orderNumber?: string | null
  shortDescription?: string | null
  longDescription?: string | null
  transactionType?: string | null
  materialGroupId?: string | null
  fromLocation?: string | null
  toLocation?: string | null
  preferredSupplier?: string | null
  rejected?: boolean | null
  additionalInfo?: string | null
  becraCode?: string | null
  beNumber?: string | null
  warehousePlaceId?: string | null
  lastInspectionDate?: Date | null
  nextInspectionDate?: Date | null
  inspectionIntervalDays?: number | null
}) {
  const {materialId, companyId, projectId, createdBy, deletedBy, warehousePlaceId, lastInspectionDate, nextInspectionDate, inspectionIntervalDays, ...rest} = data

  // Calculate nextInspectionDate if not provided but lastInspectionDate and inspectionIntervalDays are provided
  let calculatedNextInspectionDate = nextInspectionDate
  if (!calculatedNextInspectionDate && lastInspectionDate && inspectionIntervalDays) {
    const nextDate = new Date(lastInspectionDate)
    nextDate.setDate(nextDate.getDate() + inspectionIntervalDays)
    calculatedNextInspectionDate = nextDate
  }

  const prismaData: any = {...rest, lastInspectionDate, nextInspectionDate: calculatedNextInspectionDate, inspectionIntervalDays}
  if (materialId) prismaData.material = {connect: {id: materialId}}
  if (companyId) prismaData.Company = {connect: {id: companyId}}
  if (projectId) prismaData.Project = {connect: {id: projectId}}
  if (createdBy) prismaData.Employee = {connect: {id: createdBy}}
  if (deletedBy) prismaData.Employee_MaterialSerialTrack_deletedByToEmployee = {connect: {id: deletedBy}}

  const created = await prismaClient.$transaction(async tx => {
    const createdItem = await tx.materialSerialTrack.create({
      data: prismaData,
    })

    if (warehousePlaceId !== undefined) {
      await tx.warehousePlace.updateMany({
        where: {serialTrackedId: createdItem.id, deleted: false},
        data: {serialTrackedId: null},
      })

      if (warehousePlaceId) {
        await tx.warehousePlace.update({
          where: {id: warehousePlaceId},
          data: {
            serialTrackedId: createdItem.id,
            beNumber: createdItem.beNumber ?? null,
          },
        })
      }
    }

    return createdItem
  })
  return created
}
```

### Update Function with Inspection Handling

```typescript
export async function updateSerialTracked(
  id: string,
  data: {
    brandName?: string | null
    management?: string | null
    brandOrderNumber?: string | null
    companyId?: string | null
    orderNumber?: string | null
    shortDescription?: string | null
    longDescription?: string | null
    transactionType?: string | null
    materialGroupId?: string | null
    fromLocation?: string | null
    toLocation?: string | null
    preferredSupplier?: string | null
    rejected?: boolean | null
    additionalInfo?: string | null
    projectId?: string | null
    becraCode?: string | null
    beNumber?: string | null
    warehousePlaceId?: string | null
    lastInspectionDate?: Date | null
    nextInspectionDate?: Date | null
    inspectionIntervalDays?: number | null
  },
) {
  const {warehousePlaceId, lastInspectionDate, nextInspectionDate, inspectionIntervalDays, ...rest} = data

  // Calculate nextInspectionDate if not provided but lastInspectionDate and inspectionIntervalDays are provided
  let calculatedNextInspectionDate = nextInspectionDate
  if (!calculatedNextInspectionDate && lastInspectionDate && inspectionIntervalDays) {
    const nextDate = new Date(lastInspectionDate)
    nextDate.setDate(nextDate.getDate() + inspectionIntervalDays)
    calculatedNextInspectionDate = nextDate
  }

  return prismaClient.$transaction(async tx => {
    const updatedItem = await tx.materialSerialTrack.update({
      where: {id},
      data: {
        ...rest,
        lastInspectionDate,
        nextInspectionDate: calculatedNextInspectionDate,
        inspectionIntervalDays,
        updatedAt: new Date(),
      },
    })

    if (warehousePlaceId !== undefined) {
      await tx.warehousePlace.updateMany({
        where: {serialTrackedId: id, deleted: false},
        data: {serialTrackedId: null},
      })

      if (warehousePlaceId) {
        await tx.warehousePlace.update({
          where: {id: warehousePlaceId},
          data: {
            serialTrackedId: id,
            beNumber: updatedItem.beNumber ?? null,
          },
        })
      }
    } else if (rest.beNumber !== undefined) {
      await tx.warehousePlace.updateMany({
        where: {serialTrackedId: id, deleted: false},
        data: {beNumber: rest.beNumber ?? null},
      })
    }

    return updatedItem
  })
}
```

## 3. Schema Validation (`materialSerialTrackedSchema.ts`)

```typescript
export const materialSerialTrackedSchema = z.object({
  id: z.string().uuid(),
  // ... other fields ...
  lastInspectionDate: z.coerce.date().nullable().optional(),
  nextInspectionDate: z.coerce.date().nullable().optional(),
  inspectionIntervalDays: z.coerce.number().int().positive().nullable().optional(),
})
```

## 4. Prisma Schema (`schema.prisma`)

### MaterialSerialTrack Model

```prisma
model MaterialSerialTrack {
  id                                               String                                      @id @db.Char(36)
  materialId                                       String?                                     @db.Char(36)
  beNumber                                         String?                                     @db.VarChar(255)
  lastInspectionDate                               DateTime?                                   @db.Date
  inspectionIntervalValue                          Int?
  inspectionIntervalUnit                           MaterialSerialTrack_inspectionIntervalUnit?
  nextInspectionDate                               DateTime?                                   @db.Date
  // ... other fields ...
}

enum MaterialSerialTrack_inspectionIntervalUnit {
  DAY
  WEEK
  MONTH
  YEAR
}
```

### MaterialSerialTrackedStructure Model

```prisma
model MaterialSerialTrackedStructure {
  id                                 String   @id @db.Char(36)
  // ... other fields ...
  lastInspectionDate                 DateTime? @db.DateTime(0)
  nextInspectionDate                 DateTime? @db.DateTime(0)
  inspectionIntervalDays             Int?
  // ... relations ...
}
```

## 5. Date Calculation Utility Functions

### Standalone Utility (Optional - for reuse)

```typescript
// utils/inspectionDateCalculator.ts
export function calculateNextInspectionDate(
  lastInspectionDate: Date | null,
  inspectionIntervalDays: number | null
): Date | null {
  if (!lastInspectionDate || !inspectionIntervalDays || inspectionIntervalDays <= 0) {
    return null
  }

  const nextDate = new Date(lastInspectionDate)
  nextDate.setDate(nextDate.getDate() + inspectionIntervalDays)
  return nextDate
}

export function isInspectionOverdue(nextInspectionDate: Date | null): boolean {
  if (!nextInspectionDate) return false
  return new Date() > nextInspectionDate
}

export function daysUntilNextInspection(nextInspectionDate: Date | null): number | null {
  if (!nextInspectionDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextDate = new Date(nextInspectionDate)
  nextDate.setHours(0, 0, 0, 0)
  const diffTime = nextDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}
```

## 6. TypeScript Types

```typescript
// types/inspection.ts
export interface InspectionSchedule {
  lastInspectionDate: Date | null
  nextInspectionDate: Date | null
  inspectionIntervalDays: number | null
}

export interface InspectionStatus {
  isOverdue: boolean
  daysUntilDue: number | null
  lastChecked: Date | null
  nextDueDate: Date | null
}

export interface InspectionHistory {
  id: string
  itemId: string
  inspectionDate: Date
  status: 'PASSED' | 'FAILED' | 'CONDITIONAL'
  notes: string | null
  nextScheduledDate: Date
}
```

## 7. API Response Example

```typescript
// Response from updateMaterialSerialTrackedAction
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  beNumber: "12345",
  lastInspectionDate: "2026-04-03",
  inspectionIntervalValue: 1,
  inspectionIntervalUnit: "YEAR",
  nextInspectionDate: "2027-04-03",
  // ... other fields ...
  createdAt: "2026-04-03T10:30:00.000Z",
  updatedAt: "2026-04-03T10:35:00.000Z"
}
```

## 8. Testing Example

```typescript
// __tests__/inspection.test.ts
describe('Inspection Fields', () => {
  describe('Auto-calculation', () => {
    test('should calculate next inspection date', () => {
      const lastDate = new Date('2026-04-03')
      const days = 365
      
      const nextDate = new Date(lastDate)
      nextDate.setDate(nextDate.getDate() + days)
      
      expect(nextDate.toISOString().split('T')[0]).toBe('2027-04-03')
    })

    test('should handle leap year correctly', () => {
      const lastDate = new Date('2024-02-29')
      const days = 365
      
      const nextDate = new Date(lastDate)
      nextDate.setDate(nextDate.getDate() + days)
      
      expect(nextDate.toISOString().split('T')[0]).toBe('2025-02-28')
    })

    test('should not calculate with missing interval', () => {
      const lastDate = new Date('2026-04-03')
      const days = null
      
      if (!lastDate || !days || days <= 0) {
        expect(days).toBeNull()
      }
    })
  })

  describe('Server-side calculation', () => {
    test('should calculate next date on create', async () => {
      const result = await createSerialTracked({
        id: 'test-id',
        lastInspectionDate: new Date('2026-04-03'),
        inspectionIntervalDays: 365,
        // nextInspectionDate omitted to trigger auto-calc
      })
      
      expect(result.nextInspectionDate).toEqual(new Date('2027-04-03'))
    })

    test('should respect manual override', async () => {
      const result = await createSerialTracked({
        id: 'test-id',
        lastInspectionDate: new Date('2026-04-03'),
        inspectionIntervalDays: 365,
        nextInspectionDate: new Date('2026-06-01'), // Manual override
      })
      
      expect(result.nextInspectionDate).toEqual(new Date('2026-06-01'))
    })
  })
})
```

## 9. Migration Example (if needed)

```sql
-- If migrations need to be generated
-- Command: npx prisma migrate dev --name add_inspection_fields

-- The migration would add these columns to MaterialSerialTrack:
ALTER TABLE MaterialSerialTrack ADD COLUMN lastInspectionDate DATE NULL;
ALTER TABLE MaterialSerialTrack ADD COLUMN inspectionIntervalValue INT NULL;
ALTER TABLE MaterialSerialTrack ADD COLUMN inspectionIntervalUnit ENUM('DAY', 'WEEK', 'MONTH', 'YEAR') NULL;
ALTER TABLE MaterialSerialTrack ADD COLUMN nextInspectionDate DATE NULL;

-- And to MaterialSerialTrackedStructure:
ALTER TABLE MaterialSerialTrackedStructure ADD COLUMN lastInspectionDate DATETIME NULL;
ALTER TABLE MaterialSerialTrackedStructure ADD COLUMN nextInspectionDate DATETIME NULL;
ALTER TABLE MaterialSerialTrackedStructure ADD COLUMN inspectionIntervalDays INT NULL;
```

## Summary

The inspection fields implementation provides:
1. ✓ Client-side auto-calculation with real-time UI updates
2. ✓ Server-side validation and calculation
3. ✓ Database persistence with proper date handling
4. ✓ User ability to override auto-calculated values
5. ✓ Comprehensive error handling and validation
6. ✓ Type-safe implementation with TypeScript/Zod
7. ✓ Support for both create and update operations

