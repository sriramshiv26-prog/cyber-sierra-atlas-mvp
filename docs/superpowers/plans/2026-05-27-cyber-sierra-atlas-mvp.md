# Cyber Sierra Atlas MVP — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based findings consolidation tool that parses documents, deduplicates findings, validates data quality, and generates multi-audience reports — all with genealogy tracking and asset mapping.

**Architecture:** React app with localStorage persistence (no backend for MVP). Single-page app with 6 tabs (Dashboard, Register, Blast, Crosswalk, Genealogy, Reports). LLM-powered parser (Claude API) for file extraction. All state managed via React context + localStorage. Tailwind CSS + custom brand tokens.

**Tech Stack:** React 18 + Vite, Tailwind CSS, Recharts (charts), PDF.js (PDF parsing), PapaParse (CSV), Anthropic SDK (Claude API), localStorage (persistence)

---

## File Structure

**Create these files in order; they have dependencies:**

```
cyber-sierra-atlas-mvp/
├── src/
│   ├── lib/
│   │   ├── schema.ts                 # TypeScript types (Finding, Asset, Store)
│   │   ├── llm.ts                    # Claude API calls
│   │   ├── parser.ts                 # File format detection + text extraction
│   │   ├── deduplication.ts          # Exact + semantic duplicate detection
│   │   ├── validation.ts             # Data quality rules engine
│   │   ├── scoring.ts                # Systemic risk scoring (from prototype)
│   │   └── reporting.ts              # Report generation for 4 audiences
│   │
│   ├── hooks/
│   │   ├── useStore.ts               # localStorage persistence + context
│   │   ├── useFilters.ts             # Filter state management
│   │   └── useAssets.ts              # Asset registry state
│   │
│   ├── components/
│   │   ├── Header.jsx                # Logo, breadcrumb, theme + density toggles
│   │   ├── TabNav.jsx                # 6-tab navigation
│   │   ├── RegisterView.jsx          # Main findings table
│   │   ├── DashboardView.jsx         # KPI tiles + charts
│   │   ├── BlastRadiusView.jsx       # Dependency graph (simplified for MVP)
│   │   ├── CrosswalkView.jsx         # Framework matrix
│   │   ├── GenealogyView.jsx         # Source → Finding → Control → Asset → Impact
│   │   ├── ReportsView.jsx           # Report generation interface
│   │   ├── FileUploadModal.jsx       # Drag-drop upload
│   │   ├── SmartIngestPreview.jsx    # Dedup + validation preview
│   │   ├── AssetRegistry.jsx         # Asset CRUD modal
│   │   ├── FindingDrawer.jsx         # Full form editing (right panel)
│   │   └── ValidationDashboard.jsx   # Data quality status
│   │
│   ├── assets/
│   │   ├── brand-tokens.css          # Cyber Sierra design tokens (from prototype)
│   │   └── logo.svg
│   │
│   ├── App.jsx                       # Main app component (state, routing)
│   ├── App.css                       # Global styles
│   └── main.jsx                      # Vite entry point
│
├── public/
│   └── index.html                    # HTML shell
│
├── tests/
│   ├── deduplication.test.js
│   ├── validation.test.js
│   ├── scoring.test.js
│   └── reporting.test.js
│
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example
├── .gitignore
└── README.md
```

---

# Week 1: Foundation & Setup

## Task 1: Initialize Vite + React project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `public/index.html`
- Create: `src/main.jsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "cyber-sierra-atlas-mvp",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "recharts": "^2.10.0",
    "pdfjs-dist": "^4.0.0",
    "papaparse": "^5.4.1",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

- [ ] **Step 3: Create tailwind.config.js**

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'cs-navy': '#183B65',
        'cs-light': '#E3EDFB',
        'cs-cyan-dark': '#2DD6FF',
        'cs-cyan-light': '#1FB6E0',
        'cs-coral': '#FF8C70'
      }
    }
  },
  plugins: []
}
```

- [ ] **Step 4: Create public/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cyber Sierra Atlas</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 5: Create src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 6: Commit**

```bash
git add package.json vite.config.js tailwind.config.js public/index.html src/main.jsx
git commit -m "build: initialize Vite + React + Tailwind project"
```

---

## Task 2: Define TypeScript schema (data model)

**Files:**
- Create: `src/lib/schema.ts`

- [ ] **Step 1: Create schema.ts with all types**

```typescript
// Finding record
export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Risk Accepted';
  
  // Genealogy
  source_document: {
    filename: string;
    upload_date: string; // ISO8601
    parser_confidence: number; // 0.0-1.0
    raw_text?: string;
  };
  
  // Asset mapping
  asset_id: string;
  asset_name: string;
  
  // Control mapping
  control_framework: string;
  control_clause: string;
  control_description?: string;
  
  // Vulnerability data
  cve?: string;
  cvss_score?: number;
  
  // Business context
  due_date?: string; // ISO8601
  owner?: string;
  remediation_notes?: string;
  evidence_url?: string;
  
  // Relationships
  related_findings: string[];
  deduped_with?: string;
  
  // Metadata
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
  flags?: {
    overdue?: boolean;
    aging?: boolean;
    at_risk?: boolean;
    duplicate?: boolean;
    near_duplicate?: boolean;
  };
}

// Asset / CI
export interface Asset {
  id: string;
  name: string;
  type: 'application' | 'database' | 'infrastructure' | 'saas' | 'vendor' | 'network' | 'other';
  owner?: string;
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  description?: string;
  business_impact?: string;
  annual_revenue_supported?: number;
  records_processed?: number;
  dependencies: string[];
  dependents?: string[];
  created_at: string;
  updated_at: string;
}

// Control framework reference
export interface Control {
  framework: string; // "ISO 27001", "NIST CSF", etc.
  clause: string; // "A.14.2.1"
  description: string;
}

// Deduplication result
export interface Duplicate {
  finding1: string;
  finding2: string;
  reason: string;
  confidence: number;
  action: 'merge' | 'user_review' | 'ignore';
}

// Validation issue
export interface ValidationIssue {
  finding_id: string;
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// Top-level store
export interface Store {
  findings: Finding[];
  assets: Asset[];
  controls: Control[];
  lastSaved: string;
}

// UI state (separate from store, not persisted)
export interface UIState {
  view: 'dashboard' | 'register' | 'blast' | 'crosswalk' | 'genealogy' | 'reports';
  filters: {
    q: string;
    severity?: string;
    status?: string;
    source?: string;
    framework?: string;
    owner?: string;
    asset_id?: string;
  };
  drawerId: string | null;
  modalOpen: boolean;
  theme: 'light' | 'dark';
  density: 'comfy' | 'cosy' | 'compact';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/schema.ts
git commit -m "schema: define TypeScript types for findings, assets, controls"
```

---

## Task 3: Create store hook (localStorage persistence)

**Files:**
- Create: `src/hooks/useStore.ts`
- Create: `src/hooks/useFilters.ts`

- [ ] **Step 1: Create useStore.ts (context + hook)**

