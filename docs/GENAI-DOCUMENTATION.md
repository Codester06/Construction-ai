# ConstructionGen — GenAI Project Documentation

> Full-stack AI-powered construction documentation platform.
> Stack: React 18 + TypeScript + Vite | FastAPI + LangChain + Groq LLaMA 3.3 | ChromaDB

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Backend — Architecture & Code](#4-backend)
   - 4.1 [main.py — FastAPI Entry Point](#41-mainpy--fastapi-entry-point)
   - 4.2 [rag.py — ConstructionRAG Class](#42-ragpy--constructionrag-class)
   - 4.3 [ingest_docs.py — Vector DB Population](#43-ingest_docspy--vector-db-population)
   - 4.4 [Environment Setup](#44-environment-setup)
   - 4.5 [Python Dependencies](#45-python-dependencies)
5. [Frontend — Architecture & Code](#5-frontend)
   - 5.1 [Entry Points](#51-entry-points)
   - 5.2 [Routing — App.tsx](#52-routing--apptsx)
   - 5.3 [Layout Shell](#53-layout-shell)
   - 5.4 [Pages](#54-pages)
   - 5.5 [Components](#55-components)
   - 5.6 [Utilities](#56-utilities)
   - 5.7 [Icons](#57-icons)
   - 5.8 [Styling System](#58-styling-system)
6. [API Reference](#6-api-reference)
7. [Complete Data Flows](#7-complete-data-flows)
8. [State Management](#8-state-management)
9. [Key Design Decisions](#9-key-design-decisions)
10. [Build & Config](#10-build--config)
11. [Running the Project](#11-running-the-project)

---

## 1. Project Overview

ConstructionGen is an AI-powered web application for construction professionals. It generates structured Daily Site Reports from a form, and provides a conversational AI assistant with full session memory. The AI is grounded in real construction knowledge via a RAG (Retrieval-Augmented Generation) pipeline, preventing hallucination.

Core features:
- Generate professional Daily Site Reports with tone and length control
- Chat with an AI assistant that remembers the full conversation within a session
- Download reports as PDF, Word (.docx), or plain text
- Browse, view, search, and delete saved reports from local history
- Toast notifications for all user actions — no browser alerts or confirms
- Confirm overlay dialog for destructive actions (delete)

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React + TypeScript | 18.2 / 5.2 |
| Build Tool | Vite | 5.0 |
| Routing | React Router DOM | v6.21 |
| Markdown Rendering | react-markdown + remark-gfm | 10.1 / 4.0 |
| Word Export | docx + file-saver | 9.6 / 2.0 |
| PDF Export | jsPDF | 2.5 |
| Backend Framework | FastAPI + Uvicorn | latest |
| LLM Provider | Groq | llama-3.3-70b-versatile |
| LLM Orchestration | LangChain | latest |
| Vector Store | ChromaDB (local persistent) | latest |
| Embeddings | HuggingFace sentence-transformers | all-MiniLM-L6-v2 |
| Styling | Custom CSS only | no Tailwind, no UI libs |

---

## 3. Project Structure

```
construction-ai/
├── backend/
│   ├── main.py              # FastAPI app — routes, Pydantic models, CORS
│   ├── rag.py               # ConstructionRAG — LLM, embeddings, vector search, prompts
│   ├── ingest_docs.py       # One-time script to populate ChromaDB with construction docs
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # GROQ_API_KEY (not committed)
│   ├── .env.example         # Template
│   └── chroma_db/           # Persisted ChromaDB vector store (auto-created)
│
└── frontend/
    ├── index.html           # HTML shell, sets title + favicon
    ├── package.json         # npm dependencies and scripts
    ├── vite.config.ts       # Vite config — React plugin, port 5173
    ├── tsconfig.json        # TypeScript strict config, ES2020, react-jsx
    └── src/
        ├── main.tsx                   # React DOM root, imports global.css
        ├── App.tsx                    # BrowserRouter + Routes setup
        ├── pages/
        │   ├── Home.tsx               # Landing page — hero + 3 feature cards
        │   ├── NewReport.tsx          # Report form + generation + output + download
        │   ├── Chat.tsx               # AI chat with session memory + suggested questions
        │   └── History.tsx            # Saved reports list, viewer, download, delete
        ├── components/
        │   ├── Layout.tsx             # App shell — Sidebar + main content wrapper
        │   ├── Sidebar.tsx            # Fixed floating nav dock with 4 NavLinks
        │   ├── Header.tsx             # Top header (logo + icon buttons)
        │   ├── ReportRenderer.tsx     # Shared react-markdown renderer for reports
        │   ├── Toast.tsx              # Toast component + useToast hook
        │   └── Icons.tsx              # All SVG icons as React components
        ├── styles/
        │   ├── global.css             # CSS variables, resets, base elements, buttons, cards
        │   ├── layout.css             # Layout shell, main-content padding
        │   ├── sidebar.css            # Floating dock nav, tooltips, active states, responsive
        │   ├── header.css             # Header bar styles
        │   ├── home.css               # Hero, feature cards, CTA buttons
        │   ├── newreport.css          # Form grid, generate button, progress bar, report output
        │   ├── chat.css               # Chat layout, messages, input bar, typing indicator
        │   ├── history.css            # Card grid, viewer, confirm overlay, download menu
        │   └── report-renderer.css    # Scoped markdown report display styles
        └── utils/
            ├── storage.ts             # localStorage CRUD for SavedReport[]
            └── wordExport.ts          # Markdown → .docx converter using docx library
```

---

## 4. Backend

### 4.1 `main.py` — FastAPI Entry Point

Initializes the FastAPI app, configures CORS, creates one shared `ConstructionRAG` instance on startup, and defines all HTTP routes.

**CORS** allows `http://localhost:5173` (Vite) and `http://localhost:3000`.

**Pydantic Models:**

```python
class ReportRequest(BaseModel):
    project_name: str
    project_number: Optional[str] = ""
    date: str
    location: str
    contractor: str
    weather: Optional[str] = ""
    report_type: str
    topic: str
    tone: Optional[str] = "standard"      # "formal" | "standard" | "detailed"
    length: Optional[str] = "detailed"    # "brief" | "standard" | "detailed"
    include_safety: Optional[bool] = True
    include_materials: Optional[bool] = True
    include_photos: Optional[bool] = True

class ReportResponse(BaseModel):
    report: str       # raw markdown string
    success: bool
    message: str

class HistoryMessage(BaseModel):
    role: str         # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[HistoryMessage]] = []   # full conversation so far

class ChatResponse(BaseModel):
    response: str
    success: bool
```

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check — returns app name + status |
| GET | `/health` | Returns `{ status: "healthy" }` |
| POST | `/generate-report` | Generates a report via RAG, returns markdown |
| POST | `/chat` | Chat with AI, accepts full conversation history |
| GET | `/report-types` | Returns list of supported report type strings |

**`/generate-report` handler:**
Calls `rag.generate_report()` with all fields from `ReportRequest`. Returns `ReportResponse` with the markdown string. Raises HTTP 500 on any exception with the error detail.

**`/chat` handler:**
Converts `List[HistoryMessage]` to `List[Dict]` and calls `rag.chat(message, history)`. Returns `ChatResponse`.

---

### 4.2 `rag.py` — ConstructionRAG Class

The core AI engine. Initialized once at server startup.

**`__init__` — Initialization:**

```python
self.llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    groq_api_key=api_key,
    temperature=0.1,    # low = factual, minimal hallucination
    max_tokens=4096,
)

self.embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

self.vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=self.embeddings
)
```

**System Prompt (shared by both methods):**
```
You are a specialized Construction Site Report Generator.
STRICT RULES:
- ONLY generate construction-related content based on the information provided.
- Do NOT invent, assume, or fabricate any details not explicitly given.
- If a field is empty or unknown, write "Not specified" — never guess.
- Use professional construction terminology.
- Be precise, factual, and concise.
- If asked about non-construction topics, politely decline.
EXPERTISE AREAS: site inspections, safety compliance, progress tracking,
quality control, materials, workforce and equipment reporting.
```

---

**`generate_report()` method — step by step:**

1. Runs `self.vectorstore.similarity_search(topic, k=3)` — retrieves top 3 relevant construction knowledge chunks from ChromaDB based on the topic text.
2. Joins retrieved chunks into a `context` string.
3. Maps `tone` to a full instruction string:

| Tone | Instruction |
|------|------------|
| `formal` | Third person, no contractions, regulatory-grade language |
| `standard` | Balanced professional language for internal reporting |
| `detailed` | Thorough, descriptive, explains reasoning behind observations |

4. Maps `length` to a full instruction string:

| Length | Target |
|--------|--------|
| `brief` | Under 300 words, 1-2 sentences per section |
| `standard` | 400-600 words, 3-5 sentences per section |
| `detailed` | 700+ words, full paragraphs per section |

5. Builds a `PromptTemplate` f-string that includes:
   - The system prompt
   - A markdown PROJECT INFORMATION table with all form fields
   - Tone instruction block
   - Length instruction block
   - `{topic}` and `{context}` as template variables
   - Output format rules: `##` headings, `###` sub-headings, markdown tables, `**bold**`, bullet lists, `---` dividers
   - Required sections: Executive Summary, Site Observations, Safety Notes, Materials & Equipment, Recommendations, Next Steps
6. Calls `prompt.format(topic=topic, context=context)` to produce the final string.
7. Calls `self.llm.invoke(formatted_prompt)` — single string invocation.
8. Returns `response.content`.

---

**`chat()` method — step by step:**

```python
def chat(self, message: str, history: List[Dict] = []) -> str:
```

1. Runs `self.vectorstore.similarity_search(message, k=3)` for relevant context.
2. Checks `has_history = len(history) > 0`.
3. Builds `history_note`:
   - If history exists: "Use the conversation history above for follow-up answers."
   - If empty: "This is the START of the conversation. You have NO memory of any previous messages. If the user asks what they said before, tell them this is a fresh session."
4. Builds `system_content` f-string with: system prompt + chat rules + memory note + RAG context. Critically includes: "NEVER use the RELEVANT CONSTRUCTION KNOWLEDGE section to answer questions about what the user said — that is document context, not conversation history."
5. Builds the LangChain message list:
```python
messages_to_send = [SystemMessage(content=system_content)]
for turn in history:
    if turn["role"] == "user":
        messages_to_send.append(HumanMessage(content=turn["content"]))
    else:
        messages_to_send.append(AIMessage(content=turn["content"]))
messages_to_send.append(HumanMessage(content=message))
```
6. Calls `self.llm.invoke(messages_to_send)` — multi-turn message list invocation.
7. Returns `response.content`.

---

### 4.3 `ingest_docs.py` — Vector DB Population

One-time script. Populates ChromaDB with 6 construction knowledge documents:

| # | Document | Type |
|---|----------|------|
| 1 | Daily Site Report Template | Template |
| 2 | Safety Inspection Guidelines (PPE, fall protection, housekeeping, equipment) | Guidelines |
| 3 | Construction Terminology Glossary (foundation, concrete, structural, safety terms) | Reference |
| 4 | Progress Report Best Practices (executive summary, schedule, budget, risks) | Best Practices |
| 5 | Quality Control Inspection Standards (concrete, steel, masonry, waterproofing) | Standards |
| 6 | Incident Report Requirements (immediate actions, root cause, corrective actions) | Requirements |

**Pipeline:**
1. `HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")`
2. `RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)` — splits each doc into overlapping chunks
3. Each chunk becomes a `Document(page_content=chunk, metadata=doc["metadata"])`
4. `Chroma.from_documents(documents, embeddings, persist_directory="./chroma_db")` — embeds and stores all chunks
5. `vectorstore.persist()` — saves to disk

Run once: `python ingest_docs.py`

---

### 4.4 Environment Setup

File: `construction-ai/backend/.env`

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get a free key at [console.groq.com](https://console.groq.com). No quotes around the value.

---

### 4.5 Python Dependencies

```
fastapi           # Web framework
uvicorn           # ASGI server
python-dotenv     # .env file loading
langchain         # LLM orchestration core
langchain-groq    # Groq LLM integration
langchain-chroma  # ChromaDB vector store integration
chromadb          # Local vector database
langchain-huggingface  # HuggingFace embeddings
pydantic          # Data validation (used by FastAPI)
python-multipart  # Form data support
```

---

## 5. Frontend

### 5.1 Entry Points

**`index.html`** — HTML shell. Sets page title, links the SVG favicon (`/thunder-favicon.svg`), and mounts `<div id="root">`.

**`src/main.tsx`** — React DOM root:
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```
Also imports `./styles/global.css` — the only global CSS import. All other CSS files are imported inside their respective component/page files.

---

### 5.2 Routing — `App.tsx`

```tsx
<BrowserRouter>
  <Layout>
    <Routes>
      <Route path="/"            element={<Home />} />
      <Route path="/new-report"  element={<NewReport />} />
      <Route path="/chat"        element={<Chat />} />
      <Route path="/history"     element={<History />} />
    </Routes>
  </Layout>
</BrowserRouter>
```

All 4 routes are wrapped in `<Layout>` which provides the persistent sidebar and main content area.

---

### 5.3 Layout Shell

**`Layout.tsx`:**
```tsx
<div className="layout">
  <div className="layout-body">
    <Sidebar />
    <main className="main-content">
      {children}
    </main>
  </div>
</div>
```

**`layout.css`:**
- `.layout` — `min-height: 100vh`, flex column, subtle radial gradient background
- `.layout-body` — flex row, fills remaining height
- `.main-content` — `flex: 1`, `padding: 48px 48px 48px 100px` — the left padding of 100px clears the floating sidebar dock
- Responsive: at `max-width: 768px`, padding reduces to `var(--spacing-lg)` with `padding-bottom: 100px` to clear the bottom dock

**`Sidebar.tsx`:**
Fixed floating dock positioned vertically centered on the left edge. Uses `position: fixed; left: 16px; top: 50%; transform: translateY(-50%)`.

Contains:
- `.sidebar-header` — `ConstructionIcon` + "ConstructionGen" text label
- `.sidebar-nav` — 4 `NavLink` items (Home, New Report, Chat with AI, History)

Each `NavLink` renders as a 44×44px icon button. React Router's `NavLink` automatically adds `active` class when the route matches.

**Sidebar icon accent colors (by nth-child):**

| Position | Page | Hover/Active Color |
|----------|------|--------------------|
| 1st | Home | `#F97316` orange |
| 2nd | New Report | `#F97316` orange |
| 3rd | Chat with AI | `#0EA5E9` sky blue |
| 4th | History | `#8B5CF6` purple |

Active state shows a 4px colored dot to the right of the icon (`::after` pseudo-element), color matching the accent.

**Tooltip:** Each nav link has a `<span>` label that appears on hover — positioned to the right of the icon, slides in with opacity + scale transition.

**Hover animation:** `transform: translateX(8px) scale(1.1)` — slides right and scales up.

**Responsive (mobile):** At `max-width: 768px`, the sidebar moves to the bottom center (`bottom: 16px; left: 50%; transform: translateX(-50%)`), nav becomes horizontal row, active dot moves to bottom of icon.

---

### 5.4 Pages

#### `Home.tsx`

Landing page. Max width 960px, centered.

**Hero section:**
- Orange badge: `ConstructionIcon` + "AI-Powered" text, `#FFF7ED` background, `#FED7AA` border
- `<h1>` "Welcome to ConstructionGen" — 2.75rem, weight 800
- Subtitle paragraph — max-width 560px
- Two CTA buttons: "Generate a Report" (dark `#2A2420` bg) and "Chat with AI" (white with border)

**Feature cards grid:** 3 columns, each card:
- Uses CSS custom property `--accent` set inline via `style={{ '--accent': f.accent }}`
- On hover: `border-color: var(--accent)`, icon background uses `color-mix(in srgb, var(--accent) 12%, #FFFFFF)`
- Arrow `→` slides right on hover
- Clicking navigates to the card's route

| Card | Accent | Route |
|------|--------|-------|
| New Report | `#F97316` | `/new-report` |
| Chat with AI | `#0EA5E9` | `/chat` |
| History | `#8B5CF6` | `/history` |

**Tagline:** "Built for construction professionals who value speed and accuracy." — italic, muted color.

---

#### `NewReport.tsx`

**State:**
```ts
formData: ReportData        // all form field values
generatedReport: string     // raw markdown from API
loading: boolean            // generation in progress
progress: number            // 0-100 for progress bar
progressMessage: string     // current stage label
error: string               // inline error message
```

**Form fields (in a 4-column grid):**

| Field | Type | Default |
|-------|------|---------|
| Project Name | text | "" |
| Project Number | text | "" |
| Date | date | today (ISO string) |
| Weather | select | "Sunny" (options: Sunny/Cloudy/Rainy/Windy/Snowy) |
| Location | text | "" |
| Contractor | text | "" |
| Tone | select | "standard" (Formal/Standard/Detailed) |
| Length | select | "detailed" (Brief/Standard/Detailed) |
| Site Activity Description | textarea | "" — 7 rows, structured placeholder |

The topic textarea placeholder uses `white-space: pre-line` to show 6 example bullet points:
```
• Work completed: "Poured 45m³ concrete for ground floor slab, Zone B"
• Workers & equipment: "12 workers on site, 1 excavator, 2 concrete mixers"
• Safety: "Toolbox talk held, all PPE compliant, no incidents"
• Materials: "Delivered 200 steel rebar units, stored in Yard C"
• Issues/delays: "Work halted 2hrs due to heavy rain at 14:00"
• Progress: "Foundation 70% complete, on schedule"
```

**`handleGenerate()` flow:**
1. Validates `topic` is not empty — sets inline error if blank
2. Sets `loading = true`, resets progress to 0
3. Starts a `setInterval` every 800ms cycling through 6 progress stages:
   - 15% "Analyzing project details..."
   - 30% "Processing report requirements..."
   - 50% "Generating report content..."
   - 70% "Formatting sections..."
   - 85% "Adding final touches..."
   - 95% "Finalizing report..."
4. POSTs to `http://localhost:8000/generate-report` with all form fields snake_cased
5. On response: clears interval, sets progress to 100%, "Complete!"
6. On success: sets `generatedReport`, calls `saveReport()` to localStorage, shows success toast after 500ms delay, resets progress
7. On error: shows inline error message, resets progress

**Generate button:** `#F97316` orange, hover `#191970` midnight blue, ripple effect via `::before` pseudo-element, disabled state at 50% opacity.

**Progress bar:** 6px height, `#F97316` fill, smooth `width` transition, shown only while `loading`.

**Report output section** (shown after generation):
- `ReportRenderer` component renders the markdown
- Max height 700px with custom scrollbar
- Action buttons: Copy, PDF, Word, TXT, Regenerate

**Download handlers:**
- PDF: dynamically imports `jsPDF`, strips markdown symbols, adds title + subtitle header, handles page breaks
- Word: calls `exportToDocx()` utility
- TXT: strips markdown, creates Blob, triggers `<a>` click download

---

#### `Chat.tsx`

**State:**
```ts
messages: Message[]     // persisted to localStorage
inputMessage: string    // current textarea value
loading: boolean        // waiting for AI response
suggestedQuestions: string[]  // 4 random from pool of 20, set once on mount
```

**`Message` interface:**
```ts
interface Message {
  id: number
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}
```

**Initial message** (id: 1): "Hello! I'm your construction AI assistant. Ask me anything about construction, safety, materials, or best practices!"

**localStorage persistence:** Messages are saved on every state change via `useEffect`. On mount, messages are loaded from `localStorage.getItem('chatMessages')` with timestamps re-hydrated as `new Date()`.

**`handleClearChat()`:**
- Creates a fresh `[{ ...INITIAL_MESSAGE, id: Date.now(), timestamp: new Date() }]`
- Sets messages state and updates localStorage
- Next API call will send `history: []` — backend treats as fresh session

**`handleSend()` flow:**
1. Guards: empty input or loading → return
2. Creates `userMessage` object, appends to messages state
3. Clears input, sets `loading = true`
4. Builds history: `messages.slice(1)` (skips index 0 = greeting regardless of id) mapped to `{ role, content }`
5. POSTs to `http://localhost:8000/chat` with `{ message: inputMessage, history }`
6. On success: appends AI message to state
7. On error: appends error message to state
8. Finally: sets `loading = false`

**Suggested questions pool (20 questions):**
Shuffled on component mount, 4 shown. Displayed only when `messages.length === 1` (just the greeting). Clicking fills the input.

**AI responses** rendered with `<ReactMarkdown remarkPlugins={[remarkGfm]}>` inside `.message-markdown` div.

**User messages** rendered as plain text in `.message-user` styled bubble (light blue `#F0F7FF` background, `#93C5FD` border).

**Typing indicator:** 3 bouncing dots animation while `loading`.

**Input bar:** Fixed position at bottom center, max-width 700px, pill-shaped textarea (52px height, `border-radius: 9999px`), send button overlaid on the right inside the input.

**Enter key:** Sends message. Shift+Enter adds newline.

---

#### `History.tsx`

**State:**
```ts
reports: SavedReport[]
searchTerm: string
selectedReport: SavedReport | null   // null = list view, set = detail view
downloadMenuId: string | null        // which card's download dropdown is open
confirmDeleteId: string | null       // which report's delete confirm is showing
```

**List view:** 3-column card grid. Each card shows:
- Project name (bold, `1rem`)
- Date (muted, right-aligned)
- Three action buttons: View, Download (with dropdown), Delete

**Download dropdown:** Positioned absolutely below the Download button. Shows TXT / PDF / Word options. Closes on selection.

**Delete confirm overlay:**
- Full-screen backdrop with `backdrop-filter: blur(4px)`
- Centered dialog with `popIn` scale animation
- Red trash icon in circular badge
- "Delete Report?" heading + "This action cannot be undone." text
- Cancel + Delete buttons
- On confirm: calls `deleteReport(id)`, reloads reports, closes overlay, shows red toast

**Detail viewer (when `selectedReport` is set):**
- "← Back to List" button
- Two-column layout: 300px sidebar + flexible main panel
- Sidebar: report metadata card (project, date, location, contractor, project #) + download/delete action buttons (stacked vertically)
- Main panel: white card with `#F9F5F0` header (project name + report type subtitle) + scrollable body with `ReportRenderer`

**Search:** Filters by `projectName` or `topic` (case-insensitive `.includes()`).

**Empty state:** Centered icon + "No Reports Yet" + "Generate your first report to see it here!"

---

### 5.5 Components

#### `ReportRenderer.tsx`

Shared markdown renderer used in both `NewReport` and `History`:

```tsx
<div className="report-renderer">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
</div>
```

`remark-gfm` enables GitHub Flavored Markdown: tables, strikethrough, task lists, autolinks.

Scoped styles in `report-renderer.css` handle: headings (uppercase, letter-spacing, border-bottom), tables (alternating row shading, first-column label style), bullet lists (custom `▸` marker), bold, horizontal rules, blockquotes, inline code.

---

#### `Toast.tsx`

**`Toast` component:**
- Fixed position, `top: 28px`, horizontally centered via `left: 50%; transform: translateX(-50%)`
- Slides in from above: `translateY(-20px → 0)` + opacity `0 → 1` on mount
- Auto-dismisses after 3 seconds: opacity + translateY reverse, then `onClose()` called after 300ms transition
- White background, colored border matching type, `border-radius: 12px`, drop shadow
- Circular icon badge (24px) with type color background

| Type | Border/Badge Color | Icon |
|------|--------------------|------|
| success | `#10B981` green | ✓ |
| error | `#EF4444` red | ✕ |
| info | `#0EA5E9` blue | i |

**`useToast` hook:**
```ts
const { showToast, ToastComponent } = useToast();
// Place {ToastComponent} in JSX
// Call showToast('message', 'success' | 'error' | 'info')
```

Internally uses `useState` for `{ message, type } | null`. `showToast` sets state, `hideToast` clears it. `ToastComponent` is either `null` or a `<Toast>` element.

---

#### `Header.tsx`

Top header bar (currently not rendered in Layout — Layout uses Sidebar only). Contains:
- Left: `ConstructionIcon` + "ConstructionGen" h1
- Right: Profile button (`UserIcon`) + Settings button (`SettingsIcon`)

---

### 5.6 Utilities

#### `storage.ts`

All report data is stored in `localStorage` under key `construction_reports` as a JSON array.

**`SavedReport` interface:**
```ts
interface SavedReport {
  id: string           // Date.now().toString()
  projectName: string
  projectNumber: string
  date: string
  location: string
  contractor: string
  reportType: string
  topic: string
  content: string      // raw markdown from AI
  createdAt: string    // ISO timestamp
}
```

**Functions:**

| Function | Signature | Behavior |
|----------|-----------|----------|
| `saveReport` | `(report: Omit<SavedReport, 'id' \| 'createdAt'>) => void` | Prepends new report with auto id + createdAt |
| `getReports` | `() => SavedReport[]` | Parses and returns all reports, empty array if none |
| `deleteReport` | `(id: string) => void` | Filters out by id, saves back |
| `clearAllReports` | `() => void` | Sets to empty array |
| `getReportById` | `(id: string) => SavedReport \| undefined` | Finds by id |

Also exports `Template` interface and template CRUD functions (`saveTemplate`, `getTemplates`, `deleteTemplate`) and `getAnalytics()` — though templates/analytics pages are not currently in the nav.

---

#### `wordExport.ts`

Converts AI-generated markdown to a properly formatted `.docx` file.

**`exportToDocx(content, title, subtitle, filename)`** — async, calls `Packer.toBlob()` then `saveAs()`.

**`parseMarkdownToDocx(content)`** — line-by-line parser returning `(Paragraph | Table)[]`:

| Markdown | docx Output |
|----------|-------------|
| `# text` | `Paragraph` with `HeadingLevel.HEADING_1` |
| `## text` | `Paragraph` with `HeadingLevel.HEADING_2` |
| `### text` | `Paragraph` with `HeadingLevel.HEADING_3` |
| `- text` / `* text` | `Paragraph` with `bullet: { level: 0 }` |
| `\| table \| row \|` | `Table` via `buildTable()` |
| `---` | Empty spacer `Paragraph` |
| `**bold**` inline | `TextRun` with `bold: true` via `parseInlineRuns()` |
| Empty line | Empty `Paragraph` |
| Plain text | `Paragraph` with inline runs |

**`buildTable(tableLines)`:**
- Skips separator rows (lines matching `/^\|[\s\-:|]+\|$/`)
- Distributes column widths evenly as percentage (`5000 / colCount` in fifths-of-percent)
- Row 0 = header: `#F4EFE8` shading, `tableHeader: true`, top border `#6B5D52`
- Even rows: `#FDFAF7` shading
- Odd rows: `#FFFFFF` shading
- Cell padding: 0.05in top/bottom, 0.1in left/right

**Document styles:**
- H1: 36pt bold `#2A2420`, spacing before 320 / after 160
- H2: 28pt bold `#2A2420`, spacing before 240 / after 100
- H3: 24pt bold `#4A3F36`, spacing before 180 / after 80
- Page margins: 1in top/bottom, 1.2in left/right
- Title: 44pt bold `#2A2420`
- Subtitle: 22pt italic `#8B7D6B`

---

### 5.7 Icons

All icons in `Icons.tsx` are inline SVG React components — no icon library dependency. Every icon accepts standard SVG props via `currentColor` for stroke/fill, making them colorable via CSS `color` property.

**Complete icon list:**

| Export Name | Size | Usage |
|-------------|------|-------|
| `ThunderIcon` | 32px | (unused in nav, legacy) |
| `ConstructionIcon` | 32px | Sidebar header, Home hero badge, Home nav |
| `UserIcon` | 24px | Header profile button |
| `SettingsIcon` | 24px | Header settings button |
| `DocumentIcon` | 24px | New Report nav, page header, report output header |
| `HistoryIcon` | 24px | History nav, page header |
| `TemplateIcon` | 24px | (legacy, templates removed) |
| `ChartIcon` | 24px | (legacy, analytics removed) |
| `CalendarIcon` | 20px | Date field label in NewReport form |
| `CopyIcon` | 20px | Copy button in report actions |
| `DownloadIcon` | 20px | Download buttons |
| `EditIcon` | 20px | (available, unused) |
| `RefreshIcon` | 20px | Regenerate button |
| `RocketIcon` | 20px | Generate Report button |
| `SearchIcon` | 20px | Search box in History |
| `TrashIcon` | 20px | Delete buttons, confirm dialog icon |
| `StarIcon` | 20px | (available, unused) |
| `MessageIcon` | 24px | Chat nav, Chat page header |
| `SendIcon` | 20px | Chat send button |
| `FileTextIcon` | 80px | History empty state illustration |
| `BarChartIcon` | 80px | (available, unused) |
| `LayersIcon` | 80px | (available, unused) |
| `BotIcon` | 24px | AI message avatar in Chat |
| `UserCircleIcon` | 24px | User message avatar in Chat |
| `ClipboardIcon` | 32px | (available, unused) |
| `ShieldIcon` | 32px | (available, unused) |
| `TrendingUpIcon` | 32px | (available, unused) |
| `PaletteIcon` | 24px | (available, unused) |
| `CodeIcon` | 24px | (available, unused) |
| `DatabaseIcon` | 24px | (available, unused) |
| `CheckCircleIcon` | 32px | (available, unused) |
| `PackageIcon` | 32px | (available, unused) |
| `ToolIcon` | 32px | (available, unused) |
| `AlertTriangleIcon` | 32px | (available, unused) |

---

### 5.8 Styling System

#### CSS Variables (`global.css` `:root`)

**Colors:**
```css
--color-background: #F5F5F5        /* page background */
--color-surface: #FFFFFF           /* card/panel background */
--color-card: #FFFFFF
--color-card-secondary: #F8F8F8
--color-text-primary: #2A2420      /* dark brown-black */
--color-text-secondary: #6B5D52
--color-text-muted: #8B7D6B
--color-border: #D4C9BA
--color-border-light: #E8DFD0
--color-success: #10B981
--color-warning: #F59E0B
--color-error: #EF4444
--color-accent-primary: #6B5D52
--color-accent-secondary: #8B7D6B
--color-orange: #FF8C42
--color-teal: #4ECDC4
--color-purple: #9B59B6
--color-coral: #FF6B6B
--color-mint: #26DE81
--color-blue: #5DADE2
--color-yellow: #F9CA24
```

**Typography:**
```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
--font-size-xs: 0.72rem
--font-size-sm: 0.8rem
--font-size-base: 0.925rem
--font-size-md: 1rem
--font-size-lg: 1.125rem
--font-size-xl: 1.375rem
--font-size-2xl: 1.75rem
--font-size-3xl: 2.25rem
```

**Spacing:**
```css
--spacing-xs: 4px  |  --spacing-sm: 8px  |  --spacing-md: 16px
--spacing-lg: 24px |  --spacing-xl: 32px |  --spacing-2xl: 48px  |  --spacing-3xl: 64px
```

**Border Radius:**
```css
--radius-sm: 6px  |  --radius-md: 12px  |  --radius-lg: 16px
--radius-xl: 24px |  --radius-full: 9999px
```

**Shadows:**
```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08)
--shadow-md: 0 4px 12px rgba(0,0,0,0.1)
--shadow-lg: 0 8px 24px rgba(0,0,0,0.12)
--shadow-xl: 0 12px 32px rgba(0,0,0,0.15)
--shadow-dock: 0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(42,36,32,0.08)
--shadow-card: 0 4px 16px rgba(0,0,0,0.08)
```

**Transitions:**
```css
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
--transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1)
--transition-bounce: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

#### Global Base Styles

**`body`:** Inter font, `#F5F5F5` background with `linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 50%, #F5F5F5 100%)` fixed attachment. Subtle radial gradient overlays via `body::before` pseudo-element (orange, teal, purple at 2-4% opacity).

**`.btn`:** Pill shape (`border-radius: 9999px`), uppercase, 600 weight, ripple effect via `::before` pseudo-element that expands from center on hover.

**`.btn-primary`:** Dark brown gradient `#6B5D52 → #4A3F36`, lifts on hover.

**`.btn-secondary`:** White background, `#D4C9BA` border, lifts on hover.

**`.btn-outline`:** Transparent, 2px border, fills on hover.

**`.card`:** White, `2px solid #E8DFD0` border, `border-radius: 16px`, lifts 2px on hover.

**`.page-header`:** Flex row, gap 16px. Icon in 44×44px dark square badge (`#2A2420` bg, white icon). Title bold 800 weight. Subtitle muted `#9E8E82`.

**Inputs/Textarea/Select:** 2px `#D4C9BA` border, focus ring `rgba(107,93,82,0.12)`, placeholder `#B0A695`.

---

#### Per-Page CSS Notes

**`newreport.css`:**
- Form grid: 4 columns at full width, responsive to 3 → 2 → 1 at breakpoints 1200px / 900px / 768px
- `.btn-generate`: `#F97316` orange, hover `#191970` midnight blue, min-width 300px
- `.progress-compact`: flex row, 6px bar, `#F97316` fill, animated message label
- `.report-content`: max-height 700px, custom thin scrollbar

**`chat.css`:**
- `.chat-page`: `height: calc(100vh - var(--spacing-2xl) * 2)`, flex column, no overflow
- `.messages-container`: flex column, `gap: 8px`, hidden scrollbar (`scrollbar-width: none`)
- `.message-text`: white bg, `1.5px solid #C4B8AC` border, `border-radius: 16px`
- `.message-user .message-text`: `#F0F7FF` bg, `#93C5FD` border
- `.chat-input-container`: fixed bottom center, max-width 700px, z-index 100
- `.chat-input`: 52px height, pill shape, heavy box-shadow for floating effect
- `.send-btn`: absolute right inside input, 36×36px circle

**`history.css`:**
- `.history-list`: 3-column grid, responsive to 2 → 1
- `.confirm-overlay`: fixed inset, `backdrop-filter: blur(4px)`, z-index 1000
- `.confirm-dialog`: `popIn` scale animation `0.85 → 1`
- `.download-menu`: absolute positioned dropdown, z-index 100

**`sidebar.css`:**
- Sidebar uses `backdrop-filter: blur(20px) saturate(180%)` for frosted glass effect
- `.sidebar-link span` (tooltip): absolute, right of icon, opacity 0 → 1 on hover with scale
- Mobile: sidebar moves to bottom, nav becomes horizontal

**`report-renderer.css`:**
- `h1/h2`: 0.8rem, uppercase, 800 weight, `border-bottom: 2px solid #E8DFD0`
- `h3`: 0.78rem, uppercase, 700 weight
- Tables: `#F4EFE8` header, alternating `#FDFAF7` / `#FFFFFF` rows, first column `#F9F5F0` bg
- Bullet list: custom `▸` marker via `::before`
- Blockquote: left border `#D4C9BA`, italic, `#FDFAF7` bg

---

## 6. API Reference

### `GET /`
```json
{ "message": "Construction Content Generator API", "status": "running" }
```

### `GET /health`
```json
{ "status": "healthy" }
```

### `GET /report-types`
```json
{
  "report_types": [
    "Daily Site Report", "Safety Inspection Report", "Progress Report",
    "Quality Control Report", "Material Inspection Report",
    "Equipment Status Report", "Incident Report"
  ]
}
```

### `POST /generate-report`

**Request:**
```json
{
  "project_name": "Tower Block A",
  "project_number": "PRJ-001",
  "date": "2026-03-23",
  "location": "Downtown Site, Block 4",
  "contractor": "BuildCo Ltd",
  "weather": "Sunny",
  "report_type": "Daily Site Report",
  "topic": "Poured 45m³ concrete for ground floor slab, Zone B. 12 workers on site...",
  "tone": "standard",
  "length": "detailed",
  "include_safety": true,
  "include_materials": true,
  "include_photos": true
}
```

**Response (200):**
```json
{
  "report": "## Daily Site Report\n\n| Field | Details |\n|-------|--------|\n...",
  "success": true,
  "message": "Report generated successfully"
}
```

**Response (500):**
```json
{ "detail": "error message string" }
```

---

### `POST /chat`

**Request:**
```json
{
  "message": "What PPE is required on a construction site?",
  "history": [
    { "role": "user", "content": "Tell me about scaffolding safety" },
    { "role": "assistant", "content": "Scaffolding must be erected by a competent person..." }
  ]
}
```

`history` is optional. When omitted or empty `[]`, the model treats it as a fresh session.

**Response (200):**
```json
{
  "response": "Required PPE on a construction site includes:\n- Hard hat\n- Safety glasses...",
  "success": true
}
```

---

## 7. Complete Data Flows

### Report Generation Flow

```
User fills NewReport form
  │
  ├─ Validates topic is not empty
  │
  ├─ Sets loading=true, starts progress interval (800ms stages)
  │
  ├─ POST http://localhost:8000/generate-report
  │     { project_name, project_number, date, location, contractor,
  │       weather, report_type, topic, tone, length, ... }
  │
  │   FastAPI /generate-report handler
  │     └─ rag.generate_report(all fields)
  │           ├─ vectorstore.similarity_search(topic, k=3)
  │           │     ChromaDB → top 3 relevant construction doc chunks
  │           ├─ Map tone → tone_text instruction string
  │           ├─ Map length → length_text instruction string
  │           ├─ Build PromptTemplate f-string:
  │           │     system_prompt + PROJECT INFO table + tone + length
  │           │     + {topic} + {context} + output format rules
  │           ├─ prompt.format(topic=topic, context=context)
  │           └─ llm.invoke(formatted_prompt_string)
  │                 Groq API → llama-3.3-70b-versatile (temp=0.1)
  │                 → returns markdown string
  │
  ├─ Clears interval, sets progress=100%, "Complete!"
  │
  ├─ Sets generatedReport state → ReportRenderer renders markdown
  │
  ├─ saveReport() → localStorage['construction_reports'] prepend
  │
  └─ showToast('Report generated and saved to history!', 'success')
     After 500ms delay, resets progress bar
```

---

### Chat with Memory Flow

```
User types message → presses Enter or Send button
  │
  ├─ Creates userMessage object, appends to messages state
  │
  ├─ Builds history array:
  │     messages.slice(1)  ← skips index 0 (greeting)
  │     .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant',
  │                  content: m.text }))
  │
  ├─ POST http://localhost:8000/chat
  │     { message: inputMessage, history: [...] }
  │
  │   FastAPI /chat handler
  │     └─ Converts List[HistoryMessage] → List[Dict]
  │     └─ rag.chat(message, history)
  │           ├─ vectorstore.similarity_search(message, k=3)
  │           │     ChromaDB → top 3 relevant construction doc chunks
  │           ├─ has_history = len(history) > 0
  │           ├─ Builds history_note:
  │           │     has_history=True  → "Use conversation history for follow-ups"
  │           │     has_history=False → "Fresh session, NO memory of prior messages"
  │           ├─ Builds system_content:
  │           │     system_prompt + chat rules + memory note + RAG context
  │           │     + "NEVER use RAG context to answer what user said"
  │           ├─ Builds message list:
  │           │     [SystemMessage(system_content),
  │           │      HumanMessage(turn1), AIMessage(turn2), ...,
  │           │      HumanMessage(current_message)]
  │           └─ llm.invoke(messages_list)
  │                 Groq API → multi-turn conversation
  │                 → returns response string
  │
  ├─ Appends AI message to messages state
  │
  └─ localStorage updated via useEffect on messages change
```

---

### Clear Chat Flow

```
User clicks "Clear Chat"
  │
  ├─ Creates fresh: [{ ...INITIAL_MESSAGE, id: Date.now(), timestamp: new Date() }]
  ├─ setMessages(fresh)
  ├─ localStorage.setItem('chatMessages', JSON.stringify(fresh))
  │
  └─ Next message send:
       history = messages.slice(1) = []  ← empty, greeting is index 0
       POST /chat { message, history: [] }
       Backend: has_history = False
       System prompt: "This is the START of the conversation.
                       You have NO memory of any previous messages."
```

---

### Report Download Flow (Word)

```
User clicks "Word" button
  │
  └─ exportToDocx(content, title, subtitle, filename)
        │
        ├─ parseMarkdownToDocx(content)
        │     Line-by-line parser:
        │     ├─ Detects table: line starts with | and next line is separator
        │     │     Collects all table lines → buildTable()
        │     │     buildTable: splits cells, creates Table with TableRow/TableCell
        │     │     Header row: #F4EFE8 shading, bold text
        │     │     Even rows: #FDFAF7, Odd rows: #FFFFFF
        │     ├─ ## → HeadingLevel.HEADING_2
        │     ├─ ### → HeadingLevel.HEADING_3
        │     ├─ - item → bullet Paragraph
        │     ├─ **bold** → parseInlineRuns() → TextRun(bold:true)
        │     ├─ --- → spacer Paragraph
        │     └─ plain text → Paragraph with inline runs
        │
        ├─ Creates Document with:
        │     styles: H1/H2/H3 paragraph styles
        │     sections: page margins 1in/1.2in
        │     children: [title Paragraph, subtitle Paragraph, ...bodyElements]
        │
        ├─ Packer.toBlob(doc) → Blob
        └─ saveAs(blob, filename.docx)
```

---

### Delete Report Flow

```
User clicks Delete button on a report card
  │
  ├─ setConfirmDeleteId(report.id)
  │     → Renders confirm overlay with backdrop blur
  │
  ├─ User clicks "Cancel" → setConfirmDeleteId(null) → overlay closes
  │
  └─ User clicks "Delete"
        ├─ deleteReport(id) → filters localStorage array, saves back
        ├─ loadReports() → refreshes reports state
        ├─ If selectedReport.id === id → setSelectedReport(null) → back to list
        ├─ setConfirmDeleteId(null) → overlay closes
        └─ showToast('Report deleted.', 'error') → red toast
```

---

## 8. State Management

No global state library (no Redux, no Zustand). All state is local React `useState` + `useEffect` + `localStorage`.

| Data | Location | Persistence |
|------|----------|-------------|
| Generated report content | `NewReport` local state | Session only (lost on navigate) |
| Report form values | `NewReport` local state | Session only |
| Saved reports | `localStorage['construction_reports']` | Permanent (until deleted) |
| Chat messages | `Chat` local state + `localStorage['chatMessages']` | Permanent (until Clear Chat) |
| Toast state | `useToast` hook local state | Ephemeral (3s) |
| Confirm delete id | `History` local state | Ephemeral |
| Download menu id | `History` local state | Ephemeral |
| Selected report | `History` local state | Session only |
| Search term | `History` local state | Session only |

---

## 9. Key Design Decisions

**Why Groq + LLaMA 3.3 70B?**
Groq provides extremely fast inference (hundreds of tokens/sec). LLaMA 3.3 70B is a strong open-weight model with excellent instruction-following. `temperature=0.1` keeps outputs factual and deterministic — critical for professional construction reports where fabricated data is dangerous.

**Why RAG with ChromaDB?**
The vector store grounds the LLM in real construction knowledge (templates, safety standards, terminology, best practices). Without RAG, the model relies purely on parametric memory which can hallucinate specific standards or procedures. With RAG, relevant context is retrieved and injected into the prompt.

**Why send full history on every chat request (stateless backend)?**
The backend has no session management or database. Sending history from the frontend on each request is the simplest correct approach — no auth, no server-side sessions, and clearing chat is just resetting the frontend array. The tradeoff is larger request payloads for long conversations, acceptable for this use case.

**Why localStorage for report history?**
No backend database needed for MVP. Reports are stored client-side as JSON. Simple, zero-config, works offline. Tradeoff: data is browser-specific and can be cleared.

**Why custom CSS only?**
Full control over the warm beige/brown/orange design system (`#F8F5F2`, `#F97316`, `#2A2420`). Tailwind utility classes would make it harder to maintain a cohesive custom palette and would add build complexity. CSS variables enable consistent theming across all components.

**Anti-hallucination measures:**
- `temperature=0.1` — near-deterministic outputs
- System prompt explicitly forbids fabricating details
- "Not specified" fallback for all empty fields
- RAG context clearly labeled so model doesn't confuse documents with conversation history
- Fresh session detection: empty history → model told it has no prior memory
- Chat rules: "If not certain, say 'I'm not sure' rather than guessing"

**Why no dark mode?**
Design decision for consistency. The warm light palette is intentional for a professional construction tool. Removing dark mode eliminates a class of CSS complexity and ensures the design is always seen as intended.

---

## 10. Build & Config

**`vite.config.ts`:**
```ts
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})
```

**`tsconfig.json` key settings:**
```json
{
  "target": "ES2020",
  "module": "ESNext",
  "moduleResolution": "bundler",
  "jsx": "react-jsx",
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**`package.json` scripts:**
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

**Key npm dependencies:**
```
react@18.2          react-dom@18.2       react-router-dom@6.21
react-markdown@10.1  remark-gfm@4.0      docx@9.6
file-saver@2.0       jspdf@2.5           recharts@3.8
```

---

## 11. Running the Project

### Backend Setup

```bash
cd construction-ai/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: add GROQ_API_KEY=your_key_here  (no quotes)

# Populate vector database — run ONCE
python ingest_docs.py
# Output: "Successfully ingested construction documents"
# Creates: ./chroma_db/ directory

# Start the API server
uvicorn main:app --reload
# Server runs at: http://localhost:8000
# Auto-reloads on file changes
# API docs at: http://localhost:8000/docs  (FastAPI Swagger UI)
```

### Frontend Setup

```bash
cd construction-ai/frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Runs at: http://localhost:5173

# Build for production
npm run build
# Output in: dist/
```

### Startup Order

1. Start backend first: `uvicorn main:app --reload`
2. Start frontend: `npm run dev`
3. Open `http://localhost:5173`

The frontend hardcodes `http://localhost:8000` as the API base URL in `NewReport.tsx` and `Chat.tsx`. If the backend is not running, report generation and chat will show error messages.

---

*End of ConstructionGen GenAI Documentation*
