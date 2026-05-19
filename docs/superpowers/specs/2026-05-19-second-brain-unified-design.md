# Second Brain System — Unified Design Specification
**Date:** 2026-05-19  
**Status:** Design Review  
**Author:** Claude Code (Brainstorming + Design)  
**Project:** Learning Partner Evolution → Unified Second Brain

---

## 1. Executive Summary

This design specifies a **unified personal knowledge system** that integrates:
- **Structured learning** (AI certifications, quizzes, research via Genspark)
- **Personal knowledge management** (journaling, ideas, projects, task tracking)
- **Multi-source ingestion** (web, files, audio, Drive, automated feeds)
- **Cross-domain reasoning** (connect learning ↔ journaling ↔ projects)

**Key approach:** Headless API on GPU machine (central compute hub) + distributed UIs (Obsidian, web, mobile, CLI) that query it. All recurring work runs locally (Ollama embeddings, entity extraction, graph queries). Expensive synthesis queries (Claude) only on explicit user demand (~5-10/week).

**Scope:** 5 phases over 10 weeks. Phase 1 (foundation) is local-only and free. Phases 2-5 add search, synthesis, multi-device, and extensibility. **Annual token cost: ~$10-15.**

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ QUERY LAYER (Any Device: Desktop / Phone / Web / CLI / Voice)   │
│                                                                   │
│  ┌──────────────┬─────────────┬──────────────┬────────────────┐ │
│  │ Semantic     │ Graph       │ Intelligent  │ Natural        │ │
│  │ Search       │ Browser     │ Synthesis    │ Language       │ │
│  │ ("Find X")   │ ("Show X")  │ ("Connect X  │ Interface      │ │
│  │              │             │  to Y")      │                │ │
│  └──────────────┴─────────────┴──────────────┴────────────────┘ │
│                                   ↓                               │
│              All queries route through REST/GraphQL API         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ HEADLESS API SERVER (FastAPI on GPU Machine — Port 5000)        │
│                                                                   │
│  ┌──────────┬──────────────┬──────────────┬───────────────────┐ │
│  │ Vector   │ Knowledge    │ Entity       │ Query Router &    │ │
│  │ Search   │ Graph (SQL)  │ Store        │ Synthesis Agent   │ │
│  │ (Chroma) │              │ (JSON)       │ (Claude bridge)   │ │
│  └──────────┴──────────────┴──────────────┴───────────────────┘ │
│         ↑              ↑              ↑              ↑            │
└─────────────────────────────────────────────────────────────────┘
           ↑              ↑              ↑              ↑
┌─────────────────────────────────────────────────────────────────┐
│ INGESTION LAYER (Multi-Format, Multi-Source)                    │
│                                                                   │
│  ┌──────────────┬──────────┬──────────┬──────────────────────┐  │
│  │ Browser      │ File     │ Voice &  │ Automated Feeds      │  │
│  │ Harness      │ Watcher  │ Audio    │ (RSS, Webhooks, API) │  │
│  │ (Web URLs)   │ (PDF,    │ (Whisper)│                      │  │
│  │              │ DOCX,    │          │                      │  │
│  │              │ Markdown)│          │                      │  │
│  └──────────────┴──────────┴──────────┴──────────────────────┘  │
│         ↓              ↓              ↓              ↓            │
├─────────────────────────────────────────────────────────────────┤
│ PROCESSING PIPELINE (All Local Models on GPU — FREE)            │
│                                                                   │
│  ┌──────────┬────────────┬──────────┬──────────┬──────────────┐ │
│  │ Parse    │ Embed      │ Extract  │ Classify │ Link to      │ │
│  │ (Format) │ (nomic)    │ Entities │ Intent   │ Graph        │ │
│  │          │            │ (Ollama) │ (Ollama) │              │ │
│  └──────────┴────────────┴──────────┴──────────┴──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STORAGE LAYER (GPU Machine Disk)                                │
│                                                                   │
│  ┌──────────────┬─────────────┬──────────────┬──────────────┐  │
│  │ Vector DB    │ Graph DB    │ Entity Store │ Source Docs  │  │
│  │ (Chroma)     │ (SQLite)    │ (JSON)       │ (Raw files)  │  │
│  └──────────────┴─────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           ↓ (Phase 4: Sync to Mac)
┌─────────────────────────────────────────────────────────────────┐
│ LOCAL CACHE (Mac System — Read-Only Mirror for Offline Access)  │
│  • Replica vector DB (Chroma)                                    │
│  • Replica graph DB (SQLite)                                     │
│  • Syncs from GPU machine on schedule                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Design Principles

1. **Central GPU = Compute Hub**
   - All heavy lifting (embeddings, entity extraction, graph queries) runs on GPU machine
   - Other devices query via API
   - Keeps main Mac system light

2. **Local-First**
   - Vector embeddings stored locally (no cloud vendor lock-in)
   - Graph relationships stored in SQLite (portable)
   - All recurring work free (Ollama models)
   - Synthesis (Claude) only on explicit user queries

3. **Distributed UIs**
   - Obsidian: rich knowledge work, markdown editing
   - Web UI: search + graph from browser
   - Mobile: web UI on phone (read-only or with sync)
   - CLI: terminal access
   - All query the same central API

4. **Hybrid Ingestion**
   - Manual: file drops, web clipper, voice capture
   - Automated: file watchers, browser harness, feed crawlers
   - Seamlessly integrated into single processing pipeline

5. **Polymorphic Sources**
   - Sources can be: URLs, PDFs, DOCX, XLSX, markdown, audio, transcripts, images, JSON, CSV
   - Parser detects type and extracts text
   - All flow through same embedding + entity extraction

6. **PARA + Learning Integration**
   - PARA: Projects, Areas, Resources, Archives (Obsidian folder structure)
   - Learning: AI certs (AAISM, etc.), flashcards, quizzes (inherited from Learning Partner)
   - Journaling: daily notes, meeting notes, reflections
   - All sources connected in unified graph

---

## 3. Component Specification

### 3.1 Storage Layer

#### Vector Database (Chroma)
- **Purpose:** Semantic search across all documents
- **What it stores:** Document embeddings (768-dim vectors from nomic-embed-text)
- **Query:** Given a query string, return top-K most similar documents
- **Cost:** FREE (local, one-time embedding computation)
- **Capacity:** 500k+ documents (within GPU VRAM)

#### Graph Database (SQLite + Custom Relationships)
- **Purpose:** Track entities and connections
- **What it stores:**
  - **Entities table:** id, name, type (person/concept/org/project/location), first_seen, last_updated
  - **Relationships table:** source_entity, target_entity, relationship_type (mentions/cites/relates_to/authored_by/tags), confidence
  - **Documents table:** id, source, path, ingestion_date, content_hash
  - **Document_Entities junction:** document_id, entity_id, occurrence_count
- **Query:** Given an entity, return all connected entities + documents
- **Cost:** FREE (local, structured data)
- **Capacity:** 10k+ entities, 100k+ relationships

#### Entity Store (JSON Files)
- **Purpose:** Rich entity metadata (not just names)
- **What it stores:**
  ```json
  {
    "id": "ent_abc123",
    "name": "Transformer",
    "type": "concept",
    "aliases": ["attention mechanism", "seq2seq"],
    "definition": "...",
    "first_mentioned_in": "2026-01-15",
    "mention_count": 47,
    "related_entities": ["BERT", "attention", "neural networks"],
    "tags": ["learning:AAISM", "learning:Domain 2"],
    "references": ["https://arxiv.org/abs/1706.03762", ...]
  }
  ```
- **Cost:** FREE (local)

#### Document Store (Raw Files)
- **Purpose:** Original sources (PDFs, DOCX, URLs, voice transcripts)
- **Storage:** `~/second-brain-data/sources/` indexed by source hash
- **Cost:** FREE (local disk)

### 3.2 Processing Layer

#### Document Parser
- **Input:** Raw file (PDF, DOCX, XLSX, URL, markdown, audio transcription, plain text)
- **Output:** Clean text + metadata (title, author, date, source_url, format)
- **Implementation:** 
  - PDF: PyMuPDF
  - DOCX: python-docx
  - XLSX: openpyxl
  - URL: requests + BeautifulSoup
  - Audio: faster-whisper (local)
  - Markdown: parse + clean
- **Cost:** FREE (local)

#### Vector Embeddings (nomic-embed-text)
- **Input:** Parsed text documents
- **Output:** 768-dimensional vectors
- **Process:** Batch embed all documents one-time, store in Chroma
- **Re-embedding:** Only on new documents (incremental)
- **Cost:** FREE (local GPU, one-time per document)
- **Why nomic:** Open-source, 768-dim (good balance), trained on web + academic text, works locally

#### Entity Extractor (Ollama)
- **Input:** Parsed document text
- **Output:** List of entities + relationships
- **Model:** Qwen2.5-coder (fast, accurate, free)
- **Prompt:**
  ```
  Extract entities and relationships from this text:
  - People: name, occupation, affiliation
  - Concepts: name, definition
  - Organizations: name, type
  - Projects: name, status
  - Relationships: (entity1, relationship_type, entity2)
  
  Return as JSON.
  ```
- **Batch Processing:** Process 100 documents at a time (cost-efficient)
- **Cost:** FREE (local Ollama)

#### Intent Classifier (Ollama)
- **Input:** Voice transcript or text snippet
- **Output:** Intent + metadata
- **Intents:** task / idea / learning / project / plan / journal / brain-dump
- **Implementation:** Ollama (Mistral or Qwen)
- **Cost:** FREE (local)

#### Graph Builder
- **Input:** Extracted entities + relationships
- **Output:** SQLite edges + entity store updates
- **Process:**
  1. Deduplicate entities (e.g., "Transformer" vs "transformer" → same entity)
  2. Create relationships in SQLite
  3. Update entity metadata (mention count, last_seen, etc.)
- **Cost:** FREE (local logic)

### 3.3 API Layer (FastAPI)

#### Health & Status
- `GET /health` → server status
- `GET /status` → database sizes, last ingestion time, model versions

#### Ingestion Endpoints
- `POST /ingest/url` → {url, source_type, tags} → trigger ingestion
- `POST /ingest/file` → {file, source_type, tags} → trigger ingestion
- `POST /ingest/voice` → {audio_file} → transcribe + classify + ingest

#### Search Endpoints
- `GET /search?q=<query>&limit=10` → semantic search
  - Returns: [{doc_id, title, snippet, relevance_score, entities, source}]
- `GET /search/advanced?q=<query>&filters=tag:learning&sort=date` → filtered search

#### Graph Endpoints
- `GET /graph/entity/<entity_id>` → {entity, metadata, connected_entities, documents}
- `GET /graph/related/<doc_id>` → list of related documents
- `GET /graph/traverse?start=<entity_id>&depth=2` → BFS traversal
- `GET /graph/entities?type=concept&limit=50` → list entities by type

#### Synthesis Endpoints
- `POST /synthesis` → {query, context_mode} → Claude synthesis
  - context_mode: "learning" | "journal" | "project" | "cross_domain"
  - Returns: {answer, sources, entities_used, confidence}

#### Query Router
- `POST /ask` → {natural_language_query}
  - Analyzes query intent
  - Routes to: search | graph | synthesis
  - Returns: {answer, mode_used, sources}

### 3.4 UI Layer (Multiple Frontends)

#### Obsidian Vault
- Primary rich interface for knowledge work
- Folder structure:
  ```
  AI-Learning-Vault/
  ├── 00 - Inbox/          (capture, fleeting notes)
  ├── 01 - Daily Notes/    (journaling)
  ├── 02 - Projects/       (PARA: Projects)
  ├── 03 - Areas/          (PARA: Areas of responsibility)
  ├── 04 - Learning/       (PARA: Learning + AAISM)
  ├── 05 - Reference/      (PARA: Resources)
  ├── 06 - Archive/        (PARA: Archive)
  ├── 07 - Ideas/          (raw ideas + developed ideas)
  ├── 08 - Meetings/       (meeting notes)
  ├── 09 - Reading List/   (PARA + personal PKM)
  └── 10 - Dashboard/      (Dataview dashboards)
  ```
- Integration with API: sidebar panel shows search results, entity connections

#### Web UI (React)
- Search interface with results
- Entity browser with graph visualization
- Document viewer with inline entity links
- Synthesis Q&A interface
- Accessible from browser on any device on same network

#### Mobile Web UI (Responsive React)
- Search-focused
- Read-only or with cached access (Phase 4)
- Synthesis queries via API

#### CLI Tool (`sb` command)
- `sb search "query"` → results in terminal
- `sb ask "question"` → synthesis in terminal
- `sb graph entity_name` → ASCII graph visualization
- `sb ingest file.pdf` → trigger ingestion from CLI

#### Voice Interface (Future)
- Voice → transcript → classify intent → route to API
- API → search/synthesis → speak back results

---

## 4. Data Flow: End-to-End Examples

### 4.1 Example 1: Ingest a PDF Paper

```
User drops paper.pdf into ~/second-brain-data/inbox/
    ↓
File watcher detects new file
    ↓
ingest/file.py triggered:
  1. Parse PDF → extract text + metadata
  2. Tag with [learning, research]
    ↓
process/embed.py:
  1. Split text into chunks (500 tokens each)
  2. Embed each chunk with nomic-embed-text
  3. Store vectors + metadata in Chroma
    ↓
process/extract_entities.py:
  1. Send text to Ollama (Qwen2.5-coder)
  2. Ollama returns: {entities: [Transformer, BERT, ...], relationships: [...]}
    ↓
process/build_graph.py:
  1. Add entities to SQLite (if new)
  2. Link document → entities
  3. Create entity relationships (Transformer → BERT: "variant_of")
    ↓
API updated. User can now:
  - Search "Transformer" → paper appears in results
  - Browse "BERT" entity → see paper linked
  - Ask "What papers discuss Transformers?" → Sonnet synthesizes across all papers
```

### 4.2 Example 2: Voice Capture → Journal Integration

```
User records: "I realized that the AAISM governance concepts apply to my current ethics project"
    ↓
voice-to-vault.py triggered:
  1. faster-whisper transcribes → "I realized that..."
  2. Ollama classifies intent → "idea" + tags: [learning, project, connection]
    ↓
Transcript routed to 04 - Ideas/ as a note with tags
    ↓
API ingestion process (same as PDF):
  1. Embed the journal entry
  2. Extract entities: AAISM, governance, ethics project
  3. Link to existing entities in graph
    ↓
Graph now knows:
  - User's journal entry mentions governance + ethics project
  - governance entity already linked to learning notes
  - API can now synthesize: "How does my learning connect to my projects?"
    ↓
Later, when user asks "Connect my learning to my project ethics":
  1. API routes to synthesis
  2. Claude receives context:
     - User's learning about governance
     - User's project ethics journal entry
     - Related concepts (fairness, accountability)
  3. Claude synthesizes answer mentioning both
```

### 4.3 Example 3: Semantic Search + Graph Traversal

```
User searches "AI ethics"
    ↓
API /search endpoint:
  1. Embed query with nomic-embed-text
  2. Find top 10 most similar documents in Chroma
  3. Fetch entities mentioned in those documents
  4. Return results:
     [{title: "Ethics Paper", snippet: "...", entities: [fairness, transparency], source: url}]
    ↓
User clicks entity "fairness" → /graph/entity/fairness
  1. Fetch entity metadata
  2. Traverse relationships (depth=1)
     - fairness ← mentioned_in → [10 documents]
     - fairness → relates_to → [transparency, accountability, ...]
  3. Return: entity + connected docs + connected entities
    ↓
User sees graph visualization:
  fairness (center)
    ├─ related: transparency, accountability, bias
    └─ mentioned_in: paper1, journal_entry3, learning_note2
```

---

## 5. Token Cost Analysis

### 5.1 Recurring Tasks Breakdown

| Task | Frequency | Model | Tokens/Occurrence | Annual Cost |
|---|---|---|---|---|
| **Embedding new documents** | ~20 docs/week | nomic-embed-text (local) | — | $0 |
| **Entity extraction** | ~20 docs/week | Ollama/Qwen (local) | — | $0 |
| **Semantic search** | ~100 queries/week | Vector DB (local) | — | $0 |
| **Graph traversal** | ~50 queries/week | SQLite (local) | — | $0 |
| **Intent classification** | ~5 voice notes/week | Ollama (local) | — | $0 |
| **Synthesis queries** | ~8 queries/week | Claude Sonnet | ~10k tokens/query | ~$10 |
| **Dashboard updates** | ~1/day | Ollama (local) | — | $0 |
| **Weekly review** | 1/week | Ollama (local) | — | $0 |
| | | | **TOTAL/YEAR** | **~$10-15** |

### 5.2 Why So Cheap?

1. **Vector embeddings are one-time:** Embed each document once (nomic-embed-text local), then reuse vectors for infinite searches
2. **Graph queries are free:** SQLite queries don't use LLMs
3. **Entity extraction is batched:** 20 documents batched through Ollama = negligible cost
4. **Synthesis is rare:** Only when user explicitly asks complex questions (~8/week vs. 1000+ searches/week)
5. **All models local:** Ollama, nomic-embed, faster-whisper all run on GPU machine, zero API costs

### 5.3 Cost Comparison vs. Alternatives

| System | Annual Cost | Why? |
|---|---|---|
| **This design (Local + Sonnet)** | ~$10-15 | 99% local, only synthesis uses Claude |
| **Obsidian + ChatGPT** | ~$120-200 | Embedding every query to ChatGPT API |
| **Obsidian + OpenAI embeddings** | ~$50-100 | Embeddings API per query |
| **Pinecone (cloud vector DB)** | ~$100-500/year | Hosted vector DB + API calls |
| **Hypothetical full-Claude system** | ~$5000+/year | Every entity extraction, search, synthesis uses Claude |

---

## 6. Five-Phase Implementation Plan

### PHASE 1: Foundation & Core Ingestion (Weeks 1-2)

**Deliverables:**
- SQLite + Chroma setup (empty DBs ready)
- FastAPI server skeleton (health endpoints)
- 5 ingestion pipelines: URL, file, voice, Obsidian, Genspark
- Vector embedding pipeline (nomic-embed-text)
- Entity extraction pipeline (Ollama batch)
- Graph builder (SQLite relationships)

**Success Criteria:**
- API server runs on port 5000
- Ingest URL → embedded + searchable
- Ingest PDF → entities extracted + graph built
- Ingest voice → transcribed + classified + routed
- Obsidian vault auto-indexed
- 100+ documents embedded

**Cost: $0** (all local)

### PHASE 2: Search & Discovery (Weeks 3-4)

**Deliverables:**
- Semantic search API (`/search`)
- Graph query API (`/graph/entity`, `/graph/traverse`)
- Web UI (React) for search + graph visualization
- Obsidian plugin sidebar

**Success Criteria:**
- Search "AI governance" → top 5 results with snippets
- Click entity "fairness" → see all connected docs + concepts
- Graph visualization (D3.js) shows connections
- Obsidian plugin loads results in sidebar

**Cost: $0** (all local)

### PHASE 3: Intelligent Synthesis (Weeks 5-6)

**Deliverables:**
- Synthesis agent (`/synthesis` endpoint)
- Query router (detects intent: search vs. graph vs. synthesis)
- Context builder (fetch top 5 docs from vector DB, build context)
- Claude Sonnet integration (synthesis queries)

**Success Criteria:**
- Ask "What have I learned about transformers?" → answer includes learning notes + papers
- Ask "Connect my AI ethics journal to my governance learning" → synthesis links concepts
- Cost tracking: measure tokens spent, stays under $15/year
- Response time <5s per synthesis query

**Cost: ~$10/year** (5-8 synthesis queries/week × 10k tokens × ~$3/1M)

### PHASE 4: Multi-Device Access & Offline (Weeks 7-8)

**Deliverables:**
- Web UI deployment (accessible from phone on network)
- Local cache sync daemon (Mac replica of vector + graph DBs)
- Obsidian 2-way sync (new notes → ingested, new entities → backlinked)
- CLI tool (`sb search`, `sb ask`, `sb graph`)

**Success Criteria:**
- Open browser on phone → full search + graph access
- Mac syncs local cache automatically (30s background daemon)
- `sb ask "what have I learned?"` works from terminal
- New Obsidian notes appear in search within 30s
- Offline on Mac: can search local cache even if GPU offline

**Cost: $0-10** (same as Phase 3, optional synthesis if used)

### PHASE 5: Extensibility & Future Sources (Weeks 9-10)

**Deliverables:**
- Plugin framework (standard DataSource interface)
- Built-in plugins: Gmail, Slack, RSS, GitHub, Twitter
- Named entity recognition enhancements
- Cross-source deduplication
- Memory system integration (store synthesis decisions in `.claude/memory/`)

**Success Criteria:**
- Gmail plugin: ingest 100+ emails, extract entities
- Slack plugin: pull conversation history, link to projects
- RSS plugin: subscribe to feeds, auto-ingest articles
- Deduplication: recognize "John Smith" in email + Slack
- Timeline: show events across sources with relationships
- Memory bridge: store synthesis in Claude memory, retrieve later

**Cost: $10-15/year** (higher synthesis volume, more complex queries)

---

## 7. Architecture Decisions & Rationale

### Decision 1: Headless API vs. Monolithic App

**Chosen: Headless API**

**Why:**
- ✓ Single source of truth (GPU machine)
- ✓ Phone/web/CLI access without duplication
- ✓ Future sources easy to add (new API clients)
- ✓ Obsidian remains independent (can work offline)
- ✗ Requires service running on GPU (acceptable tradeoff)

### Decision 2: Local Embeddings (nomic-embed-text) vs. Cloud API (OpenAI)

**Chosen: Local (nomic-embed-text)**

**Why:**
- ✓ Saves $50-100/year (pay once, run forever)
- ✓ Privacy (embeddings stay local)
- ✓ No vendor lock-in
- ✓ Runs on GPU machine
- ✗ 768-dim vs. OpenAI's 1536-dim (nomic is still very good for semantic search)

### Decision 3: SQLite Graph vs. Neo4j

**Chosen: SQLite**

**Why:**
- ✓ Zero setup, comes with Python
- ✓ Free, no licensing
- ✓ Portable (easy to backup, replicate)
- ✗ Less powerful for complex graph queries (acceptable for this scale)
- ✗ Can upgrade to Neo4j later if needed

### Decision 4: Synthesis: On-demand (Claude) vs. Continuous Indexing

**Chosen: On-demand**

**Why:**
- ✓ Cheap (only pay for queries user actually asks)
- ✓ Simpler architecture (no constant background synthesis)
- ✓ Fresh answers (latest documents + context)
- ✗ Higher latency (5-10s for synthesis)
- Future: Could add caching for common queries

### Decision 5: Obsidian as Primary UI vs. Web-First

**Chosen: Obsidian + Web (both)**

**Why:**
- ✓ Obsidian excels at rich markdown editing + offline work
- ✓ Web UI for quick searches + graph exploration
- ✓ CLI for power users
- ✓ Phone access via web
- ✓ Users choose preferred interface

---

## 8. Success Criteria (Entire System)

- [ ] API server runs stably on GPU machine (99.9% uptime)
- [ ] 500+ documents ingested, searchable, graph-connected
- [ ] Semantic search (top 5 results in <500ms)
- [ ] Graph traversal (entity → connected docs in <100ms)
- [ ] Synthesis queries (answers in <5s, under $15/year spend)
- [ ] Obsidian vault integrates seamlessly (new notes auto-indexed)
- [ ] Web UI mobile-friendly and responsive
- [ ] CLI tool accessible from Mac terminal
- [ ] Local cache syncs within 30s
- [ ] Cross-domain synthesis works ("Connect learning to project")
- [ ] Token costs <$20/year (measured)
- [ ] System extensible (can add new sources via plugin framework)

---

## 9. Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| GPU machine offline → API unavailable | Medium | High | Phase 4: Local cache + fallback to cached search |
| Entity deduplication errors (same person 2 names) | Medium | Medium | Phase 5: Manual review UI + confidence scores |
| Obsidian sync conflicts | Low | Medium | File-watcher with conflict resolution + merge strategy |
| Vector DB grows too large | Low | Medium | Archive old documents, maintain index size limits |
| Claude API cost overruns | Low | High | Cost monitoring, synthesis query limits, approval before expensive queries |
| Ingestion pipeline slow on large files | Medium | Low | Batch processing, chunking large documents, progress tracking |

---

## 10. Future Enhancements (Post-Phase 5)

- **Knowledge graph visualization:** Interactive 3D graph (Babylon.js)
- **Collaborative features:** Multi-user vault with conflict resolution
- **Mobile app:** Native iOS/Android app (vs. web)
- **Voice synthesis:** Speak answers back to user
- **Timeline views:** Visual timeline of learning over time
- **Spaced repetition:** Auto-generate flashcards from sources
- **Citation tracking:** BibTeX/Zotero integration
- **Privacy:** End-to-end encryption option for sensitive notes
- **Analytics:** Learning progress dashboards, time spent per domain

---

## 11. Comparison to Existing Systems

### vs. Nicholas Spisak's Second Brain
- ✓ **Same:** Raw sources → wiki, entity extraction, semantic search, graph
- ✓ **Better:** Multi-platform access (phone, web, CLI), synthesis agent, local DB (no vendor lock)
- ✗ **Different:** Spisak uses Claude skills, we use local Ollama + Claude hybrid

### vs. Karpathy's LLM Wiki Pattern
- ✓ **Same:** LLM maintains knowledge between sources and notes
- ✓ **Better:** Unified search + graph (Karpathy focused on wiki generation)
- ✓ **Same approach:** Active maintenance, not just passive storage

### vs. PARA Method (P/A/R/A)
- ✓ **Integrated:** Obsidian folder structure follows PARA
- ✓ **Unified:** Relationships cross PARA boundaries (project ↔ learning ↔ journal)

### vs. Learning Partner (Existing Design)
- ✓ **Superset:** Keeps all Learning Partner features (quizzes, voice, Genspark integration)
- ✓ **Adds:** Semantic search, graph, synthesis, multi-source, multi-device
- ✓ **Improves:** Token efficiency (90% local), cost ($10/year vs. cloud-dependent)

---

## 12. Open Questions for Review

1. **Embedding model:** Is nomic-embed-text sufficient? Should we consider something larger?
2. **Graph DB scale:** Will SQLite handle 10k+ entities with fast traversal? When to upgrade to Neo4j?
3. **Synthesis frequency:** Is 8 queries/week realistic? Or should we budget higher?
4. **Obsidian plugins:** Should we build a custom plugin or use Obsidian's native API?
5. **Phone access:** Should Phase 4 include a native mobile app or is responsive web sufficient?
6. **Voice interface:** Should we add voice synthesis (speak answers back) in Phase 5?
7. **Privacy:** Should we support optional encryption for sensitive notes?

---

## Appendix A: File Structure

```
~/scripts/second-brain/
├── phase1_setup.sh
├── config/
│   ├── db_schema.sql
│   └── chroma_config.py
├── ingest/
│   ├── url.py
│   ├── file.py
│   ├── voice.py
│   ├── obsidian.py
│   └── genspark.py
├── process/
│   ├── embed.py
│   ├── extract_entities.py
│   ├── build_graph.py
│   └── index.py
├── api/
│   ├── server.py
│   ├── routes/
│   │   ├── ingest.py
│   │   ├── search.py
│   │   ├── graph.py
│   │   ├── synthesis.py
│   │   └── health.py
│   └── middleware/
│       ├── auth.py
│       └── rate_limit.py
├── sync/
│   ├── sync_daemon.py
│   └── obsidian_sync.py
├── cli/
│   ├── sb_cli.py
│   └── commands/
│       ├── search.py
│       ├── ask.py
│       └── graph.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
│   └── package.json
├── plugins/
│   ├── base.py
│   ├── gmail.py
│   ├── slack.py
│   ├── rss.py
│   └── github.py
├── tests/
│   ├── test_ingest.py
│   ├── test_search.py
│   └── test_synthesis.py
├── docs/
│   ├── architecture.md
│   ├── api_reference.md
│   ├── plugin_development.md
│   └── user_guide.md
├── data/
│   ├── sources/          (raw documents)
│   ├── vectors/          (Chroma DB)
│   ├── graph.db          (SQLite)
│   └── entities/         (JSON files)
├── requirements.txt
├── setup.py
└── README.md
```

---

**Design Status:** Ready for User Review  
**Next Step:** User reviews specification, requests changes, then transitions to writing-plans skill for implementation roadmap.
