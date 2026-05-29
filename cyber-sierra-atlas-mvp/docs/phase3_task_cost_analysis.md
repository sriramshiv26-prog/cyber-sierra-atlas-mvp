# Phase 3 Task Cost Analysis

**Date:** 2026-05-29  
**Scope:** Framework Compliance Heat Map + Sankey Diagram (Business Impact deferred to Horizon 3)  
**Total Estimate:** 9-12 hours, $0-2 cost  
**Recommendation:** Use Qwen2.5-coder for mechanics (heat map data transforms, Sankey calculations), Claude Sonnet for visual decisions

---

## Feature Breakdown

### Feature 1: Framework Compliance Heat Map (P1)
**Purpose:** Map findings against compliance frameworks (ISO 27001, NIST CSF, CIS Controls) with heat map showing coverage gaps

**Complexity Estimation:**

| Task | Est. Time | Model | Cost | Reason |
|------|-----------|-------|------|--------|
| Schema: Add framework + control refs | 15 min | Qwen2.5 | $0 | Straightforward field addition |
| Logic: Map finding→control (algorithm) | 45 min | Qwen2.5 | $0 | Data structure transformation |
| Component: Framework selector dropdown | 20 min | Qwen2.5 | $0 | Standard React patterns |
| Component: Heat map UI (table) | 45 min | Qwen2.5 | $0 | HTML table + conditional styling |
| Tests: Coverage + mapping logic | 30 min | Qwen2.5 | $0 | TDD (tests→code) |
| Styling + dark mode | 20 min | Qwen2.5 | $0 | Tailwind classes |
| **Subtotal** | **2.75 hours** | — | **$0** | — |

**Key Decisions:**
- Static framework definitions (3 frameworks: ISO 27001/14 controls, NIST CSF/5 functions, CIS/20 controls)
- Heat map shows % compliance per framework: Red <33%, Orange 33-66%, Green 66%+
- Each finding can map to 1+ controls (not 1-to-1)
- Filtering by framework updates dashboard KPI

**Deliverables:**
- src/lib/framework-mapping.ts (algorithm: findingToControls)
- src/lib/schema.ts (updated: framework_controls?: string[])
- src/components/FrameworkSelector.tsx (dropdown: select framework)
- src/components/ComplianceHeatMap.jsx (table: coverage heat map)
- 4 unit tests (all passing)

---

### Feature 2: Sankey Diagram - Remediation Flow (P2)
**Purpose:** Visualize remediation workflow: Open → In Progress → Scheduled → Closed, colored by severity

**Complexity Estimation:**

| Task | Est. Time | Model | Cost | Reason |
|------|-----------|-------|------|--------|
| Schema: Add remediation_status field | 10 min | Qwen2.5 | $0 | One field addition |
| Logic: Build Sankey data (node/link transform) | 1 hour | Qwen2.5 | $0 | Node/link aggregation algorithm |
| Component: Sankey visual (Recharts) | 30 min | Qwen2.5 | $0 | Recharts Sankey (out of box) |
| Filtering: Severity colors in flow | 20 min | Qwen2.5 | $0 | Conditional styling |
| Tests: Data transform + aggregation | 25 min | Qwen2.5 | $0 | TDD |
| Dashboard integration | 15 min | Qwen2.5 | $0 | Wire up state |
| **Subtotal** | **2.66 hours** | — | **$0** | — |

**Key Decisions:**
- Sankey nodes = remediation statuses (Open, In Progress, Scheduled, Closed)
- Link thickness = count of findings in each transition
- Color flow by severity: Red/Orange/Blue
- Can toggle severity filter to show specific subset
- Position in dashboard: separate "Remediation Velocity" section

**Deliverables:**
- src/lib/schema.ts (updated: remediation_status: 'open'|'in_progress'|'scheduled'|'closed')
- src/lib/sankey-transform.ts (algorithm: buildSankeyData)
- src/components/RemediationSankey.jsx (Sankey visualization)
- src/hooks/useStore.tsx (action: UPDATE_REMEDIATION_STATUS)
- 3 unit tests (all passing)

---

### Feature 3: Business Impact Analysis (HORIZON 3)
**Status:** DEFERRED  
**Reason:** Requires business data (revenue/availability impact per asset), not available in current project scope  
**Estimated Cost when implemented:** 8-10 hours, $1-2 (requires data gathering + visualization refinement)

---

## Phase 3 Total Cost Analysis

| Feature | Time | Model | Cost | Status |
|---------|------|-------|------|--------|
| Framework Compliance Heat Map | 2.75h | Qwen2.5 | $0 | GO |
| Sankey Diagram - Remediation Flow | 2.66h | Qwen2.5 | $0 | GO |
| Business Impact Analysis | — | — | — | DEFER to Horizon 3 |
| **Integration Testing** | **1.5h** | **Qwen2.5** | **$0** | — |
| **Documentation** | **1h** | **Qwen2.5** | **$0** | — |
| **Total Phase 3 (2 features)** | **8-9 hours** | — | **$0** | **READY** |

---

## Implementation Sequence

1. **Schema Updates** (30 min) - Add framework_controls[], remediation_status
2. **Framework Mapping Logic** (45 min) - Algorithm: which controls does a finding satisfy?
3. **Sankey Transform Logic** (1 hour) - Algorithm: aggregate findings into node/link structure
4. **UI Components** (2 hours) - Heat map table + Sankey diagram
5. **Store Actions** (20 min) - Update remediation status
6. **Tests** (55 min) - TDD coverage for algorithms
7. **Dashboard Integration** (30 min) - Wire heat map + Sankey into dashboard
8. **Dark Mode + Styling** (30 min) - Tailwind + responsive
9. **Documentation** (1 hour) - User guide + API docs

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Sankey data transform complexity | Medium | Medium | Write tests first (TDD) |
| Framework mapping ambiguity | Low | Low | Pre-define all 3 frameworks in constants |
| Heat map performance (many findings) | Low | Low | useMemo on heat map calculation |
| Responsive Sankey on mobile | Medium | Low | Test viewport changes, scroll if needed |

---

## Success Criteria

- ✅ All tests passing (100%)
- ✅ TypeScript strict mode compliant
- ✅ Dark mode fully supported
- ✅ Responsive design verified (mobile/tablet/desktop)
- ✅ No breaking changes
- ✅ Backwards compatible with Phase 2B
- ✅ Documentation complete

---

## Next Steps

**Before Implementation:**
1. User approval of Phase 3 scope (Heat Map + Sankey only)
2. GPU machine deployment & Phase 2B testing complete
3. Frontend design mockup updated to reflect Phase 2B + Phase 3

**During Implementation:**
1. Use superpowers:subagent-driven-development with Qwen2.5-coder
2. Fresh subagent per task, two-stage review
3. Frequent commits (every task)
4. Full integration testing before GPU deployment

**After Implementation:**
1. Deploy Phase 3 to GPU machine
2. Run Phase 2B + Phase 3 full test suite
3. Begin Horizon 3 planning (Business Impact Analysis)

---

## Cost Savings Options

**If budget is tight:**
- Defer Sankey to Phase 3.5 (focus on Framework Heat Map only) → reduces to 3-4 hours, $0
- Use simple bar chart instead of Sankey → reduces to 1-2 hours additional work

**Recommended:** Implement both Heat Map + Sankey (8-9 hours total gives most value for compliance operations)
