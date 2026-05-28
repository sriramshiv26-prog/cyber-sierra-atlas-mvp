# Horizon 2: 5-Feature Enhancement Implementation Plan

**Status:** Planning Phase  
**Date Created:** 2026-05-28  
**Target Completion:** Week of 2026-06-02  
**Estimated Effort:** 18-24 hours  
**Estimated Cost:** $0 (all local Qwen2.5-coder)

---

## Overview

Five critical enhancements to transform the Atlas MVP from a "finding consolidation tool" into an "actionable risk intelligence platform." All features have zero external dependencies and leverage existing React/TypeScript/localStorage stack.

---

## Feature Summary

| # | Feature | Priority | Effort | Status | Type |
|---|---------|----------|--------|--------|------|
| 1 | Smart Duplicate Detection | P1 | 4-5h | Planning | Data Quality |
| 2 | Overdue Items Tracking | P2 | 3-4h | Planning | Operations |
| 3 | RCA Registration & Display | P3 | 2-3h | Planning | Context |
| 4 | Editable Remediation Plans | P4 | 3-4h | Planning | UX |
| 5 | Business Impact Analysis | P5 | 6-8h | Deferred | Strategy |

**Total:** 18-24 hours | **Cost:** $0 | **Model:** Qwen2.5-coder-1.5B (local)

---

## Feature 1: Smart Duplicate Detection (PRIORITY 1)

### Problem
Currently, the deduplication logic may collapse findings that share the same vulnerability type but affect different assets, departments, or business contexts. This creates false positive deduplication and obscures asset-specific remediation paths.

### Solution
Implement context-aware duplicate detection that:
- Identifies findings as duplicates only if they have the SAME vulnerability AND SAME asset context
- Allows same vulnerability across different assets (e.g., "SQL Injection on Payment API" vs "SQL Injection on User API")
- Provides manual override/confirmation UI to let analysts flag false negatives

### Files Modified
- `src/lib/parser.ts` — Refine dedup algorithm in `detectAndParseFile()`
- `src/lib/schema.ts` — Add `is_confirmed_unique?: boolean` and `duplicate_group_id?: string`
- `src/components/FindingsList.jsx` — Add "Duplicate Management" filter/modal
- `src/lib/dedup-rules.ts` — Create new file with configurable dedup logic

### Implementation Tasks
1. Write unit tests for dedup rules (test both same-asset and cross-asset scenarios)
2. Implement context-aware matching algorithm
3. Add duplicate group UI with accept/reject/merge workflow
4. Manual verification: Test with 20+ sample findings from same org

### Success Criteria
- Dedup detection catches 95%+ of true duplicates
- Zero false positives on distinct-asset findings
- Manual override UI shows merged findings clearly

---

## Feature 2: Overdue Items Tracking (PRIORITY 2)

### Problem
Remediation teams have no visibility into which findings are overdue for remediation. No SLA tracking, no follow-up reminders, no escalation path.

### Solution
Add operational dashboard and filtering to highlight overdue findings:
- Dashboard KPI card showing count of overdue findings (due_date < now())
- Click-through detail page showing owner, days overdue, current status
- Filter in FindingsList for "Show only overdue"
- Risk score bonus for findings overdue >30 days (increases risk by 20%)

### Files Modified
- `src/components/DashboardView.jsx` — Add overdue KPI card
- `src/components/FindingsList.jsx` — Add overdue filter
- `src/lib/scoring.ts` — Add overdue days to risk calculation
- `src/components/OverdueDetailModal.jsx` — New component for detail view

### Implementation Tasks
1. Add overdue calculation utility function
2. Update Dashboard to show overdue metrics
3. Create OverdueDetailModal component
4. Add filter to FindingsList
5. Test with findings having various due_date scenarios

### Success Criteria
- Dashboard correctly identifies all findings with due_date < now()
- Overdue detail page shows owner + status + days overdue
- Risk scoring penalizes overdue findings appropriately

---

## Feature 3: RCA Registration & Genealogy Display (PRIORITY 3)

### Problem
Finding genealogy shows relationships but not causality. Without root cause context, analysts can't understand "why" a finding exists, only "what" related.

### Solution
Add structured RCA (Root Cause Analysis) field to findings and display in genealogy:
- New `root_cause?: string` field in Finding schema
- RCA input textarea in FindingDrawer (5-10 sentence narrative)
- Optional: Predefined RCA categories dropdown (Configuration, Missing Patch, Weak Controls, Design Flaw)
- Display RCA in GenealogyView alongside finding relationships

### Files Modified
- `src/lib/schema.ts` — Add root_cause field
- `src/components/FindingDrawer.jsx` — Add RCA input area
- `src/components/GenealogyView.jsx` — Display RCA in finding detail section
- `src/lib/templates.ts` — Add RCA suggestions to templates

### Implementation Tasks
1. Update schema with root_cause field
2. Add RCA input UI to FindingDrawer
3. Create RCA category helper (optional)
4. Update GenealogyView to display RCA
5. Add sample RCA data to 10+ templates

### Success Criteria
- RCA field is accessible in FindingDrawer
- GenealogyView displays RCA context
- 10+ findings populated with meaningful RCA

---

## Feature 4: Editable Remediation Plans (PRIORITY 4)

### Problem
LLM-generated remediation plans are suggestions, not gospel. Enterprise users need to override, modify, and confirm plans before executing them.

### Solution
Split remediation field into AI-suggested vs user-confirmed versions:
- `remediation_suggested: string` (AI-generated by Claude)
- `remediation_confirmed: string` (user-approved/modified version)
- Track `remediation_last_modified_by` and `remediation_last_modified_at`
- UI shows both versions with delta highlighting

