# Continuous Monitoring Dashboard Specification

**Feature ID:** 001-monitoring-dashboard  
**Created:** 2026-06-05  
**Status:** DRAFT  
**Phase:** 6B (SDD Pilot)  

---

## Overview

The Continuous Monitoring Dashboard provides real-time visibility into risk posture and remediation progress through a unified interface serving both security analysts and executives. Analysts access rich metrics with drill-down capabilities; executives see high-level trends and compliance status. The dashboard auto-refreshes every 5-15 minutes and integrates seamlessly with existing findings and CAPA workflows.

This is Phase 6B's SDD pilot feature—validating that Specification-Driven Development delivers robust code with zero post-deploy failures.

---

## Acceptance Criteria

Success means ALL of these are true:

- [ ] Criterion 1: Dashboard loads in <3 seconds on first visit and <1 second on refresh
- [ ] Criterion 2: Analyst view displays all 5 core metrics (severity breakdown, CAPA %, MTTR, SLA compliance, 30/60/90 trends) as interactive cards
- [ ] Criterion 3: Clicking any metric card opens filtered drill-down showing related findings or CAPAs with full filter controls
- [ ] Criterion 4: Executive view shows single risk score (0-100), key metrics summary, and 90-day trend line; toggle between views works instantly
- [ ] Criterion 5: Dashboard auto-refreshes every 5-15 minutes; manual refresh button updates data immediately
- [ ] Criterion 6: Period comparison shows current vs previous period (week or month) with calculated deltas (e.g., "+5 findings", "-2% SLA compliance")
- [ ] Criterion 7: All interactive elements keyboard navigable (Tab, Enter, Escape); color contrast ≥4.5:1; screen reader compatible (aria-labels)
- [ ] Criterion 8: Dark mode fully functional; all colors have `dark:` Tailwind variants; readable in both light and dark themes
- [ ] Criterion 9: No console errors or warnings on production build; zero TypeScript strict violations
- [ ] Criterion 10: All acceptance criteria above verified by passing integration tests; 80%+ code coverage achieved

---

## Non-Functional Requirements

### Performance
- **Page Load:** <3 seconds on first visit (cold), <1 second on refresh (cached)
- **Component Renders:** <100ms for each metric card update
- **Auto-Refresh:** No layout shift, smooth skeleton loading during refresh
- **Chart Rendering:** Recharts line/bar charts render in <200ms with 90 data points

### Security
- **API Authentication:** All endpoints require valid session token (inherited from existing auth)
- **Data Validation:** All filter inputs validated server-side; no SQL injection, no XSS
- **Audit Trail:** Dashboard views not logged (non-sensitive); data access follows existing Findings/CAPA audit trails

### Accessibility (WCAG AA Minimum)
- **Keyboard Navigation:** All metrics, filters, toggles accessible via Tab/Shift+Tab; drill-down openable/closable with Escape
- **Color Contrast:** Status indicators (green/yellow/red) meet 4.5:1 minimum; labels visible without relying solely on color
- **Screen Reader:** All icons have aria-label; form inputs have associated labels; list items announced with context
- **Focus Indicators:** Visible outline on all interactive elements; focus order logical

### Accessibility: Dark Mode Support
- **Required for all UI:** Every color has `dark:` Tailwind class equivalent
- **Testing:** Dashboard tested in both light and dark modes; no hardcoded colors
- **Pattern:** `className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"`

### Browser Support
- Chrome/Edge 90+, Firefox 88+, Safari 14+
- Mobile responsive: Works on tablet (768px) and phone (375px)

---

## Data Model

### Metrics Entity (read-only aggregation)
```typescript
interface DashboardMetrics {
  severity: {
    critical: number;      // Count of open Critical findings
    high: number;          // Count of open High findings
    medium: number;        // Count of open Medium findings
    low: number;           // Count of open Low findings
  };
  capa: {
    percentComplete: number;     // 0-100
    inProgress: number;          // Count of CAPAs in "in_progress" state
    atRisk: number;              // Count of CAPAs approaching due date
    overdue: number;             // Count of CAPAs past due date
  };
  mttr: {
    current: number;        // Days, average of last 30 days
    trend: 'improving' | 'stable' | 'degrading';
  };
  sla: {
    percentCompliant: number;    // 0-100
    overdueFindings: number;
    overdueCAPAs: number;
  };
  updatedAt: ISO8601Timestamp;
}
```

