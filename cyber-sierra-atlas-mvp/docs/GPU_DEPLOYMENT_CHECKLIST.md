# GPU Machine Deployment Checklist

**Date:** 2026-05-29  
**Scope:** Verify dependencies and deploy Phase 2B to GPU machine  
**Status:** Pre-deployment checklist (ready for GPU execution)

---

## Phase 1: Environment Setup (30 minutes)

### 1.1 System Requirements Verification
- [ ] OS: Linux or macOS
- [ ] Node.js version: ≥18.0.0
  ```bash
  node --version
  # Expected: v18.x.x or higher
  ```
- [ ] npm version: ≥9.0.0
  ```bash
  npm --version
  # Expected: v9.x.x or higher
  ```
- [ ] Git installed and configured
  ```bash
  git --version
  git config --list | grep user.name
  ```
- [ ] Disk space available: ≥2GB free (project + node_modules)
  ```bash
  df -h | grep -E "/$|/home"
  ```

### 1.2 GPU/Model Setup (if applicable)
- [ ] GPU available (RTX 5060 Ti or equivalent)
- [ ] CUDA toolkit installed (if using NVIDIA)
- [ ] Ollama installed and running (for Qwen2.5-coder local model)
  ```bash
  ollama --version
  ollama list | grep qwen
  # Expected: qwen2.5-coder:1.5b available
  ```
- [ ] GPU memory: ≥4GB available
  ```bash
  nvidia-smi  # NVIDIA
  # or
  system_profiler SPDisplaysDataType  # macOS
  ```

---

## Phase 2: Project Setup (45 minutes)

### 2.1 Clone/Pull Latest Code
- [ ] Clone from GitHub (if first time)
  ```bash
  git clone https://github.com/sriramshiv26-prog/cyber-sierra-atlas-mvp.git
  cd cyber-sierra-atlas-mvp
  ```

- [ ] OR pull latest if already cloned
  ```bash
  git pull origin main
  git status  # Verify clean working directory
  ```

- [ ] Verify branch is main
  ```bash
  git branch
  # Expected: * main
  ```

### 2.2 Dependency Installation
- [ ] Install npm dependencies
  ```bash
  npm install
  ```
  Expected time: 2-3 minutes
  Expected output: added X packages

- [ ] Verify package.json has all Phase 2B deps
  ```bash
  npm list react react-dom recharts typescript
  # Expected: All present with versions
  ```

- [ ] Check for npm audit issues
  ```bash
  npm audit
  ```
  Expected: 0 vulnerabilities (or acceptable audit exceptions documented)

### 2.3 Environment Configuration
- [ ] Check for .env file requirements
  ```bash
  ls -la | grep -i env
  # If .env.example exists, copy it:
  cp .env.example .env
  ```

- [ ] Verify localStorage is enabled (no special config needed for dev)

---

## Phase 3: Build & Test Verification (1 hour)

### 3.1 TypeScript Compilation
- [ ] Run TypeScript check
  ```bash
  npm run build:types  # or npm run tsc
  ```
  Expected: 0 errors

- [ ] Check for any type warnings
  ```bash
  npm run build 2>&1 | grep -i "error\|warning"
  ```
  Expected: 0 errors (warnings acceptable if documented)

### 3.2 Unit Tests Execution
- [ ] Run full test suite
  ```bash
  npm test -- --coverage
  ```
  Expected: 32/32 tests passing (Phase 2B)

- [ ] Verify specific test files
  ```bash
  npm test -- src/lib/dedup-rules.test.ts
  # Expected: 5/5 PASS
  
  npm test -- tests/store.test.ts
  # Expected: 6/6 PASS
  
  npm test -- tests/integration.test.ts
  # Expected: 21/21 PASS
  ```

- [ ] Check test coverage
  ```bash
  npm test -- --coverage
  # Expected: Minimum 80% coverage on modified files
  ```

### 3.3 Production Build
- [ ] Build production bundle
  ```bash
  npm run build
  ```
  Expected time: 4-5 seconds
  Expected output: ✓ built in 4.16s

