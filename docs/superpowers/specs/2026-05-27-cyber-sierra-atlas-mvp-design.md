# Cyber Sierra Atlas MVP — Design Specification

**Date:** 2026-05-27  
**Version:** 1.0 (MVP Phase)  
**Status:** Ready for implementation  

---

## 1. Executive Overview

**Cyber Sierra Atlas MVP** is a lightweight, browser-based findings consolidation and reporting tool. Users upload audit reports, vulnerability scans, and risk assessments in any format (PDF, CSV, JSON, text), and the tool:

1. **Parses** findings using Claude AI (or local LLM) into a canonical schema
2. **Consolidates** them into a single register with deduplication and validation
3. **Visualizes** the data through dashboards, genealogy (source lineage), and asset mapping
4. **Generates** multi-format reports (executive briefing, board summary, audit memo, regulatory draft)
5. **Persists** everything to browser localStorage (no backend required for MVP)

**MVP Scope (Weeks 1–4):**
- File upload + LLM parser
- Consolidated register with inline editing
- Dashboard with KPIs and charts
- Genealogy view (source → finding → control → asset → impact)
- Asset registry and mapping
- Deduplication engine (exact + semantic + near-duplicate detection)
- Validation layer (required fields, business logic checks)
- Report generation (briefings for multiple audiences)
- Light/dark theme
- localStorage persistence

**Future Expansion (Phase 2+):**
- PostgreSQL backend
- API integrations (Wiz, Snyk, Qualys, Jira)
- Real-time webhooks
- Multi-tenant SaaS
- Custom reporting templates
- Audit trail and RBAC
- Time-series / Trajectory (trend analysis)

---

## 2. Architecture

### 2.1 Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | React 18 + Vite | Fast HMR, modern tooling |
| **Styling** | Tailwind CSS + CSS Modules | Brand tokens in custom properties |
| **State** | React useState + Context | Simple, no Redux needed for MVP |
| **Persistence** | localStorage (v1) | Upgrade to PostgreSQL in Phase 2 |
| **LLM** | Claude API (Sonnet) for parsing; later Qwen2.5-coder local | Anthropic SDK for inference |
| **Parsing** | PDF.js (PDFs), PapaParse (CSV), JSON.parse (JSON) | Format-agnostic |
| **Charts** | Recharts or D3 (lightweight) | Dashboard KPIs and trends |
| **UI Components** | Headless UI + Tailwind | Accessibility-first |

### 2.2 Data Flow

```
User uploads file (PDF, CSV, JSON, text)
  ↓
Format detector (identify file type)
  ↓
Parser (PDF.js / PapaParse / JSON.parse)
  ↓
LLM extraction (Claude → canonical schema)
  ↓
Smart ingest preview:
  ✅ New findings
  ⚠️ Duplicates (exact, semantic, near-match)
  ❌ Invalid rows (validation checks)
  ↓
User review + approval
  ↓
Store in localStorage (fr.store.v3)
  ↓
Dashboard / Register / Genealogy / Reports all read from store
```

### 2.3 Folder Structure

```
src/
├── components/
│   ├── Header.jsx                    # Logo, breadcrumb, theme toggle
│   ├── TabNav.jsx                    # 6-tab segmented navigation
│   ├── RegisterView.jsx              # Main findings table
│   ├── DashboardView.jsx             # KPIs, charts, asset correlation
│   ├── BlastRadiusView.jsx           # Dependency graph (one mode for MVP)
│   ├── CrosswalkView.jsx             # Framework matrix
│   ├── GenealogyView.jsx             # Source → Finding → Control → Asset → Impact
│   ├── ReportsView.jsx               # Report generation interface
│   ├── FileUploadModal.jsx           # Drag-drop file upload
│   ├── SmartIngestPreview.jsx        # Dedup + validation preview
│   ├── AssetRegistry.jsx             # Asset CRUD interface
│   └── ...
├── lib/
│   ├── parser.ts                     # File format detection + extraction
│   ├── llm.ts                        # Claude API calls for LLM parsing
│   ├── deduplication.ts              # Exact + semantic + near-dup detection
│   ├── validation.ts                 # Data quality checks
│   ├── scoring.ts                    # Systemic risk scoring (from prototype)
│   ├── reporting.ts                  # Report generation (multiple formats)
│   └── schema.ts                     # Data model + TypeScript types
├── hooks/
│   ├── useStore.ts                   # localStorage persistence
│   ├── useFilters.ts                 # Filter state management
│   ├── useAssets.ts                  # Asset registry state
│   └── ...
├── assets/
│   ├── brand-tokens.css              # Design tokens (from Cyber Sierra)
│   ├── logo.svg
│   └── ...
├── App.jsx                           # Main app component
├── App.css                           # Global styles
└── main.jsx                          # Entry point

public/
├── index.html
└── ...
```

