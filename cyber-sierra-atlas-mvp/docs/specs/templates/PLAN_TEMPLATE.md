# Implementation Plan Template

**Feature:** [Feature name]  
**Spec Reference:** [Link to spec.md]  
**Created:** [YYYY-MM-DD]  
**Estimated Effort:** [X hours]  

---

## Executive Summary

[1 paragraph summarizing the approach and key decisions]

---

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │
│   (Component)   │
└────────┬────────┘
         │
    ┌────▼─────┐
    │   API    │
    │(Endpoint)│
    └────┬─────┘
         │
    ┌────▼──────────┐
    │   Database    │
    │  (Schema)     │
    └───────────────┘
```

[Detailed architecture description]

---

## Technical Decisions

### Decision 1: [Choice]
- **Rationale:** [Why we chose this]
- **Alternative Considered:** [What else we looked at]
- **Trade-off:** [What we're giving up]
- **Impact:** [How this affects the system]

### Decision 2: [Choice]
- **Rationale:** [Why we chose this]
- **Alternative Considered:** [What else we looked at]
- **Trade-off:** [What we're giving up]
- **Impact:** [How this affects the system]

---

## Implementation Approach

### Phase 1: Data Model & API (Effort: X hours)
1. Create database schema
2. Create TypeScript types
3. Create API endpoints
4. Write integration tests

**Success Criteria:**
- [ ] Schema migration runs successfully
- [ ] All endpoints return correct responses
- [ ] Tests passing: [X/X]

### Phase 2: Frontend Components (Effort: X hours)
1. Create React components
2. Integrate with API
3. Add state management
4. Write component tests

**Success Criteria:**
- [ ] Components render without errors
- [ ] User interactions work as specified
- [ ] Tests passing: [X/X]

### Phase 3: Testing & Polish (Effort: X hours)
1. End-to-end testing
2. Performance testing
3. Accessibility testing
4. Dark mode support

**Success Criteria:**
- [ ] All acceptance criteria met
- [ ] Zero console errors/warnings
- [ ] Dark mode fully functional

---

## Data Model

```sql
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY,
  [field_name] [type] NOT NULL,
  [field_name] [type],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT [constraint_name] [constraint]
);

CREATE INDEX idx_[table]_[field] ON [table_name]([field]);
```

---

## API Contracts

### Endpoints to Create

#### POST /api/[resource]
```
Description: Create a new [resource]
Request:
  - field1 (required, string)
  - field2 (required, number)

Response (201 Created):
{
  "data": {
    "id": "uuid",
    "field1": "value",
    "field2": 123,
    "created_at": "2026-06-04T..."
  }
}

Error (400 Bad Request):
{
  "error": "field1 is required",
  "code": "VALIDATION_ERROR"
}
```

#### GET /api/[resource]/:id
```
Description: Get a specific [resource]
Response (200 OK):
{
  "data": {
    "id": "uuid",
    "field1": "value",
    "field2": 123
  }
}

Error (404 Not Found):
{
  "error": "Resource not found",
  "code": "NOT_FOUND"
}
```

---

## Task Breakdown

| # | Task | Type | Effort | Depends On |
|---|------|------|--------|-----------|
| 1 | Create database schema | DB | 1h | - |
| 2 | Create TypeScript types | Code | 1h | 1 |
| 3 | Create API endpoints | Code | 2h | 2 |
| 4 | Write API tests | Test | 1.5h | 3 |
| 5 | Create React components | Code | 2h | 2 |
| 6 | Integrate with API | Code | 1.5h | 3,5 |
| 7 | Write component tests | Test | 1.5h | 5,6 |
| 8 | E2E testing & validation | Test | 1h | 7 |
| **TOTAL** | | | **11.5h** | |

---

## Dependencies

### External Libraries/Services
- [Library]: [Version/Purpose]
- [Service]: [Purpose/API]

### Internal Dependencies
- [Module]: [Purpose]
- [Module]: [Purpose]

### Blockers
- [Item]: [Status]

---

## Testing Strategy

### Unit Tests
- Types validation: [Details]
- API logic: [Details]
- Utility functions: [Details]

**Target Coverage:** 80%+

### Integration Tests
- API endpoints with database: [Details]
- Component with API: [Details]

### End-to-End Tests
- Complete user flow: [Details]
- Error scenarios: [Details]

### Performance Tests
- API response time: <500ms
- Component render time: <100ms

---

## Deployment Strategy

### Database Migrations
1. Create migration file
2. Test locally
3. Review migration
4. Deploy to staging
5. Deploy to production

### Code Deployment
1. Feature branch → PR
2. Two-stage review (spec compliance + code quality)
3. Merge to main
4. Deploy to staging
5. Deploy to production

### Rollback Plan
- [What to do if deployment fails]
- [Database rollback steps]
- [Communication plan]

---

## Success Criteria

- [ ] All acceptance criteria from spec met
- [ ] All tests passing (100%)
- [ ] Zero console warnings/errors
- [ ] Code quality review approved
- [ ] Spec compliance review approved
- [ ] Performance targets met
- [ ] Dark mode fully functional
- [ ] Accessibility standards met (WCAG AA)

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| [Risk description] | [How we'll prevent/handle] |
| [Risk description] | [How we'll prevent/handle] |

---

## Approval

- Plan Author: [Name]
- Reviewed by: [Name]
- Approved by: [Name]
- Approval Date: [YYYY-MM-DD]
