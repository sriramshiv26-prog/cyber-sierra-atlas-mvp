# Phase 6: CAPA & Continuous Monitoring — Task Cost Analysis

**Date:** 2026-06-01  
**Project:** Cyber Sierra Atlas MVP  
**Phases:** 6A (CAPA Core) + 6B (Continuous Monitoring)

---

## Phase 6A: CAPA Core (4-5 hours)

### Task Breakdown & Complexity

| Task | Hours | Complexity | Model Recommendation | Rationale |
|------|-------|-----------|---------------------|-----------|
| **Task 1: CapaWorkflow Entity + useStore Actions** | 1-1.5h | Low-Medium | Qwen2.5-coder-1.5B | Mechanical: new entity, new reducer actions, straightforward integration with existing store pattern. Single file modification (useStore.ts) + new types. Clear spec. |
| **Task 2: CAPA Detail Panel Component** | 1.5-2h | Medium | Qwen2.5-coder-1.5B | Mechanical: React component following Phase 5 patterns (RemediationTable, AuditTrailView as reference). Form validation, file uploads, repeating fields. Recharts timeline chart for visual. |
| **Task 3: Active CAPA List + Filtering** | 0.5-1h | Low | Qwen2.5-coder-1.5B | Mechanical: Table component, filter controls, similar to Register tab. Queries CapaWorkflow collection, displays with status/owner/date filtering. |
| **Task 4: CAPA History Tab** | 0.5-1h | Low | Qwen2.5-coder-1.5B | Mechanical: Read-only list of closed CAPAs. Simple table, search by finding/date. Reuses CapaDetailPanel in read-only mode. |
| **Task 5: State Machine Validation** | 1h | Medium | Claude Sonnet | Integration: Complex business logic. State transitions, approval gates, validation rules. Needs judgment on edge cases. Recommend Sonnet for this task. |
| **Task 6: Audit Trail Integration** | 0.5h | Low | Qwen2.5-coder-1.5B | Mechanical: Hook into existing audit-log.ts pattern (Phase 5). Log state changes, evidence uploads, approvals. |
| **Task 7: Testing (Unit + Integration)** | 2-2.5h | Medium | Qwen2.5-coder-1.5B | Mechanical TDD: Create tests first, then implement. Following Phase 5 pattern (337 tests). Test state machine, approvals, linking. |

**Total Phase 6A:** 7-8 hours work, but 4-5 hours **actual implementation** (tests run in parallel)

---

### Model Selection Strategy

**Fast/Mechanical Tasks (Qwen2.5-coder-1.5B — $0 cost):**
- Task 1: Entity + actions (isolated, clear spec)
- Task 2: Detail panel (component boilerplate, Phase 5 patterns)
- Task 3: List + filtering (straightforward query/display)
- Task 4: History tab (read-only, minimal logic)
- Task 6: Audit integration (existing patterns)
- Task 7: Testing (TDD, mechanical)

**Judgment Tasks (Claude Sonnet — $2-3 cost):**
- Task 5: State machine (business logic, edge cases, approval gates)

**Review Tasks (Claude Opus — $5-8 cost):**
- Spec compliance review (2 subagents per task)
- Code quality review (verify Phase 5 standards)

---

### Token Optimization

**Per-Task Token Budget:**

| Task | Tokens Allocated | Optimization |
|------|------------------|--------------|
| Task 1 (Entity + Actions) | 8-10k | Qwen reads spec, creates types, adds 2 actions. No context bloat. |
| Task 2 (Detail Panel) | 15-20k | Qwen reads spec + 1 Phase 5 component (RemediationTable) as reference. RCA section is main complexity. |
| Task 3 (List) | 8-10k | Qwen reads spec, references Register tab pattern, minimal new code. |
| Task 4 (History) | 5-8k | Reuses CapaDetailPanel, mostly UI. |
| Task 5 (State Machine) | 10-15k | Sonnet reads full spec + state diagram. Judgment-heavy, needs context. |
| Task 6 (Audit) | 5-8k | Qwen references Phase 5 audit-log.ts pattern. |
| Task 7 (Tests) | 12-15k | TDD approach: write tests first, minimal implementation. |