---

## 3. Data Model (Enhanced Schema)

### 3.1 Finding (Core Object)

```typescript
interface Finding {
  id: string;                          // Unique ID (F-001, F-002, ...)
  title: string;                       // Finding title (required)
  description: string;                 // Detailed description
  severity: "Critical" | "High" | "Medium" | "Low" | "Informational";  // (required)
  status: "Open" | "In Progress" | "Resolved" | "Closed" | "Risk Accepted";
  
  // Genealogy metadata
  source_document: {
    filename: string;
    upload_date: ISO8601;
    parser_confidence: 0.0–1.0;
    raw_text?: string;                 // For auditing parser accuracy
  };
  
  // Asset mapping
  asset_id: string;                    // Links to Asset.id
  asset_name: string;                  // For quick display
  
  // Control mapping
  control_framework: string;           // "ISO 27001", "NIST CSF", etc.
  control_clause: string;              // "A.14.2.1"
  control_description?: string;
  
  // Vulnerability metadata
  cve?: string;                        // CVE-XXXX format (parsed from description)
  cvss_score?: number;                 // CVSS v3.1 (if available)
  
  // Business context
  due_date?: ISO8601;                  // Remediation due date
  owner?: string;                      // Person/team responsible
  remediation_notes?: string;
  evidence_url?: string;               // Link to supporting document
  
  // Relationships
  related_findings: string[];          // IDs of duplicate/related findings
  deduped_with?: string;               // If this is a merge result, parent ID
  
  // Metadata
  created_at: ISO8601;
  updated_at: ISO8601;
  flags?: {
    overdue?: boolean;                 // Due date < today
    aging?: boolean;                   // Open > 90 days
    at_risk?: boolean;                 // Critical + Open
    duplicate?: boolean;               // Exact match with another finding
    near_duplicate?: boolean;           // Semantic match
  };
}
```

### 3.2 Asset (CI/Infrastructure)

```typescript
interface Asset {
  id: string;                          // "web-app-01", "db-prod-01", etc.
  name: string;                        // Human-readable name
  type: "application" | "database" | "infrastructure" | "saas" | "vendor" | "network" | "other";
  owner?: string;                      // Owner team/person
  criticality: "Critical" | "High" | "Medium" | "Low";
  
  // Business context
  description?: string;
  business_impact?: string;            // "Handles 10K requests/day"
  annual_revenue_supported?: number;   // For CRQ (Phase 2)
  records_processed?: number;          // For GDPR impact (Phase 2)
  
  // Dependencies
  dependencies: string[];              // IDs of assets this depends on (upstream)
  dependents?: string[];               // IDs of assets depending on this (downstream)
  
  // Metadata
  created_at: ISO8601;
  updated_at: ISO8601;
}
```

### 3.3 Store (Top-level state)

```typescript
interface Store {
  findings: Finding[];
  assets: Asset[];
  controls: Control[];                 // Control framework reference data
  lastSaved: ISO8601;
  
  // UI state (separate)
  filters: {
    q: string;                         // Search query
    severity?: string;
    status?: string;
    source?: string;
    framework?: string;
    owner?: string;
    asset_id?: string;
  };
  drawerId: string | null;             // Open finding drawer ID
  view: "dashboard" | "register" | "blast" | "crosswalk" | "genealogy" | "reports";
  modalOpen: boolean;
  theme: "light" | "dark";
  density: "comfy" | "cosy" | "compact";
}
```

---

## 4. MVP Features (Phase 1)

### 4.1 File Upload & Parsing

**User Story:** "As a CISO, I want to drop a PDF/CSV/JSON and have findings auto-extracted."

**Implementation:**
- Drag-drop zone on landing page
- Supported formats:
  - **PDF:** Extract text via PDF.js, send to Claude for parsing
  - **CSV:** Auto-detect columns (title, severity, asset, due date, etc.)
  - **JSON:** Assume array of objects matching (partial) Finding schema
  - **Text/Plaintext:** Send raw to Claude for parsing
- Parser prompt (Claude):
  ```
  Extract findings from this document into JSON.
  For each finding, extract: title, description, severity, asset, due_date, owner, cve
  If not present, leave null. Severity is one of: Critical, High, Medium, Low, Informational.
  Asset is the infrastructure/app name mentioned in the finding.
  Return a JSON array of objects with these fields.
  ```