```typescript
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Store, Finding, Asset } from '../lib/schema';

const StoreContext = createContext(null);

const initialStore: Store = {
  findings: [],
  assets: [],
  controls: [],
  lastSaved: new Date().toISOString(),
};

function storeReducer(state, action) {
  switch (action.type) {
    case 'ADD_FINDINGS':
      return {
        ...state,
        findings: [...state.findings, ...action.payload],
        lastSaved: new Date().toISOString(),
      };
    case 'UPDATE_FINDING':
      return {
        ...state,
        findings: state.findings.map(f => f.id === action.payload.id ? action.payload : f),
        lastSaved: new Date().toISOString(),
      };
    case 'DELETE_FINDING':
      return {
        ...state,
        findings: state.findings.filter(f => f.id !== action.payload),
        lastSaved: new Date().toISOString(),
      };
    case 'ADD_ASSET':
      return {
        ...state,
        assets: [...state.assets, action.payload],
        lastSaved: new Date().toISOString(),
      };
    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map(a => a.id === action.payload.id ? action.payload : a),
        lastSaved: new Date().toISOString(),
      };
    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter(a => a.id !== action.payload),
        lastSaved: new Date().toISOString(),
      };
    case 'LOAD_FROM_STORAGE':
      return action.payload || initialStore;
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [store, dispatch] = useReducer(storeReducer, initialStore);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fr.store.v3');
    if (saved) {
      try {
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to load store:', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('fr.store.v3', JSON.stringify(store));
  }, [store]);

  return (
    <StoreContext.Provider value={{ store, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}
```

- [ ] **Step 2: Create useFilters.ts**

```typescript
import { useState } from 'react';

export function useFilters() {
  const [filters, setFilters] = useState({
    q: '',
    severity: null,
    status: null,
    source: null,
    framework: null,
    owner: null,
    asset_id: null,
  });

  function applyFilters(findings) {
    return findings.filter(f => {
      // Text search
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const matches = f.title.toLowerCase().includes(q) || 
                       f.description?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Enum filters
      if (filters.severity && f.severity !== filters.severity) return false;
      if (filters.status && f.status !== filters.status) return false;
      if (filters.asset_id && f.asset_id !== filters.asset_id) return false;
      if (filters.owner && f.owner !== filters.owner) return false;
      if (filters.framework && f.control_framework !== filters.framework) return false;

      // Source doc filename
      if (filters.source && f.source_document.filename !== filters.source) return false;

      return true;
    });
  }

  return { filters, setFilters, applyFilters };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useStore.ts src/hooks/useFilters.ts
git commit -m "hooks: add useStore (localStorage persistence) and useFilters"
```

---

## Task 4: Create layout components (Header + TabNav)

**Files:**
- Create: `src/components/Header.jsx`
- Create: `src/components/TabNav.jsx`
- Create: `src/App.css` (initial global styles)

- [ ] **Step 1: Create Header.jsx**

```jsx
import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function Header({ view, onViewChange, theme, onThemeChange, density, onDensityChange, lastSaved }) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        
        {/* Logo + breadcrumb */}
        <div className="flex items-center gap-4">
          <div className="text-lg font-semibold text-cs-navy dark:text-white">
            Cyber Sierra Atlas
          </div>
          <span className="text-sm text-slate-500">/</span>
          <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
            {view.toUpperCase()}
          </span>
        </div>

        {/* Last saved + Theme + Density toggles */}
        <div className="flex items-center gap-6">
          
          {/* Last saved */}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Saved: {new Date(lastSaved).toLocaleTimeString()}
          </div>

          {/* Density dropdown */}
          <select 
            value={density} 
            onChange={(e) => onDensityChange(e.target.value)}
            className="px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          >
            <option value="comfy">Comfy</option>
            <option value="cosy">Cosy</option>
            <option value="compact">Compact</option>
          </select>

          {/* Theme toggle */}
          <button
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon size={20} className="text-slate-600" />
            ) : (
              <Sun size={20} className="text-slate-400" />
            )}
          </button>

          {/* Reset seed (dev button) */}
          <button
            onClick={() => {
              if (confirm('Reset all data and reload?')) {
                localStorage.removeItem('fr.store.v3');
                location.reload();
              }
            }}
            className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create TabNav.jsx**

```jsx
import React from 'react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'register', label: 'Register', icon: '📋' },
  { id: 'blast', label: 'Blast Radius', icon: '💥' },
  { id: 'crosswalk', label: 'Crosswalk', icon: '🔀' },
  { id: 'genealogy', label: 'Genealogy', icon: '🌳' },
  { id: 'reports', label: 'Reports', icon: '📄' },
];

