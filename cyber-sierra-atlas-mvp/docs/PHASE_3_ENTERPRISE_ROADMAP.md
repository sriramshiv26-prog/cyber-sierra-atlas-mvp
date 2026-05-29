# ATLAS Phase 3: The Operational Leap (Enterprise Scale)

**Status**: 📋 Planning Phase  
**Target**: Transform from browser-based MVP to enterprise infrastructure  
**Timeline**: 4-6 weeks (estimated)  
**Cost Optimization**: Use Qwen2.5-coder local + Supabase free tier  

---

## 🎯 Phase 3 Overview

Move from **localStorage → PostgreSQL/Supabase backend**  
Move from **single-user → multi-tenant with RBAC**  
Move from **transactional → audit-trail with immutability**  
Move from **tactical → strategic** (executive decision support)

### Current Architecture (MVP)
```
Browser → React App → localStorage (single user)
```

### Target Architecture (Enterprise)
```
Browser
  ↓
React App (SPA)
  ↓
API Gateway (Express.js + JWT)
  ↓
Multi-Tenant Backend (Tenant isolation via RLS)
  ↓
PostgreSQL/Supabase (row-level security)
```

---

## 🏛️ Pillar 1: Multi-Tenant Architecture

### Task 3.1: Backend Scaffolding (8-10h, $0-5)
- [ ] Set up Express.js + TypeScript server
- [ ] Implement JWT/Supabase Auth integration
- [ ] Create middleware for tenant isolation
- [ ] Database schema: users, teams, tenants, findings, assets
- [ ] Row-level security (RLS) policies per tenant
- [ ] Tests: Auth flow, tenant isolation, permission boundaries

**Model**: Supabase free tier + Qwen2.5-coder  
**Critical**: Validate RLS policies thoroughly before production

### Task 3.2: API Layer - Findings (6-8h, $0)
- [ ] REST endpoints: POST/GET/PUT/DELETE findings
- [ ] Query filters (severity, status, asset, framework, owner)
- [ ] Batch operations (update N findings, soft-delete with audit)
- [ ] Pagination + full-text search on PostgreSQL
- [ ] Duplicate detection API endpoint
- [ ] Tests: CRUD, filtering, batch operations, RLS enforcement

### Task 3.3: API Layer - Assets & Controls (4-6h, $0)
- [ ] Asset CRUD endpoints
- [ ] Control framework management
- [ ] Asset hierarchy (dependencies, dependents)
- [ ] Tests: Asset relationships, deduplication, control mapping

### Task 3.4: Audit Trail Table (6-8h, $0)
**Schema**:
```sql
audit_logs(
  id (PK),
  finding_id,
  user_id,
  action (CREATE, UPDATE, DELETE, MERGE_DUPLICATES),
  timestamp,
  before (JSON),
  after (JSON)
)
```
- [ ] PostgreSQL triggers for auto-capture
- [ ] Immutable records (never update/delete)
- [ ] API endpoint: GET /findings/{id}/audit-log
- [ ] Tests: Trigger validation, immutability enforcement

---

## 🔐 Pillar 2: Role-Based Access Control (RBAC)

### Role Model

```
TEAM ADMIN
  ├─ Full CRUD on all findings
  ├─ Manage users + roles
  ├─ View audit trail (full)
  └─ Export data (full)

CISO / MANAGER
  ├─ View all findings (read)
  ├─ Update status + remediation
  ├─ Create reports + exports
  ├─ View audit trail (own changes + team)
  └─ Cannot delete findings

ANALYST
  ├─ Create + edit findings
  ├─ View own findings + shared
  ├─ Update status
  └─ View limited audit trail (own changes)

AUDITOR (read-only)
  ├─ View all findings
  ├─ View audit trail (full)
  └─ Cannot edit anything

VENDOR (external)
  ├─ View findings assigned to them
  ├─ Update status to 'Resolved'
  └─ Cannot view sensitive fields
```

### Task 3.5: Role & Permission Schema (4-6h, $0)
- [ ] users table: user_id, email, name, role_id, tenant_id
- [ ] roles table: role_id, name (admin, ciso, analyst, auditor, vendor)
- [ ] permissions table: role_id, resource, action
- [ ] RLS policies: Check user role before returning data
- [ ] Tests: Permission enforcement per role, data isolation

### Task 3.6: Frontend RBAC (4-6h, $0)
- [ ] AuthContext: User + role + permissions
- [ ] ProtectedRoute: Block UI based on role
- [ ] Conditional rendering: Show/hide buttons per role
- [ ] Input validation: Disable sensitive fields for auditor
- [ ] Export limitations: Only admin/ciso can full-export
- [ ] Tests: Role-based UI, permission checks

---