### 4.2 Smart Ingest with Deduplication & Validation

**User Story:** "I upload a PDF, see which findings are new vs duplicates vs invalid, then approve before import."

**Implementation:**

1. **Exact deduplication:**
   ```typescript
   // Same CVE + same asset = definitely a duplicate
   finding1.cve === finding2.cve && finding1.asset_id === finding2.asset_id
   ```

2. **Semantic deduplication:**
   ```typescript
   // Same CVE + different asset → related but not duplicate
   // Title similarity > 90% + same asset → likely duplicate
   // Use cosine similarity or LLM embedding comparison
   ```

3. **Validation checks:**
   ```typescript
   const validationRules = [
     { check: "title is not empty", flag: "MISSING_TITLE" },
     { check: "severity is one of [Critical, High, Medium, Low, Informational]", flag: "INVALID_SEVERITY" },
     { check: "if due_date exists, it's a valid ISO8601 date", flag: "INVALID_DUE_DATE" },
     { check: "if status is 'Resolved', updated_at should be set", flag: "INCONSISTENT_STATUS" },
     { check: "asset_id matches a known asset", flag: "UNKNOWN_ASSET" },
     { check: "if status === 'Open' && due_date < today", flag: "OVERDUE" },
     { check: "if status === 'Open' && created_at < 90 days ago", flag: "AGING" },
     { check: "if severity === 'Critical' && status === 'Open'", flag: "AT_RISK" },
   ];
   ```

4. **Smart Ingest Preview:**
   ```
   Found 15 findings in this PDF:
   
   ✅ New (8)
   ├─ SQL injection in /login [Severity: Critical]
   ├─ Weak MFA config [Severity: High]
   └─ ...
   
   ⚠️ Potential duplicates (4)
   ├─ "SQL injection in /login" — exact match with F-001 (from Snyk, 2024-05-12)
   │  Same CVE (CVE-2024-1234), same asset
   │  [Keep separate] [Merge findings]
   └─ ...
   
   ❌ Invalid rows (3)
   ├─ Row 5: missing severity [Auto-fix] [Skip]
   └─ ...
   
   [Approve import]
   ```

### 4.3 Consolidated Register (Main Table)

**User Story:** "I see all findings in one filterable, editable table with full context."

**Implementation:**
- **Columns:** ID · Title (+ subtitle/description) · Source doc · Severity · Status · Owner · Framework · Asset · Due · Actions
- **Inline editing:** Click any cell → edit → blur to save
- **Sticky header:** Scrollable body, header stays fixed
- **Filters:** Search (title/description) · Severity dropdown · Status dropdown · Source doc · Framework · Owner · Asset
- **Sorting:** Click column header to sort A→Z or Z→A
- **Row click:** Opens right-side drawer with full form

**Row drawer (side panel, 680px wide):**
```
┌─────────────────────────────────┐
│ ✕ F-001: SQL injection in /login│
├─────────────────────────────────┤
│ [Edit] [Duplicate merge] [Delete]│
│                                 │
│ FINDING                         │
│ Title: SQL injection in /login  │
│ Description: [textarea]         │
│ Severity: [dropdown] Critical   │
│ Status: [dropdown] Open         │
│ CVE: CVE-2024-1234              │
│ CVSS: 8.6                       │
│                                 │
│ ASSET & OWNER                   │
│ Asset: [Asset dropdown]         │
│ Owner: [text]                   │
│ Due date: [date picker]         │
│                                 │
│ CONTROL MAPPING                 │
│ Framework: [ISO 27001]          │
│ Clause: [A.14.2.1]              │
│                                 │
│ GENEALOGY                       │
│ Source: Snyk_Report_2024-05-26  │
│ Uploaded: 2024-05-26 14:32 UTC  │
│ Parser confidence: 94%          │
│                                 │
│ RELATIONSHIPS                   │
│ Related: F-002 (dup), F-003 (.. │
│                                 │
│ [Save] [Cancel]                 │
└─────────────────────────────────┘
```

### 4.4 Dashboard (KPIs & Charts)

**User Story:** "I see a high-level view: how many findings, by severity, by status, by source, and which assets are most at-risk."

**Tiles (6-item grid):**
- Total Findings: 47
- Open: 23
- Overdue (due < today): 5
- Critical (active): 3
- Closed (30d): 12
- By Source: Snyk (15) · PDF (18) · Manual (14)

