# Frontend Design Review: Phase 2B Backend Alignment

**Date:** 2026-05-29  
**Scope:** Identify all backend changes from Phase 2B and required frontend mockup updates  
**Status:** Review document (mockup updates follow)

---

## Overview

Phase 2B added 4 operational features with corresponding backend implementation. This document maps each backend feature to required frontend design changes.

**Backend Features Implemented:**
1. ✅ Smart Duplicate Detection
2. ✅ Overdue Items Tracking
3. ✅ RCA Registration & Display
4. ✅ Editable Remediation Plans

---

## Feature 1: Smart Duplicate Detection

### Backend Changes
- Schema: Added `is_confirmed_unique`, `duplicate_group_id` fields
- Algorithm: `isSameFinding()` - context-aware (same type + asset)
- Store: 3 actions (mergeDuplicates, confirmUnique, unmarkDuplicate)
- RegisterView: Added "Flags" column + filter

### Frontend Design Changes REQUIRED

#### 1.1 RegisterView - Flags Column (NEW)
**Location:** Findings table, new column after "Severity" column  
**Content:** Color-coded badges

```
┌──────────────────────────────────────────────────────────────┐
│ Title        │ Asset  │ Severity │ Flags       │ Status      │
├──────────────────────────────────────────────────────────────┤
│ Finding 1    │ API    │ High     │ Duplicate   │ Open        │
│ Finding 2    │ API    │ High     │ ✓ Unique    │ Open        │
│ Finding 3    │ DB     │ Medium   │ ? Review    │ In Progress │
└──────────────────────────────────────────────────────────────┘
```

**Badge Styles:**
- Blue "Duplicate" badge (if duplicate_group_id exists)
- Green "✓ Unique" badge (if is_confirmed_unique === true)
- Yellow "? Review" badge (if status review needed)
- Orange "Overdue" badge (if due_date < now - overlaps with Feature 2)

**Design Specifications:**
- Badge height: 24px
- Font size: 12px
- Padding: 4px 8px
- Border radius: 4px
- Background: semi-transparent (see color specs below)
- Dark mode: Adjust opacity for visibility

```css
/* Suggested badge styles */
.badge-duplicate {
  background: #DBEAFE;  /* light-blue-100 */
  color: #1E40AF;       /* blue-900 */
  dark:background: #0C2340/30;  /* blue-900/30 */
  dark:color: #93C5FD;  /* light-blue-300 */
}

.badge-unique {
  background: #DCFCE7;  /* light-green-100 */
  color: #166534;       /* green-900 */
  dark:background: #052E16/30;  /* green-900/30 */
  dark:color: #86EFAC;  /* light-green-300 */
}

.badge-review {
  background: #FEF3C7;  /* light-yellow-100 */
  color: #B45309;       /* yellow-900 */
  dark:background: #2D2015/30;  /* yellow-900/30 */
  dark:color: #FEDE12;  /* light-yellow-400 */
}
```

#### 1.2 RegisterView - Filter Control (NEW)
**Location:** Filter bar, new toggle button  
**Label:** "Duplicates Only"

```
┌────────────────────────────────────────────────────────┐
│ [Filters] [Severity ▼] [Status ▼] [Duplicates Only]   │
└────────────────────────────────────────────────────────┘
```

**Behavior:**
- Toggle button (not dropdown)
- Blue highlight when active
- Filters findings where duplicate_group_id exists OR (is_confirmed_unique === false)
- Works with existing Severity/Status filters (AND logic)

#### 1.3 DuplicateModal (NEW)
**Location:** Modal overlay (appears when user clicks "Merge" button from toolbar)  
**Content:** Merge workflow for duplicate findings

