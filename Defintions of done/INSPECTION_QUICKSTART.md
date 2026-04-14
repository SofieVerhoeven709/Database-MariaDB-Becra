# Inspection Fields - Developer Quick Start

## Quick Overview

Inspection management feature has been added to Material Serial Tracked items. Users can now:
- Set when the last inspection occurred
- Specify how often inspections are needed (in days)
- See when the next inspection is due
- Override the next inspection date if needed

---

## What Was Changed?

### Files Modified: 2

1. **`src/dal/materialSerialTracked.ts`**
   - Added inspection field handling to `createSerialTracked()`
   - Added inspection field handling to `updateSerialTracked()`
   - Both functions now auto-calculate `nextInspectionDate` if not provided

2. **`src/components/custom/serialTrackedFormDialog.tsx`**
   - Added auto-calculation logic in `setField()` function
   - Added 3 new form input fields for inspection management
   - Updated form submission to pass inspection data

### Files Already Configured: 2

- **`src/schemas/materialSerialTrackedSchema.ts`** - ✅ Already has validation
- **`prisma/schema.prisma`** - ✅ Already has database fields

---

## How It Works

### User Interaction Flow

```
1. User opens form to create/edit item
                    ↓
2. User enters "Last Inspection Date" (e.g., 2026-04-03)
                    ↓
3. User enters "Inspection Interval Days" (e.g., 365)
                    ↓
4. Form automatically calculates "Next Inspection Date" (2027-04-03)
                    ↓
5. User can override calculated date if needed
                    ↓
6. User submits form
                    ↓
7. Server receives data
                    ↓
8. Server validates and applies same calculation logic
                    ↓
9. Data saved to database
```

### Technical Flow

```
Form Input (string)
    ↓
Client-side calculation (JavaScript Date)
    ↓
UI update (display in form)
    ↓
Form submit (convert to Date objects)
    ↓
Server receives (Date objects)
    ↓
Server-side calculation (if needed)
    ↓
Database save (DATE type)
```

---

## The Three Inspection Fields

### 1. Last Inspection Date
- **Type**: Date (YYYY-MM-DD)
- **Purpose**: When was the item last inspected?
- **Example**: 2026-04-03
- **Optional**: Yes
- **Can be empty**: Yes

### 2. Inspection Interval (Days)
- **Type**: Number (positive integer)
- **Purpose**: How many days between inspections?
- **Example**: 365 (annual inspection)
- **Optional**: Yes
- **Can be empty**: Yes
- **Minimum**: 1 day
- **Common values**: 
  - 7 (weekly)
  - 30 (monthly)
  - 90 (quarterly)
  - 365 (annual)

### 3. Next Inspection Date
- **Type**: Date (YYYY-MM-DD)
- **Purpose**: When is the next inspection due?
- **Example**: 2027-04-03
- **Optional**: Yes
- **Auto-calculated**: YES (from Last Date + Interval)
- **Can be overridden**: YES (user can set manually)

---

## Usage Examples

### Example 1: Annual Inspection
```
Input:
  Last Inspection Date: 2026-04-03
  Inspection Interval: 365 days

Result:
  Next Inspection Date: 2027-04-03 (auto-calculated)
```

### Example 2: Monthly Inspection
```
Input:
  Last Inspection Date: 2026-04-03
  Inspection Interval: 30 days

Result:
  Next Inspection Date: 2026-05-03 (auto-calculated)
```

### Example 3: Manual Override
```
Input:
  Last Inspection Date: 2026-04-03
  Inspection Interval: 365 days
  Next Inspection Date: 2026-06-01 (manually set)

Result:
  Next Inspection Date: 2026-06-01 (user's manual value)
  (NOT recalculated as 2027-04-03)
```

### Example 4: Partial Data
```
Input:
  Last Inspection Date: 2026-04-03
  Inspection Interval: (empty)

Result:
  Next Inspection Date: (empty - no auto-calculation)
```

---

## Code Changes - Summary

### In `materialSerialTracked.ts`

**Before**: Function only handled basic fields
```typescript
export async function createSerialTracked(data: {
  id: string
  beNumber?: string | null
  brandName?: string | null
  // ... other fields ...
})
```

