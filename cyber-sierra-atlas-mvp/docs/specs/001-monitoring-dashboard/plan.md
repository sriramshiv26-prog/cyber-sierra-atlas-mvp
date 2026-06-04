# Implementation Plan: Continuous Monitoring Dashboard

**Feature:** Continuous Monitoring Dashboard  
**Spec Reference:** docs/specs/001-monitoring-dashboard/spec.md  
**Created:** 2026-06-05  
**Estimated Effort:** 19.75 hours (3.5h spec/plan + 16.25h implementation)  

---

## Executive Summary

Build a dual-view monitoring dashboard (analyst detailed + executive summary) with 5 core metrics, drill-down capabilities, and 5-15 minute auto-refresh. Uses existing findings/CAPA data; no new database tables. Primary implementation via Qwen2.5-coder-32B (local, free) with Haiku for polish/reviews. Fits comfortably in Phase 6B (1-week sprint). Expected cost: ~$0.20 (essentially free).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    MONITORING DASHBOARD                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  FRONTEND LAYER (React 18, TypeScript, Tailwind)            │
│  ├─ Dashboard Container                                     │
│  │  ├─ Header (title, refresh status, manual refresh)       │
│  │  ├─ View Toggle (Analyst ↔ Executive)                    │
│  │  └─ Content (view-specific rendering)                    │
│  │                                                           │
│  ├─ Analyst View                                            │
│  │  ├─ MetricsGrid (3-col responsive)                       │
│  │  │  ├─ SeverityCard (4 mini counts + trend)              │
│  │  │  ├─ CapaCard (% complete + breakdown)                │
│  │  │  ├─ MttrCard (avg days + trend)                       │
│  │  │  ├─ SlaCard (% compliant + overdue)                   │
│  │  │  └─ TrendsCard (90-day line chart)                    │
│  │  ├─ DrillDown Panel (modal when card clicked)            │
│  │  │  ├─ FilterBar (severity, status, date, team)          │
│  │  │  └─ ResultsList (paginated findings/CAPAs)            │
│  │  └─ ComparisonView (week/month toggle)                   │
│  │                                                           │
│  └─ Executive View                                          │
│     ├─ RiskScoreCard (0-100, color-coded)                   │
│     ├─ MetricsSummary (4 key cards)                         │
│     ├─ TrendLine (single metric over 90 days)               │
│     └─ ActionItems (if any)                                 │
│                                                              │
│  STATE MANAGEMENT (useStore)                                │
│  ├─ DashboardStore (metrics, trends, filters, view)         │
│  └─ Auto-refresh subscription (setInterval)                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  API LAYER (Express endpoints)                              │
│  ├─ GET /api/dashboard/metrics                              │
│  ├─ GET /api/dashboard/trends?days=30|60|90                 │
│  ├─ GET /api/dashboard/compare?period=week|month            │
│  └─ GET /api/dashboard/drill-down?filters...                │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  DATA LAYER (PostgreSQL)                                    │
│  ├─ findings table (existing, reuse)                        │
│  └─ capa_items table (existing, reuse)                      │
│     (Aggregations computed on-demand; no new tables)        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Architecture Decisions:**
1. **Separate endpoints** for metrics/trends/drill-down = modular, cacheable
2. **Server-side aggregation** = avoid client fetching 1000+ records
3. **setInterval refresh** = simple, predictable, no WebSocket complexity
4. **Single component** (two views) = consistent data, no duplication
5. **Drill-down in URL** = shareable, preserves on reload

---

## Technical Decisions

### Decision 1: Aggregation Strategy
- **Rationale:** Metrics require counts/averages across all findings/CAPAs; client-side would need fetching thousands of records
- **Alternative Considered:** Materialized views in database (complex, not needed for Phase 6B)
- **Trade-off:** Server does aggregation work; benefit is fast responses
- **Impact:** Dashboard responsive; future optimization available if needed

### Decision 2: Refresh Cadence
- **Rationale:** 5-15 min auto-refresh = simple (setInterval), low infrastructure, good enough for security ops
- **Alternative Considered:** Real-time WebSocket (complex, higher cost)
- **Trade-off:** Up to 15min stale data; benefit is stability, simplicity, zero infrastructure
- **Impact:** Phase 7 can add WebSocket if faster updates needed