**Charts (4-item row):**
1. Severity distribution (stacked bar: Critical, High, Medium, Low, Info)
2. Status distribution (stacked bar: Open, In Progress, Resolved, Closed, Risk Accepted)
3. Status donut: Open (50%) · Closed (30%) · Resolved (15%) · Risk Accepted (5%)
4. Weekly trend (line chart): Open findings over last 8 weeks

**Asset Correlation Panel:**
- Table: Asset · Finding count · Severity mix · Owner
- Click asset → filter Register to that asset
- Color-code by criticality (red = Critical, orange = High, etc.)

### 4.5 Genealogy View

**User Story:** "I click a finding and see its full lineage: where it came from, what control it maps to, which asset, and what it impacts."

**5-column DAG (SVG-based, read-only):**

```
SOURCE DOCUMENT          FINDING              CONTROL + SIBLINGS      ASSET              IMPACT
┌──────────────┐       ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   ┌──────────────┐
│ Snyk Report  │   →   │ SQL inj in   │  →   │ ISO 27001    │  →   │ Web App      │ → │ Systemic R:  │
│ 2024-05-26   │       │ /login       │      │ A.14.2.1     │      │ Prod         │   │ 16.2         │
│ (14 findings)│       │ Critical     │      │ Secure Dev   │      │ Owner: Plat  │   │              │
│ Confidence:  │       │             │      │              │      │ Criticality: │   │ Depends on:  │
│ 94%          │       │ Related:     │      │ Related:     │      │ High         │   │ DB, Okta     │
│              │       │ F-002 (dup)  │      │ F-002, F-003 │      │              │   │              │
│              │       │ F-003 (near) │      │              │      │              │   │              │
└──────────────┘       └──────────────┘      └──────────────┘      └──────────────┘   └──────────────┘
     ↓                      ↓                     ↓                     ↓                 ↓
  [Click for               [Edit]            [View clause]          [View asset       [Show impact
   details]                                  details]               details]           chain]
```

**User actions:**
- Click any column node → show details (sidebar)
- "Related findings" → shows F-002, F-003 as clickable list
- "Dependencies" → shows downstream assets affected
- "Assets" column → click to jump to asset details

### 4.6 Asset Registry

**User Story:** "I define my known assets (web app, database, SaaS, etc.) so findings can be mapped."

**Asset list + CRUD:**
```
Known Assets

☑ Production Web App (web-app-01)
  Type: application | Owner: Platform Team | Criticality: High
  [Edit] [Delete]

☑ Database Cluster (db-prod-01)
  Type: database | Owner: Database Team | Criticality: Critical
  [Edit] [Delete]

☑ Okta SSO (okta-ent)
  Type: saas | Owner: IAM Team | Criticality: High
  [Edit] [Delete]

[+ Add asset]
```

**Add/Edit asset modal:**
```
Asset name: [text]
Type: [dropdown] application | database | infrastructure | saas | vendor
Owner: [text]
Criticality: [dropdown] Critical | High | Medium | Low
Description: [textarea]
Business impact: [textarea] "Handles 10K requests/day"
Dependencies: [multi-select] ← other assets this depends on
[Save] [Cancel]
```

### 4.7 Report Generation

**User Story:** "I generate a board-ready briefing, audit memo, or executive summary with a click."

**Reports tab:**
- 4 audience presets: Weekly digest · Board briefing · Audit-ready memo · CISO 1-on-1
- Show preview (textarea) generated from findings
- Buttons: [Edit] [Copy] [Export as .docx] [Export as .pdf]

**LLM-generated report (Claude):**
```
Prompt: "Generate a ${audience} briefing for a ${org} CISO
         Current findings: ${findings}
         Assets: ${assets}
         Tone: outcome-led, calm, specific. No buzzwords.
         Format: Markdown"

Output:
# Cyber Security Posture — Week of May 27, 2024

## Overview
47 total findings across 4 critical assets. 3 critical vulnerabilities require immediate attention.

## Key Metrics
- Open: 23 findings (down 2 from last week)
- Critical: 3 (actively exploited: 1)
- Overdue: 5 findings (all High or Critical)
- MTTR: 14 days (target: 12)

## Critical Issues
1. SQL injection in /login (web-app-01)
   Severity: Critical | Due: May 28 | Owner: Platform Team
   Action: Patch or disable endpoint within 24 hours

2. Weak MFA config (okta-ent)
   Severity: High | Due: May 30 | Owner: IAM Team
   Action: Enforce MFA on all admin accounts

## By Asset
- web-app-01: 15 findings (8 High, 7 Medium)
- db-prod-01: 12 findings (3 Critical, 9 High)
- okta-ent: 8 findings (4 High, 4 Medium)
- k8s-prod: 12 findings (5 High, 7 Medium)

## Next Steps
1. Resolve 2 overdue Critical findings by EOD May 28
2. Plan database patching window (db-prod-01)
3. Schedule MFA roll-out (okta-ent)
```

