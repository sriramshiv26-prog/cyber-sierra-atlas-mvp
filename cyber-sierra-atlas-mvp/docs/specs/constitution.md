# Cyber Sierra Atlas MVP: Constitution

**Version:** 1.0  
**Effective Date:** 2026-06-04  
**Last Updated:** 2026-06-04  

---

## Purpose

This Constitution defines the **non-negotiable standards** that every feature, specification, and code change must comply with in the Cyber Sierra Atlas MVP project.

The Constitution is the **safety net** that ensures consistent quality, security, and maintainability across all work.

---

## Mandatory Tech Stack

These technology choices are **not negotiable**:

| Component | Requirement |
|-----------|-------------|
| **Language** | TypeScript (strict mode: `true`) |
| **Framework** | React 18+ |
| **State Management** | Redux-like useStore hook pattern |
| **Testing Framework** | Vitest (not Jest) |
| **UI Library** | Testing Library (@testing-library/react) |
| **Build Tool** | Vite (not Webpack) |
| **Styling** | Tailwind CSS 3+ |
| **Package Manager** | npm (monorepo ready) |
| **Runtime** | Node.js 18+ |
| **Database** | PostgreSQL (assumed for backend) |

### No Exceptions
- No mixing with other frameworks (Vue, Angular, etc.)
- No migration to different languages for this phase
- No alternative test runners (Jest, Mocha, etc.)
- No CSS-in-JS or other styling approaches

---

## Quality Standards (All Non-Negotiable)

### TypeScript Compliance
- [ ] `strict: true` in tsconfig.json
- [ ] No `any` types except documented exceptions (max 2-3 per file)
- [ ] No unsafe casts (`as any`)
- [ ] All imports/exports typed
- [ ] No implicit `any`

**Verification:** `npx tsc --noEmit` returns zero errors

### Test Coverage
- [ ] Minimum 80% code coverage
- [ ] All user-facing features tested
- [ ] Edge cases covered
- [ ] Error scenarios tested

**Verification:** `npm test` shows coverage report

### Code Quality
- [ ] Zero console.errors in production code
- [ ] Zero console.warn in production code
- [ ] No TODO/FIXME without follow-up ticket
- [ ] No commented-out code
- [ ] No debug code (debugger statements, etc.)

**Verification:** Code review checklist passes

### Dark Mode Support
- **Required for all UI components**
- [ ] All colors have `dark:` variants
- [ ] Tested in both light and dark modes
- [ ] Using Tailwind `dark:` classes (not custom logic)
- [ ] No hardcoded colors

**Pattern:** `className="bg-white dark:bg-slate-900"`

### Accessibility (WCAG AA Minimum)
- [ ] Keyboard navigation works
- [ ] Color contrast ≥4.5:1
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Semantic HTML used

**Verification:** axe-core scan, manual testing

### Build & Performance
- [ ] Build succeeds with zero errors
- [ ] Build time < 10 seconds (Vite)
- [ ] Bundle size reasonable (track with each PR)
- [ ] No console warnings on production build

**Verification:** `npm run build` succeeds

---

## Specification Requirements

### Every Spec Must Include:
- [ ] Clear feature description
- [ ] 3-5 acceptance criteria (testable)
- [ ] Non-functional requirements (performance, security, accessibility)
- [ ] Data model changes (if any)
- [ ] API contracts (if applicable)
- [ ] Edge cases (minimum 3)
- [ ] Testing strategy
- [ ] Risk assessment
- [ ] Approval signatures

### Constitution Compliance Check:
Before planning, spec MUST be reviewed against:
- [ ] Tech stack matches mandatory tools
- [ ] Testing strategy covers 80%+ coverage target
- [ ] Dark mode requirement understood
- [ ] Accessibility approach defined
- [ ] No contradictions with existing specs

---

## Code Review Process (Two-Stage, Non-Negotiable)

### Stage 1: Spec Compliance Review
**Goal:** Does the code do exactly what the spec says?

Check:
- [ ] Spec acceptance criteria all met
- [ ] No extra features not in spec (scope creep)
- [ ] No missing features from spec
- [ ] Spec edge cases handled
- [ ] Data model matches spec

**Rule:** Code must pass Stage 1 BEFORE going to Stage 2

### Stage 2: Code Quality Review
**Goal:** Is the code well-written, tested, and maintainable?

Check:
- [ ] TypeScript strict compliance
- [ ] Test coverage ≥80%
- [ ] Dark mode fully applied
- [ ] Accessibility standards met
- [ ] No console errors/warnings
- [ ] Follows project patterns
- [ ] Performance acceptable

**Rule:** Code must pass Stage 2 BEFORE merge

### Review Order
1. **ALWAYS Stage 1 first** (spec compliance)
2. **THEN Stage 2** (code quality)
3. Never skip either stage
4. Both must pass before merge

---

## Testing Requirements

### Unit Tests
- Minimum: 80% coverage
- Required for: Components, utilities, hooks, services
- Framework: Vitest + Testing Library
- Pattern: Arrange-Act-Assert

### Integration Tests
- Required for: API endpoints, component interactions
- Pattern: Real database (not mocks for critical paths)

### End-to-End Tests
- Required for: Critical user flows
- Tools: Playwright or Cypress (future)

