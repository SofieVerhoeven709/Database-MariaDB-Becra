# Inspection Fields - Quick Reference

## Form Fields Overview

```
┌─────────────────────────────────────────────────────────┐
│         Serial Tracked Item Inspection Fields            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Last Inspection Date: [2026-04-03           ]          │
│  Description: Date when the item was last inspected     │
│                                                          │
│  Inspection Interval (Days): [365            ]          │
│  Description: How many days between inspections         │
│                                                          │
│  Next Inspection Date: [2027-04-03           ]          │
│  Description: When the next inspection is due           │
│  (Auto-calculated from Last Date + Interval,            │
│   or set manually)                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Auto-Calculation Flow

```
User Updates Last Inspection Date or Interval Days
                    ↓
            Is form valid?
                ↙      ↘
              NO      YES
              ↓        ↓
           Skip     Check if both fields present
                         ↓
                    YES            NO
                     ↓              ↓
              Calculate           Skip
              Next Date           Auto-calc
                ↓
         Last Date + Days
                ↓
        Update Next Date
              ↓
        Display to user
                ↓
        User can override
              ↓
            Save
```

## Data Types

| Field | Type | Format | Example | Required |
|-------|------|--------|---------|----------|
| Last Inspection Date | Date | YYYY-MM-DD | 2026-04-03 | No |
| Inspection Interval | Number | Positive integer | 365 | No |
| Next Inspection Date | Date | YYYY-MM-DD | 2027-04-03 | No |

## Calculation Examples

### Example 1: Annual Inspection
- Last Inspection Date: 2025-04-03
- Inspection Interval: 365 days
- Next Inspection Date: 2026-04-03 ✓ (Auto-calculated)

### Example 2: Quarterly Inspection
- Last Inspection Date: 2026-01-15
- Inspection Interval: 90 days
- Next Inspection Date: 2026-04-15 ✓ (Auto-calculated)

### Example 3: Manual Override
- Last Inspection Date: 2026-04-03
- Inspection Interval: 365 days
- Next Inspection Date: 2026-06-01 (Manually set, overrides calculation)

## Server-Side Implementation

### Create Flow
```typescript
createSerialTracked({
  lastInspectionDate: Date,
  inspectionIntervalDays: number,
  nextInspectionDate?: Date  // Optional - will be calculated if not provided
})
```

### Update Flow
```typescript
updateSerialTracked(id, {
  lastInspectionDate?: Date,
  inspectionIntervalDays?: number,
  nextInspectionDate?: Date
})
```

### Calculation Logic
```typescript
if (!nextInspectionDate && lastInspectionDate && inspectionIntervalDays) {
  // Calculate next date
  const nextDate = new Date(lastInspectionDate)
  nextDate.setDate(nextDate.getDate() + inspectionIntervalDays)
  nextInspectionDate = nextDate
}
```

## Validation Rules

✓ Both Last Inspection Date and Interval must be present to trigger auto-calculation
✓ Interval must be positive (> 0)
✓ All dates must be valid
✓ User can manually override calculated Next Inspection Date
✗ Empty fields are allowed (optional fields)
✗ Negative or zero intervals are rejected

## Database Structure

### MaterialSerialTrack Table
```sql
last_inspection_date          DATE
inspection_interval_value     INT
inspection_interval_unit      ENUM('DAY', 'WEEK', 'MONTH', 'YEAR')
next_inspection_date          DATE
```

### MaterialSerialTrackedStructure Table
```sql
last_inspection_date          DATETIME
inspection_interval_days      INT
next_inspection_date          DATETIME
```

## User Actions

### When Creating
1. ✓ Fill Last Inspection Date
2. ✓ Enter Inspection Interval (Days)
3. ✓ See Next Inspection Date auto-calculate
4. ✓ Optionally override Next Inspection Date
5. ✓ Save

### When Editing
1. ✓ Change Last Inspection Date → Next Date recalculates
2. ✓ Change Inspection Interval → Next Date recalculates
3. ✓ Change Next Inspection Date → Manual override
4. ✓ Save updates

## Status Indicators (Future)

Recommended visual indicators for inspection status:
- 🟢 **GREEN**: Next inspection not yet due
- 🟡 **YELLOW**: Next inspection due within 30 days
- 🔴 **RED**: Next inspection overdue

## Integration Points

Current implementation:
- ✓ Form UI (serialTrackedFormDialog.tsx)
- ✓ Database Layer (materialSerialTracked.ts)
- ✓ Schema Validation (materialSerialTrackedSchema.ts)
- ✓ Prisma Models (schema.prisma)

Future integration needed:
- [ ] Inspection history tracking
- [ ] Notification system
- [ ] Reporting/analytics
- [ ] Mobile app support

