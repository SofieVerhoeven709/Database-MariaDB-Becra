# Inspection Fields - Testing Checklist

## Pre-Testing Setup
- [ ] Database migrations applied (if any migrations were generated)
- [ ] Development server running
- [ ] Browser console open to check for errors
- [ ] Test user account ready

## Form Display Tests

### When Creating New Item
- [ ] "Last Inspection Date" field is visible
- [ ] "Inspection Interval (Days)" field is visible  
- [ ] "Next Inspection Date" field is visible
- [ ] Fields are in correct position in form (after Rejected toggle, before Long Description)
- [ ] Date fields accept YYYY-MM-DD format
- [ ] Interval field accepts positive integers only

### When Editing Existing Item
- [ ] All three inspection fields are pre-populated with existing values
- [ ] Last Inspection Date shows correctly formatted date
- [ ] Inspection Interval shows as number
- [ ] Next Inspection Date shows correctly formatted date

### Field Validation
- [ ] Can leave all inspection fields empty
- [ ] Can fill only Last Inspection Date without error
- [ ] Can fill only Inspection Interval without error
- [ ] Cannot enter negative inspection interval
- [ ] Cannot enter 0 as inspection interval
- [ ] Can enter very large interval values (e.g., 10000 days)
- [ ] Invalid dates are rejected by browser date picker

## Auto-Calculation Tests

### Test 1: Basic Auto-Calculation
1. Open Create Item dialog
2. Fill "Last Inspection Date": 2026-04-03
3. Fill "Inspection Interval (Days)": 365
4. **Expected Result**: "Next Inspection Date" auto-fills with 2027-04-03
- [ ] Next Inspection Date updates automatically
- [ ] Calculation is mathematically correct
- [ ] Format is YYYY-MM-DD

### Test 2: Recalculation on Date Change
1. Open Create Item dialog
2. Fill "Last Inspection Date": 2026-04-03
3. Fill "Inspection Interval (Days)": 365
4. Change "Last Inspection Date" to: 2026-05-03
5. **Expected Result**: "Next Inspection Date" updates to 2027-05-03
- [ ] Next Inspection Date recalculates
- [ ] New calculation is correct

### Test 3: Recalculation on Interval Change
1. Open Create Item dialog
2. Fill "Last Inspection Date": 2026-04-03
3. Fill "Inspection Interval (Days)": 365
4. Change "Inspection Interval (Days)" to: 90
5. **Expected Result**: "Next Inspection Date" updates to 2026-07-02
- [ ] Next Inspection Date recalculates
- [ ] New calculation is correct

### Test 4: Manual Override
1. Open Create Item dialog
2. Fill "Last Inspection Date": 2026-04-03
3. Fill "Inspection Interval (Days)": 365
4. Next Inspection Date auto-fills: 2027-04-03
5. Manually change "Next Inspection Date" to: 2026-06-01
6. Save the item
7. Reopen item in edit mode
8. **Expected Result**: Next Inspection Date remains 2026-06-01 (not recalculated)
- [ ] Manual override is preserved after save
- [ ] Value is not recalculated on reopen
- [ ] No errors occur

### Test 5: Partial Data - No Auto-Calc
1. Open Create Item dialog
2. Fill only "Last Inspection Date": 2026-04-03
3. Leave "Inspection Interval (Days)" empty
4. **Expected Result**: "Next Inspection Date" remains empty
- [ ] No auto-calculation occurs
- [ ] No errors in console

### Test 6: Partial Data - No Auto-Calc (Reverse)
1. Open Create Item dialog
2. Fill only "Inspection Interval (Days)": 365
3. Leave "Last Inspection Date" empty
4. **Expected Result**: "Next Inspection Date" remains empty
- [ ] No auto-calculation occurs
- [ ] No errors in console

### Test 7: Leap Year Calculation
1. Open Create Item dialog
2. Fill "Last Inspection Date": 2024-02-29 (leap year date)
3. Fill "Inspection Interval (Days)": 365
4. **Expected Result**: "Next Inspection Date" calculates correctly (2025-02-28)
- [ ] Leap year is handled correctly
- [ ] Calculation doesn't create invalid date

## Data Persistence Tests

### Create and Save
1. Fill serial tracked item form with all fields
2. Set Last Inspection Date: 2026-04-03
3. Set Inspection Interval: 365
4. Next Inspection Date auto-calculates: 2027-04-03
5. Save item
6. **Expected Result**: Item is created with inspection data in database
- [ ] Item saves without errors
- [ ] No console errors
- [ ] Inspection fields are stored

### Retrieve and Display
1. Create an item with inspection data (see above)
2. Re-open item for editing
3. **Expected Result**: All inspection fields are populated with saved values
- [ ] Last Inspection Date displays correctly
- [ ] Inspection Interval displays correctly
- [ ] Next Inspection Date displays correctly
- [ ] All values match what was saved

### Update Values
1. Open existing item for editing
2. Change Last Inspection Date to: 2026-05-01
3. Save
4. Re-open for editing
5. **Expected Result**: New date is displayed
- [ ] Updated value is saved
- [ ] Updated value persists after reopen
- [ ] No data loss

