# Cyber Sierra Atlas MVP

A modern security findings consolidation and analysis platform. Ingest vulnerabilities from multiple sources, deduplicate intelligently, validate data quality, and generate executive briefings.

**Status:** ✅ MVP COMPLETE (19/19 tests passing, 92/100 code quality)

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Anthropic API key (from https://console.anthropic.com/)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/sriramshiv26-prog/cyber-sierra-atlas-mvp.git
cd cyber-sierra-atlas-mvp

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env and add your VITE_ANTHROPIC_API_KEY

# 4. Start dev server
npm run dev

# 5. Open http://localhost:5173 in your browser
```

---

## Features

### Core Functionality
- **Smart Ingest:** Upload findings from PDF, CSV, JSON, XLSX, DOCX, plaintext
- **Intelligent Deduplication:** Exact (CVE + Asset) and semantic (title similarity) matching
- **Data Validation:** 12+ rules for data quality checking
- **Risk Scoring:** Dynamic risk scores based on severity × asset criticality
- **Finding Register:** Search, filter, sort, and edit findings in a comprehensive table

### Analytics & Reporting
- **Executive Reports:** Generate audience-tailored briefings (Weekly, Board, Audit, CISO)
- **Compliance Crosswalk:** Framework matrix showing control coverage
- **Blast Radius:** Visualize cascading impact of critical vulnerabilities
- **Genealogy:** Track finding lineage (source → finding → asset → impact)

### User Experience
- **Dark Mode:** Full light/dark theme support
- **Persistent Storage:** Auto-save to browser localStorage
- **Responsive Design:** Mobile → Desktop
- **Real-time Validation:** Form validation with quality alerts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite 5 + Tailwind CSS 3 |
| **State** | Context API + useReducer + localStorage |
| **LLM** | Claude 3.5 Sonnet (Anthropic SDK) |
| **Charts** | Recharts 2 |
| **File Parsing** | PDF.js, PapaParse, XLSX, Mammoth |
| **Icons** | Lucide React |
| **Testing** | Vitest |

---

## Project Structure

```
cyber-sierra-atlas-mvp/
├── src/
│   ├── components/         # React components (views, modals, drawers)
│   │   ├── DashboardView.jsx
│   │   ├── RegisterView.tsx
│   │   ├── ReportsView.jsx
│   │   ├── CrosswalkView.jsx
│   │   ├── BlastRadiusView.jsx
│   │   ├── GenealogyView.jsx
│   │   └── ... (Header, TabNav, modals)
│   ├── hooks/             # Custom hooks
│   │   ├── useStore.tsx   # State management
│   │   └── useFilters.ts  # Filter logic
│   ├── lib/               # Utilities
│   │   ├── schema.ts      # TypeScript interfaces
│   │   ├── llm.ts         # Claude API integration
│   │   ├── parser.ts      # File parsing
│   │   ├── deduplication.ts
│   │   ├── validation.ts
│   │   ├── scoring.ts
│   │   └── ai-provider.ts
│   ├── assets/            # Cyber Sierra brand tokens
│   ├── App.jsx            # Main app container
│   └── main.jsx           # React root
├── tests/                 # Test suite
│   ├── store.test.ts
│   └── integration.test.ts
├── package.json
├── vite.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Testing

```bash
# Run all tests
npm test -- --run

# Expected: 19/19 tests passing
# Duration: ~160ms
```

**Test Coverage:**
- ✅ Store reducer (ADD, UPDATE, DELETE)
- ✅ Deduplication engine (exact + semantic)
- ✅ Validation rules
- ✅ Risk scoring
- ✅ Error handling
- ✅ E2E functional testing (manual)

---

## Building for Production

```bash
# Build optimized bundle
npm run build

# Output: dist/ directory
# Includes: minified JS, CSS, sourcemaps (disabled in prod)

# Test production build locally
npm run preview
```

**Deployment:**
- Static HTML/CSS/JS in `dist/`
- Deploy to any static host:
  - Vercel (recommended)
  - Netlify
  - GitHub Pages
  - AWS S3 + CloudFront
  - Any CDN

---

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-v0-...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_AI_PROVIDER` | AI provider (claude, openai, local) | `claude` |
| `VITE_LOCAL_LLM_ENDPOINT` | Ollama endpoint (if using local) | `http://localhost:11434/api/generate` |
| `VITE_LOCAL_LLM_MODEL` | Local LLM model name | `llama3` |

### Setup

```bash
# Copy example
cp .env.example .env

# Edit .env
VITE_ANTHROPIC_API_KEY=sk-ant-v0-... (from console.anthropic.com)

# Verify
npm run dev
```

---

## Cost Estimation

Based on Claude 3.5 Sonnet pricing:

| Activity | Tokens | Cost |
|----------|--------|------|
| File ingest (per 50MB) | 2,000-5,000 | $0.10-0.25 |
| Report generation (per report) | 500-2,000 | $0.05-0.10 |
| Dedup validation (per 100 findings) | 500 | $0.03 |
| **Monthly (1000 findings)** | 50,000-100,000 | **$2-5** |

*Costs significantly reduced on GPU machine using local Qwen2.5-coder (~$0 after initial setup).*

---

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| File upload (10MB CSV) | ~2s | Including parsing + dedup |
| Dashboard render | ~150ms | 100+ findings |
| Report generation | ~3s | Claude API call |
| Deduplication (100 findings) | ~100ms | O(n²) but fast in practice |
| Page reload | <500ms | Includes localStorage load |

---

## Roadmap

### Phase 1 (Complete ✅)
- Smart Ingest (file upload + parsing)
- Deduplication + Validation
- Finding Register
- Dashboard with charts
- Reports & Crosswalk
- Genealogy view

### Phase 2 (Planned)
- Asset registry UI (CRUD for assets)
- PDF export (reports, register)
- Remediation suggestion AI
- Audit trail / change log
- Component snapshot tests
- Accessibility improvements (aria-labels, focus-trap)

### Phase 3+ (Future)
- Webhook integrations (Slack, Teams, Jira)
- Time-series trajectory view
- EPSS / KEV enrichment
- Multi-tenant support
- Real-time collaboration

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit with meaningful messages: `git commit -m "feat: describe your change"`
3. Push and create a pull request

---

## Code Quality

- **Test Coverage:** 19 unit/integration tests (all passing)
- **Code Audit:** 92/100 score
- **Security:** 0 critical/high vulnerabilities
- **Type Safety:** TypeScript, ~85% strict coverage
- **Performance:** No bottlenecks detected

See [CODE_AUDIT.md](CODE_AUDIT.md) for full review.

---

## Documentation

- [README.md](README.md) — This file
- [CHANGELOG.md](CHANGELOG.md) — Feature changelog
- [TESTING.md](TESTING.md) — Testing results
- [CODE_AUDIT.md](CODE_AUDIT.md) — Code review & security

---

## License

MIT

---

## Support

- Questions? Open an issue on GitHub
- Testing results? See [TESTING.md](TESTING.md)
- Code review? See [CODE_AUDIT.md](CODE_AUDIT.md)

---

## Credits

**Built with:** React, Vite, Claude API, Anthropic SDK  
**Design:** Cyber Sierra brand tokens  
**Testing:** Vitest + manual E2E validation

---

**Ready to deploy!** Push to production or clone on GPU machine for local LLM experimentation.