**Export formats (Phase 1):**
- Markdown (copy-paste to Slack, email, docs)
- Plain text (.txt)
- HTML (.html)
- **Phase 2:** .docx (using docx library), .pdf (using pdf-lib or print-as-PDF)

### 4.8 Validation Dashboard

**User Story:** "I see data quality issues at a glance: invalid rows, duplicates, aging findings, at-risk findings."

**Status bar (always visible):**
```
Data Quality: ✅ 5 ❌ 3 ⚠️ 8 | 47 findings | Last saved: 14:32 UTC

[View issues]
```

**Issues panel (on demand):**
```
Data Quality Issues

❌ Invalid rows (3):
   Row F-005: missing severity [Auto-fix] [Skip]
   Row F-012: due_date in past [Mark overdue] [Edit]

⚠️ At-risk findings (8):
   3 Critical open > 30 days
   5 High open > 60 days
   
🔄 Potential duplicates (2):
   F-002 vs F-008: 95% title match, same asset
   F-015 vs F-019: same CVE, same asset

📊 Aging findings (5):
   7 findings open 90+ days
   4 findings open 180+ days

[Batch fix invalid] [Review duplicates] [Resolve overdue]
```

### 4.9 Theme & Density

**User Story:** "I can toggle light/dark mode and adjust row density for my workflow."