### Decision 3: View Architecture
- **Rationale:** Single component with toggle = instant switch, no data duplication, consistent data
- **Alternative Considered:** Separate routes/components for analyst vs executive
- **Trade-off:** One component has two rendering paths; benefit is reduced code
- **Impact:** Executive always has latest analyst data; simpler maintenance

### Decision 4: Drill-Down Filter Storage
- **Rationale:** Filters in URL params = shareable links, survives reload, bookmarkable
- **Alternative Considered:** State only (lost on reload)
- **Trade-off:** URL changes with filters; benefit is state persistence
- **Impact:** Professional UX; enables sharing investigations with team

---

## Implementation Approach

### Phase 1: Data Model & API (2.5 hours)

**Task 1.1: TypeScript Types (0.75h)**
- Create `src/types/dashboard.ts` with all TS interfaces
  - `DashboardMetrics`, `TrendPoint`, `Trends`, `PeriodComparison`, `DrillDownResults`, `FilterCriteria`
- Export all types for component + API use
- Vitest: Type checking tests (ensure types compile)

**Task 1.2: API Endpoints Definition (0.5h)**
- Create `src/api/dashboard.ts` with 4 endpoint functions
  - `getDashboardMetrics()`, `getDashboardTrends(days)`, `getComparison(period)`, `getDrillDown(filters)`
- Each function returns correctly typed Promise
- Error handling stubs

**Task 1.3: Database Queries (1h)**
- Create `src/services/dashboardService.ts` with aggregation logic
  - `computeSeverityBreakdown()`: SELECT severity, COUNT(*) FROM findings WHERE status='open'
  - `computeCapaMetrics()`: SELECT state, COUNT(*) FROM capa_items
  - `computeMTTR()`: SELECT AVG(EXTRACT(DAY FROM (closed_at - created_at))) ...
  - `computeSLACompliance()`: SELECT COUNT(overdue)/COUNT(total) ...
  - `getTrendData(days)`: Query findings/CAPA history over date range
  - `getComparisonData(period)`: Compare current vs previous period
- Index optimization recommendations in comments
- Vitest integration tests: Each function returns correct structure with sample data

**Task 1.4: Wire API Endpoints (0.25h)**
- Create `src/routes/dashboardRoutes.ts` (Express)
  - `router.get('/dashboard/metrics', ...)`
  - `router.get('/dashboard/trends', ...)`
  - `router.get('/dashboard/compare', ...)`
  - `router.get('/dashboard/drill-down', ...)`
- Call service functions, return JSON responses
- Error handling (500 on service failure)
- Vitest: Mock service, verify endpoints return correct structure

---

### Phase 2: React Components (2.5 hours)

**Task 2.1: Component Architecture (1h)**
- Create `src/components/Dashboard/index.tsx` (main container)
  - State: `metrics`, `trends`, `view` ('analyst'|'executive'), `isLoading`, `error`
  - useEffect: Fetch metrics + trends on mount
  - useEffect: setInterval for auto-refresh (cleanup on unmount)
  - Render: Header + ViewToggle + ConditionalContent
- Create `src/components/Dashboard/AnalystView.tsx`
  - Render MetricsGrid (5 cards in 3-col responsive)
  - Pass drill-down handler
  - Render DrillDownPanel if active
  - Render ComparisonView if toggled
- Create `src/components/Dashboard/ExecutiveView.tsx`
  - Render RiskScoreCard, MetricsSummary, TrendLine, ActionItems
  - Minimal, executive-focused
- Vitest: Snapshot tests, verify conditional rendering

**Task 2.2: Metric Cards Component (0.75h)**
- Create reusable `src/components/Dashboard/MetricCard.tsx`
  - Props: `title`, `value`, `unit`, `trend`, `onClick`, `isLoading`
  - Render: Icon + Value + Trend indicator + optional breakdown
  - Dark mode: All colors use `dark:` classes
  - Accessible: aria-label for value, click handler properly labeled
- Create specialized cards:
  - `SeverityCard`: 4 mini cards (Critical/High/Med/Low)
  - `CapaCard`: Progress circle + breakdown
  - `MttrCard`: Value + trend line
  - `SlaCard`: Gauge + overdue count
  - `TrendsCard`: Recharts LineChart