### Files Modified
- `src/lib/schema.ts` — Update remediation fields
- `src/components/FindingDrawer.tsx` — Add edit/confirm workflow for remediation
- `src/lib/llm.ts` — Store suggestion vs confirmation separately
- `src/components/DashboardView.jsx` — Show audit trail for remediation changes

### Implementation Tasks
1. Update schema with new remediation fields
2. Update FindingDrawer with edit/confirm buttons
3. Implement delta display (show what user changed)
4. Track modification history
5. Test with at least 5 override scenarios

### Success Criteria
- User can modify AI suggestions without losing original
- Audit trail tracks who made changes and when
- Delta display shows clear before/after

---

## Feature 5: Business Impact Analysis (PRIORITY 5 — DEFERRED TO HORIZON 3)

### Problem
Technical risk scores don't translate to business context. A "Critical" SQL Injection on a dev server has zero business impact; a "High" data exfiltration on payment processing could cost millions.

### Solution
Integrate asset business criticality metadata and calculate "business impact score" for findings:
- Asset enrichment: `business_criticality` (1-5), `mtpd` (Max Time To Protect Data), `max_downtime_cost` ($/hour), `data_classification`
- Business Impact Score = Finding Risk × Asset Criticality
- BlastRadiusView enhancement: Show service context + impact cost
- New dashboard chart: "Business Impact Trend" (cost exposed over time)

### Files Modified
- `src/lib/schema.ts` — Extend Asset with criticality metadata
- `src/components/BlastRadiusView.jsx` — Add ServiceImpactCard component
- `src/lib/impact-scoring.ts` — New file with business impact calculation
- `src/components/DashboardView.jsx` — Add business impact trend chart

### Implementation Tasks
1. Define asset criticality scale and mapping
2. Update asset schema
3. Build ServiceImpactCard UI
4. Implement impact scoring calculation
5. Create business impact trend visualization
6. Manual data entry for 10+ critical assets (business team work)

### Success Criteria
- Asset criticality data available for 80%+ of assets
- Impact scores correlate with business assessment
- Dashboard impact trend shows meaningful trends

### Status: DEFERRED
**Reason:** Requires business data (asset criticality, downtime costs) not yet available. Recommend Phase 3 after business team maps critical assets.

---

## Implementation Sequence

```
Week 1, Day 1-2: Feature 1 (Smart Duplicate Detection) — 4-5h
  └─ Schema updates, dedup logic, duplicate management UI, tests

Week 1, Day 2: Feature 2 (Overdue Items) — 3-4h
  └─ Dashboard card, detail modal, filtering, risk penalty

Week 1, Day 3: Feature 3 (RCA Registration) — 2-3h
  └─ Schema, input UI, genealogy display

Week 1, Day 4: Feature 4 (Editable Remediation) — 3-4h
  └─ Schema split, edit/confirm workflow, audit trail

Week 2, Day 1-2: Testing & Code Review — 3-4h
  └─ Integration tests, regression tests, code review

Week 2, Day 3: Documentation & GitHub — 2h
  └─ Update README, commit, push, create release notes
```

---

## Risk & Mitigation

| Feature | Risk | Mitigation |
|---------|------|-----------|
| Smart Dedup | Logic bugs in dedup algorithm | Extensive unit tests (20+ scenarios); manual verification of first 10 grouped findings |
| Overdue | Null due_dates cause errors | Filter nulls; show warning count separately |
| RCA | Free-form text leads to inconsistent data | Add category dropdown + examples |
| Editable Plans | Users lose original suggestions | Version history + store both AI + confirmed |
| Business Impact | Asset data incomplete | Flag "Impact pending" until business team provides data |

---

## Cost Analysis

**All $0 cost** because:
1. No external APIs (all React component updates)
2. No Claude API calls (using Qwen2.5-coder for all code generation)
3. No new services (localStorage + existing stack)
4. Testing: Local Jest + React Testing Library

**Time Breakdown:**
- Code generation: 8-10h (Qwen2.5-coder)
- Testing: 3-4h (Jest, RTL)
- Code review: 2h
- Documentation: 1-2h
- Git operations: 0.5h

---

## Dependencies

✅ **Zero external dependencies** for Features 1-4  
⚠️ **Data dependency** for Feature 5: Business team must provide asset criticality data

---

## Success Metrics

1. **Smart Dedup:** Duplicate detection accuracy >95%; zero false positives
2. **Overdue Tracking:** All overdue findings visible in dashboard; SLA violations tracked
3. **RCA Display:** Finding genealogy enriched with root cause; 10+ findings with RCA
4. **Editable Plans:** Users can override 100% of suggestions; audit trail complete
5. **Business Impact:** (Phase 3) Asset criticality mapped for 80%+ of assets

---

## Next Steps

1. ✅ Task cost analysis (DONE)
2. ✅ Implementation plan (DONE)
3. ⏭️ Feature 1 implementation (Smart Duplicate Detection)
4. ⏭️ Feature 2 implementation (Overdue Items)
5. ⏭️ Features 3-4 implementation (RCA + Editable Plans)
6. ⏭️ Integration testing + code review
7. ⏭️ GitHub push + documentation

---

## References

- Design Spec: `docs/superpowers/specs/2026-05-27-cyber-sierra-atlas-mvp-design.md`
- Current Implementation: Latest commits in `src/`
- GitHub Repo: https://github.com/sriramshiv26-prog/cyber-sierra-atlas-mvp