### Update with Recalculation
1. Open existing item for editing
2. Last Inspection Date: 2026-04-03, Interval: 365, Next: 2027-04-03
3. Change Last Inspection Date to: 2026-05-01
4. Change Inspection Interval to: 90
5. **Expected Result**: 
   - Next Inspection Date should be empty (since we changed multiple fields)
   - OR it should recalculate to 2026-07-30 (2026-05-01 + 90 days)
- [ ] Form behaves consistently with specification
- [ ] Changes are saved correctly
- [ ] No errors occur

## Server-Side Calculation Tests

### Verify Server-Side Calc (Create)
1. Create item via form with:
   - Last Inspection Date: 2026-04-03
   - Inspection Interval: 365
   - Next Inspection Date: (leave empty for auto-calc)
2. Check database directly
3. **Expected Result**: Database shows Next Inspection Date as 2027-04-03
- [ ] Server calculates date correctly
- [ ] Value is stored in database
- [ ] No null values when calculation occurred

### Verify Server-Side Calc (Update)
1. Edit existing item to:
   - Last Inspection Date: 2026-04-03
   - Inspection Interval: 365
   - Next Inspection Date: (leave empty for auto-calc)
2. Save
3. Check database directly
4. **Expected Result**: Database shows Next Inspection Date as 2027-04-03
- [ ] Server calculates date correctly
- [ ] Updated value is stored in database

### Verify Manual Override on Server
1. Create item with:
   - Last Inspection Date: 2026-04-03
   - Inspection Interval: 365
   - Next Inspection Date: 2026-06-01 (manually set)
2. Check database directly
3. **Expected Result**: Database shows Next Inspection Date as 2026-06-01 (not the calculated 2027-04-03)
- [ ] Manual override is respected
- [ ] Server doesn't override user's manual value

## Error Handling Tests

### Invalid Date Format
- [ ] Entering "invalid" in date field shows browser error
- [ ] Browser prevents form submission with invalid dates
- [ ] No server errors occur

### Invalid Interval
- [ ] Entering "-5" in interval field shows validation error
- [ ] Entering "0" in interval field shows validation error
- [ ] Entering "abc" in interval field shows validation error
- [ ] Form prevents submission with invalid interval

### Database Errors
- [ ] If database is unavailable, user sees friendly error message
- [ ] Error message suggests retrying
- [ ] No sensitive information in error message
- [ ] Form remains open for user to retry

## UI/UX Tests

### Field Labels and Help Text
- [ ] "Last Inspection Date" label is clear
- [ ] "Inspection Interval (Days)" label indicates unit is days
- [ ] "Next Inspection Date" has helpful tooltip/description
- [ ] Description says "Auto-calculated from last inspection date + interval, or set manually"

### Visual Feedback
- [ ] Required fields are clearly marked (or marked as optional)
- [ ] Input fields have appropriate placeholder text
- [ ] Date picker works correctly on all browsers
- [ ] Number input spinner works correctly

### Responsive Design
- [ ] Form fields are readable on mobile
- [ ] Form fields are readable on tablet
- [ ] Form fields are readable on desktop
- [ ] All three inspection fields are visible without scrolling

### Accessibility
- [ ] Field labels are properly associated with inputs (label for/id)
- [ ] Tab order is logical
- [ ] Date picker is keyboard accessible
- [ ] Screen reader can identify field purposes

## Cross-Browser Tests

- [ ] Chrome - Date input works
- [ ] Firefox - Date input works
- [ ] Safari - Date input works
- [ ] Edge - Date input works
- [ ] Mobile Safari - Date picker accessible
- [ ] Chrome Mobile - Date picker accessible

## Integration Tests

### With Other Fields
- [ ] Changing inspection fields doesn't affect other form fields
- [ ] Inspection fields don't interfere with BE Number selection
- [ ] Inspection fields don't interfere with company selection
- [ ] Inspection fields work correctly alongside all other form fields

### Duplicate Item
1. Create item with inspection data
2. Open item and select "Duplicate" mode
3. **Expected Result**: Inspection fields are pre-filled from original
- [ ] Last Inspection Date is copied
- [ ] Inspection Interval is copied
- [ ] Next Inspection Date is copied
- [ ] User can modify before saving

## Performance Tests

- [ ] Auto-calculation happens instantly (no lag)
- [ ] Form submission with inspection data completes within 2 seconds
- [ ] No memory leaks when opening/closing form multiple times
- [ ] Form remains responsive with large interval values (e.g., 100000)

## Regression Tests

- [ ] Creating item without inspection data still works
- [ ] Editing item without touching inspection fields still works
- [ ] Deleting item with inspection data works
- [ ] All existing validation rules still apply
- [ ] No errors with empty inspection fields

## Documentation Tests

- [ ] Code comments explain auto-calculation logic
- [ ] Comments explain Date handling approach
- [ ] Function signatures are clear about inspection parameters
- [ ] Example calculations are documented

---

## Sign-Off

After completing all tests:

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] No console errors
- [ ] No database inconsistencies
- [ ] User acceptance is obtained
- [ ] Ready for production deployment

**Date Tested**: _______________
**Tested By**: _______________
**Sign-Off**: _______________