- Vitest: Render with data, verify click handlers, test dark mode variants

**Task 2.3: Toggle & Layout (0.75h)**
- Create `src/components/Dashboard/ViewToggle.tsx`
  - Props: `current`, `onChange`
  - Render: [Analyst View] [Executive Summary] toggle buttons
  - Accessible: Keyboard navigable, ARIA attributes
- Create `src/components/Dashboard/Header.tsx`
  - Render: Title, last refresh time, manual refresh button
  - Manual refresh: onClick → fetch + update state
  - Show loading spinner during fetch
- Create responsive grid layout in `AnalystView`
  - 3 columns on desktop, 1 on mobile (Tailwind `grid-cols-1 md:grid-cols-3`)
- Vitest: Verify toggle switches views, refresh updates timestamp

---

### Phase 3: Drill-Down & Filtering (1.75 hours)

**Task 3.1: Filter Bar Component (0.5h)**
- Create `src/components/Dashboard/FilterBar.tsx`
  - Props: `onFilter: (FilterCriteria) => void`
  - Render: Severity checkboxes, Status checkboxes, Date range picker, Clear button
  - Validation: Invalid values rejected
  - Accessible: Labels on all checkboxes, keyboard navigable
  - Dark mode: Checkboxes readable in both themes
- Vitest: Apply filters, verify onChange callback, test clear functionality

**Task 3.2: Drill-Down Results View (0.75h)**
- Create `src/components/Dashboard/DrillDownPanel.tsx`
  - Props: `results`, `filter`, `onClose`, `isLoading`
  - Render: Modal/panel with FilterBar + ResultsList
  - Pagination: Show 10 items per page, next/prev buttons
  - Accessible: Escape key closes panel, focus trap
  - Dark mode: Readable in both themes
- Create `src/components/Dashboard/ResultsList.tsx`
  - Render: Paginated findings/CAPAs, each clickable
  - Columns: Title, Severity, Status, Created Date
  - Click row → navigate to detail page (existing flow)
  - Export to CSV button
- Vitest: Open panel, apply filters, verify results, test pagination

**Task 3.3: Filter State Management (0.5h)**
- Update `useStore` with drill-down state
  - `drillDownResults: Finding[] | CAPA[]`
  - `drillDownFilter: FilterCriteria`
  - `isFilterActive: boolean`
- Create actions:
  - `setDrillDownFilter(filter)` → fetch results, update state
  - `clearDrillDownFilter()` → reset state
- Vitest: Verify state updates, store actions return correct state

---

### Phase 4: Dashboard Layout & Polish (1.75 hours)

**Task 4.1: Responsive Layout (0.5h)**
- Implement responsive grid:
  - Desktop: 3 cards per row → MetricsGrid
  - Tablet (768px): 2 cards per row
  - Mobile (375px): 1 card per row
- Test on real devices / DevTools
- Verify no horizontal scrolling

**Task 4.2: Dark Mode Styling (0.5h)**
- Audit all colors in components:
  - Background: `bg-white dark:bg-slate-900`
  - Text: `text-slate-900 dark:text-white`
  - Borders: `border-slate-200 dark:border-slate-700`
  - Accent: Status colors (green/yellow/red) have dark variants
- No hardcoded colors anywhere
- Test in both light + dark modes visually
- Vitest: Snapshot tests in both themes

**Task 4.3: Accessibility & Performance (0.75h)**
- Keyboard Navigation:
  - Tab through all cards, buttons, filters
  - Escape closes drill-down
  - Enter activates buttons
- Color Contrast (axe-core):
  - Run axe scanner on dashboard
  - Verify 4.5:1 minimum on all text
- Screen Reader:
  - Add aria-labels to all icons
  - Add aria-labels to metric values ("Critical findings: 3")
  - Form inputs have associated labels
- ARIA Attributes:
  - Modal has aria-modal="true"
  - Buttons have aria-label if icon-only
  - List items have role="listitem"
- Performance Profiling:
  - Lighthouse audit: target <3s load, <100ms renders
  - React DevTools profiler: no unnecessary re-renders
  - Memory: No leaks on repeated refresh

---

### Phase 5: Auto-Refresh & Period Comparison (1.5 hours)

