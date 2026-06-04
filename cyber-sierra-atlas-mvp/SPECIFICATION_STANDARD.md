# Specification-Driven Development Standard

**Cyber Sierra Atlas MVP**  
**Effective:** 2026-06-04  
**Version:** 1.0  

---

## What is Specification-Driven Development (SDD)?

**Specs are the source of truth. Code implements specs. Tests validate specs.**

```
SPEC (Source of Truth)
    ↓
PLAN (How to implement)
    ↓
CODE (Implementation)
    ↓
TESTS (Validation)
    ↓
DEPLOY (With confidence)
```

This is the opposite of traditional development where:
```
CODE (Best guess)
    ↓
TESTS (Hope it works)
    ↓
DEPLOY (Fingers crossed)
    ↓
FIX (In production)
```

---

## Every Feature Follows This Workflow

### Step 1: Specification (1-2 hours)

Write a detailed spec that answers:
- What does this feature do?
- How will we know it works? (acceptance criteria)
- What are edge cases?
- What are non-functional requirements?
- What data structures does it need?

**Using /specify (if available):**
```bash
specify --new-feature "Continuous Monitoring Dashboard"
# Creates: docs/specs/NNN-feature-name/spec.md
```

**Using manual approach:**
1. Copy `docs/specs/SPEC_TEMPLATE.md`
2. Fill in all sections completely
3. Save to `docs/specs/NNN-feature-name/spec.md`

**Spec checklist:**
- [ ] Feature description clear
- [ ] Acceptance criteria testable (not "works well", but "returns 200 OK")
- [ ] Edge cases identified
- [ ] Non-functional requirements quantified
- [ ] Data model defined
- [ ] API contracts defined
- [ ] Complies with constitution.md
- [ ] No contradictions

### Step 2: Spec Review (30 min)

Spec MUST pass review before planning. Reviewers check:
- Is every acceptance criterion testable?
- Are all edge cases covered?
- Does it comply with constitution.md?
- Are requirements unambiguous?
- Are there any contradictions?

**If review finds issues:** Spec bounces back for revision, re-reviewed

**When approved:** Proceed to Step 3

### Step 3: Implementation Plan (1-1.5 hours)

Create a plan that describes HOW to build the spec:
- Architecture decisions (why, not what)
- Technical approach
- Task breakdown
- Dependencies
- Testing strategy
- Effort estimates

**Using /plan (if available):**
```bash
specify --plan docs/specs/NNN-feature-name/spec.md
# Creates: docs/specs/NNN-feature-name/plan.md
```

**Using manual approach:**
1. Copy `docs/specs/templates/PLAN_TEMPLATE.md`
2. Fill in all sections (architecture, decisions, tasks)
3. Save to `docs/specs/NNN-feature-name/plan.md`

**Plan checklist:**
- [ ] Architecture clear (diagram helpful)
- [ ] Technical decisions have rationale
- [ ] All dependencies listed
- [ ] Tasks are 2-4 hour chunks
- [ ] Testing strategy covers 80%+
- [ ] Effort estimates realistic

### Step 4: Plan Review (30 min)

Plan MUST pass review before implementation. Reviewers check:
- Does architecture make sense?
- Are decisions well-reasoned?
- Are dependencies identified?
- Are tasks realistic?
- Is testing strategy adequate?

**If review finds issues:** Plan bounces back for revision, re-reviewed

**When approved:** Proceed to Step 5

### Step 5: Task Generation (30-45 min)

Break plan into executable tasks for TodoWrite:

**Using /tasks (if available):**
```bash
specify --tasks docs/specs/NNN-feature-name/plan.md
# Output: Structured task list
```

**Using manual approach:**
1. Extract task breakdown from plan.md
2. Create TodoWrite entries for each task
3. Link each task to spec requirement

**Each task should:**
- [ ] Be 2-4 hours of work
- [ ] Have clear acceptance criteria
- [ ] Reference the spec requirement it fulfills
- [ ] Have defined success criteria

### Step 6: Implementation (3-4 hours, normal TDD)