- **Theme toggle:** Button in header (☀️ / 🌙)
  - Light: Navy hero + tinted light (#E3EDFB) + cyan accents
  - Dark: Navy hero + dark surfaces + cyan accents
  - Persisted to localStorage as `fr.theme`

- **Density toggle:** Dropdown in header
  - Comfy: Row height 48px, padding 16px
  - Cosy: Row height 40px, padding 12px
  - Compact: Row height 32px, padding 8px
  - Persisted to localStorage as `fr.density`

---

## 5. User Workflows

### Workflow 1: First-Time Setup
```
1. User opens Atlas
2. System detects no assets defined
3. Prompt: "Let's set up your asset registry"
4. User adds: Web App, Database, Okta, K8s
5. System saves to localStorage
6. User is ready to upload findings
```

### Workflow 2: Upload & Consolidate
```
1. User clicks "+ Upload findings"
2. Drag-drops PDF or selects CSV
3. Parser extracts findings (LLM call)
4. Smart ingest shows preview:
   - 8 new
   - 4 possible duplicates
   - 2 invalid rows
5. User reviews + approves duplicates
6. System auto-fixes invalid rows or skips them
7. Findings imported to localStorage
8. Dashboard updates with new counts
```

### Workflow 3: Browse & Edit
```
1. User views Register (default tab)
2. Filters by severity = Critical
3. Sees 3 rows
4. Clicks F-001
5. Right drawer opens
6. Edits due_date + owner
7. Blurs to save
8. Dashboard updates
9. Genealogy shows full context (source → finding → control → asset → impact)
```

### Workflow 4: Generate Report
```
1. User clicks "Reports" tab
2. Selects audience: "Board briefing"
3. LLM generates briefing from current findings
4. User reviews preview
5. Clicks "Copy" → copies to clipboard
6. Pastes into email/Slack
7. Or exports as .docx/.pdf (Phase 2)
```

---

## 6. File Format Support

### 6.1 PDF
- **Parser:** PDF.js (extract text)
- **Flow:** Extract text → LLM parse → canonical JSON
- **Example:** Snyk report, pen-test report, audit PDF

### 6.2 CSV
- **Parser:** PapaParse
- **Auto-detect columns:** title, severity, asset, status, due_date, owner, cve, description
- **Flow:** Parse CSV → map columns to schema → import or show preview
- **Example:** Spreadsheet export from Jira, manual tracking sheet

### 6.3 JSON
- **Parser:** JSON.parse
- **Expected shape:** Array of objects with finding fields
- **Flow:** Parse → map to schema → import
- **Example:** API export from Wiz, Snyk, or another tool

### 6.4 Text/Plaintext
- **Parser:** LLM (Claude)
- **Flow:** Raw text → Claude extracts structured findings → preview → import
- **Example:** Pasted text, email body, chat message

---

## 7. Report Generation (Details)

### 7.1 Briefing Prompts (by audience)

**Weekly Digest:**
```
Generate a 1-page weekly briefing for a CISO.
Format: Markdown
Tone: Calm, outcome-led, specific
Include:
- Overview (total findings, trend from last week)
- Top 3 critical items requiring action
- By-asset summary (counts + key issues)
- Metrics (MTTR, overdue count, trending)
- Recommended next steps (3–5 items)
Data: ${findings} ${assets}
```

**Board Briefing:**
```
Generate a 2-page board-level briefing for executives (non-technical).
Format: Markdown
Tone: Business-focused, data-driven, non-alarming
Include:
- Business impact (which revenue streams at risk)
- Key metrics (overall risk posture vs. target)
- Top 3 issues + business context
- Progress vs. last quarter (trend)
- Investment required (rough estimate)
Data: ${findings} ${assets}
```

**Audit-Ready Memo:**
```
Generate an audit-ready memorandum for external/internal auditors.
Format: Markdown
Tone: Formal, precise, evidence-focused
Include:
- Executive summary (scope, period, findings count)
- Detailed finding list (control clause, severity, status, evidence)
- Remediation timeline (what's being fixed, when)
- Repeating findings (historic context)
- Management response (per control)
Data: ${findings} ${assets}
```

**CISO 1-on-1:**
```
Generate talking points for a CISO 1-on-1 with the board/CRO.
Format: Markdown (bullet-point focused)
Tone: Conversational, strategic
Include:
- What's changed (new critical items, closures, trends)
- What needs board decision (resource, timeline trade-offs)
- Risk narrative (how these findings fit into broader posture)
- Key wins (findings closed, improvements made)
Data: ${findings} ${assets}
```

### 7.2 Export Formats

**MVP (Phase 1):**
- Markdown (.md)
- Plain text (.txt)
- HTML (.html)
- Copy-to-clipboard

**Phase 2:**
- .docx (using docx library + brand letterhead)
- .pdf (using pdf-lib or HTML → print-to-PDF)
- .xlsx (spreadsheet with pivot tables)

---

## 8. Deduplication Logic (Detailed)

### Strategy 1: Exact Match
```typescript
function findExactDuplicates(findings: Finding[]): Duplicate[] {
  const duplicates: Duplicate[] = [];
  
  for (let i = 0; i < findings.length; i++) {
    for (let j = i + 1; j < findings.length; j++) {
      const f1 = findings[i], f2 = findings[j];
      
      // Same CVE + same asset = exact duplicate
      if (f1.cve && f1.cve === f2.cve && f1.asset_id === f2.asset_id) {
        duplicates.push({
          finding1: f1.id,
          finding2: f2.id,
          reason: "EXACT: same CVE + asset",
          confidence: 1.0,
          action: "merge (keep higher severity)"
        });
      }
      
      // Same title + same asset + same source = exact duplicate
      if (f1.title === f2.title && f1.asset_id === f2.asset_id && f1.source_document.filename === f2.source_document.filename) {
        duplicates.push({
          finding1: f1.id,
          finding2: f2.id,
          reason: "EXACT: same title + asset + source",
          confidence: 1.0,
          action: "merge (consolidate sources)"
        });
      }
    }
  }
  
  return duplicates;
}
```

### Strategy 2: Semantic Similarity
```typescript
function findSemanticDuplicates(findings: Finding[]): Duplicate[] {
  const duplicates: Duplicate[] = [];
  
  for (let i = 0; i < findings.length; i++) {
    for (let j = i + 1; j < findings.length; j++) {
      const f1 = findings[i], f2 = findings[j];
      
      // Same asset + high title similarity (cosine distance or Levenshtein)
      if (f1.asset_id === f2.asset_id) {
        const similarity = cosineSimilarity(f1.title, f2.title);
        if (similarity > 0.85) {
          duplicates.push({
            finding1: f1.id,
            finding2: f2.id,
            reason: "SEMANTIC: similar titles, same asset",
            confidence: similarity,
            action: "user review (likely duplicate)"
          });
        }
      }
    }
  }
  
  return duplicates;
}
```

### Strategy 3: LLM-Assisted
For tricky cases, query Claude:
```typescript
async function llmDeduplication(f1: Finding, f2: Finding): Promise<Duplicate> {
  const response = await claude.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Are these two findings the same issue?
        
        Finding 1:
        Title: ${f1.title}
        Description: ${f1.description}
        Asset: ${f1.asset_name}
        CVE: ${f1.cve || "N/A"}
        
        Finding 2:
        Title: ${f2.title}
        Description: ${f2.description}
        Asset: ${f2.asset_name}
        CVE: ${f2.cve || "N/A"}
        
        Answer: YES (definitely same) or NO (different) or MAYBE (very similar, user should review).
        Reasoning: [one sentence]`
    }]
  });
  
  const answer = response.content[0].text.toLowerCase();
  
  if (answer.includes("yes")) {
    return { finding1: f1.id, finding2: f2.id, reason: "LLM: YES — same issue", confidence: 0.95, action: "merge" };
  } else if (answer.includes("maybe")) {
    return { finding1: f1.id, finding2: f2.id, reason: "LLM: MAYBE — user review", confidence: 0.70, action: "user review" };
  }
  
  return null; // Different
}
```

---

## 9. Validation Rules (Comprehensive)

```typescript
const VALIDATION_RULES = [
  // Required fields
  { field: "title", rule: "required", message: "Title is required" },
  { field: "severity", rule: "required", message: "Severity is required" },
  
  // Enum validation
  { field: "severity", rule: "enum", values: ["Critical", "High", "Medium", "Low", "Informational"], message: "Invalid severity" },
  { field: "status", rule: "enum", values: ["Open", "In Progress", "Resolved", "Closed", "Risk Accepted"], message: "Invalid status" },
  { field: "asset_type", rule: "enum", values: ["application", "database", "infrastructure", "saas", "vendor", "network", "other"], message: "Invalid asset type" },
  
  // Date validation
  { field: "due_date", rule: "validDate", message: "Invalid date format" },
  { field: "due_date", rule: "futureDate", message: "Due date should be in the future (or today)", conditional: "status === 'Open'" },
  
  // Custom business logic
  { rule: "!(/^CVE-\\d{4}-\\d{4,}$/.test(cve))", rule: "invalidCVE", message: "CVE format should be CVE-YYYY-NNNNN" },
  { rule: "status === 'Resolved' && !updated_at", message: "Resolved findings must have an updated_at date" },
  { rule: "severity === 'Critical' && daysOpen > 30", flag: "AT_RISK", severity: "warning" },
  { rule: "daysOpen > 90 && status === 'Open'", flag: "AGING", severity: "warning" },
  { rule: "due_date < today && status === 'Open'", flag: "OVERDUE", severity: "error" },
];
```

---

## 10. Technology Decisions

### 10.1 Why React?
- Fast iteration on UI components
- Large ecosystem (charts, date pickers, modals)
- Familiar pattern (state → render)
- Can upgrade to Next.js for Phase 2 (API routes, SSR)

### 10.2 Why Tailwind + Custom CSS?
- Fast prototyping with utility classes
- Custom brand tokens (--cs-cyan-400, etc.) work well
- CSS Modules for scoped component styles
- Can adopt CSS-in-JS later if needed

### 10.3 Why localStorage for MVP?
- Zero backend infrastructure
- Works offline
- Deployment is just a static HTML file
- 5–10MB limit is enough for 1000s of findings
- Upgrade path: localStorage → IndexedDB → PostgreSQL (Phase 2)

### 10.4 Why Claude API for parsing?
- Best-in-class natural language understanding
- Reliable structured extraction (JSON mode)
- Good enough for finding parsing (better than GPT-3.5, competitive with GPT-4)
- Upgrade path: use Claude for initial parsing, then fine-tune Qwen2.5-coder local for bulk inference (Phase 2)

---

## 11. Phase 1 Scope (Weeks 1–4)

### Week 1: Foundation
- [ ] React + Vite project setup
- [ ] Component structure (Header, TabNav, Views)
- [ ] localStorage hooks (useStore, usePersist)
- [ ] Brand tokens + styling (Tailwind + custom CSS)
- [ ] Schema & TypeScript types
- [ ] Draft all 6 view components (skeleton)

### Week 2: Parser & Upload
- [ ] File upload modal (drag-drop)
- [ ] PDF.js integration (text extraction)
- [ ] PapaParse CSV integration
- [ ] JSON parser
- [ ] Claude API integration for LLM parsing
- [ ] Raw ingest (store unparsed findings)

### Week 3: Deduplication, Validation & Dashboard
- [ ] Exact deduplication (CVE + asset match)
- [ ] Semantic deduplication (string similarity)
- [ ] Smart ingest preview UI
- [ ] Validation rules engine
- [ ] Validation dashboard/flags
- [ ] Dashboard KPIs and charts (Recharts)

### Week 4: Register, Genealogy, Reports
- [ ] Register table (with inline editing, filters, sorting)
- [ ] Row drawer (full form editing)
- [ ] Genealogy view (5-column SVG DAG)
- [ ] Asset registry (CRUD)
- [ ] Report generation (LLM + 4 audience presets)
- [ ] Report export (markdown, text, HTML)

### By end of Week 4:
- ✅ All 6 tabs working (Register, Dashboard, Blast—simplified, Crosswalk, Genealogy, Reports)
- ✅ File upload → parsing → deduplication → storage
- ✅ Full genealogy tracking (source → finding → control → asset → impact)
- ✅ Asset registry and mapping
- ✅ Report generation for 4 audiences
- ✅ localStorage persistence
- ✅ Light/dark theme + density tweaks
- ✅ Validation dashboard + flagging
- ✅ ~2500 LOC React + utilities

---

## 12. Future Expansion (Phase 2+)

### Phase 2 (Weeks 5–8):
- [ ] PostgreSQL backend (migrate from localStorage)
- [ ] User authentication (JWT)
- [ ] Multi-tenancy
- [ ] Audit trail (who changed what when)
- [ ] Webhook integrations (Wiz, Snyk, Qualys)
- [ ] Real-time ingest

### Phase 3 (Weeks 9–12):
- [ ] Trajectory (time-series / trend analysis)
- [ ] KEV + EPSS overlay (CISA data enrichment)
- [ ] Workflow (assignment, approvals, SLAs)
- [ ] Advanced Blast modes (Sankey + Adversary lens)
- [ ] Custom reporting templates (user-defined)

### Phase 4+:
- [ ] CRQ (cyber risk quantification in $)
- [ ] Regulatory packs (DORA, NIS2, MAS TRM exports)
- [ ] Attack path simulation
- [ ] Multi-entity rollup
- [ ] Insurance integration

---

## 13. Success Criteria

### MVP Launch (Week 4):
- [ ] Can upload 50+ findings from various formats (PDF, CSV, JSON, text)
- [ ] Deduplication catches 80%+ of exact duplicates, surfaces near-duplicates for review
- [ ] Dashboard loads in <2 seconds
- [ ] Report generation completes in <10 seconds
- [ ] All data persists across browser refreshes
- [ ] Light/dark themes work correctly
- [ ] No console errors
- [ ] Works on desktop (1280px+) and tablets (960px+)

### Genealogy Tracking:
- [ ] Every finding shows source document (filename, upload date, parser confidence)
- [ ] Genealogy DAG shows source → finding → control → asset → impact
- [ ] User can click any finding and see full context
- [ ] Asset mapping is accurate (>90% correct auto-detection + user verification)

### Validation & Data Quality:
- [ ] Invalid rows flagged (missing required fields, bad dates, etc.)
- [ ] Overdue/aging/at-risk findings highlighted
- [ ] Duplicates surfaced for merge/review
- [ ] Dashboard shows data quality metrics

---

## 14. Design System & Brand Compliance

**All design decisions reference `assets/brand-tokens.css` (from Cyber Sierra):**
- Color: Navy (#183B65) + Tinted light (#E3EDFB) + Cyan (#2DD6FF / #1FB6E0)
- Typography: Inter (headings, body) + JetBrains Mono (paths, IDs, chips, metadata)
- Spacing, radius, shadow: CSS custom properties
- Theme toggle: body class `fr-theme-dark` flips token values

**Non-negotiable:**
- No custom colors; all come from `--cs-*` tokens
- Never lighten past #E3EDFB; never use cool whites
- Inter-first typography rule
- Document-grade density (12–16px body text is correct at 1920×1080)

---

## 15. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| localStorage limit (5–10MB) | Monitor usage; upgrade to IndexedDB or backend if >50KB findings |
| LLM parser hallucinations | Show user preview before import; allow reject/edit; log raw parser output |
| Dedup false positives | "MAYBE" category for user review; feedback loop for improvement |
| Slow file uploads | Stream parsing; show progress bar; don't block UI |
| Data loss (browser clear) | Add "Export all" button; encourage periodic manual backup |
| Cross-browser compatibility | Test on Chrome, Firefox, Safari; use polyfills for older browsers |

---

## 16. Success Definition

**MVP is "done" when:**
1. A user can upload 50 findings from a mixed set of documents (3x PDFs, 2x CSVs, 1x JSON)
2. System deduplicates correctly (catches exact dups, surfaces near-dups)
3. Dashboard shows accurate counts and charts
4. User can view genealogy for any finding (source → control → asset → impact)
5. User can generate a board-ready briefing in <10 seconds
6. Data persists across browser closes
7. Light + dark themes work
8. No critical bugs; <5 known issues

---

**End of Design Specification**

---

**Next Step:** User reviews this spec. If approved, invoke `writing-plans` to create implementation plan.