## 📊 Pillar 3: Immutable Audit Trail

### Audit Trail Principles
- **Append-only**: Never update/delete audit records
- **Timestamped**: All changes timestamped to UTC
- **Immutable**: PostgreSQL triggers auto-capture
- **Queryable**: Fast audit retrieval by finding/user/date range

### Task 3.7: Audit Infrastructure (6-8h, $0)
- [ ] PostgreSQL triggers on findings table
- [ ] Capture all column changes (before → after as JSON)
- [ ] Store user_id + timestamp automatically
- [ ] Compress old audit records (optional: S3 archive)
- [ ] Query performance: Index on (finding_id, timestamp)
- [ ] Tests: Trigger validation, query performance

### Task 3.8: Audit UI Components (4-6h, $0)
- [ ] AuditTrailDrawer: Show change history for a finding
- [ ] Side-by-side diff: Before/After values
- [ ] Timeline view: Click to see state at any point
- [ ] Export audit log as PDF: For compliance
- [ ] Tests: Component rendering, diff accuracy

---

## 👔 Pillar 4: Executive War Room

### Dashboard: 7 KPIs with Sparklines

```
┌────────────────────────────────────────────────────────┐
│ Executive Risk Dashboard (3-month trends)             │
├────────────────────────────────────────────────────────┤
│ Open Risk ($)  │ SLA Compliance  │ Overdue Items      │
│ Critical Open  │ Mean Time-to-Fix │ Risk Velocity     │
│ Team Velocity  │                  │                    │
└────────────────────────────────────────────────────────┘

Risk By Framework (Stacked Bar)
Risk Exposure Trend (3-month Line Chart)
Top Assets by Risk (Table)
Team Performance (Analyst Velocity)
```

### Task 3.9: Executive Metrics Engine (8-10h, $0)
- [ ] Compute views: pre-calculate KPIs nightly
- [ ] MTTR calculation: (closure_date - discovery_date)
- [ ] Risk exposure formula: SUM(finding.risk_score) by status
- [ ] SLA compliance: % closed within target date
  - Critical: 7 days
  - High: 30 days
  - Medium: 60 days
  - Low: 90 days
- [ ] Tests: Metric accuracy, performance (< 5s query)

### Task 3.10: Executive Dashboard (8-10h, $0)
- [ ] KPI cards with sparklines (3-month trend)
- [ ] Risk by framework stacked bar
- [ ] Risk exposure line chart
- [ ] Top assets + analysts tables
- [ ] Responsive design (desktop-focused)
- [ ] Tests: Chart rendering, data accuracy

### Task 3.11: Board Report Generator (6-8h, $0)
- [ ] Template system: Board vs CISO vs CEO
- [ ] Dynamic narrative: Auto-generate text based on metrics
- [ ] Chart embedding: Risk trend, compliance, velocity
- [ ] Branding: Logo, colors, footer
- [ ] PDF export (via Puppeteer or wkhtmltopdf)
- [ ] Tests: PDF quality, narrative accuracy

---

## 📅 Implementation Sequence

### **Phase 3A: Backend Foundation (Weeks 1-2)**
1. **Task 3.1**: Backend scaffolding + Supabase auth
2. **Task 3.4**: Audit trail table + triggers
3. **Task 3.5**: RBAC schema + RLS policies
4. **Outcome**: Backend ready for API implementation

### **Phase 3B: API & Audit (Weeks 2-3)**
5. **Task 3.2**: Findings API endpoints
6. **Task 3.3**: Assets & controls API
7. **Task 3.7**: Audit infrastructure finalization
8. **Outcome**: APIs callable from frontend, audit trail working

### **Phase 3C: Frontend RBAC & Audit (Weeks 3-4)**
9. **Task 3.6**: Frontend RBAC (AuthContext, ProtectedRoute)
10. **Task 3.8**: Audit UI components
11. **Outcome**: Connected to backend with role-based UI

### **Phase 3D: Executive Suite (Weeks 4-6)**
12. **Task 3.9**: Executive metrics engine
13. **Task 3.10**: Executive dashboard
14. **Task 3.11**: Board report generator
15. **Outcome**: Complete executive dashboard with reports

---

## 🛠️ Technology Stack (Phase 3)

| Layer | Technology | Why | Cost |
|-------|-----------|-----|------|
| **Auth** | Supabase Auth | Built-in JWT + RLS | Free |
| **Database** | PostgreSQL (Supabase) | ACID + RLS + triggers | Free tier |
| **Backend** | Express.js + TypeScript | Lightweight, familiar | Free |
| **Middleware** | Supabase SDK | Auth + RLS integration | Free |
| **Frontend** | React (existing) | No changes needed | Free |
| **PDF Export** | Puppeteer | Headless Chrome rendering | Free |
| **Testing** | Vitest (existing) | Full coverage | Free |
| **Code Generation** | Qwen2.5-coder | Local LLM inference | Free |