Implement the feature using TDD:
1. Write failing tests
2. Write minimal code to pass tests
3. Refactor if needed
4. All code must match spec exactly (no more, no less)

**Key rule:** Code that exceeds or falls short of the spec is a problem. Spec is the contract.

**Implementation checklist:**
- [ ] All acceptance criteria from spec covered by tests
- [ ] All edge cases from spec handled in code
- [ ] All tasks tracked in TodoWrite
- [ ] All commits reference spec
- [ ] 80%+ test coverage achieved
- [ ] Dark mode applied
- [ ] Accessibility standards met
- [ ] Zero console warnings

### Step 7: Two-Stage Code Review (30-60 min)

**Stage 1: Spec Compliance Review**
Does code do exactly what spec says?
- [ ] All acceptance criteria met
- [ ] No features added not in spec
- [ ] All spec edge cases handled
- [ ] Data model matches spec
- [ ] API contracts match spec

→ **Must pass Stage 1 before Stage 2**

**Stage 2: Code Quality Review**
Is code well-written and maintainable?
- [ ] TypeScript strict compliance
- [ ] Test coverage ≥80%
- [ ] Dark mode fully applied
- [ ] Accessibility standards met
- [ ] No console warnings/errors
- [ ] Follows project patterns
- [ ] Performance acceptable

→ **Must pass Stage 2 before merge**

### Step 8: Merge & Deploy

When both reviews pass:
```bash
git merge feature-branch
git push origin main
```

Update memory with decision record and deploy.

---

## File Structure

```
docs/specs/
├── constitution.md ← Project standards (change rarely)
├── SPEC_TEMPLATE.md ← Template for all new specs
├── templates/
│   ├── PLAN_TEMPLATE.md ← Template for all plans
│   └── SDD_CHECKLIST.md ← Review checklists
├── 001-continuous-monitoring/
│   ├── spec.md ← Feature specification
│   ├── plan.md ← Implementation plan
│   ├── data-model.md (optional)
│   ├── contracts/ (optional)
│   │   └── api.md
│   └── research.md (optional)
├── 002-next-feature/
│   ├── spec.md
│   ├── plan.md
│   └── ...
└── ...
```

---

## SDD Checklist (Use for Every Feature)

### SPECIFICATION PHASE
- [ ] Feature described clearly
- [ ] Acceptance criteria are testable
- [ ] Non-functional requirements quantified
- [ ] Data model defined
- [ ] API/interface contracts defined
- [ ] Edge cases identified (min 3)
- [ ] Complies with constitution.md
- [ ] Spec review passed

### PLANNING PHASE
- [ ] Architecture documented
- [ ] Technical decisions with rationale
- [ ] All dependencies identified
- [ ] Tasks broken into 2-4 hour chunks
- [ ] Effort estimates realistic
- [ ] Testing strategy covers 80%+
- [ ] Plan review passed

### TASK GENERATION PHASE
- [ ] Tasks created in TodoWrite
- [ ] Each task links to spec requirement
- [ ] Acceptance criteria per task clear

### IMPLEMENTATION PHASE
- [ ] TDD approach (tests first)
- [ ] All tasks tracked
- [ ] All commits reference spec
- [ ] 80%+ test coverage achieved
- [ ] No console errors/warnings
- [ ] Dark mode applied
- [ ] All tests passing

### CODE REVIEW PHASE
- [ ] Spec compliance review: APPROVED
- [ ] Code quality review: APPROVED
- [ ] All tests passing: 100%
- [ ] Zero regressions detected

### DEPLOYMENT PHASE
- [ ] Code on GitHub
- [ ] Memory updated
- [ ] Changelog entry
- [ ] Feature marked complete

---

## Key Principles

### 1. Specs are Primary Artifacts
Code implements specs, not vice versa. When spec and code disagree, spec wins.

### 2. Unambiguous Specs
Specs must be precise enough that two developers would implement them the same way. If a spec is ambiguous, it's not ready for planning.

### 3. Constitution Compliance
Every spec must comply with `constitution.md`. Constitution is the safety net for quality.