### Trend Data (time-series)
```typescript
interface TrendPoint {
  date: YYYY-MM-DD;
  openFindings: number;
  closedFindings: number;
  mttrDays: number;
  slaCompliance: number;
  capaCompletePercent: number;
}

interface Trends {
  days30: TrendPoint[];    // Last 30 daily snapshots
  days60: TrendPoint[];    // Last 60 daily snapshots (includes 30)
  days90: TrendPoint[];    // Last 90 daily snapshots (includes 60 + 30)
}
```

### Period Comparison
```typescript
interface PeriodComparison {
  current: {
    period: 'this_week' | 'this_month';
    metrics: DashboardMetrics;
    startDate: YYYY-MM-DD;
    endDate: YYYY-MM-DD;
  };
  previous: {
    period: 'last_week' | 'last_month';
    metrics: DashboardMetrics;
    startDate: YYYY-MM-DD;
    endDate: YYYY-MM-DD;
  };
  deltas: {
    criticalFindings: number;     // +3 or -2
    capaCompleteChange: number;   // +5 (percent points)
    mttrChange: number;           // +2 or -1 (days)
    slaComplianceChange: number;  // +2 or -1 (percent points)
  };
}
```

### DrillDown Results
```typescript
interface DrillDownResults {
  filter: FilterCriteria;
  results: (Finding | CAPA)[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface FilterCriteria {
  severity?: ('critical' | 'high' | 'medium' | 'low')[];
  status?: ('open' | 'in_progress' | 'resolved' | 'at_risk' | 'overdue')[];
  dateRange?: { start: YYYY-MM-DD; end: YYYY-MM-DD };
  team?: string[];
}
```

### No Database Changes
- Uses existing `findings` table (Phase 2-5)
- Uses existing `capa_items` table (Phase 6A)
- Aggregations computed on-demand (no new tables required for MVP)
- Future: Consider materialized views for performance if needed

---

## API Contracts

### Endpoint 1: GET /api/dashboard/metrics
**Purpose:** Fetch current dashboard metrics snapshot

**Request:**
```
GET /api/dashboard/metrics
Headers: Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": {
    "severity": {
      "critical": 3,
      "high": 12,
      "medium": 45,
      "low": 102
    },
    "capa": {
      "percentComplete": 73,
      "inProgress": 15,
      "atRisk": 8,
      "overdue": 2
    },
    "mttr": {
      "current": 14,
      "trend": "improving"
    },
    "sla": {
      "percentCompliant": 85,
      "overdueFindings": 2,
      "overdueCAPAs": 1
    },
    "updatedAt": "2026-06-05T10:30:00Z"
  }
}
```

**Error (500 Internal Server Error):**
```json
{
  "error": "Failed to compute metrics",
  "code": "METRICS_COMPUTATION_FAILED"
}
```

---

### Endpoint 2: GET /api/dashboard/trends?days=30|60|90
**Purpose:** Fetch historical trend data for chart rendering

**Request:**
```
GET /api/dashboard/trends?days=90
Headers: Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": {
    "days30": [
      {
        "date": "2026-05-06",
        "openFindings": 165,
        "closedFindings": 28,
        "mttrDays": 16,
        "slaCompliance": 82,
        "capaCompletePercent": 68
      },
      // ... 29 more days
    ],
    "days60": [ /* full 60 days */ ],
    "days90": [ /* full 90 days */ ]
  }
}
```

---

### Endpoint 3: GET /api/dashboard/compare?period=week|month
**Purpose:** Compare current period to previous period

**Request:**
```
GET /api/dashboard/compare?period=week
Headers: Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": {
    "current": {
      "period": "this_week",
      "metrics": { /* full DashboardMetrics */ },
      "startDate": "2026-06-02",
      "endDate": "2026-06-05"
    },
    "previous": {
      "period": "last_week",
      "metrics": { /* full DashboardMetrics */ },
      "startDate": "2026-05-26",
      "endDate": "2026-05-29"
    },
    "deltas": {
      "criticalFindings": 2,
      "capaCompleteChange": 3,
      "mttrChange": -2,
      "slaComplianceChange": 1
    }
  }
}
```

---

### Endpoint 4: GET /api/dashboard/drill-down
**Purpose:** Fetch filtered list of findings or CAPAs for drill-down investigation