- [ ] Verify build output
  ```bash
  ls -lh dist/
  # Expected: dist/ directory with index.html, assets/
  ```

- [ ] Check bundle size
  ```bash
  du -sh dist/
  # Expected: <600KB gzipped (551.50 kB is target)
  ```

- [ ] Verify no build errors
  ```bash
  npm run build 2>&1 | grep -i error
  # Expected: 0 errors
  ```

### 3.4 Production Build Verification
- [ ] Test production bundle locally
  ```bash
  npm run preview
  # Opens http://localhost:4173
  ```

- [ ] Manual smoke tests (via browser):
  - [ ] App loads without errors
  - [ ] Dashboard displays all KPIs
  - [ ] Can upload a test CSV/JSON file
  - [ ] Can toggle dark mode
  - [ ] Responsive on mobile (resize browser to 375px)
  - [ ] All Phase 2B features visible:
    - [ ] Flags column in findings table
    - [ ] Duplicate badges display
    - [ ] Overdue KPI shows count
    - [ ] RCA section visible in drawer
    - [ ] Remediation editable workflow works

---

## Phase 4: Phase 2B Feature Verification (30 minutes)

### 4.1 Smart Duplicate Detection
- [ ] Upload test data with duplicate findings
- [ ] Verify duplicate detection algorithm runs
  ```bash
  # Look at console/network tab
  npm test -- src/lib/dedup-rules.test.ts
  ```

- [ ] Test DuplicateModal workflow
  - [ ] Modal opens when "Merge" clicked
  - [ ] Radio buttons functional
  - [ ] Merge button updates findings

- [ ] Verify Flags column displays correctly
  - [ ] Duplicate badge shows (blue)
  - [ ] Unique badge shows (green)
  - [ ] Review badge shows (yellow)

- [ ] Test "Duplicates Only" filter
  - [ ] Toggle button appears
  - [ ] Filter works when activated
  - [ ] Resets when deactivated

### 4.2 Overdue Items Tracking
- [ ] Overdue KPI displays on Dashboard
  ```bash
  # Should show count of findings with due_date < now
  ```

- [ ] Click Overdue KPI opens OverdueDetailModal
  - [ ] Modal displays overdue findings
  - [ ] Shows days past due (orange)
  - [ ] Shows owner and status

- [ ] Test "Overdue Only" filter
  - [ ] Filter button appears in RegisterView
  - [ ] Filter works when activated
  - [ ] Shows only findings with due_date < now

- [ ] Verify risk scoring penalty
  ```bash
  npm test -- tests/integration.test.ts
  # Risk score should increase for overdue findings
  ```

### 4.3 RCA Registration & Display
- [ ] Open FindingDrawer and verify RCA section exists
  - [ ] Textarea for RCA description present
  - [ ] Category dropdown available
  - [ ] Dark mode fully supported

- [ ] Add RCA to a finding
  - [ ] Type in RCA textarea
  - [ ] Select category
  - [ ] Save (should persist in localStorage)

- [ ] Open GenealogyView and verify RCA displays
  - [ ] RCA text visible
  - [ ] Category badge shows
  - [ ] Formatting preserved (line breaks)

### 4.4 Editable Remediation Plans
- [ ] Open FindingDrawer and find Remediation section
  - [ ] State 1 shows: AI Suggestion (blue box)
  - [ ] "Confirm & Edit" button visible

- [ ] Click "Confirm & Edit"
  - [ ] Switches to State 2 (Edit mode)
  - [ ] Textarea becomes editable
  - [ ] "✓ Confirm Plan" and "✕ Cancel" buttons appear

- [ ] Edit remediation text and confirm
  - [ ] Switches to State 3 (Confirmed, green box)
  - [ ] Shows audit trail (last_modified_by, last_modified_at)
  - [ ] "Edit Again" button allows re-editing

- [ ] Verify localStorage persistence
  - [ ] Refresh page
  - [ ] Changes still present

---