### 4. Traceability
Every code change traces back to a spec requirement. "Why did we build this?" → Spec.

### 5. Quality Gates
Specs are validated BEFORE planning. Plans are validated BEFORE coding. This prevents wasted time on bad specs/plans.

### 6. Clear Success Criteria
If you can't test it, it's not in the spec. Acceptance criteria must be testable.

---

## Tools & Commands

### Spec-Kit Tools (When Available)
```bash
# Generate feature spec
specify --new-feature "Feature Name"

# Generate implementation plan
specify --plan docs/specs/NNN-feature-name/spec.md

# Generate task list
specify --tasks docs/specs/NNN-feature-name/plan.md
```

### Manual Approach
1. Copy template from `docs/specs/SPEC_TEMPLATE.md`
2. Fill in sections
3. Commit to git
4. Share for review

### Testing
```bash
# Run all tests
npm test

# Run tests for specific feature
npm test -- features/my-feature

# Check test coverage
npm test -- --coverage
```

### Type Checking
```bash
# Verify TypeScript strict compliance
npx tsc --noEmit
```

---

## Common Scenarios

### Scenario 1: Requirement Changes Mid-Feature
1. Update the spec with new requirement
2. Re-run /plan command (or manually update plan)
3. Update task list
4. Code implements updated spec
5. Tests validate updated spec
6. All changes flow from spec change

### Scenario 2: Spec Ambiguity Found During Coding
1. STOP coding
2. Update spec to clarify
3. Get spec re-reviewed
4. Update plan
5. Update tasks
6. Resume coding with clear spec

### Scenario 3: Code Exceeds Spec
This is a problem. Either:
- Spec was incomplete → Update spec, re-review, continue
- Developer added features → Remove them (scope creep not allowed)

### Scenario 4: Edge Case Found During Testing
1. If spec already covered it → Code implements it
2. If spec didn't cover it → Update spec, re-review, update code

---

## Success Looks Like

- ✅ Every feature has a written spec
- ✅ Every spec passes review before planning
- ✅ Every plan passes review before coding
- ✅ Code matches spec exactly
- ✅ Tests validate spec acceptance criteria
- ✅ 100% test pass rate
- ✅ Zero regressions in other features
- ✅ Zero post-deploy surprises

---

## Why SDD Matters

Traditional development: You hope the code works.

SDD: You know the code works because:
1. Spec was validated for completeness
2. Plan was validated for feasibility
3. Code was checked against spec (before merge)
4. Tests validate spec acceptance criteria
5. Everything shipped has been reviewed against the spec

This is why you get zero post-deploy failures.

---

## FAQ

**Q: Isn't writing specs slower than just coding?**
A: No. Writing a spec takes 1-2 hours. Finding and fixing a bug in production takes 10+ hours. SDD prevents bugs by validating the spec before coding.

**Q: What if requirements aren't clear?**
A: That's exactly when you need a spec. Working through the spec forces clarity. Unclear specs bounce back in review.

**Q: What if the spec is wrong?**
A: Update it. Spec isn't written in stone. But changes flow through the system: spec → plan → code → tests. Clear audit trail.

**Q: How do we handle urgent fixes?**
A: Even hot fixes get a spec (simplified). Ensures we understand what we're fixing and why.

**Q: What about technical exploration?**
A: Write a spec for the spike. Document findings. Use findings to improve the full spec. Then implement.

---

## Next Steps

1. **Read this document completely**
2. **Read constitution.md** — Know the quality standards
3. **Review SPEC_TEMPLATE.md** — Understand spec structure
4. **For your first feature**, follow the 8-step workflow above
5. **Ask questions** — Update documentation if anything is unclear

---

## Status

**SDD is MANDATORY for:**
- ✅ Phase 6B onwards
- ✅ All new projects
- ✅ All features (no exceptions)

**Expected Outcome:**
- Zero post-deploy failures
- Clear decision audit trail
- 20%+ faster iteration
- Team confidence in deployments

---

**Last Updated:** 2026-06-04  
**Maintained by:** Architecture team  
**Questions?** Update this doc or raise an issue
