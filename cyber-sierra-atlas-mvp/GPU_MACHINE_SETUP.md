# GPU Machine Setup & Phase 2B Implementation Guide

**Date:** 2026-05-29  
**Status:** Ready for Deployment  
**Phase:** Phase 2B Implementation

---

## PREREQUISITES: GPU Machine Checklist

### 1. System Requirements
- [ ] Node.js >= 18.0.0 installed
- [ ] npm >= 9.0.0 installed
- [ ] Git installed and configured
- [ ] 2GB+ free disk space
- [ ] Internet access for npm packages

### 2. Verify Installations
```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check Git
git --version
```

---

## STEP 1: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/sriramshiv26-prog/cyber-sierra-atlas-mvp.git
cd cyber-sierra-atlas-mvp

# Verify branch
git branch -a
# Should show: main (current branch)
```

---

## STEP 2: Install Dependencies

```bash
# Install all packages
npm install

# Verify installation succeeded
npm list

# Expected output: Should show all packages without errors
```

### Dependencies Installed:
- ✅ React 18.2.0 + React DOM
- ✅ Vite 5.0.0 (build tool)
- ✅ TypeScript 6.0.3
- ✅ Tailwind CSS 3.3.0
- ✅ Recharts 2.10.0 (charts)
- ✅ Anthropic SDK 0.20.0 (Claude API)
- ✅ PDF.js, PapaParse, Mammoth, XLSX (file parsing)
- ✅ Vitest (testing framework)

---

## STEP 3: Environment Setup

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your Claude API key
# VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx
```

⚠️ **Important:** Add your Anthropic API key to `.env`

---

## STEP 4: Verify Build

```bash
# Test build process
npm run build

# Expected: Build succeeds in ~10-30 seconds
# Output: dist/ folder created with index.html, main-*.js, etc.
```

---

## STEP 5: Start Development Server

```bash
# Start dev server
npm run dev

# Expected output:
#   ➜  Local:   http://localhost:5173/
#   ➜  Press q to quit

# Open browser and verify:
# - Dashboard loads with KPIs
# - All 6 tabs visible (Dashboard, Register, Blast Radius, Crosswalk, Genealogy, Reports)
# - No console errors
```

---

## STEP 6: Run Tests (Phase 2A)

```bash
# Run test suite
npm test

# Expected: All 19 tests passing
# Output should show:
#   ✓ 19 tests passed
#   ✓ 0 tests failed
```

---

## STEP 7: Verify Phase 2B Code (Check-Only)

```bash
# Check what Phase 2B features are in the code
grep -r "duplicate\|overdue\|remediation\|rca" src/

# Expected: Code contains Phase 2B field definitions
# (Not yet implemented in UI, but schema ready)
```

---

## Phase 2B Implementation: Ready to Start

### What's Already Done (Phase 2A ✅)
- [x] Schema updated with Phase 2B fields
- [x] Deduplication algorithm implemented
- [x] Risk scoring with overdue penalties
- [x] File parsing (PDF, CSV, JSON, XLSX, DOCX)
- [x] Validation rules engine
- [x] Store/state management
- [x] Dashboard UI (KPIs, charts)
- [x] RegisterView table structure
- [x] FindingDrawer skeleton
- [x] GenealogyView with DAG
- [x] Tests written (19/19 passing)
- [x] TypeScript strict mode
- [x] Documentation complete

### What Needs Implementation (Phase 2B 🚀)
- [ ] **Task 1-3:** RegisterView enhancements (Flags column, filters, search)
- [ ] **Task 4-6:** FindingDrawer form (RCA input, 3-state remediation)
- [ ] **Task 7-9:** Modals (DuplicateModal, OverdueDetailModal)
- [ ] **Task 10-12:** GenealogyView RCA display + integration testing

**Effort:** 12 tasks × 30-45 min = 6-9 hours  
**Cost:** $0 (local Qwen2.5-coder) or ~$50-100 (Claude Sonnet)

---

## Architecture & Key Files

