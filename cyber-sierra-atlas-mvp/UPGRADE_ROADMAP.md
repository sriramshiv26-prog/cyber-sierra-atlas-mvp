# 🚀 Cyber Sierra Atlas: Evolution Roadmap
## From "Professional MVP" to "World-Class Risk Intelligence Platform"

This document outlines the strategic growth path for the Cyber Sierra Atlas. It is divided into a **Visionary Roadmap** (long-term platform goals) and **Immediate Enhancements** (zero-dependency technical additions).

---

## 🗺️ The Visionary Roadmap (Long-Term)

### Horizon 1: The Connectivity Leap (API Ecosystem)
*Move from "Static Uploads" to "Live Data Streams".*
- [ ] **Enterprise Connectors:** Build native integrations for Jira, GitHub Issues, AWS Security Hub, and ServiceNow.
- [ ] **Live Sync Engine:** Transform the "Import" button into a "Sync" button that polls APIs for new findings.
- [ ] **CMDB Integration:** Auto-populate the Asset Registry by connecting to a Cloud Discovery tool or internal database.

### Horizon 2: The Intelligence Leap (Actionable Insights)
*Move from "What is wrong?" to "How do we fix it?"*
- [x] **Auto-Remediation Blueprints:** Use LLMs to generate step-by-step remediation plans for every finding. ✅ IMPLEMENTED (generateRemediationPlan via Claude API)
- [x] **Dynamic Risk Scoring:** Replace static severity with calculated Risk Score: `(Severity * Asset Criticality) / Control Effectiveness`. ✅ IMPLEMENTED (calculateRiskScore with control effectiveness)
- [x] **Interactive Attack Path Simulation:** Visual dependency hierarchies with nested asset trees. ✅ IMPLEMENTED (BlastRadiusView with DependencyNode component)
- [x] **Evidence Vault:** Attach files/screenshots to findings as base64 storage. ✅ IMPLEMENTED (evidence array with file metadata)
- [x] **Export Formats:** CSV, JSON, Markdown exports for findings and full store. ✅ IMPLEMENTED (exportFindingsAsCSV, exportStoreAsJSON, exportFindingsAsMarkdown)
- [x] **Finding Templates:** Pre-defined templates for common findings (9 templates). ✅ IMPLEMENTED (FINDING_TEMPLATES with baseProperties)
- [x] **Risk Velocity Tracking:** Timeline chart showing discovery vs. closure rate. ✅ IMPLEMENTED (LineChart with cumulative discovered/closed/active)

### Horizon 3: The Operational Leap (Platform Scale)
*Move from a "Browser Tool" to "Enterprise Infrastructure".*
- [ ] **Multi-Tenant Backend:** Migrate from `localStorage` to a secure PostgreSQL/Supabase backend.
- [ ] **RBAC (Role-Based Access Control):** Define views for "Analyst," "CISO," and "External Auditor."
- [ ] **Immutable Audit Trail:** Implement a blockchain-style change log for every finding to satisfy SOC2/ISO27001 requirements.
- [ ] **Executive War Room:** A "presentation mode" for board meetings with high-level risk storytelling.

---

## ⚡ Phase 1: Completed "Zero-Dependency" Enhancements
*All completed utilizing the existing React/localStorage/LLM stack without adding new platforms.*

✅ **Status: COMPLETE** (committed 2026-05-28)

### 1. Intelligence Engine $\rightarrow$ Fixes
- [x] **LLM Remediation Suggester:** "Generate Plan" button in `FindingDrawer` asks Claude for step-by-step remediation (max 3000 tokens). ✅ DONE
- [x] **Dynamic Risk Scoring:** Scoring logic in `scoring.ts` with formula `(Severity × Criticality / ControlEffectiveness) × 5`. Risk levels: Extreme (90+), High (70+), Medium (50+), Low (25+), Minimal (5+). ✅ DONE

### 2. Visualization $\rightarrow$ Trends
- [x] **Risk Velocity Tracking:** LineChart on Dashboard showing cumulative discovered/closed/active findings over time. ✅ DONE
- [x] **Visual Dependency Trees:** BlastRadiusView nested component (DependencyNode) showing asset hierarchy with finding counts. ✅ DONE

### 3. Operational $\rightarrow$ Utility
- [x] **Local Evidence Vault:** Evidence array with base64-encoded files, 5MB size limit per file. ✅ DONE
- [x] **Finding Templates:** 9 pre-built templates (default-password, outdated-tls, missing-mfa, weak-password-policy, unpatched-system, excessive-permissions, open-port, no-encryption, logging-disabled). ✅ DONE
- [x] **Export Suite:** CSV (with quoted fields), JSON (full store), Markdown (severity-grouped) exports. ✅ DONE