**Request:**
```
GET /api/dashboard/drill-down?severity=critical,high&status=open&page=1&pageSize=10
Headers: Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": {
    "filter": {
      "severity": ["critical", "high"],
      "status": ["open"]
    },
    "results": [
      {
        "id": "finding-uuid",
        "title": "SQL Injection in Login Form",
        "severity": "critical",
        "status": "open",
        "createdAt": "2026-05-15T...",
        // ... full Finding object
      },
      // ... 9 more results
    ],
    "count": 15,
    "page": 1,
    "pageSize": 10,
    "totalPages": 2
  }
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Invalid severity value. Allowed: critical, high, medium, low",
  "code": "VALIDATION_ERROR"
}
```

---

## Implementation Details

### Architecture Decisions

**Decision 1: Client-side vs Server-side Aggregation**
- **Choice:** Server-side aggregation
- **Rationale:** Metrics (severity counts, MTTR averages, SLA %) require access to all findings/CAPAs; computing on client would require fetching 1000+ records
- **Trade-off:** Server does more work; benefit is <1s response for pre-computed aggregations
- **Impact:** Dashboard remains responsive; future optimization is materialized views in PostgreSQL

**Decision 2: Single Endpoint vs Multiple Endpoints**
- **Choice:** Multiple endpoints (/metrics, /trends, /drill-down, /compare)
- **Rationale:** Each endpoint serves a different use case and refresh cadence (metrics every 5 min, trends less frequently)
- **Trade-off:** More API calls; benefit is granular caching and independent optimization
- **Impact:** Better performance; easier to test

**Decision 3: Auto-Refresh Mechanism**
- **Choice:** setInterval on client-side (5-15 min)
- **Rationale:** Avoids WebSocket complexity; simple, predictable, low infrastructure cost
- **Trade-off:** Up to 15 minutes of stale data; benefit is stability and simplicity
- **Impact:** Good enough for Phase 6B; can add WebSocket in Phase 7 if needed

**Decision 4: Dual-View Architecture**
- **Choice:** Single component with view toggle (not separate routes)
- **Rationale:** Same data, different presentation; toggle is instant
- **Trade-off:** One component does two things; benefit is reduced code duplication and consistent data
- **Impact:** Executive view always has latest analyst data

### Dependencies
- **recharts:** ^2.10.0 (line/bar charts, already in project)
- **date-fns:** ^2.30.0 (date math for trends, already in project)
- **react-router-dom:** (for drill-down filtering in URL)

### User Stories

**Story 1:** As a security analyst, I want to see open findings grouped by severity so I can prioritize my work.
- **Acceptance:** Dashboard shows Critical, High, Medium, Low counts; clicking each opens filtered list

**Story 2:** As an executive, I want to see overall risk in a single number so I can report to stakeholders.
- **Acceptance:** Executive view shows Risk Score 0-100; color-coded (red/yellow/green)

**Story 3:** As a team lead, I want to see CAPA completion % and overdue items so I can track remediation progress.
- **Acceptance:** Dashboard shows 73% complete, 2 overdue; clicking opens CAPA drill-down

**Story 4:** As an analyst, I want to drill-down from metrics to actual findings/CAPAs so I can investigate quickly.
- **Acceptance:** Click any metric → filtered list with full filtering controls

**Story 5:** As an analyst, I want to compare this week vs last week so I can see if we're improving.
- **Acceptance:** Toggle shows week/month comparison with deltas

---

## Edge Cases

1. **Case:** No findings or CAPAs exist in the database
   **Expected behavior:** Dashboard shows all zeros; no errors; labels still visible

2. **Case:** User lacks permission to view certain findings
   **Expected behavior:** Metrics aggregated only for findings user can access; drill-down respects permissions

3. **Case:** Network request fails during auto-refresh
   **Expected behavior:** Toast error shown; skeleton stays on screen; retry in 30 seconds; user can manually refresh

4. **Case:** User opens drill-down, applies filters, filters reset (e.g., page reload)
   **Expected behavior:** URL reflects filter state; reload preserves filters

5. **Case:** MTTR data unavailable (no closures in last 30 days)
   **Expected behavior:** Show "N/A" with explanation; don't break dashboard

6. **Case:** User rapidly clicks multiple metric cards
   **Expected behavior:** Only latest drill-down request shown; earlier requests cancelled

7. **Case:** Browser is offline
   **Expected behavior:** Error toast; cached data (if available) shown; retry when online