**Total Cost**: $0 (free tier) + optional upgrade to $25-50/month if traffic exceeds free limits

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **RLS Misconfiguration** | Data leaks between tenants | Thorough testing + security review before production |
| **Performance Degradation** | Slow queries as data grows | Index strategy + query optimization + caching |
| **Audit Trail Storage Bloat** | Database size explosion | Archive old logs to S3 quarterly |
| **API Rate Limits** | Throttling for bulk operations | Request batching + caching + async jobs |
| **Auth Edge Cases** | Regression in existing flow | Comprehensive integration tests for all paths |
| **Migration Complexity** | Data loss during migration | Run in parallel (new backend + old localStorage) for weeks |

---

## ✅ Acceptance Criteria (Phase 3 Complete)

### Functional Requirements
- [ ] Multi-tenant isolation verified: Teams can't see each other's data
- [ ] RBAC enforced: Each role can only access permitted resources
- [ ] Audit trail complete: Every change logged with who/when/before/after
- [ ] Executive dashboard live: All 7 KPIs displaying correctly
- [ ] Board report generator: PDF exports with dynamic narrative working

### Quality Gates
- [ ] All critical tests passing (80%+ coverage)
- [ ] API response time < 200ms (p95)
- [ ] Dashboard load < 3 seconds
- [ ] No data leaks in RLS tests
- [ ] Audit trail immutability validated
- [ ] Security review passed (OAuth, RLS, tenant isolation)

### Performance Targets
- [ ] Database: < 10k findings without degradation
- [ ] API: 100+ concurrent users
- [ ] Dashboard: Computed in < 5 seconds nightly
- [ ] Search: < 500ms for full-text queries

---

## 🚀 Future Enhancements (Phase 4+)

- **Webhooks**: Slack/Teams notifications on findings
- **Time-series**: Historical tracking (findings per severity per week)
- **ML/Anomaly Detection**: Flag unusual patterns
- **Integration Ecosystem**: Jira, ServiceNow, GitHub, Slack connectors
- **Real-time Collaboration**: Multi-user concurrent editing
- **Mobile App**: Native iOS/Android
- **GraphQL API**: Alternative to REST
- **Historical Risk Modeling**: Track risk exposure over quarters
- **Predictive Analytics**: Forecast findings based on trends

---

## 📊 Phase 3 Success Metrics

| Metric | Target | Achieved Via |
|--------|--------|--------------|
| **User Onboarding** | < 5 min per user | Automated auth + role assignment |
| **Data Security** | 100% tenant isolation | RLS policies validated |
| **Audit Compliance** | Complete trail | PostgreSQL triggers + immutability |
| **Decision Speed** | < 5 min to risk view | Executive dashboard precomputed |
| **Time to Remediation** | SLA compliance > 90% | Visibility + tracking + escalation |
| **Team Scaling** | Support 10+ teams | Multi-tenant architecture + RLS |
| **Audit Pass Rate** | 100% (SOC2/ISO27001) | Complete audit trail |

---

## 📋 Phase 3 Launch Checklist

- [ ] Phase 2B completed (59/59 tests passing) ✓
- [ ] Technology stack approved (Supabase + Express)
- [ ] Data model reviewed (tenant isolation, audit schema)
- [ ] RBAC matrix agreed upon (roles + permissions)
- [ ] Security review completed (RLS, authentication)
- [ ] Timeline realistic (4-6 weeks estimated)
- [ ] Budget approved (free tier + Qwen2.5-coder)
- [ ] Stakeholder sign-off obtained

---

## 🎯 Summary

**Phase 3 transforms ATLAS from MVP to enterprise platform:**

✅ **Backend**: PostgreSQL + Express.js + Supabase  
✅ **Multi-tenant**: Row-level security isolation  
✅ **RBAC**: 5 roles with granular permissions  
✅ **Audit Trail**: Immutable change history (compliance-ready)  
✅ **Executive Suite**: Dashboard + board reporting  

**Cost**: $0 (local dev) → $25-200/month (hosted)  
**Timeline**: 4-6 weeks  
**Complexity**: High (significant architectural changes)  

**Status**: Phase 2B complete. Phase 3 ready for kickoff upon approval.

---

## 📞 Questions?

Refer to:
- `PHASE_2B_COMPLETE.md` - What we just shipped (59 tests passing)
- `phase3_task_cost_analysis.md` - Detailed cost breakdown
- `../src/` - Phase 2B implementation (smart dedup, overdue tracking, RCA, remediation)