**Total Phase 6A tokens:** 63-86k (vs. ~120k if using Sonnet for all tasks)

**Savings:** ~35% token reduction by using Qwen for mechanical tasks

---

## Phase 6B: Continuous Monitoring (3-4 hours, Optional)

### Task Breakdown

| Task | Hours | Complexity | Model |
|------|-------|-----------|-------|
| **Task 1: Monitoring Dashboard Component** | 1-1.5h | Medium | Qwen2.5-coder-1.5B |
| **Task 2: Trend Chart (Recharts)** | 0.5-1h | Low | Qwen2.5-coder-1.5B |
| **Task 3: Recurrence Detection Logic** | 1h | Medium | Claude Sonnet |
| **Task 4: Monitoring Integration Tests** | 0.5-1h | Low | Qwen2.5-coder-1.5B |

**Total Phase 6B tokens:** 35-50k (3-4 hours work)

---

## Execution Approach: Subagent-Driven Development

**Phase 6A (4-5 hours):**
1. Fresh subagent per task (7 tasks)
2. Qwen2.5-coder-1.5B for Tasks 1-4, 6-7 (mechanical)
3. Claude Sonnet for Task 5 (state machine judgment)
4. Two-stage review after each task:
   - Spec compliance (verify task matches spec)
   - Code quality (verify Phase 5 standards: tests, coverage, no regressions)

**Phase 6B (Optional, 3-4 hours):**
- Same approach: fresh subagent per task
- Qwen for Tasks 1-2, 4 (mechanical)
- Sonnet for Task 3 (recurrence logic)

---

## Cost Summary

| Phase | Tasks | Hours | Primary Model | Secondary Model | Est. Cost |
|-------|-------|-------|---------------|-----------------|-----------|
| **6A** | 7 | 4-5h | Qwen2.5-coder | Sonnet (Task 5) | $0-3 |
| **6B** | 4 | 3-4h | Qwen2.5-coder | Sonnet (Task 3) | $0-2 |
| **Total** | 11 | 7-9h | — | — | **$0-5** |

**Token Usage Estimate:**
- Phase 6A: 63-86k tokens
- Phase 6B: 35-50k tokens
- **Total: 98-136k tokens** (~$0.50-2.00 with Qwen + Sonnet mix)

---

## Phase 5 Comparison (Validation)

Phase 5 (7 features, 24-32 hours work):
- Average: 3-4 hours per feature
- Used Qwen2.5-coder-1.5B (local, $0)
- Result: 337 tests, 100% pass rate, zero regressions

Phase 6A (1 feature with RCA, 4-5 hours):
- Slightly above average (more complex than Heat Map, simpler than Export)
- Same model strategy (Qwen + Sonnet for judgment tasks)
- Target: 50+ tests, 100% pass rate, zero regressions

---

## Recommendation

**Execute Phase 6A + 6B together using subagent-driven development:**

✅ **Phase 6A (CAPA Core, 4-5 hours):**
- Tasks 1-4, 6-7: Qwen2.5-coder-1.5B (fast, $0, mechanical)
- Task 5: Claude Sonnet (state machine judgment, $2-3)
- Two-stage review per task
- Target completion: 6-8 hours wall-clock time (same-day possible)

✅ **Phase 6B (Continuous Monitoring, 3-4 hours, optional):**
- Same approach, 4 tasks
- Can defer to Phase 7 if needed

✅ **Token Optimization:**
- Qwen for 80% of work (mechanical tasks)
- Sonnet for 20% (judgment/integration)
- 35% fewer tokens than using Sonnet throughout

✅ **Quality:**
- Two-stage review ensures spec compliance + code quality
- Follows Phase 5 patterns (337 tests, 100% pass rate)
- Zero regressions expected

---

## Next Steps

1. **User Review:** Approve task cost analysis + model recommendations
2. **Invoke writing-plans:** Create detailed implementation plan with 7 tasks (Phase 6A)
3. **Dispatch subagents:** Fresh subagent per task, Qwen for mechanical, Sonnet for judgment
4. **Review cycle:** Spec compliance → code quality → approval
5. **Commit & Push:** All commits to GitHub with descriptive messages