8. **Case:** SLA compliance = 0% (all overdue)
   **Expected behavior:** Show 0% in red; list all overdue items; no errors

---

## Testing Strategy

### Unit Tests
- **DashboardContainer:** Renders both views, toggle works, state updates
- **MetricsCard:** Displays value, trend, and is clickable
- **ChartContainer:** Renders with data, handles empty data, responsive
- **FilterBar:** Applies filters, clears filters, validates input
- **ComparisonView:** Shows deltas correctly, toggles period (week/month)

### Integration Tests
- **Full Dashboard Load:** Fetch metrics + trends in parallel, render without errors
- **Drill-Down Flow:** Click metric → fetch filtered results → render list
- **Auto-Refresh:** setInterval fetches new metrics every 5-15 min without layout shift
- **Error Handling:** Network error shows toast, retry button works
- **View Toggle:** Switch analyst ↔ executive, data consistent
- **Period Comparison:** Compare current to previous, deltas calculated correctly

### Accessibility Tests (axe-core)
- **Keyboard Navigation:** All interactive elements reachable via Tab; drill-down closable with Escape
- **Color Contrast:** All text/icons meet 4.5:1 minimum (checked with axe)
- **Screen Reader:** Icons have aria-labels; form inputs labeled; list context announced
- **Focus Visible:** All interactive elements have visible focus indicator

### Dark Mode Tests
- **Visual:** Dashboard readable in both light and dark modes
- **No Hardcoding:** Zero hardcoded colors in code; all use Tailwind `dark:` variants
- **Contrast:** Dark mode colors also meet 4.5:1 contrast

### Performance Tests
- **Load Time:** <3 seconds on first visit (Lighthouse)
- **Component Render:** <100ms for each metric card
- **Chart Render:** <200ms for Recharts with 90 data points
- **No Memory Leaks:** DevTools profiler shows steady memory (no growth on repeated refreshes)

### Target Coverage
- **Code Coverage:** 80%+
- **User Flows:** All acceptance criteria verified
- **Edge Cases:** All 8 edge cases tested

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| API aggregation is too slow (>1s) | Dashboard feels sluggish | Medium | Test with realistic data volume (10k+ findings); optimize queries with indexes; consider caching layer |
| Auto-refresh causes performance degradation | Users notice slowdown after hours | Medium | Monitor memory; unsubscribe from listeners; limit chart data to 90 days |
| Drill-down filters don't persist on reload | User loses context | Low | Store filters in URL params; validate params on mount |
| Dark mode colors don't have enough contrast | WCAG AA failure | Low | Run axe-core on every Tailwind color change; automated checks in CI |
| Chart library (Recharts) incompatible with large datasets | Chart fails to render | Low | Test with 90 days of data upfront; lazy-load if >10k points |

---

## Out of Scope

The following are explicitly NOT part of this feature:

- Real-time WebSocket updates (Phase 7 enhancement)
- Predictive analytics / ML-powered forecasting (Phase 7 enhancement)
- Smart alerts & notifications (Phase 7 enhancement)
- Anomaly detection (Phase 7 enhancement)
- Historical snapshots / audit trail (Phase 6B+ enhancement)
- Saved custom views / personalization (Phase 7 enhancement)
- Custom dashboard builder / drag-and-drop (out of scope for foreseeable future)

---

## Success Metrics

How will we know this feature is successful?

- **Load Time:** Dashboard loads <3 seconds on first visit, <1 second on refresh (measured with Lighthouse)
- **Drill-Down Usage:** Analysts use drill-down feature at least 3x per dashboard view (inferred from UX testing)
- **SLA Compliance:** 100% of acceptance criteria passing; zero post-deploy issues
- **Test Coverage:** 80%+ code coverage achieved and maintained
- **Accessibility:** 100% WCAG AA compliance (axe-core passes, manual testing passes)
- **Dark Mode:** Works flawlessly in both light and dark themes

---

## References

- Related specs: Phase 6A CAPA Workflow (docs/specs/006a-capa-core/spec.md)
- Technical docs: Constitution.md, SPECIFICATION_STANDARD.md
- Existing code: src/store/useStore, src/api/findings, src/api/capa
- Data schema: findings table, capa_items table (Phase 6A)

---

## Approval

- Spec Author: Claude Haiku 4.5
- Created: 2026-06-05
- Ready for Review: Yes