---

## 🎯 Phase 2A: "Zero-Dependency" Enhancements - CHARTS COMPLETE ✅

**Status:** Partially Complete (2 of 5 features) — 2026-05-28  
**Effort:** 2.5 hours (Severity × Age Heat Map + Asset Risk Spider Chart)  
**Cost:** $0 (Qwen2.5-coder local)

### Completed Phase 2A Features

- [x] **Severity × Age Heat Map** — Shows findings by severity (rows) × age brackets (columns). Color intensity (green=new, red=old) reveals SLA violations at a glance. Implementation: `src/lib/chart-utils.ts`, DashboardView new section. 277 LOC, builds in 3.95s.

- [x] **Asset Risk Spider Chart** — Replaces bar chart with 5-dimensional radar showing top 5 assets. Dimensions: Vulnerability Count, Avg Severity, Open %, Overdue Count, Control Gap. Multi-dimensional view beats single-number ranking. Recharts RadarChart + normalization logic.

**Commit:** `43602b6` — "feat: Implement Severity × Age Heat Map and Asset Risk Spider Chart"

---

## 🎯 Phase 2B: Planned "Zero-Dependency" Enhancements (Horizon 2B & 2C)
*Operational quality + compliance features. Planning complete: 2026-05-28. Implementation roadmap: `docs/HORIZON_2_ENHANCEMENT_PLAN.md`*

**Total Effort:** 18-24 hours | **Total Cost:** $0 (Qwen2.5-coder local) | **Model:** Qwen2.5-coder-1.5B

**Full Plan:** See `docs/HORIZON_2_ENHANCEMENT_PLAN.md` for detailed task breakdown, risk analysis, and sequencing.

### Priority 1: Smart Duplicate Detection (FOUNDATION) [4-5h, $0]
- [ ] Context-aware dedup: Same vulnerability + same asset context only
- [ ] Duplicate group tracking: `is_confirmed_unique` and `duplicate_group_id` fields
- [ ] Duplicate Management UI: Flag/confirm/merge interface in FindingsList
- [ ] Manual override: Analysts can override dedup decisions
- **Status:** Planned | **Start Date:** 2026-06-02

### Priority 2: Overdue Items Tracking (OPERATIONS) [3-4h, $0]
- [ ] Dashboard KPI: Count of findings where due_date < now() and status ≠ 'Closed'
- [ ] Overdue detail modal: Show owner, days overdue, current status, remediation plan
- [ ] FindingsList filter: "Show only overdue" checkbox
- [ ] Risk scoring: +20% penalty for findings overdue >30 days
- **Status:** Planned | **Start Date:** 2026-06-03

### Priority 3: RCA Registration & Genealogy Display (CONTEXT) [2-3h, $0]
- [ ] Schema addition: `root_cause?: string` field
- [ ] FindingDrawer: RCA textarea input (5-10 sentence narrative)
- [ ] Optional RCA categories: Configuration, Missing Patch, Weak Controls, Design Flaw
- [ ] GenealogyView: Display RCA context alongside finding relationships
- **Status:** Planned | **Start Date:** 2026-06-03

### Priority 4: Editable Remediation Plans (UX) [3-4h, $0]
- [ ] Schema update: Split into `remediation_suggested` (AI) and `remediation_confirmed` (user)
- [ ] FindingDrawer: "Accept & Edit" button for remediation plans
- [ ] Audit trail: Track `remediation_last_modified_by` and `remediation_last_modified_at`
- [ ] Delta display: Show what user changed from AI suggestion
- **Status:** Planned | **Start Date:** 2026-06-04

### Priority 5: Business Impact Analysis (STRATEGY) [6-8h, $0] — DEFERRED to Horizon 3
- [ ] Asset enrichment: `business_criticality`, `mtpd`, `max_downtime_cost`, `data_classification`
- [ ] BlastRadiusView: ServiceImpactCard showing business context
- [ ] Impact scoring: Finding risk × asset criticality = business impact score
- [ ] Dashboard: Business Impact Trend chart (cost exposed over time)
- **Status:** Deferred (requires business data) | **Planned Start:** 2026-06-10 (Phase 3)

---

## 🛡️ Critical Blind Spots to Address
*Key areas currently missing that are essential for a "Unicorn" product:*

1. **Closing the Feedback Loop:** The tool currently consumes data but doesn't "push" it. Integrating with a ticketing system is the primary goal.
2. **Evidence Management:** A finding without evidence is just a claim. The tool needs a robust way to attach "Proof of Finding."
3. **Time-Series Analysis:** The board doesn't care about the *current* state; they care about the *trend*. The tool needs to track "Risk Delta" over time.