## Phase 5: Git Repository Verification (15 minutes)

### 5.1 Commit History Check
- [ ] Verify Phase 2B commits are present
  ```bash
  git log --oneline | head -15
  # Expected: 12 Phase 2B commits visible
  ```

- [ ] Check all Phase 2B commits
  ```bash
  git log --oneline --grep="schema\|dedup\|overdue\|RCA\|remediation" | wc -l
  # Expected: 12 or more commits
  ```

- [ ] Verify latest commit is Phase 2B-related
  ```bash
  git log -1 --oneline
  # Expected: Last commit from Phase 2B tasks
  ```

### 5.2 Branch Status
- [ ] Verify no uncommitted changes
  ```bash
  git status
  # Expected: "nothing to commit, working tree clean"
  ```

- [ ] Check for unpushed commits
  ```bash
  git log origin/main..HEAD
  # Expected: empty (all commits pushed)
  ```

### 5.3 File Integrity Check
- [ ] Verify all modified files exist
  ```bash
  git ls-files | grep -E "schema|dedup|scoring|remediation|useStore"
  # Expected: All files present
  ```

- [ ] Check file integrity
  ```bash
  git diff HEAD~12 HEAD --name-only | wc -l
  # Expected: 10 files modified/created
  ```

---

## Phase 6: Documentation Verification (15 minutes)

### 6.1 Phase 2B Documentation
- [ ] PHASE_2B_COMPLETE.md exists and is readable
  ```bash
  cat docs/PHASE_2B_COMPLETE.md | head -50
  ```

- [ ] Contains all required sections
  - [ ] Executive Summary
  - [ ] Features Implemented (4 features)
  - [ ] Code Metrics
  - [ ] Schema Changes
  - [ ] Test Results
  - [ ] Deployment Instructions

### 6.2 README Update
- [ ] Project README mentions Phase 2B
  ```bash
  grep -i "phase 2b\|duplicate\|overdue\|rca\|remediation" README.md
  ```

- [ ] If not present, update README with Phase 2B summary

### 6.3 Upgrade Roadmap
- [ ] UPGRADE_ROADMAP.md updated with Phase 2B status
  ```bash
  grep -i "phase 2b" UPGRADE_ROADMAP.md
  ```

---

## Phase 7: Performance Baseline (20 minutes)

### 7.1 Load Time Measurement
- [ ] Start dev server and measure page load
  ```bash
  npm run dev
  ```

- [ ] Open browser DevTools → Performance tab
  - [ ] Measure First Contentful Paint (FCP)
    Expected: <2 seconds
  - [ ] Measure Largest Contentful Paint (LCP)
    Expected: <3 seconds
  - [ ] Measure Cumulative Layout Shift (CLS)
    Expected: <0.1

### 7.2 Feature Performance
- [ ] Duplicate detection with 100+ findings
  - [ ] Dropdown/filter response time: <500ms
  
- [ ] Overdue filter with 50+ findings
  - [ ] Filter response time: <200ms

- [ ] Dashboard rendering
  - [ ] All charts render in <2 seconds
  - [ ] No console errors

### 7.3 Bundle Performance
- [ ] Check bundle size breakdown
  ```bash
  npm run build -- --analyze  # if available
  # or
  npm run build && du -sh dist/assets/
  ```

- [ ] Verify no unexpected size increases
  Expected: assets <600KB total

---

## Phase 8: GPU-Specific Checks (if applicable)

### 8.1 Ollama/Model Integration (if using local Qwen2.5)
- [ ] Ollama daemon running
  ```bash
  ollama serve &
  # or verify service is running
  ```

- [ ] Qwen2.5-coder model available
  ```bash
  ollama list | grep qwen
  # Expected: qwen2.5-coder:1.5b or similar
  ```

- [ ] Can pull model if missing
  ```bash
  ollama pull qwen2.5-coder:1.5b
  ```

### 8.2 GPU Memory Utilization
- [ ] Check VRAM usage during tasks
  ```bash
  nvidia-smi --query-gpu=memory.used,memory.free --format=csv,noheader -l 1
  # Expected: <4GB used during compilation/tests
  ```