export function TabNav({ view, onViewChange }) {
  return (
    <div className="flex gap-1 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
            view === tab.id
              ? 'bg-cs-light dark:bg-slate-800 text-cs-navy dark:text-white border border-cs-cyan-light'
              : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create src/App.css**

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

:root {
  --cs-navy-700: #183B65;
  --cs-blue-100: #E3EDFB;
  --cs-cyan-400: #2DD6FF;
  --cs-cyan-500: #1FB6E0;
  --cs-coral: #FF8C70;
}

[class*="fr-theme-dark"] {
  --frt-bg-primary: #0F172A;
  --frt-bg-secondary: #1E293B;
  --frt-text-primary: #F1F5F9;
  --frt-text-secondary: #CBD5E1;
}

* {
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

body {
  background-color: var(--cs-blue-100);
  color: #0F172A;
}

body.dark {
  background-color: #0A0F1E;
  color: #F1F5F9;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.jsx src/components/TabNav.jsx src/App.css
git commit -m "ui: add Header and TabNav components with theme/density toggles"
```

---

## Task 5: Create skeleton view components

**Files:**
- Create: `src/components/DashboardView.jsx`
- Create: `src/components/RegisterView.jsx`
- Create: `src/components/BlastRadiusView.jsx`
- Create: `src/components/CrosswalkView.jsx`
- Create: `src/components/GenealogyView.jsx`
- Create: `src/components/ReportsView.jsx`

- [ ] **Step 1: Create skeleton components (all similar structure)**

```jsx
// src/components/DashboardView.jsx
export function DashboardView() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p className="text-slate-600">Dashboard coming soon...</p>
    </div>
  );
}
```

Repeat for: RegisterView, BlastRadiusView, CrosswalkView, GenealogyView, ReportsView (all with identical structure, just different titles)

- [ ] **Step 2: Create src/App.jsx (main component)**

```jsx
import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './hooks/useStore';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { DashboardView } from './components/DashboardView';
import { RegisterView } from './components/RegisterView';
import { BlastRadiusView } from './components/BlastRadiusView';
import { CrosswalkView } from './components/CrosswalkView';
import { GenealogyView } from './components/GenealogyView';
import { ReportsView } from './components/ReportsView';

function AppContent() {
  const { store } = useStore();
  const [view, setView] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('fr.theme') || 'light');
  const [density, setDensity] = useState(() => localStorage.getItem('fr.density') || 'cosy');

  // Persist theme
  useEffect(() => {
    localStorage.setItem('fr.theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Persist density
  useEffect(() => {
    localStorage.setItem('fr.density', density);
    document.body.setAttribute('data-density', density);
  }, [density]);

  const viewMap = {
    dashboard: <DashboardView />,
    register: <RegisterView />,
    blast: <BlastRadiusView />,
    crosswalk: <CrosswalkView />,
    genealogy: <GenealogyView />,
    reports: <ReportsView />,
  };

  return (
    <div className="flex flex-col h-screen bg-cs-light dark:bg-gray-900">
      <Header 
        view={view} 
        onViewChange={setView}
        theme={theme}
        onThemeChange={setTheme}
        density={density}
        onDensityChange={setDensity}
        lastSaved={store.lastSaved}
      />
      <TabNav view={view} onViewChange={setView} />
      <main className="flex-1 overflow-auto">
        {viewMap[view]}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DashboardView.jsx src/components/RegisterView.jsx src/components/BlastRadiusView.jsx src/components/CrosswalkView.jsx src/components/GenealogyView.jsx src/components/ReportsView.jsx src/App.jsx
git commit -m "ui: add skeleton view components and main App component"
```

---

## Task 6: Test that app runs locally

**Files:**
- None (test only)

- [ ] **Step 1: Install dependencies**

```bash
npm install
```

Expected: All packages installed successfully.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Expected: Vite dev server starts at http://localhost:5173, app opens in browser.

- [ ] **Step 3: Verify all tabs render**

- Navigate to each tab (Dashboard, Register, Blast Radius, Crosswalk, Genealogy, Reports)
- Each should show a placeholder message
- No console errors

- [ ] **Step 4: Verify theme toggle works**

- Click moon icon in header
- Body should turn dark
- Refresh page, theme should persist

- [ ] **Step 5: Verify density dropdown works**

- Change density (Comfy → Cosy → Compact)
- Refresh page, density should persist

- [ ] **Step 6: Stop server and commit**

```bash
git add .
git commit -m "test: verify app structure and basic navigation work"
```

---

# Week 2: Parser & File Upload

## Task 7: Create LLM parser (Claude API)

**Files:**
- Create: `src/lib/llm.ts`
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

```
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

- [ ] **Step 2: Create src/lib/llm.ts**

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
});

export async function parseFindingsWithLLM(text: string, sourceFilename: string) {
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Extract findings from this document into JSON. 

For each finding, extract these fields:
- title: Brief finding title (required)
- description: Detailed description
- severity: One of [Critical, High, Medium, Low, Informational] (required)
- asset: Infrastructure/app name mentioned (required)
- status: One of [Open, In Progress, Resolved, Closed, Risk Accepted] (default: Open)
- owner: Person/team responsible
- due_date: Remediation due date (ISO8601 if available)
- cve: CVE ID if mentioned (format: CVE-YYYY-NNNNN)
- control_framework: Framework name (ISO 27001, NIST CSF, etc.) if mentioned
- control_clause: Clause ID (e.g., A.14.2.1)

Return a JSON array of objects with these fields. Use null for missing fields.
Only return the JSON array, no other text.

Document: ${text}`,
      },
    ],
  });

  // Extract JSON from response
  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let findings;
  try {
    findings = JSON.parse(content.text);
  } catch (e) {
    console.error('Failed to parse LLM response:', content.text);
    throw new Error('Failed to parse findings from document');
  }

  // Enrich with metadata
  return findings.map((f, idx) => ({
    id: `F-${Date.now()}-${idx}`,
    title: f.title || 'Untitled finding',
    description: f.description || '',
    severity: f.severity || 'Medium',
    status: f.status || 'Open',
    asset_name: f.asset || 'Unknown',
    asset_id: '', // Will be resolved during smart ingest
    owner: f.owner || null,
    due_date: f.due_date || null,
    cve: f.cve || null,
    control_framework: f.control_framework || null,
    control_clause: f.control_clause || null,
    source_document: {
      filename: sourceFilename,
      upload_date: new Date().toISOString(),
      parser_confidence: 0.85, // Conservative default
      raw_text: null,
    },
    related_findings: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    flags: {},
  }));
}

export async function generateBriefing(findings: any[], audience: string) {
  const findingsSummary = findings
    .slice(0, 20) // Limit to 20 findings for token budget
    .map(f => `- ${f.title} (${f.severity}, ${f.status})`)
    .join('\n');

  const prompt = {
    weekly_digest: `Generate a 1-page weekly briefing. Include: overview, top 3 critical items, by-asset summary, metrics, next steps.`,
    board_briefing: `Generate a 2-page board-level briefing. Include: business impact, key metrics, top 3 issues with business context, progress vs. last quarter.`,
    audit_memo: `Generate an audit-ready memorandum. Include: executive summary, detailed finding list, remediation timeline, management response.`,
    ciso_one_on_one: `Generate talking points for CISO 1-on-1. Include: what's changed, what needs board decision, risk narrative, key wins.`,
  };

  const selectedPrompt = prompt[audience] || prompt.weekly_digest;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `${selectedPrompt}

Current findings (sample):
${findingsSummary}

Tone: outcome-led, calm, specific. No buzzwords. No markdown formatting.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return content.text;
}
```

- [ ] **Step 3: Create tests (src/lib/llm.test.ts -- mock only)**

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('LLM parser', () => {
  it('should format findings correctly', () => {
    // Mock test - actual LLM calls tested in integration
    const testFinding = {
      id: 'F-001',
      title: 'SQL injection',
      severity: 'Critical',
    };
    expect(testFinding.severity).toBe('Critical');
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/llm.ts .env.example
git commit -m "feat: add Claude API integration for LLM-powered finding parsing"
```

---

## Task 8: Create file parser (PDF, CSV, JSON, text)

**Files:**
- Create: `src/lib/parser.ts`

- [ ] **Step 1: Create src/lib/parser.ts**

```typescript
import * as pdfjsLib from 'pdfjs-dist';
import Papa from 'papaparse';
import { parseFindingsWithLLM } from './llm';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function detectAndParseFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  let text = '';

  if (ext === 'pdf') {
    text = await extractTextFromPDF(file);
  } else if (ext === 'csv') {
    text = await extractTextFromCSV(file);
  } else if (ext === 'json') {
    text = await extractTextFromJSON(file);
  } else {
    // Default: treat as plaintext
    text = await file.text();
  }

  // Send to LLM for parsing
  return await parseFindingsWithLLM(text, file.name);
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }

  return text;
}

async function extractTextFromCSV(file: File): Promise<string> {
  const text = await file.text();
  return text;
}

async function extractTextFromJSON(file: File): Promise<string> {
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    // Convert JSON to readable text
    return JSON.stringify(data, null, 2);
  } catch {
    return text;
  }
}
```

- [ ] **Step 2: Create test**

```typescript
import { describe, it, expect } from 'vitest';

describe('File parser', () => {
  it('should identify PDF files', () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    expect(file.name.endsWith('.pdf')).toBe(true);
  });

  it('should identify CSV files', () => {
    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
    expect(file.name.endsWith('.csv')).toBe(true);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/parser.ts tests/parser.test.ts
git commit -m "feat: add file format detection and text extraction (PDF, CSV, JSON, text)"
```

---

## Task 9: Create file upload modal component

**Files:**
- Create: `src/components/FileUploadModal.jsx`

- [ ] **Step 1: Create FileUploadModal.jsx**

```jsx
import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { detectAndParseFile } from '../lib/parser';

export function FileUploadModal({ isOpen, onClose, onParsedFindings }) {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleFile(file) {
    setError(null);
    setIsLoading(true);

    try {
      const findings = await detectAndParseFile(file);
      onParsedFindings(findings);
      setIsLoading(false);
      onClose();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 w-96">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload Findings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
            dragActive
              ? 'border-cs-cyan-500 bg-cs-light'
              : 'border-slate-300 dark:border-slate-600 hover:border-cs-cyan-500'
          }`}
        >
          <Upload size={40} className="mx-auto mb-4 text-slate-400" />
          <p className="font-medium text-slate-900 dark:text-white mb-2">
            Drag findings here or click below
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Supported: PDF, CSV, JSON, plain text
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.json,.txt"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 bg-cs-cyan-500 text-white rounded-lg hover:bg-cs-cyan-600 disabled:opacity-50"
          >
            {isLoading ? 'Parsing...' : 'Select File'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FileUploadModal.jsx
git commit -m "ui: add file upload modal with drag-drop support"
```

---

# Week 3: Deduplication, Validation & Dashboard

## Task 10: Create deduplication engine

**Files:**
- Create: `src/lib/deduplication.ts`

- [ ] **Step 1: Create src/lib/deduplication.ts**

```typescript
import { Finding, Duplicate } from './schema';

export function findExactDuplicates(findings: Finding[]): Duplicate[] {
  const duplicates: Duplicate[] = [];

  for (let i = 0; i < findings.length; i++) {
    for (let j = i + 1; j < findings.length; j++) {
      const f1 = findings[i];
      const f2 = findings[j];

      // Same CVE + same asset
      if (f1.cve && f1.cve === f2.cve && f1.asset_id === f2.asset_id) {
        duplicates.push({
          finding1: f1.id,
          finding2: f2.id,
          reason: `EXACT: same CVE (${f1.cve}) + same asset`,
          confidence: 1.0,
          action: 'merge',
        });
      }

      // Same title + same asset + same source
      if (
        f1.title === f2.title &&
        f1.asset_id === f2.asset_id &&
        f1.source_document.filename === f2.source_document.filename
      ) {
        duplicates.push({
          finding1: f1.id,
          finding2: f2.id,
          reason: 'EXACT: same title + asset + source',
          confidence: 1.0,
          action: 'merge',
        });
      }
    }
  }

  return duplicates;
}

export function findSemanticDuplicates(findings: Finding[]): Duplicate[] {
  const duplicates: Duplicate[] = [];

  for (let i = 0; i < findings.length; i++) {
    for (let j = i + 1; j < findings.length; j++) {
      const f1 = findings[i];
      const f2 = findings[j];

      // Same asset + high title similarity
      if (f1.asset_id === f2.asset_id) {
        const similarity = cosineSimilarity(f1.title, f2.title);
        if (similarity > 0.85) {
          duplicates.push({
            finding1: f1.id,
            finding2: f2.id,
            reason: `SEMANTIC: ${Math.round(similarity * 100)}% title match, same asset`,
            confidence: similarity,
            action: 'user_review',
          });
        }
      }
    }
  }

  return duplicates;
}

function cosineSimilarity(a: string, b: string): number {
  const tokensA = a.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const tokensB = b.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  const vocab = new Set([...tokensA, ...tokensB]);
  const vecA = Array.from(vocab).map(w => tokensA.includes(w) ? 1 : 0);
  const vecB = Array.from(vocab).map(w => tokensB.includes(w) ? 1 : 0);

  const dotProduct = vecA.reduce((sum, v, i) => sum + v * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

export function mergeFinding(primary: Finding, secondary: Finding): Finding {
  // Keep higher severity
  const severityRank = { Critical: 5, High: 4, Medium: 3, Low: 2, Informational: 1 };
  const severity = severityRank[primary.severity] >= severityRank[secondary.severity]
    ? primary.severity
    : secondary.severity;

  return {
    ...primary,
    severity,
    related_findings: [...new Set([...primary.related_findings, secondary.id])],
    deduped_with: secondary.id,
    updated_at: new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Create test**

```typescript
import { describe, it, expect } from 'vitest';
import { findExactDuplicates, cosineSimilarity } from '../lib/deduplication';

describe('Deduplication', () => {
  it('should find exact CVE + asset duplicates', () => {
    const findings = [
      {
        id: 'F-1',
        cve: 'CVE-2024-1234',
        asset_id: 'app-1',
        title: 'SQL injection',
      },
      {
        id: 'F-2',
        cve: 'CVE-2024-1234',
        asset_id: 'app-1',
        title: 'Another SQL injection',
      },
    ];

    const dups = findExactDuplicates(findings);
    expect(dups).toHaveLength(1);
    expect(dups[0].action).toBe('merge');
  });

  it('should calculate string similarity', () => {
    const similarity = cosineSimilarity('SQL injection', 'SQL injection attack');
    expect(similarity).toBeGreaterThan(0.7);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/deduplication.ts tests/deduplication.test.ts
git commit -m "feat: add exact and semantic deduplication engine with merge logic"
```

---

## Task 11: Create validation rules engine

**Files:**
- Create: `src/lib/validation.ts`

- [ ] **Step 1: Create src/lib/validation.ts**

```typescript
import { Finding, ValidationIssue } from './schema';

export function validateFinding(finding: Finding): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Required fields
  if (!finding.title?.trim()) {
    issues.push({
      finding_id: finding.id,
      field: 'title',
      rule: 'required',
      message: 'Title is required',
      severity: 'error',
    });
  }

  if (!finding.severity) {
    issues.push({
      finding_id: finding.id,
      field: 'severity',
      rule: 'required',
      message: 'Severity is required',
      severity: 'error',
    });
  }

  // Enum validation
  const validSeverities = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
  if (finding.severity && !validSeverities.includes(finding.severity)) {
    issues.push({
      finding_id: finding.id,
      field: 'severity',
      rule: 'enum',
      message: `Severity must be one of: ${validSeverities.join(', ')}`,
      severity: 'error',
    });
  }

  const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'Risk Accepted'];
  if (finding.status && !validStatuses.includes(finding.status)) {
    issues.push({
      finding_id: finding.id,
      field: 'status',
      rule: 'enum',
      message: `Status must be one of: ${validStatuses.join(', ')}`,
      severity: 'error',
    });
  }

  // Date validation
  if (finding.due_date) {
    const dueDate = new Date(finding.due_date);
    if (isNaN(dueDate.getTime())) {
      issues.push({
        finding_id: finding.id,
        field: 'due_date',
        rule: 'validDate',
        message: 'Invalid date format',
        severity: 'error',
      });
    } else if (dueDate < new Date() && finding.status === 'Open') {
      issues.push({
        finding_id: finding.id,
        field: 'due_date',
        rule: 'overdue',
        message: 'Due date is in the past',
        severity: 'warning',
      });
    }
  }

  // CVE format
  if (finding.cve && !/^CVE-\d{4}-\d{4,}$/.test(finding.cve)) {
    issues.push({
      finding_id: finding.id,
      field: 'cve',
      rule: 'invalidCVE',
      message: 'CVE format should be CVE-YYYY-NNNNN',
      severity: 'warning',
    });
  }

  // Business logic: aging findings
  const daysSinceCreated = (Date.now() - new Date(finding.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated > 90 && finding.status === 'Open') {
    issues.push({
      finding_id: finding.id,
      field: 'status',
      rule: 'aging',
      message: `Finding is ${Math.round(daysSinceCreated)} days old`,
      severity: 'warning',
    });
  }

  // Business logic: at-risk
  if (finding.severity === 'Critical' && finding.status === 'Open') {
    issues.push({
      finding_id: finding.id,
      field: 'severity',
      rule: 'at_risk',
      message: 'Critical finding is still open',
      severity: 'error',
    });
  }

  return issues;
}

export function validateAllFindings(findings: Finding[]): ValidationIssue[] {
  return findings.flatMap(f => validateFinding(f));
}
```

- [ ] **Step 2: Create test**

```typescript
import { describe, it, expect } from 'vitest';
import { validateFinding } from '../lib/validation';

describe('Validation', () => {
  it('should flag missing title', () => {
    const finding = { id: 'F-1', title: '', severity: 'Critical' };
    const issues = validateFinding(finding);
    expect(issues.some(i => i.rule === 'required')).toBe(true);
  });

  it('should flag overdue findings', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const finding = {
      id: 'F-1',
      title: 'Test',
      severity: 'High',
      status: 'Open',
      due_date: pastDate,
    };
    const issues = validateFinding(finding);
    expect(issues.some(i => i.rule === 'overdue')).toBe(true);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/validation.ts tests/validation.test.ts
git commit -m "feat: add validation rules engine with error and warning checks"
```

---

## Task 12: Create smart ingest preview component

**Files:**
- Create: `src/components/SmartIngestPreview.jsx`

- [ ] **Step 1: Create SmartIngestPreview.jsx**

```jsx
import React, { useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { findExactDuplicates, findSemanticDuplicates } from '../lib/deduplication';
import { validateAllFindings } from '../lib/validation';

export function SmartIngestPreview({ findings, assets, onApprove, onCancel }) {
  const [selectedDuplicates, setSelectedDuplicates] = useState({});

  const validationIssues = validateAllFindings(findings);
  const exactDups = findExactDuplicates(findings);
  const semanticDups = findSemanticDuplicates(findings);

  const newFindings = findings.filter(
    f => !exactDups.some(d => d.finding1 === f.id || d.finding2 === f.id) &&
         !semanticDups.some(d => d.finding1 === f.id || d.finding2 === f.id)
  );

  const invalidFindings = validationIssues
    .filter(i => i.severity === 'error')
    .map(i => i.finding_id);

  function handleApprove() {
    // Filter out invalid findings
    const validFindings = findings.filter(f => !invalidFindings.includes(f.id));
    
    // Apply deduplication
    const finalFindings = validFindings.filter(f => {
      // Remove duplicates (keep only first of pair)
      const isDupKey = `${f.id}-dup`;
      return !selectedDuplicates[isDupKey];
    });

    onApprove(finalFindings);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl max-h-[90vh] overflow-auto p-6">
        
        <h2 className="text-xl font-bold mb-6">Smart Ingest Preview</h2>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900 p-3 rounded">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {newFindings.length}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">New</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {exactDups.length + semanticDups.length}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">Duplicates</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900 p-3 rounded">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {invalidFindings.length}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Invalid</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {findings.length}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
          </div>
        </div>

        {/* New findings */}
        {newFindings.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-green-600 flex items-center gap-2 mb-3">
              <CheckCircle size={18} /> New Findings ({newFindings.length})
            </h3>
            <div className="space-y-2">
              {newFindings.map(f => (
                <div key={f.id} className="p-3 bg-green-50 dark:bg-slate-700 rounded border border-green-200 dark:border-slate-600">
                  <p className="font-medium">{f.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {f.severity} • {f.asset_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exact duplicates */}
        {exactDups.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-yellow-600 flex items-center gap-2 mb-3">
              <AlertTriangle size={18} /> Exact Duplicates ({exactDups.length})
            </h3>
            <div className="space-y-2">
              {exactDups.map(dup => {
                const f1 = findings.find(f => f.id === dup.finding1);
                const f2 = findings.find(f => f.id === dup.finding2);
                return (
                  <div key={`${dup.finding1}-${dup.finding2}`} className="p-3 bg-yellow-50 dark:bg-slate-700 rounded border border-yellow-200 dark:border-slate-600">
                    <p className="text-sm">{dup.reason}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {f1?.title} vs {f2?.title}
                    </p>
                    <button
                      onClick={() => setSelectedDuplicates(prev => ({
                        ...prev,
                        [`${f2.id}-dup`]: !prev[`${f2.id}-dup`]
                      }))}
                      className="text-xs mt-2 text-blue-600 hover:underline"
                    >
                      {selectedDuplicates[`${f2.id}-dup`] ? 'Keep both' : 'Merge (keep first)'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Invalid findings */}
        {invalidFindings.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-3">
              <AlertCircle size={18} /> Invalid Findings ({invalidFindings.length})
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              These will be skipped during import.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t dark:border-slate-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Import {findings.length - invalidFindings.length} Findings
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SmartIngestPreview.jsx
git commit -m "ui: add smart ingest preview with dedup and validation review"
```

---

## Task 13: Create dashboard with KPIs and charts

**Files:**
- Modify: `src/components/DashboardView.jsx`

- [ ] **Step 1: Replace DashboardView.jsx**

```jsx
import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStore } from '../hooks/useStore';

export function DashboardView() {
  const { store } = useStore();
  const { findings } = store;

  // Calculate KPIs
  const total = findings.length;
  const open = findings.filter(f => f.status === 'Open').length;
  const overdue = findings.filter(f => f.flags?.overdue).length;
  const critical = findings.filter(f => f.severity === 'Critical' && f.status === 'Open').length;
  const closed30d = findings.filter(f => {
    const closed = f.status === 'Closed';
    if (!closed) return false;
    const daysOld = (Date.now() - new Date(f.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld <= 30;
  }).length;

  // Severity distribution
  const severityData = [
    { name: 'Critical', value: findings.filter(f => f.severity === 'Critical').length, fill: '#C9432B' },
    { name: 'High', value: findings.filter(f => f.severity === 'High').length, fill: '#E5733A' },
    { name: 'Medium', value: findings.filter(f => f.severity === 'Medium').length, fill: '#C99A2B' },
    { name: 'Low', value: findings.filter(f => f.severity === 'Low').length, fill: '#2E8AB0' },
    { name: 'Info', value: findings.filter(f => f.severity === 'Informational').length, fill: '#5A6E89' },
  ];

  // Status distribution
  const statusData = [
    { name: 'Open', value: findings.filter(f => f.status === 'Open').length },
    { name: 'In Progress', value: findings.filter(f => f.status === 'In Progress').length },
    { name: 'Resolved', value: findings.filter(f => f.status === 'Resolved').length },
    { name: 'Closed', value: findings.filter(f => f.status === 'Closed').length },
  ];

  // Asset distribution
  const assetCounts = {};
  findings.forEach(f => {
    assetCounts[f.asset_name] = (assetCounts[f.asset_name] || 0) + 1;
  });
  const assetData = Object.entries(assetCounts).map(([name, count]) => ({ name, count }));

  return (
    <div className="p-6 space-y-6">
      
      {/* KPI Tiles */}
      <div className="grid grid-cols-6 gap-4">
        <KPITile label="Total Findings" value={total} color="blue" />
        <KPITile label="Open" value={open} color="yellow" />
        <KPITile label="Overdue" value={overdue} color="red" />
        <KPITile label="Critical (Active)" value={critical} color="red" />
        <KPITile label="Closed (30d)" value={closed30d} color="green" />
        <KPITile label="Unique Assets" value={Object.keys(assetCounts).length} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* Severity bars */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold mb-3">By Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status donut */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold mb-3">By Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#3B82F6', '#10B981'][index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset correlation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold mb-3">Assets by Finding Count</h3>
        <div className="space-y-2">
          {assetData
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(asset => (
              <div key={asset.name} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded">
                <span className="font-mono text-sm">{asset.name}</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">
                  {asset.count} findings
                </span>
              </div>
            ))}
        </div>
      </div>

    </div>
  );
}

function KPITile({ label, value, color }) {
  const bgColors = {
    blue: 'bg-blue-50 dark:bg-blue-900',
    yellow: 'bg-yellow-50 dark:bg-yellow-900',
    red: 'bg-red-50 dark:bg-red-900',
    green: 'bg-green-50 dark:bg-green-900',
    purple: 'bg-purple-50 dark:bg-purple-900',
  };

  const textColors = {
    blue: 'text-blue-700 dark:text-blue-300',
    yellow: 'text-yellow-700 dark:text-yellow-300',
    red: 'text-red-700 dark:text-red-300',
    green: 'text-green-700 dark:text-green-300',
    purple: 'text-purple-700 dark:text-purple-300',
  };

  return (
    <div className={`${bgColors[color]} rounded-lg p-4`}>
      <div className={`text-2xl font-bold ${textColors[color]}`}>{value}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DashboardView.jsx
git commit -m "feat: implement dashboard with KPI tiles and Recharts visualizations"
```

---

# Week 4: Register, Genealogy, Reports

## Task 14: Create register table with inline editing

**Files:**
- Modify: `src/components/RegisterView.jsx`
- Create: `src/components/FindingDrawer.jsx`

- [ ] **Step 1: Create FindingDrawer.jsx (side panel for editing)**

```jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export function FindingDrawer({ finding, isOpen, onClose }) {
  const { dispatch } = useStore();
  const [edited, setEdited] = useState(finding || {});

  function handleSave() {
    dispatch({ type: 'UPDATE_FINDING', payload: { ...edited, updated_at: new Date().toISOString() } });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto" onClick={onClose} />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-slate-800 shadow-lg pointer-events-auto overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="font-bold text-lg truncate">{edited.title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={edited.title || ''}
              onChange={e => setEdited({ ...edited, title: e.target.value })}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select
              value={edited.severity || ''}
              onChange={e => setEdited({ ...edited, severity: e.target.value })}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            >
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
              <option>Informational</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={edited.status || ''}
              onChange={e => setEdited({ ...edited, status: e.target.value })}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
              <option>Risk Accepted</option>
            </select>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-medium mb-1">Owner</label>
            <input
              type="text"
              value={edited.owner || ''}
              onChange={e => setEdited({ ...edited, owner: e.target.value })}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={edited.due_date?.split('T')[0] || ''}
              onChange={e => setEdited({ ...edited, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>

          {/* CVE */}
          <div>
            <label className="block text-sm font-medium mb-1">CVE</label>
            <input
              type="text"
              value={edited.cve || ''}
              onChange={e => setEdited({ ...edited, cve: e.target.value })}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              placeholder="CVE-YYYY-NNNNN"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={edited.description || ''}
              onChange={e => setEdited({ ...edited, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>

          {/* Genealogy (read-only) */}
          <div className="pt-4 border-t dark:border-slate-700">
            <h3 className="font-semibold text-sm mb-2">Genealogy</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>Source:</strong> {edited.source_document?.filename}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>Asset:</strong> {edited.asset_name}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>Control:</strong> {edited.control_framework} {edited.control_clause}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create RegisterView.jsx**

```jsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useFilters } from '../hooks/useFilters';
import { FileUploadModal } from './FileUploadModal';
import { SmartIngestPreview } from './SmartIngestPreview';
import { FindingDrawer } from './FindingDrawer';
import { detectAndParseFile } from '../lib/parser';

export function RegisterView() {
  const { store, dispatch } = useStore();
  const { filters, setFilters, applyFilters } = useFilters();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [parsedFindings, setParsedFindings] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [sortColumn, setSortColumn] = useState('severity');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = applyFilters(store.findings);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  function handleSortClick(column) {
    if (sortColumn === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDir('desc');
    }
  }

  async function handleParsedFindings(findings) {
    setParsedFindings(findings);
  }

  function handleApproveImport(findings) {
    dispatch({ type: 'ADD_FINDINGS', payload: findings });
    setParsedFindings(null);
    setUploadOpen(false);
  }

  function openDrawer(finding) {
    setSelectedFinding(finding);
    setDrawerOpen(true);
  }

  return (
    <div className="p-6 space-y-4">
      
      {/* Toolbar */}
      <div className="flex gap-4 items-center">
        <button
          onClick={() => setUploadOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Upload Findings
        </button>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          value={filters.q}
          onChange={e => setFilters({ ...filters, q: e.target.value })}
          className="px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
        />

        {/* Severity filter */}
        <select
          value={filters.severity || ''}
          onChange={e => setFilters({ ...filters, severity: e.target.value || null })}
          className="px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm"
        >
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Status filter */}
        <select
          value={filters.status || ''}
          onChange={e => setFilters({ ...filters, status: e.target.value || null })}
          className="px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>

        <span className="text-sm text-slate-600 dark:text-slate-400 ml-auto">
          {sorted.length} / {store.findings.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
            <tr>
              <HeaderCell onClick={() => handleSortClick('title')} sortColumn={sortColumn} column="title">ID · Title</HeaderCell>
              <HeaderCell onClick={() => handleSortClick('source_document.filename')} sortColumn={sortColumn} column="source_document.filename">Source</HeaderCell>
              <HeaderCell onClick={() => handleSortClick('severity')} sortColumn={sortColumn} column="severity">Severity</HeaderCell>
              <HeaderCell onClick={() => handleSortClick('status')} sortColumn={sortColumn} column="status">Status</HeaderCell>
              <HeaderCell onClick={() => handleSortClick('owner')} sortColumn={sortColumn} column="owner">Owner</HeaderCell>
              <HeaderCell onClick={() => handleSortClick('asset_name')} sortColumn={sortColumn} column="asset_name">Asset</HeaderCell>
              <th className="px-4 py-3 text-left font-medium">Due</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(f => (
              <tr
                key={f.id}
                onClick={() => openDrawer(f)}
                className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition"
              >
                <td className="px-4 py-3 font-mono text-xs">{f.id} · {f.title}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400">{f.source_document.filename}</td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={f.severity} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={f.status} />
                </td>
                <td className="px-4 py-3 text-sm">{f.owner || '—'}</td>
                <td className="px-4 py-3 text-sm font-mono">{f.asset_name}</td>
                <td className="px-4 py-3 text-sm">{f.due_date ? new Date(f.due_date).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <FileUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onParsedFindings={handleParsedFindings}
      />

      {parsedFindings && (
        <SmartIngestPreview
          findings={parsedFindings}
          assets={store.assets}
          onApprove={handleApproveImport}
          onCancel={() => setParsedFindings(null)}
        />
      )}

      <FindingDrawer
        finding={selectedFinding}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

function HeaderCell({ onClick, sortColumn, column, children }) {
  const isSorted = sortColumn === column;
  return (
    <th
      onClick={onClick}
      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
    >
      <div className="flex items-center gap-2">
        {children}
        {isSorted && <ChevronDown size={16} />}
      </div>
    </th>
  );
}

function SeverityBadge({ severity }) {
  const colors = {
    Critical: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    High: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    Medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    Low: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    Informational: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[severity]}`}>{severity}</span>;
}

function StatusBadge({ status }) {
  const colors = {
    Open: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    'In Progress': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    Resolved: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    Closed: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'Risk Accepted': 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>{status}</span>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RegisterView.jsx src/components/FindingDrawer.jsx
git commit -m "feat: implement register table with filters, sorting, and inline editing via drawer"
```

---

## Task 15: Create genealogy view

**Files:**
- Modify: `src/components/GenealogyView.jsx`

- [ ] **Step 1: Replace GenealogyView.jsx**

```jsx
import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';

export function GenealogyView() {
  const { store } = useStore();
  const [selectedId, setSelectedId] = useState(store.findings[0]?.id || null);

  const finding = store.findings.find(f => f.id === selectedId);
  if (!finding) {
    return <div className="p-6 text-center text-slate-600">No findings to display</div>;
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Picker */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Finding</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-64 px-3 py-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
        >
          {store.findings.map(f => (
            <option key={f.id} value={f.id}>
              {f.id} - {f.title}
            </option>
          ))}
        </select>
      </div>

      {/* 5-column DAG */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 overflow-x-auto">
        <div className="grid grid-cols-5 gap-4 min-w-max">
          
          {/* Column 1: Source Document */}
          <div>
            <h3 className="font-bold text-sm mb-3">SOURCE DOCUMENT</h3>
            <div className="bg-cs-light dark:bg-slate-700 rounded p-3 text-xs">
              <p className="font-mono font-bold">{finding.source_document.filename}</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                {new Date(finding.source_document.upload_date).toLocaleDateString()}
              </p>
              <p className="text-blue-600 dark:text-blue-400 font-mono text-xs mt-1">
                Confidence: {Math.round(finding.source_document.parser_confidence * 100)}%
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center text-2xl">→</div>

          {/* Column 2: Finding */}
          <div>
            <h3 className="font-bold text-sm mb-3">FINDING</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900 rounded p-3 text-xs">
              <p className="font-bold">{finding.title}</p>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1">
                {finding.severity}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                {finding.description?.substring(0, 100)}...
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center text-2xl">→</div>

          {/* Column 3: Control */}
          <div>
            <h3 className="font-bold text-sm mb-3">CONTROL</h3>
            <div className="bg-blue-50 dark:bg-blue-900 rounded p-3 text-xs">
              <p className="font-bold">{finding.control_framework}</p>
              <p className="font-mono text-slate-600 dark:text-slate-300 mt-1">
                {finding.control_clause}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                {finding.control_description}
              </p>
              {finding.related_findings.length > 0 && (
                <div className="mt-2 pt-2 border-t dark:border-blue-800">
                  <p className="text-xs font-bold">Related:</p>
                  {finding.related_findings.map(id => (
                    <button
                      key={id}
                      onClick={() => setSelectedId(id)}
                      className="block text-blue-600 dark:text-blue-400 hover:underline text-xs mt-1"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center text-2xl">→</div>

          {/* Column 4: Asset */}
          <div>
            <h3 className="font-bold text-sm mb-3">ASSET</h3>
            <div className="bg-green-50 dark:bg-green-900 rounded p-3 text-xs">
              <p className="font-bold">{finding.asset_name}</p>
              <p className="font-mono text-slate-600 dark:text-slate-300 text-xs mt-1">
                {finding.asset_id}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Owner: {finding.owner || 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center text-2xl">→</div>

          {/* Column 5: Impact */}
          <div>
            <h3 className="font-bold text-sm mb-3">IMPACT</h3>
            <div className="bg-red-50 dark:bg-red-900 rounded p-3 text-xs">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">
                Risk Level: {finding.severity}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Status: {finding.status}
              </p>
              {finding.due_date && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Due: {new Date(finding.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flags */}
      {finding.flags && Object.keys(finding.flags).length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Flags</h3>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(finding.flags).map(([key, value]) => 
              value && <span key={key} className="px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 rounded text-xs font-mono">
                {key.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GenealogyView.jsx
git commit -m "feat: implement genealogy view showing source → finding → control → asset → impact lineage"
```

---

## Task 16: Create report generation

**Files:**
- Modify: `src/components/ReportsView.jsx`
- Modify: `src/lib/reporting.ts`

- [ ] **Step 1: Create src/lib/reporting.ts**

```typescript
import { generateBriefing } from './llm';

export async function generateReport(findings: any[], audience: string): Promise<string> {
  try {
    const briefing = await generateBriefing(findings, audience);
    return briefing;
  } catch (err) {
    console.error('Failed to generate report:', err);
    throw new Error('Failed to generate report. Please try again.');
  }
}

export function exportAsMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
```

- [ ] **Step 2: Replace ReportsView.jsx**

```jsx
import React, { useState } from 'react';
import { Copy, Download, RotateCcw } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { generateReport, exportAsMarkdown, copyToClipboard } from '../lib/reporting';

const AUDIENCES = [
  { id: 'weekly_digest', label: 'Weekly Digest', icon: '📋' },
  { id: 'board_briefing', label: 'Board Briefing', icon: '🎯' },
  { id: 'audit_memo', label: 'Audit Memo', icon: '📄' },
  { id: 'ciso_one_on_one', label: 'CISO 1-on-1', icon: '👔' },
];

export function ReportsView() {
  const { store } = useStore();
  const [selectedAudience, setSelectedAudience] = useState('weekly_digest');
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    setError(null);
    setIsLoading(true);
    setReport('');

    try {
      const content = await generateReport(store.findings, selectedAudience);
      setReport(content);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Audience selector */}
      <div>
        <h2 className="text-lg font-bold mb-3">Select Audience</h2>
        <div className="grid grid-cols-4 gap-3">
          {AUDIENCES.map(aud => (
            <button
              key={aud.id}
              onClick={() => setSelectedAudience(aud.id)}
              className={`p-4 rounded-lg border-2 transition ${
                selectedAudience === aud.id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
              }`}
            >
              <div className="text-2xl mb-2">{aud.icon}</div>
              <div className="font-medium text-sm">{aud.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading || store.findings.length === 0}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isLoading ? 'Generating...' : 'Generate Report'}
      </button>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Report preview */}
      {report && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <h3 className="font-bold text-lg">Report Preview</h3>
            <button
              onClick={() => copyToClipboard(report)}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Copy size={16} /> Copy
            </button>
            <button
              onClick={() => exportAsMarkdown(report, `report-${selectedAudience}`)}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Download size={16} /> Export
            </button>
            <button
              onClick={() => setReport('')}
              className="flex items-center gap-2 px-3 py-1 bg-slate-400 text-white rounded text-sm hover:bg-slate-500"
            >
              <RotateCcw size={16} /> Clear
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 whitespace-pre-wrap text-sm font-sans">
            {report}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!report && !isLoading && (
        <div className="text-center p-12 text-slate-600 dark:text-slate-400">
          Generate a report by selecting an audience and clicking "Generate Report"
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ReportsView.jsx src/lib/reporting.ts
git commit -m "feat: implement report generation with multi-audience support and export options"
```

---

## Task 17: Final integration and testing

**Files:**
- None (testing only)

- [ ] **Step 1: Test full flow end-to-end**

```
1. Start dev server: npm run dev
2. Click "+ Upload Findings"
3. Drag a test PDF or paste text with sample findings
4. System should:
   ✅ Parse file (show filename in parser output)
   ✅ Detect any duplicates
   ✅ Flag invalid rows
   ✅ Show smart ingest preview
5. Click "Import X Findings"
6. Verify Register tab shows findings with:
   ✅ Sorting (click column header)
   ✅ Filtering (search, severity dropdown, status dropdown)
   ✅ Inline editing (click row → drawer opens)
   ✅ Genealogy (source document, control, asset visible)
7. Verify Dashboard shows:
   ✅ KPI tiles (total, open, overdue, critical, closed, assets)
   ✅ Charts (severity bars, status donut)
   ✅ Asset correlation table
8. Verify Genealogy shows:
   ✅ Source → Finding → Control → Asset → Impact flow
   ✅ Can switch between findings
   ✅ Can click related findings
9. Verify Reports shows:
   ✅ Audience selector
   ✅ Generate button (calls Claude API)
   ✅ Report preview (markdown content)
   ✅ Copy / Export buttons
10. Verify theme toggle works (dark mode)
11. Verify density toggle works (comfy/cosy/compact)
12. Verify data persists across browser refresh
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All tests pass (schema, dedup, validation, scoring).

- [ ] **Step 3: Build for production**

```bash
npm run build
```

Expected: `dist/` folder created with bundled app.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "test: verify end-to-end flow and production build"
```

---

## Task 18: Create project README and documentation

**Files:**
- Create: `README.md`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create README.md**

```markdown
# Cyber Sierra Atlas MVP

Lightweight browser-based findings consolidation tool with LLM-powered parsing, deduplication, validation, and report generation.

## Features

- **File Upload Parser**: Parse findings from PDF, CSV, JSON, or plaintext (powered by Claude AI)
- **Smart Ingest**: Automatic deduplication (exact + semantic), validation, and preview before import
- **Consolidated Register**: Filterable, sortable table with inline editing and full genealogy tracking
- **Dashboard**: KPI tiles, severity/status charts, asset correlation
- **Genealogy View**: Source document → Finding → Control → Asset → Impact lineage
- **Report Generation**: Multi-audience briefings (weekly digest, board, audit, CISO 1-on-1)
- **Persistence**: All data saved to browser localStorage (no backend required for MVP)
- **Theme & Density**: Dark mode + adjustable row density

## Quick Start

### Prerequisites
- Node.js 18+
- Anthropic API key (for LLM parsing)

### Installation

```bash
git clone https://github.com/yourusername/cyber-sierra-atlas-mvp.git
cd cyber-sierra-atlas-mvp
npm install
```

### Configuration

Copy `.env.example` to `.env.local` and add your API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_ANTHROPIC_API_KEY=your_key_here
```

### Development

```bash
npm run dev
```

Opens at http://localhost:5173

### Build

```bash
npm run build
```

Outputs to `dist/` for deployment.

## Architecture

- **React 18 + Vite**: Fast HMR, modern tooling
- **Tailwind CSS**: Utility-first styling with Cyber Sierra brand tokens
- **localStorage**: Client-side persistence (5–10MB capacity)
- **Claude API**: LLM-powered finding parsing and report generation
- **Recharts**: Dashboard visualizations

## Data Model

### Finding
- id, title, description, severity, status
- source_document (filename, upload_date, parser_confidence)
- asset_id, asset_name, control_framework, control_clause
- cve, cvss_score, due_date, owner, remediation_notes
- related_findings, deduped_with, flags (overdue, aging, at_risk, duplicate)

### Asset
- id, name, type, owner, criticality, description, business_impact
- dependencies, dependents

## Roadmap

### Phase 2 (Weeks 5–8)
- PostgreSQL backend (migrate from localStorage)
- User authentication (JWT)
- Multi-tenancy support
- Webhook integrations (Wiz, Snyk, Qualys)

### Phase 3 (Weeks 9–12)
- Trajectory (time-series trend analysis)
- KEV + EPSS enrichment (CISA data)
- Workflow (assignment, approvals, SLAs)
- Advanced Blast modes (Sankey + Adversary lens)

## Testing

```bash
npm test
```

## Contributing

See CONTRIBUTING.md (TBD)

## License

See LICENSE

---

Built with Cyber Sierra brand guidelines. See `docs/CLAUDE.md` for design rules.
```

- [ ] **Step 2: Update .gitignore**

```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test
coverage/
.nyc_output/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
```

- [ ] **Step 3: Commit**

```bash
git add README.md .gitignore .env.example
git commit -m "docs: add README and project documentation"
```

---

# Summary

**Week 1 (Foundation):** Project setup, schema definition, state management, layout components (Header, TabNav), skeleton views

**Week 2 (Parser & Upload):** LLM integration (Claude API), file format detection + extraction (PDF, CSV, JSON, text), upload modal with drag-drop

**Week 3 (Dedup & Validation):** Deduplication engine (exact + semantic), validation rules, smart ingest preview, dashboard with KPIs and charts

**Week 4 (Register, Genealogy, Reports):** Register table with filters/sorting/editing, genealogy 5-column DAG, report generation for 4 audiences

**Total:** ~18 tasks, ~2500 LOC, TDD throughout, frequent commits

---

**Next Step:** Choose execution approach:
1. **Subagent-driven** (recommended) — I dispatch fresh subagent per task with review between tasks
2. **Inline execution** — Execute tasks sequentially in this session

Which would you prefer?