**Task 5.1: Auto-Refresh Mechanism (0.75h)**
- Implement in Dashboard container:
  ```typescript
  useEffect(() => {
    const interval = setInterval(() => {
      // Fetch metrics + trends in parallel
      // Show skeleton during refresh (no flicker)
      // Update state
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);
  ```
- Loading state: Show skeleton on cards during refresh
- Error handling: Toast error on failure, retry in 30s
- Manual refresh button: Bypass interval, fetch immediately
- Vitest: Mock setInterval, verify fetch called at intervals, cleanup works

**Task 5.2: Period Comparison (0.75h)**
- Create `src/components/Dashboard/ComparisonView.tsx`
  - Props: `comparison: PeriodComparison`
  - Render: Side-by-side current vs previous period
  - Show deltas: "+2 critical", "-3% SLA", "+1 day MTTR"
  - Period toggle: Week / Month buttons
- Logic to compute comparison:
  - Current period: last 7 days (week) or 30 days (month)
  - Previous period: same length, before current
  - Deltas: difference between metrics
- Vitest: Fetch comparison data, verify deltas calculated correctly

---

### Phase 6: Testing & Coverage (1.75 hours)

**Task 6.1: Unit Tests (0.75h)**
- MetricsCard: Render with data, trend indicator, click handler
- MetricsSummary: Render 4 cards, values displayed correctly
- ChartContainer (Recharts): Render with 90 points, no errors
- FilterBar: Apply filters, clear filters, validate input
- ViewToggle: Switch views, state updates
- Each test: Arrange-Act-Assert, isolated, <100ms

**Task 6.2: Integration Tests (0.75h)**
- Dashboard loads: Fetch metrics + trends in parallel, render both views
- Drill-down: Click severity card → fetch filtered results → render list
- Auto-refresh: setInterval triggers fetch, metrics update without layout shift
- Error handling: Network error → toast error, retry works
- View toggle: Switch analyst ↔ executive, same data, different rendering
- Period comparison: Fetch comparison, deltas correct
- Dark mode: Visual snapshot tests in both themes

**Task 6.3: Coverage & Review (0.25h)**
- Run `npm test -- --coverage`
- Target: 80%+ coverage (statements, branches, functions)
- Review coverage report, identify gaps
- Add tests for uncovered branches
- Run full test suite, verify all passing

---

### Phase 7: Two-Stage Code Review (1.5 hours)

**Task 7.1: Spec Compliance Review (0.75h)**
- Verify all acceptance criteria met:
  - [ ] 5 metrics displayed and clickable
  - [ ] Drill-down works (click → filtered list)
  - [ ] View toggle works (analyst ↔ executive)
  - [ ] Auto-refresh every 5-15 min
  - [ ] Period comparison works
  - [ ] <3s load time measured
  - [ ] WCAG AA accessibility
  - [ ] Dark mode functional
  - [ ] 80%+ test coverage
- Fix any spec gaps
- Re-test until ✅ approved

**Task 7.2: Code Quality Review (0.75h)**
- TypeScript strict: `npx tsc --noEmit` zero errors
- Test coverage: 80%+ achieved
- Dark mode: No hardcoded colors, all `dark:` variants present
- Accessibility: axe-core passes, manual keyboard nav works
- Console: Zero errors/warnings in production build
- Performance: Lighthouse <3s load, <100ms renders
- Code style: Follows Phase 6A patterns, clean, readable
- Fix issues, re-test until ✅ approved

---

### Phase 8: Deployment & Documentation (1 hour)

**Task 8.1: Final Commit & Push (0.5h)**
- Commit: `git commit -m "feat: implement continuous monitoring dashboard with dual-view architecture"`
- Push: `git push origin main`
- Verify: Code on GitHub, tests passing in CI

**Task 8.2: Documentation & Memory (0.5h)**
- Update memory with Phase 6B results
  - Did SDD save time? Track actual vs estimated effort
  - Issues found by spec review
  - Regressions: Should be zero
  - Post-deploy issues: Should be zero
- Create implementation summary document
- Mark Phase 6B SDD pilot complete

---

## Task Breakdown Summary