- [ ] Verify no GPU out-of-memory errors
  ```bash
  npm run build 2>&1 | grep -i "out of memory\|oom\|error"
  # Expected: 0 OOM errors
  ```

---

## Phase 9: Backup & Safety Check (10 minutes)

### 9.1 Pre-Deployment Backup
- [ ] Create backup of current state
  ```bash
  git tag -a v2b-gpu-deploy -m "Phase 2B Ready for GPU deployment"
  git push origin v2b-gpu-deploy
  ```

- [ ] Verify backup
  ```bash
  git tag -l v2b-gpu-deploy
  ```

### 9.2 Data Backup (localStorage)
- [ ] Export current findings (if any test data)
  ```bash
  # In browser console:
  # localStorage.getItem('findings')
  # Save to file if needed
  ```

---

## Phase 10: Deployment Execution (15 minutes)

### 10.1 Start Application
- [ ] Start dev server
  ```bash
  npm run dev
  ```
  Expected: Listening on http://localhost:5173

- [ ] OR start production preview
  ```bash
  npm run build && npm run preview
  ```
  Expected: Listening on http://localhost:4173

### 10.2 Smoke Tests (Final)
- [ ] All Phase 2B features work as expected
- [ ] No console errors
- [ ] Dark mode toggles correctly
- [ ] Responsive on mobile (check at 375px)
- [ ] All tests pass (npm test)

### 10.3 Sign-Off
- [ ] All checklist items completed
- [ ] No blockers or critical issues
- [ ] Ready for Phase 3 planning
- [ ] Ready for next GPU machine phase

---

## Troubleshooting

### Issue: npm install fails
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Tests fail with "module not found"
**Solution:**
```bash
npm run build:types
npm test
```

### Issue: Port 5173 already in use
**Solution:**
```bash
lsof -i :5173
kill -9 <PID>
npm run dev
```

### Issue: Build exceeds 600KB
**Solution:**
```bash
npm run build -- --analyze
# Identify large dependencies
# Possible solution: lazy-load Recharts components
```

### Issue: Dark mode styles not applied
**Solution:**
```bash
# Clear browser cache
# Verify "dark" class on <html> element
# Check Tailwind config includes dark mode
```

### Issue: Git push fails (remotes)
**Solution:**
```bash
git remote -v
# Verify origin points to GitHub
git pull origin main
git push origin main
```

---

## Success Criteria

- ✅ All dependencies installed
- ✅ Build succeeds with 0 errors
- ✅ Tests pass: 32/32 (100%)
- ✅ No TypeScript errors
- ✅ All Phase 2B features verified
- ✅ Production bundle <600KB
- ✅ No console errors
- ✅ Dark mode working
- ✅ Responsive design verified
- ✅ Git commits visible
- ✅ Documentation complete
- ✅ Ready for Phase 3

---

## Next Steps After Deployment

1. **Phase 3 Implementation Planning**
   - Use task cost analysis for Framework Heat Map + Sankey
   - Subagent-driven development for 12 Phase 3 tasks
   - Estimated: 8-9 hours, $0 cost

2. **Frontend Design Review**
   - Update HTML mockup with Phase 2B + Phase 3 features
   - Verify alignment between backend and frontend
   - Document all new UI components

3. **Full Integration Testing**
   - Phase 2B + Phase 3 together
   - Cross-feature interaction testing
   - Performance baseline with full dataset

4. **GitHub Update**
   - Push all verified Phase 2B code
   - Tag release: v2.0.0-phase2b
   - Update README with feature list

---

## Contact & Support

If any issues arise during deployment:
1. Check Troubleshooting section above
2. Review relevant Phase 2B documentation
3. Check GitHub issues for similar problems
4. Re-run specific failing tests with `-v` flag for details

---

**Deployment Prepared By:** Claude AI  
**Date:** 2026-05-29  
**Status:** Ready for GPU Machine Implementation