### Frontend Components
```
src/
├── components/
│   ├── Dashboard.tsx        (KPI tiles, charts)
│   ├── RegisterView.tsx     (findings table - EXTEND HERE)
│   ├── FindingDrawer.tsx    (details panel - EXTEND HERE)
│   ├── GenealogyView.tsx    (lineage diagram - EXTEND HERE)
│   └── SmartIngestPreview.tsx
├── hooks/
│   └── useStore.ts          (state management)
├── lib/
│   ├── llm.ts              (Claude API)
│   ├── parser.ts           (file parsing)
│   ├── deduplication.ts    (duplicate detection)
│   ├── validation.ts       (validation rules)
│   └── scoring.ts          (risk scoring)
└── types.ts                (TypeScript interfaces)
```

### Key Types (src/types.ts)
```typescript
interface Finding {
  id: string;
  title: string;
  asset: Asset;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Scheduled" | "Closed";
  
  // Phase 2B Fields ⭐
  duplicate_group_id?: string;        // Smart Dedup
  is_confirmed_unique?: boolean;
  due_date?: string;                  // Overdue Tracking
  root_cause?: string;                // RCA
  rca_category?: string;
  remediation_suggested?: string;     // Editable Remediation
  remediation_confirmed?: string;
  remediation_last_modified_by?: string;
  remediation_last_modified_at?: string;
}
```

---

## Git Workflow: Phase 2B Implementation

```bash
# 1. Make sure you're on main
git checkout main
git pull origin main

# 2. Create feature branch for Phase 2B
git checkout -b feature/phase2b-findingmanagement

# 3. Implement Phase 2B tasks (12 tasks)
# - Commit frequently (after each task)
# - Run tests after each task: npm test
# - Keep commits atomic and descriptive

# 4. When Phase 2B is complete
git log --oneline -12  # Show last 12 commits

# 5. Push to remote
git push origin feature/phase2b-findingmanagement

# 6. Create Pull Request on GitHub
# Visit: https://github.com/sriramshiv26-prog/cyber-sierra-atlas-mvp/pulls
# Create PR: feature/phase2b-findingmanagement → main

# 7. After code review and merge
git checkout main
git pull origin main
```

---

## Troubleshooting

### npm install fails
```bash
# Clear cache
npm cache clean --force

# Try again
npm install
```

### Port 5173 already in use
```bash
# Use different port
npm run dev -- --port 5174
```

### Tests failing
```bash
# Run tests with UI
npm test -- --ui

# Run specific test
npm test -- deduplication.test.ts
```

### Build fails
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix errors, then rebuild
npm run build
```

---

## Performance Baseline (Phase 2A)

| Metric | Value |
|--------|-------|
| Build time | 3-5 seconds |
| App startup | <1 second |
| Page load | <2 seconds |
| Test suite | 5-10 seconds |
| Code size | 47KB (gzipped) |

---

## Next Steps

### Immediate (Today)
1. ✅ Clone repository
2. ✅ Run `npm install`
3. ✅ Add `.env` with API key
4. ✅ Run `npm run dev` → verify app loads
5. ✅ Run `npm test` → verify all tests pass

### Tomorrow (Phase 2B Implementation)
1. Create `feature/phase2b-findingmanagement` branch
2. Implement Task 1-3: RegisterView enhancements
3. Implement Task 4-6: FindingDrawer + RCA + Remediation
4. Implement Task 7-9: Modals + deduplication workflow
5. Implement Task 10-12: GenealogyView RCA + integration testing
6. Push to GitHub and create PR

---

## Support & Documentation

**Architecture:** `docs/ARCHITECTURE.md`  
**Phase 2B Plan:** `docs/superpowers/plans/2026-05-29-phase3-implementation.md`  
**Frontend Design:** `/Users/sriram/Downloads/Cyber_Sierra_Atlas_Complete_With_All_Features.html`  
**Code Audit:** `CODE_AUDIT.md`

---

**Ready to deploy! 🚀**

Follow this checklist step-by-step. When you reach "STEP 5: Start Development Server" and see the app load without errors, Phase 2B implementation can begin.

