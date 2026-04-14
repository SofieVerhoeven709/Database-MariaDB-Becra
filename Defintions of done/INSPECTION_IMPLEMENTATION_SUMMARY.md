# Inspection Fields Implementation Summary

## Overview
Inspection management fields have been successfully integrated into the Material Serial Tracked system. This enables tracking of inspection schedules and automatic calculation of next inspection dates.

## Database Schema Changes

### MaterialSerialTrack Model
Added the following inspection-related fields:
- `lastInspectionDate` (Date): The date of the most recent inspection
- `inspectionIntervalValue` (Int): Numeric value for inspection interval (for more complex scheduling)
- `inspectionIntervalUnit` (Enum): Unit for inspection interval (DAY, WEEK, MONTH, YEAR)
- `nextInspectionDate` (Date): Automatically calculated or manually set date for the next inspection

### MaterialSerialTrackedStructure Model
Added inspection fields for individual tracked items:
- `lastInspectionDate` (DateTime)
- `nextInspectionDate` (DateTime)
- `inspectionIntervalDays` (Int): Inspection interval in days (simplified version)

## Form Implementation

### Form Fields Added
The `serialTrackedFormDialog.tsx` component now includes:

1. **Last Inspection Date** (Date Input)
   - Allows users to set when the last inspection occurred
   - Format: YYYY-MM-DD

2. **Inspection Interval (Days)** (Number Input)
   - Allows users to specify how many days between inspections
   - Minimum value: 1
   - Example: 365 for annual inspections

3. **Next Inspection Date** (Date Input - Read-Only Display with Manual Override)
   - Automatically calculated based on last inspection date + interval
   - Can be manually overridden if needed
   - Format: YYYY-MM-DD

### Auto-Calculation Logic
When a user updates either `lastInspectionDate` or `inspectionIntervalDays`, the form automatically:
1. Validates both fields are provided and valid
2. Creates a new Date from `lastInspectionDate`
3. Adds `inspectionIntervalDays` days to it
4. Updates `nextInspectionDate` with the calculated value
5. Formats the result as YYYY-MM-DD for display

**Note:** Users can still manually override the calculated `nextInspectionDate` if needed.

## Server-Side Implementation

### DAL Layer (`materialSerialTracked.ts`)

#### createSerialTracked()
- Extended to accept inspection parameters: `lastInspectionDate`, `nextInspectionDate`, `inspectionIntervalDays`
- Implements server-side calculation: if `nextInspectionDate` is not provided but `lastInspectionDate` and `inspectionIntervalDays` are, it calculates the next date
- Stores all values in the database via Prisma

#### updateSerialTracked()
- Extended to accept inspection parameters
- Implements the same server-side calculation logic
- Ensures `nextInspectionDate` is properly updated when inspection fields change

### Schema Validation (`materialSerialTrackedSchema.ts`)
Already configured with:
- `lastInspectionDate: z.coerce.date().nullable().optional()`
- `nextInspectionDate: z.coerce.date().nullable().optional()`
- `inspectionIntervalDays: z.coerce.number().int().positive().nullable().optional()`

## User Workflow

### Creating a Serial Tracked Item with Inspection
1. User opens "New Serial Tracked Item" dialog
2. Fills in basic material information (BE Number, Brand Name, etc.)
3. Sets "Last Inspection Date" (e.g., 2026-04-03)
4. Sets "Inspection Interval (Days)" (e.g., 365)
5. System automatically calculates "Next Inspection Date" (e.g., 2027-04-03)
6. User can manually adjust "Next Inspection Date" if needed
7. Saves the item

### Editing an Existing Item
1. User opens item in edit mode
2. Can update inspection dates
3. If "Last Inspection Date" and "Inspection Interval Days" are both filled, "Next Inspection Date" auto-updates
4. User can save changes

## Technical Details

### Date Handling
- Client-side: YYYY-MM-DD format (HTML5 date input)
- Server-side: JavaScript Date objects (converted to Prisma DateTime)
- Database: DATE type for MaterialSerialTrack, DateTime(0) for MaterialSerialTrackedStructure

### Calculation Edge Cases Handled
- Both `lastInspectionDate` and `inspectionIntervalDays` must be present to auto-calculate
- Negative or zero intervals are rejected
- Invalid date values are silently ignored (no error thrown to user)
- Manual override of `nextInspectionDate` always takes precedence

## Files Modified

1. **`src/dal/materialSerialTracked.ts`**
   - Updated `createSerialTracked()` with inspection field handling and auto-calculation
   - Updated `updateSerialTracked()` with inspection field handling and auto-calculation

2. **`src/components/custom/serialTrackedFormDialog.tsx`**
   - Added three inspection-related form fields
   - Implemented `setField()` enhancement for auto-calculation logic
   - Added user-friendly helper text for Next Inspection Date field

3. **`prisma/schema.prisma`** (already updated)
   - MaterialSerialTrack model includes inspection fields
   - MaterialSerialTrackedStructure model includes inspection fields

4. **`src/schemas/materialSerialTrackedSchema.ts`** (already updated)
   - Schema validation for inspection fields

## Future Enhancements

Possible improvements for future iterations:
1. Add inspection history tracking (record each inspection event)
2. Add automated alerts/notifications when `nextInspectionDate` is approaching
3. Add interval unit selector (days, weeks, months, years) to match MaterialSerialTrack model
4. Add bulk inspection date updates for multiple items
5. Add reports for overdue inspections
6. Integration with MaterialSerialTrackedStructure for individual item tracking

## Testing Recommendations

1. **Create Item with Inspection**
   - Set Last Inspection: 2026-04-03
   - Set Interval: 365 days
   - Verify Next Inspection calculates to: 2027-04-03

2. **Update Item Inspection**
   - Modify Last Inspection Date
   - Verify Next Inspection updates correctly

3. **Manual Override**
   - Set Last Inspection and Interval
   - Manually change Next Inspection Date
   - Verify the manual value is saved (not recalculated)

4. **Edge Cases**
   - Empty Last Inspection Date with valid Interval (should not auto-calculate)
   - Empty Interval with valid Last Inspection (should not auto-calculate)
   - Invalid date format (should be handled gracefully)
   - Negative or zero interval (should be rejected)