```
┌──────────────────────────────────────────────────────────┐
│ Merge Duplicate Findings                          [×]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Select Master Finding (merging others into this):       │
│                                                          │
│ ◉ Finding 1: SQL Injection on /api/users               │
│   Asset: Payment API | Severity: High                  │
│                                                          │
│ ○ Finding 2: SQL Injection on /api/users               │
│   Asset: Payment API | Severity: High                  │
│                                                          │
│ ○ Finding 3: SQL Injection on /api/users               │
│   Asset: Payment API | Severity: High                  │
│                                                          │
│ Duplicates to merge:                                   │
│ ┌────────────────────────────────────┐                │
│ │ ▪ Finding 2 (High)                 │                │
│ │ ▪ Finding 3 (High)                 │                │
│ └────────────────────────────────────┘                │
│                                                          │
│ After merge: Finding 1 will be marked as confirmed     │
│ unique and others will be linked to it.                │
│                                                          │
│ [Cancel]                                    [Merge]    │
└──────────────────────────────────────────────────────────┘
```

**Modal Dimensions:**
- Width: 600px
- Max-height: 80vh
- Dark mode: Full support

**Elements:**
- Title with close button (×)
- Radio button group for master selection
- Each option shows: title, asset_name, severity
- Duplicates box showing items to be merged
- Info box with explanation (border-left: 4px blue)
- Cancel + Merge buttons (standard placement)

---

## Feature 2: Overdue Items Tracking

### Backend Changes
- Schema: Added `due_date` field (used for overdue calculation)
- Scoring: Risk penalty +20-40% for overdue findings
- DashboardView: Overdue KPI tile (clickable)
- RegisterView: "Overdue Only" filter

### Frontend Design Changes REQUIRED

#### 2.1 Dashboard - Overdue KPI (ENHANCED)
**Location:** KPI row, 5th tile (new or modified)

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Total    │ Active   │ Critical │ Overdue  │ Assets   │  ← NEW
│ 42       │ 18       │ 5        │ 7        │ 12       │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Overdue Tile Styling:**
- Text color: #D97706 (orange-600) for highlight
- Dark mode: #FCD34D (amber-300)
- Clickable (cursor: pointer, hover effect)
- Shows count of findings with due_date < now

#### 2.2 OverdueDetailModal (NEW)
**Location:** Modal overlay (appears when Overdue KPI clicked)  
**Content:** List of overdue findings with details

```
┌──────────────────────────────────────────────────────────┐
│ Overdue Findings (7)                              [×]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ╭─────────────────────────────────────────────────────╮ │
│ │ ⚠ SQL Injection /api/users                         │ │
│ │    Asset: Payment API                              │ │
│ │    Severity: HIGH | Status: Open                   │ │
│ │    Owner: John Doe | Days Overdue: 15 days        │ │
│ ╰─────────────────────────────────────────────────────╯ │
│                                                          │
│ ╭─────────────────────────────────────────────────────╮ │
│ │ ⚠ Missing MFA on admin                             │ │
│ │    Asset: Auth Module                              │ │
│ │    Severity: CRITICAL | Status: In Progress        │ │
│ │    Owner: Jane Smith | Days Overdue: 42 days      │ │
│ ╰─────────────────────────────────────────────────────╯ │
│                                                          │
│ [Close]                                                 │
└──────────────────────────────────────────────────────────┘
```

**Modal Dimensions:**
- Width: 700px
- Max-height: 90vh
- Scrollable if > 5 findings