### Test Naming
```typescript
// ✅ GOOD: Describes what is tested
it('should show error message when form submission fails')

// ❌ BAD: Describes implementation
it('calls handleError function')
```

---

## Git & Commits

### Commit Messages
Format: `[type]: [subject]`

Types:
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code restructure (no behavior change)
- `test:` — Tests only
- `docs:` — Documentation only
- `style:` — Formatting (no logic change)
- `chore:` — Dependencies, config

Example: `feat: add CAPA detail panel with state machine validation`

### Commit Discipline
- [ ] One logical change per commit
- [ ] Commits are atomic (can revert individually)
- [ ] Related tests included in same commit
- [ ] No merge commits in main (rebase or squash)
- [ ] Clear, descriptive message

### Branch Naming
Format: `[feature|fix|refactor]/[short-description]`

Examples:
- `feature/capa-detail-panel`
- `fix/audit-trail-ordering`
- `refactor/state-machine-utils`

---

## Approval Gates (All Required)

### Before Planning
- [ ] Spec review passed (complete, consistent, feasible)
- [ ] Constitution compliance check passed
- [ ] Tech stack/dependencies identified

### Before Implementation
- [ ] Plan review passed (architecture sound, decisions documented)
- [ ] Task breakdown is realistic
- [ ] Effort estimates are reasonable

### Before Merge
- [ ] Spec compliance review: APPROVED
- [ ] Code quality review: APPROVED
- [ ] All tests passing: 100%
- [ ] Zero console errors/warnings
- [ ] Zero regressions in other tests

### Before Deployment
- [ ] Code on GitHub
- [ ] Memory updated (decision records)
- [ ] Changelog entry written
- [ ] Release notes prepared

---

## Regression Testing

**Rule: ZERO regressions allowed**

- [ ] All Phase 2/4/5 tests still passing
- [ ] New changes don't break existing functionality
- [ ] Database migrations backwards compatible

**Verification:** `npm test` shows all tests passing

---

## Security & Compliance

### Required Security Checks
- [ ] No hardcoded secrets
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No CSRF protection needed (API token auth)
- [ ] Input validation on all user inputs
- [ ] Output encoding where needed

### Data Protection
- [ ] Sensitive data encrypted at rest (if applicable)
- [ ] Audit trail immutable
- [ ] User data not exposed in logs/errors

### Third-Party Dependencies
- [ ] All dependencies vetted
- [ ] Security advisories checked
- [ ] License compatibility verified

---

## Documentation Requirements

### In-Code Documentation
- [ ] Complex logic has 1-line comments
- [ ] Public APIs have JSDoc comments
- [ ] Non-obvious choices documented
- [ ] No redundant comments ("this increments x")

### External Documentation
- [ ] README updated if setup changes
- [ ] API docs updated if endpoints change
- [ ] Decision recorded in memory system
- [ ] Decisions linked to specs/PRs

---

## Performance Requirements

### Frontend
- [ ] Page loads in <3 seconds
- [ ] Components render in <100ms
- [ ] No unnecessary re-renders
- [ ] Lazy loading for large lists

### API
- [ ] Response time <500ms (p95)
- [ ] Database queries optimized
- [ ] No N+1 queries

### Build
- [ ] Build time <10 seconds
- [ ] Bundle size tracked
- [ ] No circular dependencies

---

## Accessibility Checklist

Must pass:
- [ ] Keyboard navigation (Tab through all controls)
- [ ] Color contrast (axe-core report)
- [ ] Screen reader (tested with NVDA/JAWS)
- [ ] Focus visible (outline/border on focus)
- [ ] Form labels (all inputs labeled)
- [ ] Semantic HTML (proper heading hierarchy)

---

## Phase Progression Rules

### Phase 6A ✅ Complete
- All 7 tasks done
- 517/517 tests passing
- Ready for Phase 6B

### Phase 6B (Current - starting with SDD)
- All features must have: Spec → Plan → Tasks → Code
- All Constitution requirements apply
- All quality gates enforced

### Phase 7+ 
- 100% of features use SDD
- Constitution compliance mandatory
- Zero post-deploy failures expected

---

## Exceptions & Waivers

### Policy
- No exceptions to Constitution without documented waiver
- Waivers require: Approval from lead architect
- Waivers must be: Minimal scope, limited duration
- Waivers must be: Tracked and reviewed monthly

### Documented Exceptions
- [Item]: [Reason]: [Duration]

---

## Review & Update Cadence

- **Monthly:** Review quality metrics, adjust if needed
- **Quarterly:** Full Constitution review
- **Annual:** Major standards update

---

## Approval & Enforcement

**This Constitution is APPROVED and EFFECTIVE as of 2026-06-04**

All work Phase 6B onwards MUST comply with this Constitution.

**Enforced by:**
- Spec compliance review (before planning)
- Code quality review (before merge)
- Automated checks (TypeScript, coverage, linting)

**Violations:** Any code that violates Constitution requirements is rejected in review.

---

## Questions?

If a requirement is unclear or conflicts with a real constraint, file an issue or update memory. Constitution evolves based on team feedback while maintaining core quality standards.

**Remember:** This Constitution exists to protect code quality and reduce production failures. Every requirement here is based on lessons learned from Phase 2-5.

---

**Constitution Status: ✅ ACTIVE & MANDATORY**