| # | Task | Type | Effort | Depends On |
|---|------|------|--------|-----------|
| 1 | Data Model & API (types, endpoints, queries) | Backend | 2.5h | - |
| 2 | React Components (Dashboard, views, cards) | Frontend | 2.5h | 1 |
| 3 | Drill-Down & Filtering (panel, filters, state) | Frontend | 1.75h | 2 |
| 4 | Layout & Polish (responsive, dark mode, a11y) | Frontend | 1.75h | 3 |
| 5 | Auto-Refresh & Comparison (setInterval, deltas) | Frontend | 1.5h | 4 |
| 6 | Testing & Coverage (unit, integration, coverage) | Testing | 1.75h | 5 |
| 7 | Two-Stage Code Review (spec compliance, quality) | Review | 1.5h | 6 |
| 8 | Deployment & Documentation (commit, memory) | DevOps | 1h | 7 |
| | | | **16.25h** | |

Plus: Spec (0.75h) + Plan (0.5h) = **17.5h total** (fits in Phase 6B)

---

## Dependencies

### External Libraries/Services
- **recharts** ^2.10.0 (charts, already in project)
- **date-fns** ^2.30.0 (date math, already in project)
- **react-router-dom** (routing, already in project)

### Internal Dependencies
- **useStore** hook (state management, Phase 6A)
- **findings API** (existing endpoints)
- **capa API** (existing endpoints, Phase 6A)

### Blockers
- None; all dependencies available

---

## Testing Strategy

### Unit Tests (Component-level)
- MetricsCard: Render, display value/trend, click handler
- ViewToggle: Switch views, state updates
- FilterBar: Apply filters, validate, clear
- ChartContainer: Render with data, handle empty data
- ComparisonView: Calculate deltas, display comparison

**Target:** 80%+ coverage

### Integration Tests (API + Component)
- Full dashboard load: Fetch metrics + trends → render
- Drill-down flow: Click metric → fetch filtered results → list
- Auto-refresh: setInterval → fetch → update (no flicker)
- Error handling: Network error → toast → retry
- View toggle: Switch analyst ↔ executive
- Period comparison: Calculate and display deltas

### Accessibility Tests (WCAG AA)
- Keyboard nav: Tab, Shift+Tab, Enter, Escape
- Color contrast: 4.5:1 minimum (axe-core)
- Screen reader: Icons labeled, context announced
- Focus visible: All interactive elements

### Dark Mode Tests
- Visual: Readable in both light and dark modes
- No hardcoding: All colors use `dark:` variants
- Contrast: Both themes meet 4.5:1 minimum

### Performance Tests
- Load time: <3 seconds (Lighthouse)
- Render time: <100ms per card
- Chart render: <200ms with 90 points
- Memory: No leaks on repeated refresh

---

## Deployment Strategy

### Code Deployment
1. Feature branch: `feature/monitoring-dashboard`
2. All tasks completed locally (TDD: tests + code)
3. Two-stage review:
   - **Stage 1:** Spec compliance (does code match spec?)
   - **Stage 2:** Code quality (types, tests, dark mode, a11y, performance)
4. Merge to main
5. Push to GitHub
6. CI passes (all tests, TypeScript, linting)

### Rollback Plan
- If critical bug found: Revert commit, fix, re-review
- Dashboard is non-blocking feature (existing flows still work)
- Data is read-only (no writes) → safe to rollback

---

## Success Criteria

- [ ] All acceptance criteria from spec met
- [ ] All 8 tasks completed and tested
- [ ] 80%+ code coverage achieved
- [ ] Zero console warnings/errors
- [ ] <3s load time measured
- [ ] WCAG AA accessibility verified
- [ ] Dark mode fully functional
- [ ] Both code reviews passed
- [ ] Code merged to main
- [ ] Zero regressions in Phase 6A tests

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| API aggregation is slow (>1s) | Test with realistic data; optimize queries; add indexes |
| Auto-refresh causes memory leak | Monitor memory in profiler; properly cleanup setInterval |
| Drill-down filters don't persist | Store filters in URL params |
| Dark mode contrast fails | Run axe-core on every color change |
| Chart library fails with large data | Test with 90-day dataset upfront |

---

## Approval

- Plan Author: Claude Haiku 4.5
- Created: 2026-06-05
- Ready for Implementation: Yes