**Each Finding Card:**
- Border: left 4px, orange (#FCD34D) if overdue, red if critical
- Padding: 16px
- Margin-bottom: 12px
- Shows: title, asset_name, severity, status, owner, days overdue
- Dark mode: Full support

#### 2.3 RegisterView - Overdue Filter (NEW)
**Location:** Filter bar, similar to "Duplicates Only"  
**Label:** "Overdue Only"

```
┌────────────────────────────────────────────────────────┐
│ [Filters] [Severity ▼] [Duplicates Only] [Overdue]    │
└────────────────────────────────────────────────────────┘
```

**Behavior:**
- Toggle button
- Orange highlight when active
- Filters findings where due_date < now()

---

## Feature 3: RCA Registration & Display

### Backend Changes
- Schema: Added `root_cause` (textarea), `rca_category` (dropdown)
- FindingDrawer: New RCA input section
- GenealogyView: New RCA display section

### Frontend Design Changes REQUIRED

#### 3.1 FindingDrawer - RCA Input Section (NEW)
**Location:** New section in FindingDrawer, after "Severity" section  
**Content:** Textarea + category dropdown

```
┌──────────────────────────────────────────────────────┐
│ ℹ Root Cause Analysis (RCA)                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Description (5-10 sentences):                       │
│ ┌──────────────────────────────────────────────────┐│
│ │ The admin account lacked MFA enforcement due to  ││
│ │ a configuration oversight in the IdP. The team   ││
│ │ assumed the setting was applied globally, but    ││
│ │ it only applied to new accounts created after... ││
│ │                                                  ││
│ │                                        [4 rows] ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ Category:                                           │
│ [Configuration Error ▼]                            │
│   ↳ Configuration Error                            │
│   ↳ Missing Security Patch                         │
│   ↳ Weak Security Controls                         │
│   ↳ Design Flaw                                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Textarea Specifications:**
- Rows: 4
- Placeholder: "Describe the root cause in 5-10 sentences..."
- Icon: ℹ (blue, size 18)
- Dark mode: Full support

**Category Dropdown:**
- Options: 4 predefined categories
- Default: (empty/none)
- Icon: (same as parent section)

#### 3.2 GenealogyView - RCA Display (NEW)
**Location:** New section below genealogy flow diagram  
**Content:** RCA text + category badge

```
┌──────────────────────────────────────────────────────┐
│ [Genealogy Diagram Here]                             │
│                                                      │
├──────────────────────────────────────────────────────┤
│ ℹ Root Cause Analysis                               │
├──────────────────────────────────────────────────────┤
│                                                      │
│ The admin account lacked MFA enforcement due to     │
│ a configuration oversight in the IdP. The team      │
│ assumed the setting was applied globally, but       │
│ it only applied to new accounts created after...    │
│                                                      │
│ Category: ┌───────────────────────┐               │
│           │ Configuration Error    │               │
│           └───────────────────────┘               │
└──────────────────────────────────────────────────────┘
```

**Display Styling:**
- Only show if root_cause is populated
- Blue border-left (4px) separator
- Icon: ℹ (size 18, blue)
- Category badge: blue background, rounded, 12px font
- Whitespace preserved (preserve line breaks from textarea)
- Dark mode: Adjust colors for visibility

**Conditional Rendering:**
```jsx
{selectedFinding?.root_cause && (
  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
    {/* RCA display here */}
  </div>
)}
```

---

## Feature 4: Editable Remediation Plans

### Backend Changes
- Schema: Split remediation into `remediation_suggested` (AI) vs `remediation_confirmed` (user-approved)
- Schema: Added audit trail fields (`remediation_last_modified_by`, `remediation_last_modified_at`)
- FindingDrawer: New editable remediation section (3-state workflow)
- Store: Action to update remediation status

### Frontend Design Changes REQUIRED

#### 4.1 FindingDrawer - Editable Remediation Section (NEW)
**Location:** New section after Remediation field (replace existing or add new)  
**Content:** 3-state workflow (View → Edit → View Confirmed)

**STATE 1: View AI Suggestion**
```
┌──────────────────────────────────────────────────────┐
│ Remediation Plan                                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ◉ AI Suggestion (Claude)                           │
│ ┌──────────────────────────────────────────────────┐│
│ │ Implement MFA enforcement across all user        ││
│ │ accounts. First, enable MFA in the IdP config    ││
│ │ for all existing users. Then, add MFA prompt...  ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ [Confirm & Edit]                                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**STATE 2: Edit Mode**
```
┌──────────────────────────────────────────────────────┐
│ Remediation Plan                                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ◉ AI Suggestion (Claude)                           │
│ ┌──────────────────────────────────────────────────┐│
│ │ [Editable textarea - user modified text]         ││
│ │ Implement MFA enforcement across all user        ││
│ │ accounts. Priority: CRITICAL. Timeline: 2 weeks. ││
│ │ Owner: Security Team.                            ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ [✓ Confirm Plan]  [✕ Cancel]                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**STATE 3: View Confirmed (Green Box)**
```
┌──────────────────────────────────────────────────────┐
│ Remediation Plan                                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ✓ Confirmed Plan                                    │
│ ┌──────────────────────────────────────────────────┐│
│ │ Implement MFA enforcement across all user        ││
│ │ accounts. Priority: CRITICAL. Timeline: 2 weeks. ││
│ │ Owner: Security Team.                            ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ Last modified by: John Doe                          │
│ Last modified at: 2026-05-29 14:32:15               │
│                                                      │
│ [Edit Again]                                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Visual Specifications:**

| State | Background | Icon | Text Color | Border |
|-------|-----------|------|-----------|--------|
| Suggestion | #DBEAFE (blue-100) | None | #1E40AF (blue-900) | 1px #3B82F6 |
| Confirmed | #DCFCE7 (green-100) | ✓ | #166534 (green-900) | 1px #22C55E |
| Dark Mode | Adjust opacity 20% | — | Adjust lightness | — |

**Buttons:**
- "Confirm & Edit": Text button, blue text, underline on hover
- "✓ Confirm Plan": Primary button, green background
- "✕ Cancel": Text button, red text
- "Edit Again": Text button, blue text (STATE 3 only)

**Audit Trail Display (STATE 3 only):**
- Small text, gray color (#6B7280)
- Dark mode: #9CA3AF
- Format: "Last modified by: [user] | Last modified at: [timestamp]"
- Timestamp format: YYYY-MM-DD HH:MM:SS (24-hour)

---

## Summary of Design Changes Required

### New UI Components
1. ✓ "Flags" column in RegisterView (4 badge types)
2. ✓ "Duplicates Only" filter toggle
3. ✓ DuplicateModal (merge workflow)
4. ✓ Overdue KPI (clickable, orange)
5. ✓ OverdueDetailModal (list of overdue findings)
6. ✓ "Overdue Only" filter toggle
7. ✓ RCA input section in FindingDrawer
8. ✓ RCA display section in GenealogyView
9. ✓ Editable remediation section (3-state) in FindingDrawer

### Color Palette Additions
- Duplicate badge: Blue (#DBEAFE, #1E40AF)
- Unique badge: Green (#DCFCE7, #166534)
- Review badge: Yellow (#FEF3C7, #B45309)
- Overdue highlight: Orange (#FCD34D, #D97706)

### Responsive Design Considerations
- Badges scale on mobile (reduce padding)
- Modal width adjusts (600-700px → 100% - 32px on mobile)
- Filter buttons stack if needed
- RCA textarea maintains 4-row height on all screens

### Dark Mode Requirements
- All new components fully styled with `dark:` classes
- Ensure sufficient contrast (WCAG AA minimum)
- Verify readability of badges in dark mode
- Test modal overlays with dark background

---

## Mockup Update Checklist

- [ ] Add Flags column to RegisterView findings table
- [ ] Add badge styles (Duplicate, Unique, Review, Overdue)
- [ ] Add "Duplicates Only" filter toggle to RegisterView
- [ ] Create DuplicateModal visual design (radio buttons, merge workflow)
- [ ] Create Overdue KPI tile (orange, clickable)
- [ ] Create OverdueDetailModal (finding cards with details)
- [ ] Add "Overdue Only" filter toggle to RegisterView
- [ ] Add RCA input section to FindingDrawer (textarea + dropdown)
- [ ] Add RCA display section to GenealogyView (blue border, category badge)
- [ ] Add editable remediation section to FindingDrawer (3-state workflow)
- [ ] Update all components with dark mode support
- [ ] Test responsive design on mobile/tablet/desktop
- [ ] Verify color contrast (WCAG AA)
- [ ] Document all new interactive elements

---

## Frontend Design Alignment: Complete

All Phase 2B backend features have corresponding frontend design specifications. The mockup should be updated to include all elements listed in this document before frontend development begins on GPU machine.