**After**: Function now handles inspection fields
```typescript
export async function createSerialTracked(data: {
  id: string
  beNumber?: string | null
  brandName?: string | null
  // ... other fields ...
  lastInspectionDate?: Date | null
  nextInspectionDate?: Date | null
  inspectionIntervalDays?: number | null
})
```

**New Logic Added**:
```typescript
// Calculate nextInspectionDate if not provided but lastInspectionDate and inspectionIntervalDays are provided
let calculatedNextInspectionDate = nextInspectionDate
if (!calculatedNextInspectionDate && lastInspectionDate && inspectionIntervalDays) {
  const nextDate = new Date(lastInspectionDate)
  nextDate.setDate(nextDate.getDate() + inspectionIntervalDays)
  calculatedNextInspectionDate = nextDate
}
```

### In `serialTrackedFormDialog.tsx`

**Added to FormState type**:
```typescript
lastInspectionDate: string
nextInspectionDate: string
inspectionIntervalDays: string
```

**Enhanced setField() function**:
```typescript
function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
  setForm(prev => ({...prev, [key]: value}))
  
  // NEW: Auto-calculate when these fields change
  if (key === 'lastInspectionDate' || key === 'inspectionIntervalDays') {
    // ... auto-calculation logic ...
  }
}
```

**Added 3 new form fields**:
```typescript
<Input 
  type="date"
  id="lastInspectionDate"
  value={form.lastInspectionDate}
  onChange={e => setField('lastInspectionDate', e.target.value)}
/>

<Input
  type="number"
  min="1"
  id="inspectionIntervalDays"
  value={form.inspectionIntervalDays}
  onChange={e => setField('inspectionIntervalDays', e.target.value)}
/>

<Input
  type="date"
  id="nextInspectionDate"
  value={form.nextInspectionDate}
  onChange={e => setField('nextInspectionDate', e.target.value)}
/>
```

---

## How to Test

### Quick Test (5 minutes)

1. Start development server
2. Open Serial Tracked Item form (Create)
3. Enter a BE Number and select material
4. Scroll down to "Last Inspection Date"
5. Enter: 2026-04-03
6. Enter Inspection Interval: 365
7. **VERIFY**: "Next Inspection Date" automatically shows 2027-04-03
8. Click Save
9. Re-open item
10. **VERIFY**: All three dates are still there

### Complete Test (30 minutes)

1. Create item with all three inspection fields
2. Edit item and change Last Inspection Date
3. **VERIFY**: Next Inspection Date recalculates
4. Edit item and manually change Next Inspection Date
5. **VERIFY**: Manual date is preserved after save
6. Create item with empty inspection fields
7. **VERIFY**: Form saves without errors
8. Create item with only Last Inspection Date
9. **VERIFY**: Next Inspection Date stays empty (no auto-calc)

---

## Common Developer Tasks

### Add a New Inspection Field

If you need to add more inspection fields, follow this pattern:

1. **Add to Prisma schema** (`schema.prisma`)
   ```prisma
   inspectionNotes: String? @db.Text
   ```

2. **Add to FormState** (`serialTrackedFormDialog.tsx`)
   ```typescript
   inspectionNotes: string
   ```

3. **Add to form HTML**
   ```typescript
   <Textarea
     id="inspectionNotes"
     value={form.inspectionNotes}
     onChange={e => setField('inspectionNotes', e.target.value)}
   />
   ```

4. **Add to schema validation** (`materialSerialTrackedSchema.ts`)
   ```typescript
   inspectionNotes: z.string().max(500).nullable().optional()
   ```

5. **Add to DAL functions** (`materialSerialTracked.ts`)
   ```typescript
   export async function createSerialTracked(data: {
     // ... existing fields ...
     inspectionNotes?: string | null
   })
   ```

### Modify Auto-Calculation Logic

The auto-calculation is in `serialTrackedFormDialog.tsx` in the `setField()` function:

