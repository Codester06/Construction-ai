# High Level Design Report
# ConstructionGen — AI-Powered Construction Documentation Platform

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Scope of the Document](#11-scope-of-the-document)
   - 1.2 [Intended Audience](#12-intended-audience)
   - 1.3 [System Overview](#13-system-overview)
2. [System Design](#2-system-design)
   - 2.1 [Application Design](#21-application-design)
   - 2.2 [Process Flow](#22-process-flow)
   - 2.3 [Information Flow](#23-information-flow)
   - 2.4 [Components Design](#24-components-design)
   - 2.5 [Key Design Considerations](#25-key-design-considerations)
   - 2.6 [API Catalogue](#26-api-catalogue)
3. [Data Design](#3-data-design)
   - 3.1 [Data Model](#31-data-model)
   - 3.2 [Data Access Mechanism](#32-data-access-mechanism)
   - 3.3 [Data Retention Policies](#33-data-retention-policies)
   - 3.4 [Data Migration](#34-data-migration)
4. [Interfaces](#4-interfaces)
5. [State and Session Management](#5-state-and-session-management)
6. [Caching](#6-caching)
7. [Non-Functional Requirements](#7-non-functional-requirements)
   - 7.1 [Security Aspects](#71-security-aspects)
   - 7.2 [Performance Aspects](#72-performance-aspects)
8. [References](#8-references)

---

## 1. Introduction

### 1.1 Scope of the Document

This High Level Design (HLD) document describes the architectural and design decisions for **ConstructionGen**, an AI-powered construction documentation platform. It covers the overall system architecture, component interactions, data design, interface definitions, state management strategy, and non-functional requirements.

This document does not cover low-level implementation details such as individual function logic, CSS specifics, or line-by-line code explanations — those are addressed in the accompanying LLD and GENAI-DOCUMENTATION files. This document is intended to provide a bird's-eye view of how the system is structured and why those structural choices were made.

**In scope:**
- Overall system architecture (frontend, backend, AI layer, storage)
- Component responsibilities and interactions
- API contract between frontend and backend
- Data models and storage strategy
- Session and state management approach
- Security and performance considerations

**Out of scope:**
- Deployment infrastructure and DevOps pipelines
- User authentication and multi-user support (not implemented in current version)
- Mobile native applications
- Third-party integrations beyond Groq API and HuggingFace embeddings

---

### 1.2 Intended Audience

| Audience | Purpose |
|----------|---------|
| Software Developers | Understanding system structure before contributing or extending |
| Technical Reviewers | Evaluating architectural decisions and design quality |
| Project Evaluators / Assessors | Reviewing the GenAI system design for academic or professional assessment |
| QA Engineers | Understanding component boundaries for test planning |
| Future Maintainers | Onboarding to the codebase with a high-level map |

---

### 1.3 System Overview

ConstructionGen is a full-stack web application that uses Generative AI to assist construction professionals with two primary tasks:

1. **Report Generation** — Users fill a structured form with project details and a site activity description. The system uses a Retrieval-Augmented Generation (RAG) pipeline to produce a professional, formatted Daily Site Report in markdown, downloadable as PDF, Word (.docx), or plain text.

2. **AI Chat Assistant** — Users converse with an AI assistant specializing in construction knowledge. The assistant maintains full conversation memory within a session and is grounded in a local vector knowledge base to prevent hallucination.

**High-Level Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│                                                             │
│   ┌─────────────┐   ┌──────────────┐   ┌───────────────┐  │
│   │  React SPA  │   │ localStorage │   │  File System  │  │
│   │  (Vite 5)   │   │  (Reports +  │   │  (Downloads)  │  │
│   │  Port 5173  │   │   Chat Msgs) │   │               │  │
│   └──────┬──────┘   └──────────────┘   └───────────────┘  │
│          │ HTTP REST (JSON)                                  │
└──────────┼──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                     BACKEND SERVER                          │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              FastAPI (Python)  Port 8000            │  │
│   │                                                     │  │
│   │   /generate-report          /chat                   │  │
│   │         │                      │                    │  │
│   │   ┌─────▼──────────────────────▼──────┐            │  │
│   │   │        ConstructionRAG             │            │  │
│   │   │  ┌─────────────┐  ┌─────────────┐ │            │  │
│   │   │  │  ChromaDB   │  │  ChatGroq   │ │            │  │
│   │   │  │ (local vec) │  │ LLaMA 3.3   │ │            │  │
│   │   │  │ similarity  │  │  70B via    │ │            │  │
│   │   │  │  search     │  │  Groq API   │ │            │  │
│   │   │  └─────────────┘  └──────┬──────┘ │            │  │
│   │   └───────────────────────────┼────────┘            │  │
│   └───────────────────────────────┼─────────────────────┘  │
│                                   │                         │
└───────────────────────────────────┼─────────────────────────┘
                                    │ HTTPS
                          ┌─────────▼──────────┐
                          │    Groq Cloud API   │
                          │  llama-3.3-70b-     │
                          │    versatile        │
                          └────────────────────┘
```

**Technology Summary:**

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite 5, React Router v6 |
| Backend | Python FastAPI, Uvicorn ASGI server |
| AI / LLM | Groq API — llama-3.3-70b-versatile, temperature 0.1 |
| RAG / Embeddings | LangChain, HuggingFace all-MiniLM-L6-v2 |
| Vector Store | ChromaDB (local persistent, on-disk) |
| Client Storage | Browser localStorage |
| Styling | Custom CSS (no Tailwind, no UI libraries) |

---

## 2. System Design

### 2.1 Application Design

ConstructionGen follows a **two-tier client-server architecture** with an AI inference layer:

- **Tier 1 — Frontend (Client):** A React Single Page Application (SPA) running in the browser. Handles all UI rendering, form management, local data persistence, and file downloads. Communicates with the backend exclusively via HTTP REST calls.

- **Tier 2 — Backend (Server):** A Python FastAPI application. Stateless — holds no session data between requests. Owns the AI pipeline: vector retrieval, prompt construction, and LLM invocation.

- **External AI Layer:** Groq Cloud API provides LLM inference. The backend calls Groq synchronously per request.

**Frontend Architecture — Component Tree:**

```
App (BrowserRouter)
└── Layout
    ├── Sidebar (fixed floating nav dock)
    └── main.content (page outlet)
        ├── Home          → /
        ├── NewReport     → /new-report
        ├── Chat          → /chat
        └── History       → /history

Shared Components (used across pages):
├── ReportRenderer    (react-markdown renderer)
├── Toast / useToast  (notification system)
└── Icons             (SVG icon library)

Utilities:
├── storage.ts        (localStorage CRUD)
└── wordExport.ts     (markdown → .docx)
```

**Backend Architecture — Module Responsibilities:**

```
main.py  ──────────────────────────────────────────────────
│  FastAPI app instance                                    │
│  CORS middleware configuration                           │
│  Pydantic request/response models                        │
│  HTTP route handlers (/generate-report, /chat, /health)  │
│  Single shared ConstructionRAG instance (app lifetime)   │
────────────────────────────────────────────────────────────
         │ delegates to
rag.py   ▼──────────────────────────────────────────────────
│  ConstructionRAG class                                   │
│  LLM: ChatGroq (llama-3.3-70b-versatile, temp=0.1)      │
│  Embeddings: HuggingFaceEmbeddings (all-MiniLM-L6-v2)   │
│  VectorStore: Chroma (./chroma_db, persistent)           │
│  generate_report() — RAG + structured prompt → markdown  │
│  chat() — RAG + multi-turn message list → response       │
────────────────────────────────────────────────────────────
         │ populated by
ingest_docs.py ─────────────────────────────────────────────
│  One-time script                                         │
│  6 construction knowledge documents                      │
│  RecursiveCharacterTextSplitter (1000 chars, 200 overlap)│
│  Chroma.from_documents() → ./chroma_db                   │
────────────────────────────────────────────────────────────
```

---

### 2.2 Process Flow

#### Report Generation Process

```
1. User opens /new-report
2. User fills form:
   - Project Name, Number, Date, Location, Contractor, Weather
   - Tone (Formal / Standard / Detailed)
   - Length (Brief / Standard / Detailed)
   - Site Activity Description (required, structured text)
3. User clicks "Generate Report"
4. Frontend validates: topic must not be empty
5. Frontend starts animated 6-stage progress bar (800ms per stage)
6. Frontend POSTs to /generate-report
7. Backend receives ReportRequest
8. ConstructionRAG.generate_report():
   a. Embeds topic text using all-MiniLM-L6-v2
   b. Queries ChromaDB: top 3 similar construction knowledge chunks
   c. Maps tone → instruction string
   d. Maps length → instruction string
   e. Builds structured prompt (system rules + project table + tone + length + topic + context)
   f. Invokes Groq LLM (single string prompt)
   g. Returns markdown string
9. Backend returns { report: "...", success: true }
10. Frontend clears progress bar, renders report via ReportRenderer
11. Frontend saves report to localStorage
12. Toast notification: "Report generated and saved to history!"
13. User can download as PDF / Word / TXT
```

#### Chat Process (with Memory)

```
1. User opens /chat
2. Initial greeting message shown (loaded from localStorage or default)
3. User types message, presses Enter or Send
4. Frontend builds history array:
   - Takes messages.slice(1) (skips greeting at index 0)
   - Maps each to { role: "user"|"assistant", content: string }
5. Frontend POSTs to /chat { message, history }
6. Backend receives ChatRequest
7. ConstructionRAG.chat():
   a. Embeds message using all-MiniLM-L6-v2
   b. Queries ChromaDB: top 3 similar construction knowledge chunks
   c. Checks has_history (len(history) > 0)
   d. Builds system message with memory awareness instruction
   e. Constructs LangChain message list:
      [SystemMessage, HumanMessage, AIMessage, ..., HumanMessage(current)]
   f. Invokes Groq LLM (multi-turn message list)
   g. Returns response string
8. Backend returns { response: "...", success: true }
9. Frontend appends AI message to messages state
10. localStorage updated automatically via useEffect
```

#### Clear Chat Process

```
1. User clicks "Clear Chat"
2. Frontend resets messages to [fresh INITIAL_MESSAGE with new id]
3. localStorage updated
4. Next chat request sends history: []
5. Backend detects has_history = False
6. System prompt instructs model: "Fresh session, NO memory of prior messages"
```

---

### 2.3 Information Flow

#### Report Generation — Information Flow

```
[Browser Form Data]
  projectName, projectNumber, date, location,
  contractor, weather, reportType, topic, tone, length
        │
        ▼ HTTP POST (JSON)
[FastAPI /generate-report]
        │
        ▼ topic text
[HuggingFace Embeddings]  ──→  vector representation
        │
        ▼ vector query (k=3)
[ChromaDB]  ──→  top 3 relevant construction knowledge chunks
        │
        ▼ project fields + tone/length mappings + topic + context chunks
[Prompt Builder]  ──→  structured markdown prompt string
        │
        ▼ prompt string
[Groq API — LLaMA 3.3 70B]  ──→  markdown report string
        │
        ▼ HTTP Response (JSON)
[Frontend]
        │
        ├──▶ ReportRenderer (display)
        ├──▶ localStorage (persist)
        └──▶ Download handlers (PDF / DOCX / TXT)
```

#### Chat — Information Flow

```
[User Message + Conversation History]
        │
        ▼ HTTP POST (JSON)
[FastAPI /chat]
        │
        ▼ current message text
[HuggingFace Embeddings]  ──→  vector representation
        │
        ▼ vector query (k=3)
[ChromaDB]  ──→  top 3 relevant construction knowledge chunks
        │
        ▼ system prompt + RAG context + history turns + current message
[LangChain Message Builder]
  [SystemMessage]
  [HumanMessage] ← history turn 1
  [AIMessage]    ← history turn 2
  ...
  [HumanMessage] ← current message
        │
        ▼ message list
[Groq API — LLaMA 3.3 70B]  ──→  AI response string
        │
        ▼ HTTP Response (JSON)
[Frontend]
        ├──▶ Appended to messages state
        └──▶ Persisted to localStorage
```

---

### 2.4 Components Design

The system is split into three clear layers: **Frontend**, **Backend**, and **AI Pipeline**. Below is the full component map followed by a breakdown of each major component.

---

#### Project Structure

```
construction-ai/
├── backend/
│   ├── main.py            # FastAPI app — routes, CORS, Pydantic models
│   ├── rag.py             # ConstructionRAG — LLM, embeddings, vector search
│   ├── ingest_docs.py     # One-time script to populate ChromaDB
│   ├── requirements.txt   # Python dependencies
│   ├── .env               # GROQ_API_KEY
│   └── chroma_db/         # Persisted vector store (auto-created on ingest)
│
└── frontend/
    ├── index.html         # HTML shell
    ├── package.json       # npm deps and scripts
    └── src/
        ├── main.tsx       # React DOM root
        ├── App.tsx        # BrowserRouter + 4 Routes
        ├── pages/
        │   ├── Home.tsx         # Landing — hero + feature cards
        │   ├── NewReport.tsx    # Form + generation + output + download
        │   ├── Chat.tsx         # AI chat with session memory
        │   └── History.tsx      # Report list, viewer, delete, download
        ├── components/
        │   ├── Layout.tsx       # Sidebar + main content shell
        │   ├── Sidebar.tsx      # Fixed floating nav dock
        │   ├── ReportRenderer.tsx  # Shared react-markdown renderer
        │   ├── Toast.tsx        # Notifications + useToast hook
        │   └── Icons.tsx        # 33 inline SVG components
        ├── styles/              # All css files 
        └── utils/
            ├── storage.ts       # localStorage CRUD for reports
            └── wordExport.ts    # Markdown → .docx converter
```

---

#### Frontend Components

- `App.tsx` — `BrowserRouter` + 4 `<Route>` definitions, wrapped in `Layout`
- `Layout.tsx` — `Sidebar` + `<Outlet>` side-by-side via CSS grid
- `Sidebar.tsx` — Fixed dock, `NavLink` active state, hover tooltips
- `Home.tsx` — Hero + 3 feature cards (`#F97316` / `#0EA5E9` / `#8B5CF6`)
- `NewReport.tsx` — Form → 6-stage progress bar → `POST /generate-report` → `ReportRenderer` + `localStorage` save + PDF/DOCX/TXT/Copy download
- `Chat.tsx` — `messages.slice(1)` as `history` per request; `useEffect` → `localStorage`; Clear Chat → `history: []`
- `History.tsx` — Card grid; real-time search; confirm-overlay delete; download dropdown; 2-col detail viewer
- `ReportRenderer.tsx` — `react-markdown` + `remark-gfm` → renders tables, bold, lists, code
- `Toast.tsx` / `useToast` — Fixed top-center, slide-in, 3s auto-dismiss, success/error/info
- `Icons.tsx` — 33 inline SVG components, color via CSS `currentColor`

#### Backend Components

- `main.py` — CORS middleware, Pydantic request/response models, route handlers — delegates all logic to `ConstructionRAG`
- `ConstructionRAG` (`rag.py`) — Singleton: `ChatGroq` (llama-3.3-70b, temp=0.1) + `HuggingFaceEmbeddings` (all-MiniLM-L6-v2) + `Chroma` (persistent)
- `generate_report()` — `embed(topic)` → `similarity_search(k=3)` → `PromptTemplate` → `llm.invoke(str)` → markdown
- `chat()` — `embed(msg)` → `similarity_search(k=3)` → `[SystemMessage, *history, HumanMessage]` → `llm.invoke(list)` → str
- `ingest_docs.py` — One-time script: splits 6 docs (`chunk=1000, overlap=200`) → `Chroma.from_documents()` → `./chroma_db`

#### Utility Modules

- `storage.ts` — `saveReport`, `getReports`, `deleteReport`, `getReportById`, `clearAllReports`; all ops JSON parse/stringify `SavedReport[]` under key `construction_reports`
- `wordExport.ts` — `exportToDocx(content, title, subtitle, filename)`; line-by-line markdown parser → `docx` AST (Table / Heading2 / Bullet / TextRun) → `Packer.toBlob()` → `saveAs()`

---

### 2.5 Key Design Considerations

1. **Stateless backend** — No server-side session; `history[]` sent client-side per request
2. **RAG grounding** — ChromaDB top-3 chunks injected per request to reduce hallucination
3. **`temperature=0.1`** — Near-deterministic output for factual, consistent reports
4. **`localStorage` only** — No backend DB for MVP; tradeoff is browser-local storage
5. **Singleton `ConstructionRAG`** — Avoids reloading 90MB embedding model + ChromaDB index per request
6. **Markdown output** — Single LLM format consumed by `react-markdown`, `jsPDF`, and `docx` independently
7. **No Redux/Zustand** — All state is page-local; cross-page data via `localStorage` utils
8. **`messages[0]` excluded from history** — Greeting never sent to backend; prevents model treating it as a user turn

---

### 2.6 API Catalogue

**Base URL:** `http://localhost:8000`

| # | Method | Endpoint | Description | Auth |
|---|--------|----------|-------------|------|
| 1 | GET | `/` | Root health check | None |
| 2 | GET | `/health` | Service health status | None |
| 3 | POST | `/generate-report` | Generate AI report from form data | None |
| 4 | POST | `/chat` | Chat with AI, supports conversation history | None |
| 5 | GET | `/report-types` | List available report type strings | None |

---

**`POST /generate-report`**

Request body:
```json
{
  "project_name": "string (required)",
  "project_number": "string (optional, default: \"\")",
  "date": "string (required, ISO date)",
  "location": "string (required)",
  "contractor": "string (required)",
  "weather": "string (optional, default: \"\")",
  "report_type": "string (required)",
  "topic": "string (required)",
  "tone": "\"formal\" | \"standard\" | \"detailed\" (default: \"standard\")",
  "length": "\"brief\" | \"standard\" | \"detailed\" (default: \"detailed\")",
  "include_safety": "boolean (default: true)",
  "include_materials": "boolean (default: true)",
  "include_photos": "boolean (default: true)"
}
```

Success response `200`:
```json
{
  "report": "## Daily Site Report\n\n...",
  "success": true,
  "message": "Report generated successfully"
}
```

Error response `500`:
```json
{ "detail": "error description string" }
```

---

**`POST /chat`**

Request body:
```json
{
  "message": "string (required)",
  "history": [
    { "role": "user", "content": "string" },
    { "role": "assistant", "content": "string" }
  ]
}
```

`history` is optional. Empty array `[]` or omitted = fresh session, no prior memory.

Success response `200`:
```json
{
  "response": "string (AI reply)",
  "success": true
}
```

---

## 3. Data Design

### 3.1 Data Model

ConstructionGen uses two data stores: **browser localStorage** for user-generated content, and **ChromaDB** for the AI knowledge base.

#### localStorage — `SavedReport`

```
SavedReport {
  id          : string    — Date.now().toString(), unique identifier
  projectName : string    — from form input
  projectNumber: string   — from form input
  date        : string    — ISO date string (YYYY-MM-DD)
  location    : string    — from form input
  contractor  : string    — from form input
  reportType  : string    — always "Daily Site Report" in current version
  topic       : string    — user's site activity description
  content     : string    — raw markdown string returned by AI
  createdAt   : string    — ISO timestamp of when report was saved
}
```

Stored as: `localStorage['construction_reports']` → JSON array of `SavedReport[]`, newest first (prepended on save).

#### localStorage — Chat Messages

```
Message {
  id        : number    — Date.now() or Date.now()+1
  text      : string    — message content
  sender    : "user" | "ai"
  timestamp : Date      — serialized as ISO string, re-hydrated on load
}
```

Stored as: `localStorage['chatMessages']` → JSON array of `Message[]`.

#### ChromaDB — Construction Knowledge Documents

```
Document {
  page_content : string    — text chunk (max 1000 chars)
  metadata     : {
    type        : string   — "template" | "guidelines" | "glossary" |
                             "best_practices" | "standards" | "requirements"
    report_type : string   — e.g. "daily_site_report", "safety_inspection"
    category    : string   — e.g. "terminology", "quality_control"
  }
}
```

6 source documents → split into chunks → embedded → stored in `./chroma_db` (SQLite + binary index files).

ChromaDB internal files:
```
chroma_db/
├── chroma.sqlite3                          — metadata, document text, collection info
└── {collection-uuid}/
    ├── data_level0.bin                     — HNSW index vectors
    ├── header.bin                          — index header
    ├── length.bin                          — vector lengths
    └── link_lists.bin                      — HNSW graph links
```

---

### 3.2 Data Access Mechanism

#### localStorage Access (Frontend)

All localStorage operations are centralized in `src/utils/storage.ts`:

| Operation | Function | Mechanism |
|-----------|----------|-----------|
| Save report | `saveReport(report)` | `JSON.parse` → prepend → `JSON.stringify` → `setItem` |
| Load all reports | `getReports()` | `getItem` → `JSON.parse` → return array |
| Delete report | `deleteReport(id)` | `getReports()` → `.filter()` → `setItem` |
| Get by id | `getReportById(id)` | `getReports()` → `.find()` |
| Clear all | `clearAllReports()` | `setItem('construction_reports', '[]')` |

Chat messages are accessed directly in `Chat.tsx` via `localStorage.getItem/setItem('chatMessages')` with `useEffect` for persistence on every state change.

#### ChromaDB Access (Backend)

ChromaDB is accessed exclusively through LangChain's `Chroma` wrapper in `ConstructionRAG`:

```python
# Similarity search — used in both generate_report() and chat()
context_docs = self.vectorstore.similarity_search(query_text, k=3)
# Returns List[Document] — top 3 most semantically similar chunks
```

The embedding model (`all-MiniLM-L6-v2`) converts the query text to a 384-dimensional vector. ChromaDB uses HNSW (Hierarchical Navigable Small World) approximate nearest-neighbor search to find the closest stored vectors.

#### Groq API Access (Backend)

```python
# Single-turn (report generation)
response = self.llm.invoke(formatted_prompt_string)

# Multi-turn (chat)
response = self.llm.invoke([SystemMessage, HumanMessage, AIMessage, ..., HumanMessage])

# Both return: response.content (string)
```

---

### 3.3 Data Retention Policies

| Data | Storage | Retention | Deletion Mechanism |
|------|---------|-----------|-------------------|
| Saved reports | localStorage | Indefinite until user action | `deleteReport(id)` per report, or `clearAllReports()` |
| Chat messages | localStorage | Indefinite until user action | "Clear Chat" button resets to greeting only |
| ChromaDB knowledge | Local disk `./chroma_db` | Permanent (static knowledge base) | Manual deletion of `chroma_db/` directory |
| API request/response | In-memory only | Request lifetime only | Garbage collected after response |
| LLM conversation history | In-memory (browser) | Browser session + localStorage | Cleared on "Clear Chat" |

No server-side logs, no database, no cloud storage. All user data remains on the client device.

---

### 3.4 Data Migration

**Current version:** No formal migration mechanism exists. The system is a single-user, browser-local MVP.

**localStorage schema changes:** If the `SavedReport` schema changes in a future version (e.g., adding new fields), existing localStorage data will still parse correctly because:
- `JSON.parse` does not fail on missing fields
- TypeScript interfaces use optional fields where appropriate
- New fields would default to `undefined` for old records

**ChromaDB re-ingestion:** If the knowledge base documents are updated, the `chroma_db/` directory must be deleted and `ingest_docs.py` re-run. There is no incremental update mechanism in the current version.

**Future migration path (if multi-user is added):**
- Replace localStorage with a backend database (PostgreSQL or MongoDB)
- Add a migration script to export localStorage JSON and import into the database
- Add user authentication (JWT or OAuth) before database migration

---

## 4. Interfaces

### 4.1 User Interface

The UI is a React SPA with a fixed floating sidebar dock and a main content area. Light theme only — no dark mode.

**Navigation Interface:**
- Fixed vertical dock on the left (`position: fixed; left: 16px; top: 50%; transform: translateY(-50%)`)
- 4 icon-only nav buttons with hover tooltips
- Active route highlighted with colored dot indicator
- Responsive: moves to bottom horizontal bar on mobile (`max-width: 768px`)

**Page Interfaces:**

| Page | Primary Interface Elements |
|------|---------------------------|
| Home | Hero section, 3 clickable feature cards, 2 CTA buttons |
| New Report | 8-field form grid, textarea with placeholder, tone/length selects, generate button, progress bar, report output with download actions |
| Chat | Message list, typing indicator, fixed bottom input bar, suggested question chips (on fresh chat), clear chat button |
| History | Search input, 3-column report card grid, download dropdown, delete confirm overlay, 2-column report detail viewer |

**Notification Interface:**
- `Toast` component: fixed top-center, slides in from above, auto-dismisses after 3 seconds
- Types: success (green), error (red), info (blue)
- Used for: report generated, report copied, report deleted, file downloaded

**Confirmation Interface:**
- Full-screen backdrop overlay with `backdrop-filter: blur(4px)`
- Centered dialog with scale-in animation
- Used exclusively for destructive delete action — no `window.confirm()` anywhere

---

### 4.2 Backend API Interface

The frontend communicates with the backend via HTTP REST. All requests and responses use `Content-Type: application/json`.

**Base URL:** `http://localhost:8000`

**CORS Policy:**
- Allowed origins: `http://localhost:5173`, `http://localhost:3000`
- Allowed methods: all (`*`)
- Allowed headers: all (`*`)
- Credentials: allowed

**Error Handling:**
- All route handlers are wrapped in `try/except`
- Exceptions raise `HTTPException(status_code=500, detail=str(e))`
- Frontend catches fetch errors and displays inline error messages or error toast

---

### 4.3 External API Interface — Groq

**Provider:** Groq Cloud  
**Model:** `llama-3.3-70b-versatile`  
**Authentication:** API key via `GROQ_API_KEY` environment variable  
**Protocol:** HTTPS REST (abstracted by LangChain `ChatGroq`)

**Configuration:**
```
temperature : 0.1     (near-deterministic, factual)
max_tokens  : 4096    (sufficient for detailed reports)
```

**Invocation modes:**
- Single string prompt → used for report generation
- List of LangChain message objects → used for multi-turn chat

**Failure handling:** If Groq API is unavailable or returns an error, the exception propagates to FastAPI's exception handler and returns HTTP 500 to the frontend.

---

### 4.4 External Interface — HuggingFace Embeddings

**Model:** `sentence-transformers/all-MiniLM-L6-v2`  
**Output:** 384-dimensional dense vectors  
**Loading:** Downloaded on first run, cached locally by HuggingFace  
**Usage:** Converts text to vectors for ChromaDB similarity search  
**Authentication:** Unauthenticated (public model, rate-limited without HF_TOKEN)

---

### 4.5 File Export Interfaces

| Format | Library | Mechanism |
|--------|---------|-----------|
| PDF | jsPDF (dynamically imported) | Strips markdown, renders text line-by-line with page break detection, triggers `doc.save()` |
| Word (.docx) | docx + file-saver | Parses markdown to docx AST (Paragraph, Table, TextRun), `Packer.toBlob()` → `saveAs()` |
| TXT | Native Blob API | Strips markdown symbols, creates `Blob`, triggers `<a>` click download |

---

## 5. State and Session Management

### 5.1 Frontend State Architecture

ConstructionGen uses **local React component state** exclusively — no global state manager (no Redux, no Zustand, no Context API for shared state).

**State distribution:**

| State | Owner Component | Type | Scope |
|-------|----------------|------|-------|
| Form field values | `NewReport` | `useState<ReportData>` | Page lifetime |
| Generated report markdown | `NewReport` | `useState<string>` | Page lifetime |
| Generation loading flag | `NewReport` | `useState<boolean>` | Request lifetime |
| Progress bar value + message | `NewReport` | `useState<number/string>` | Request lifetime |
| Inline error message | `NewReport` | `useState<string>` | Page lifetime |
| Chat messages array | `Chat` | `useState<Message[]>` | Persisted to localStorage |
| Chat input value | `Chat` | `useState<string>` | Keystroke lifetime |
| Chat loading flag | `Chat` | `useState<boolean>` | Request lifetime |
| Suggested questions | `Chat` | `useState<string[]>` | Component mount (random, fixed) |
| Saved reports list | `History` | `useState<SavedReport[]>` | Loaded from localStorage on mount |
| Search term | `History` | `useState<string>` | Page lifetime |
| Selected report (viewer) | `History` | `useState<SavedReport \| null>` | Page lifetime |
| Download menu open id | `History` | `useState<string \| null>` | Click lifetime |
| Confirm delete id | `History` | `useState<string \| null>` | Click lifetime |
| Toast state | `useToast` hook | `useState<{message,type} \| null>` | 3 seconds |

---

### 5.2 Session Management

**Backend sessions:** None. The FastAPI backend is fully stateless. No cookies, no JWT tokens, no server-side session store. Every HTTP request is independent.

**Chat session memory:** Managed entirely on the frontend. The `messages` array in `Chat.tsx` is the session. On every send, `messages.slice(1)` (all messages except the greeting) is serialized and sent to the backend as the `history` field. The backend reconstructs the conversation context from this array on each request.

**Session persistence:** Chat messages are persisted to `localStorage['chatMessages']` via `useEffect` on every state change. On page reload or navigation, messages are re-loaded from localStorage, so the chat session survives browser navigation within the same browser.

**Session reset:** Clicking "Clear Chat" replaces the messages array with a single fresh greeting message and updates localStorage. The next API call sends `history: []`, and the backend system prompt explicitly tells the model it has no memory of prior exchanges.

**Report session:** Generated reports are not kept in component state across navigation. If the user navigates away from `/new-report`, the generated report is lost from view (but already saved to localStorage history). The user can retrieve it from `/history`.

---

### 5.3 localStorage Persistence Strategy

```
Key: 'construction_reports'
Value: JSON.stringify(SavedReport[])
Updated: on every saveReport() or deleteReport() call
Read: on History page mount via getReports()

Key: 'chatMessages'
Value: JSON.stringify(Message[])
Updated: useEffect triggered on every messages state change in Chat.tsx
Read: useState initializer in Chat.tsx (lazy initial state)
```

Timestamps in `Message` objects are serialized as ISO strings and re-hydrated as `new Date(msg.timestamp)` on load to restore the `Date` type.

---

## 6. Caching

### 6.1 Frontend Caching

| Data | Cache Mechanism | Duration | Invalidation |
|------|----------------|----------|-------------|
| Saved reports | `localStorage['construction_reports']` | Permanent | Manual delete or `clearAllReports()` |
| Chat messages | `localStorage['chatMessages']` | Permanent | "Clear Chat" button |
| Suggested questions | `useState` (random on mount) | Component lifetime | Page reload / remount |
| jsPDF library | Browser module cache (dynamic import) | Browser session | Browser cache clear |

The React SPA itself (JS bundles, CSS, assets) is cached by the browser according to standard HTTP cache headers set by Vite's dev server or production build output.

---

### 6.2 Backend Caching

| Component | Cache Mechanism | Notes |
|-----------|----------------|-------|
| `ConstructionRAG` instance | In-memory (module-level singleton) | Created once at startup, reused for all requests |
| HuggingFace embedding model | HuggingFace local model cache (`~/.cache/huggingface`) | Downloaded once, loaded from disk on subsequent startups |
| ChromaDB vector index | On-disk (`./chroma_db`) | Loaded into memory on `Chroma()` init, persisted to disk |
| Groq API responses | Not cached | Every request hits Groq API fresh |

**ChromaDB HNSW index** is loaded into memory when `ConstructionRAG.__init__()` runs. Subsequent similarity searches operate on the in-memory index — no disk I/O per query.

**No HTTP-level caching** is implemented for API responses. Report generation and chat responses are always freshly generated — caching LLM outputs would be inappropriate given the variability of user inputs.

---

### 6.3 Embedding Model Loading

The `all-MiniLM-L6-v2` model (~90MB) is downloaded from HuggingFace Hub on first run and cached at `~/.cache/huggingface/hub/`. On subsequent server starts, it loads from the local cache — no network request needed. This is handled transparently by the `sentence-transformers` library.

---

## 7. Non-Functional Requirements

### 7.1 Security Aspects

#### API Key Management

The Groq API key is stored in a `.env` file on the backend server and loaded via `python-dotenv`. It is never exposed to the frontend or included in any HTTP response. The `.env` file is listed in `.gitignore` and must not be committed to version control.

```
Risk: API key exposure in source code
Mitigation: Environment variable only, .env excluded from git
```

#### CORS Policy

The backend restricts cross-origin requests to known frontend origins (`localhost:5173`, `localhost:3000`). In a production deployment, this list must be updated to the actual deployed frontend domain.

```
Risk: Unauthorized cross-origin API access
Mitigation: Explicit CORS origin whitelist in FastAPI middleware
```

#### Input Handling

- All user inputs pass through Pydantic model validation on the backend. Unexpected fields are ignored; required fields are type-checked.
- The LLM system prompt explicitly instructs the model to only generate construction-related content and to decline off-topic requests.
- No SQL or shell commands are constructed from user input — no injection attack surface.

```
Risk: Prompt injection (user crafts input to override system prompt)
Mitigation: System prompt uses strict rules; temperature=0.1 reduces creative deviation;
            RAG context is labeled to prevent confusion with user input
```

#### Data Privacy

- All user-generated reports and chat history are stored exclusively in the user's browser localStorage.
- No user data is sent to any server other than the local FastAPI backend.
- The local backend sends only the prompt text (which includes user-provided project details) to the Groq API. Users should be aware that project details in the topic field are transmitted to Groq's servers for inference.

```
Risk: Sensitive project data transmitted to Groq Cloud
Mitigation: Users should avoid including confidential project identifiers in the topic field
            Future: self-hosted LLM option (e.g., Ollama) would eliminate this risk
```

#### No Authentication

The current version has no user authentication. The API is open to any client that can reach `localhost:8000`. This is acceptable for a local development/demo deployment but must be addressed before any public deployment.

```
Risk: Unauthorized API access in networked environments
Mitigation (future): Add API key authentication or OAuth before public deployment
```

---

### 7.2 Performance Aspects

#### LLM Inference Latency

Groq provides significantly faster inference than comparable cloud providers for LLaMA models. Typical response times:

| Operation | Expected Latency |
|-----------|-----------------|
| Report generation (detailed) | 3–8 seconds |
| Report generation (brief) | 1–3 seconds |
| Chat response | 1–4 seconds |

The frontend manages perceived performance with:
- 6-stage animated progress bar during report generation (800ms per stage)
- Typing indicator (3 bouncing dots) during chat response wait

#### Embedding + Vector Search

ChromaDB similarity search on the local 6-document knowledge base is near-instantaneous (<50ms). The embedding model inference (converting query text to vector) adds ~100–200ms on first call after model load, and is faster on subsequent calls due to model being in memory.

#### Frontend Rendering Performance

- `react-markdown` renders markdown to React elements — for reports up to 700+ words this is imperceptible
- The report content area has `max-height: 700px` with overflow scroll to prevent layout reflow on large reports
- `jsPDF` is dynamically imported (`import('jspdf')`) — only loaded when the user clicks PDF download, keeping initial bundle size smaller
- Chat messages use `useRef` + `scrollIntoView` for smooth auto-scroll to latest message

#### localStorage Performance

localStorage operations are synchronous and block the main thread. For the data volumes in this application (tens of reports, hundreds of chat messages), this is not a concern. If report count grows to thousands, `getReports()` (which parses the full array) could become slow — at that point, IndexedDB would be the appropriate upgrade.

#### Bundle Size

Key dependencies and their approximate contribution to bundle size:

| Dependency | Approx. Size |
|------------|-------------|
| React + React DOM | ~130KB |
| react-router-dom | ~25KB |
| react-markdown + remark-gfm | ~80KB |
| docx | ~200KB |
| file-saver | ~5KB |
| jsPDF (lazy loaded) | ~300KB |
| recharts (installed, unused in nav) | ~200KB |

Total estimated initial bundle: ~450KB (excluding jsPDF which is lazy). This is acceptable for a professional web application.

#### Scalability Considerations

The current architecture is single-user, single-instance. For multi-user scaling:

| Bottleneck | Current | Scaled Solution |
|------------|---------|----------------|
| LLM inference | Groq API (rate-limited per key) | Multiple API keys or self-hosted LLM |
| Vector search | Single ChromaDB instance | Shared ChromaDB or cloud vector DB (Pinecone, Weaviate) |
| Report storage | localStorage (per browser) | Backend database (PostgreSQL) |
| Backend | Single Uvicorn process | Multiple workers (`uvicorn --workers N`) or containerized deployment |

---

## 8. References

| # | Reference | Description |
|---|-----------|-------------|
| 1 | [FastAPI Documentation](https://fastapi.tiangolo.com/) | Python web framework used for the backend API |
| 2 | [LangChain Documentation](https://python.langchain.com/docs/) | LLM orchestration framework — prompts, chains, message types |
| 3 | [Groq API Documentation](https://console.groq.com/docs/) | LLM inference provider — llama-3.3-70b-versatile |
| 4 | [ChromaDB Documentation](https://docs.trychroma.com/) | Local persistent vector store for RAG |
| 5 | [HuggingFace sentence-transformers](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) | Embedding model — all-MiniLM-L6-v2 |
| 6 | [React Documentation](https://react.dev/) | Frontend UI framework |
| 7 | [React Router v6](https://reactrouter.com/en/main) | Client-side routing for the SPA |
| 8 | [react-markdown](https://github.com/remarkjs/react-markdown) | Markdown rendering in React |
| 9 | [remark-gfm](https://github.com/remarkjs/remark-gfm) | GitHub Flavored Markdown plugin (tables, strikethrough) |
| 10 | [docx npm package](https://docx.js.org/) | Programmatic Word document generation |
| 11 | [jsPDF](https://github.com/parallax/jsPDF) | Client-side PDF generation |
| 12 | [file-saver](https://github.com/eligrey/FileSaver.js) | Client-side file download utility |
| 13 | [Vite](https://vitejs.dev/) | Frontend build tool and dev server |
| 14 | [Pydantic v2](https://docs.pydantic.dev/) | Data validation for FastAPI request/response models |
| 15 | [HNSW Algorithm](https://arxiv.org/abs/1603.09320) | Approximate nearest-neighbor search used by ChromaDB |
| 16 | [RAG — Lewis et al. 2020](https://arxiv.org/abs/2005.11401) | Original Retrieval-Augmented Generation paper |
| 17 | LLD Report — `construction-ai/LLD.md` | Low Level Design document for this project |
| 18 | GenAI Documentation — `construction-ai/GENAI-DOCUMENTATION.md` | Full code-level documentation for this project |

---

*End of ConstructionGen High Level Design Report*