```typescript
if (key === 'lastInspectionDate' || key === 'inspectionIntervalDays') {
  // This is where the calculation happens
  if (updatedForm.lastInspectionDate && updatedForm.inspectionIntervalDays) {
    try {
      const lastDate = new Date(updatedForm.lastInspectionDate)
      const days = parseInt(updatedForm.inspectionIntervalDays, 10)
      if (!isNaN(lastDate.getTime()) && !isNaN(days) && days > 0) {
        const nextDate = new Date(lastDate)
        nextDate.setDate(nextDate.getDate() + days)
        const nextDateStr = nextDate.toISOString().split('T')[0]
        setForm(prev => ({...prev, nextInspectionDate: nextDateStr}))
      }
    } catch (e) {
      // Error handling
    }
  }
}
```

To modify:
- Change the condition on the first line to include new trigger fields
- Modify the calculation logic inside the try block
- Update the error handling as needed

### Add Server-Side Validation

If you need stricter validation, add it to:

**Option 1**: In schema (`materialSerialTrackedSchema.ts`)
```typescript
lastInspectionDate: z.coerce.date().min(new Date('2000-01-01')).nullable().optional()
```

**Option 2**: In server function (`materialSerialTracked.ts`)
```typescript
if (data.lastInspectionDate && data.lastInspectionDate > new Date()) {
  throw new Error('Last inspection date cannot be in the future')
}
```

---

## Debugging Tips

### Auto-calculation not working?
1. Check browser console for errors
2. Verify both fields are filled (no empty fields)
3. Verify interval is positive (> 0)
4. Check that field names match: `lastInspectionDate`, `inspectionIntervalDays`

### Data not saving?
1. Check form submission payload in Network tab
2. Verify inspection dates are valid
3. Check server console for errors
4. Verify Prisma schema is updated

### Tests failing?
1. Check date format is YYYY-MM-DD
2. Verify number inputs are positive integers
3. Check that Date objects are properly created
4. Verify timezone handling (use UTC dates)

---

## Files Reference

### Main Implementation Files
- `src/dal/materialSerialTracked.ts` - Backend logic for create/update
- `src/components/custom/serialTrackedFormDialog.tsx` - Frontend form UI

### Configuration Files (Already Updated)
- `src/schemas/materialSerialTrackedSchema.ts` - Validation schemas
- `prisma/schema.prisma` - Database definitions

### Documentation Files (New)
- `INSPECTION_IMPLEMENTATION_SUMMARY.md` - Detailed overview
- `INSPECTION_QUICK_REFERENCE.md` - Visual guides
- `INSPECTION_TESTING_CHECKLIST.md` - Test cases
- `INSPECTION_CODE_REFERENCE.md` - Code snippets
- `INSPECTION_CHANGELOG.md` - All changes

---

## Troubleshooting Checklist

- [ ] Database schema includes inspection fields
- [ ] Prisma client is regenerated (`npx prisma generate`)
- [ ] Form component imports are correct
- [ ] Server functions are typed correctly
- [ ] Date calculations handle edge cases (leap years, month boundaries)
- [ ] No TypeScript compilation errors
- [ ] No runtime console errors
- [ ] Form submits without validation errors
- [ ] Data persists after save and reload
- [ ] Auto-calculation works both client and server side

---

## Next Steps

1. **Test** the implementation with the Quick Test above
2. **Review** the documentation files created
3. **Run** the Testing Checklist (`INSPECTION_TESTING_CHECKLIST.md`)
4. **Deploy** to staging environment
5. **Get** user acceptance sign-off
6. **Deploy** to production
7. **Monitor** for any issues
8. **Plan** future enhancements (see `INSPECTION_CHANGELOG.md`)

---

## Questions?

Refer to:
- **How does it work?** → `INSPECTION_IMPLEMENTATION_SUMMARY.md`
- **Show me visual diagrams** → `INSPECTION_QUICK_REFERENCE.md`
- **What to test?** → `INSPECTION_TESTING_CHECKLIST.md`
- **Show me the code** → `INSPECTION_CODE_REFERENCE.md`
- **What changed?** → `INSPECTION_CHANGELOG.md`

---

**Last Updated**: April 3, 2026
**Status**: ✅ Ready for Development & Testing

