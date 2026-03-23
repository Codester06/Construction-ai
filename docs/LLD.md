# LOW LEVEL DESIGN (LLD) REPORT
## ConstructionGen — AI-Powered Construction Documentation System

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 Scope of the Document
   - 1.2 Intended Audience
2. [System Overview](#2-system-overview)
3. [System Design](#3-system-design)
   - 3.1 Architecture Diagram
   - 3.2 UML Class Diagram
   - 3.3 UML Sequence Diagram — Report Generation
   - 3.4 UML Sequence Diagram — Chat with AI
   - 3.5 UML Activity Diagram — Report Generation Flow
4. [Application Design](#4-application-design)
   - 4.1 Process Flow
   - 4.2 Information Flow
   - 4.3 Components Design
5. [LLM Selection & Rationale](#5-llm-selection--rationale)
6. [Approach Toward Solving the Problem Statement](#6-approach-toward-solving-the-problem-statement)
7. [Key Design Considerations](#7-key-design-considerations)
8. [API Catalogue](#8-api-catalogue)
9. [References](#9-references)

---

## 1. Introduction

ConstructionGen is an AI-powered construction documentation platform that enables construction professionals to generate structured site reports and interact with a domain-specific AI assistant. The system combines a Retrieval-Augmented Generation (RAG) pipeline with a modern React frontend and a FastAPI backend to deliver accurate, grounded, and professionally formatted construction reports.

### 1.1 Scope of the Document

This Low Level Design document covers:

- The internal architecture and component breakdown of the ConstructionGen system
- UML diagrams (Class, Sequence, Activity) representing system behaviour
- The overall system architecture diagram
- The LLM selection rationale
- The approach taken to solve the core problem statement
- API contracts between frontend and backend
- Key design decisions made during development

This document does not cover deployment infrastructure, CI/CD pipelines, or user authentication systems.

### 1.2 Intended Audience

- Software developers maintaining or extending the system
- Technical reviewers and evaluators
- System architects reviewing design decisions
- Academic assessors evaluating the project submission

---

## 2. System Overview

ConstructionGen solves a real-world problem faced by construction site managers: the time-consuming and error-prone process of writing daily site reports manually. The system accepts structured project metadata and a natural language description of site activities, then uses an LLM backed by a RAG pipeline to generate a professional, formatted report.

**Core capabilities:**

| Feature | Description |
|---|---|
| Report Generation | AI generates structured Markdown reports from form inputs |
| Chat with AI | Domain-restricted Q&A assistant for construction topics |
| Report History | Persistent local storage of all generated reports |
| Export | Download reports as PDF, Word (.doc), or plain text |
| RAG Pipeline | ChromaDB vector store grounds responses in real construction knowledge |

**Technology Stack:**

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router v6 |
| Styling | Custom CSS with CSS Variables (no Tailwind) |
| Markdown Rendering | react-markdown + remark-gfm |
| Backend | Python 3, FastAPI, Uvicorn |
| LLM | Groq API — LLaMA 3.3 70B Versatile |
| LLM Orchestration | LangChain (langchain-groq) |
| Vector Store | ChromaDB (local persistent) |
| Embeddings | HuggingFace sentence-transformers/all-MiniLM-L6-v2 |
| Storage | Browser localStorage (reports, chat history) |
| PDF Export | jsPDF |

---

## 3. System Design

### 3.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                             │
│                                                                     │
│  ┌──────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────────┐   │
│  │  Home    │  │  NewReport  │  │   Chat   │  │   History     │   │
│  │  Page    │  │    Page     │  │   Page   │  │    Page       │   │
│  └──────────┘  └─────────────┘  └──────────┘  └───────────────┘   │
│        │              │               │                │            │
│        └──────────────┴───────────────┴────────────────┘           │
│                              │                                      │
│                    ┌─────────▼──────────┐                          │
│                    │   React Router v6  │                          │
│                    │   Layout + Sidebar │                          │
│                    └─────────┬──────────┘                          │
│                              │                                      │
│                    ┌─────────▼──────────┐                          │
│                    │   localStorage     │                          │
│                    │  (reports, chat)   │                          │
│                    └────────────────────┘                          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP (fetch API)
                           │ POST /generate-report
                           │ POST /chat
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI — port 8000)                   │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                        main.py                               │  │
│   │   CORS Middleware → Route Handlers → Pydantic Validation     │  │
│   └──────────────────────┬───────────────────────────────────────┘  │
│                          │                                          │
│   ┌──────────────────────▼───────────────────────────────────────┐  │
│   │                   ConstructionRAG (rag.py)                   │  │
│   │                                                              │  │
│   │  ┌─────────────────┐      ┌──────────────────────────────┐  │  │
│   │  │  ChromaDB        │      │   LangChain + Groq LLM       │  │  │
│   │  │  Vector Store    │─────▶│   LLaMA 3.3 70B Versatile    │  │  │
│   │  │  (chroma_db/)    │      │   temperature=0.1            │  │  │
│   │  └─────────────────┘      └──────────────────────────────┘  │  │
│   │                                                              │  │
│   │  ┌─────────────────────────────────────────────────────┐    │  │
│   │  │  HuggingFace Embeddings (all-MiniLM-L6-v2)          │    │  │
│   │  └─────────────────────────────────────────────────────┘    │  │
│   └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS API call
                           ▼
                  ┌─────────────────┐
                  │   Groq Cloud    │
                  │  LLaMA 3.3 70B  │
                  └─────────────────┘
```

---

### 3.2 UML Class Diagram

```
┌──────────────────────────────────────┐
│           ConstructionRAG            │
├──────────────────────────────────────┤
│ - llm: ChatGroq                      │
│ - embeddings: HuggingFaceEmbeddings  │
│ - vectorstore: Chroma                │
│ - system_prompt: str                 │
├──────────────────────────────────────┤
│ + __init__()                         │
│ + generate_report(project_name,      │
│     project_number, date, location,  │
│     contractor, weather, report_type,│
│     topic, tone, length, ...) : str  │
│ + chat(message: str) : str           │
└──────────────────────────────────────┘
                    │ uses
        ┌───────────┴────────────┐
        ▼                        ▼
┌───────────────┐      ┌──────────────────┐
│   ChatGroq    │      │     Chroma       │
├───────────────┤      ├──────────────────┤
│ model: str    │      │ persist_dir: str │
│ temperature   │      │ embedding_fn     │
│ max_tokens    │      ├──────────────────┤
├───────────────┤      │ similarity_search│
│ invoke()      │      │ (query, k) : []  │
└───────────────┘      └──────────────────┘

┌──────────────────────────────────────┐
│           ReportRequest              │
├──────────────────────────────────────┤
│ + project_name: str                  │
│ + project_number: str (optional)     │
│ + date: str                          │
│ + location: str                      │
│ + contractor: str                    │
│ + weather: str (optional)            │
│ + report_type: str                   │
│ + topic: str                         │
│ + tone: str = "standard"             │
│ + length: str = "detailed"           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│           ReportResponse             │
├──────────────────────────────────────┤
│ + report: str                        │
│ + success: bool                      │
│ + message: str                       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│           SavedReport (TS)           │
├──────────────────────────────────────┤
│ + id: string                         │
│ + projectName: string                │
│ + projectNumber: string              │
│ + date: string                       │
│ + location: string                   │
│ + contractor: string                 │
│ + reportType: string                 │
│ + topic: string                      │
│ + content: string                    │
│ + createdAt: string                  │
└──────────────────────────────────────┘
```

---

### 3.3 UML Sequence Diagram — Report Generation

```
User          NewReport.tsx       FastAPI (main.py)     ConstructionRAG       Groq LLM
 │                  │                    │                     │                  │
 │  Fill form &     │                    │                     │                  │
 │  click Generate  │                    │                     │                  │
 │─────────────────▶│                    │                     │                  │
 │                  │ POST /generate-    │                     │                  │
 │                  │ report (JSON body) │                     │                  │
 │                  │───────────────────▶│                     │                  │
 │                  │                    │ validate Pydantic   │                  │
 │                  │                    │ model               │                  │
 │                  │                    │────────────────────▶│                  │
 │                  │                    │                     │ similarity_search│
 │                  │                    │                     │ (topic, k=3)     │
 │                  │                    │                     │─────────────────▶│
 │                  │                    │                     │  [ChromaDB local]│
 │                  │                    │                     │◀─────────────────│
 │                  │                    │                     │ build prompt     │
 │                  │                    │                     │ (system+context  │
 │                  │                    │                     │ +tone+length)    │
 │                  │                    │                     │ llm.invoke()     │
 │                  │                    │                     │─────────────────▶│
 │                  │                    │                     │                  │ LLaMA 3.3 70B
 │                  │                    │                     │                  │ generates
 │                  │                    │                     │◀─────────────────│
 │                  │                    │◀────────────────────│ return content   │
 │                  │◀───────────────────│ ReportResponse      │                  │
 │                  │ setGeneratedReport │                     │                  │
 │                  │ saveReport()       │                     │                  │
 │                  │ → localStorage     │                     │                  │
 │◀─────────────────│                    │                     │                  │
 │  Report rendered │                    │                     │                  │
 │  via             │                    │                     │                  │
 │  ReportRenderer  │                    │                     │                  │
```

---

### 3.4 UML Sequence Diagram — Chat with AI

```
User           Chat.tsx          FastAPI (main.py)    ConstructionRAG      Groq LLM
 │                 │                    │                    │                 │
 │  Type message   │                    │                    │                 │
 │  & press Send   │                    │                    │                 │
 │────────────────▶│                    │                    │                 │
 │                 │ POST /chat         │                    │                 │
 │                 │ { message: str }   │                    │                 │
 │                 │───────────────────▶│                    │                 │
 │                 │                    │ rag.chat(message)  │                 │
 │                 │                    │───────────────────▶│                 │
 │                 │                    │                    │ similarity_     │
 │                 │                    │                    │ search(msg, k=3)│
 │                 │                    │                    │ [ChromaDB]      │
 │                 │                    │                    │ build prompt    │
 │                 │                    │                    │ llm.invoke()    │
 │                 │                    │                    │────────────────▶│
 │                 │                    │                    │◀────────────────│
 │                 │                    │◀───────────────────│                 │
 │                 │◀───────────────────│ ChatResponse       │                 │
 │                 │ append AI message  │                    │                 │
 │                 │ save to            │                    │                 │
 │                 │ localStorage       │                    │                 │
 │◀────────────────│                    │                    │                 │
 │  Response shown │                    │                    │                 │
 │  via ReactMarkdown                   │                    │                 │
```

---

### 3.5 UML Activity Diagram — Report Generation Flow

```
        ┌─────────────────────┐
        │   User opens        │
        │   New Report page   │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  Fill in form:      │
        │  project name,      │
        │  date, location,    │
        │  contractor,        │
        │  weather, tone,     │
        │  length, topic      │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  Click "Generate    │
        │  Report" button     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  topic.trim()       │
        │  empty?             │
        └──────────┬──────────┘
              ┌────┴────┐
             YES        NO
              │          │
        ┌─────▼──┐  ┌────▼────────────────┐
        │ Show   │  │ Show progress bar   │
        │ error  │  │ POST /generate-     │
        └────────┘  │ report              │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │ Backend: validate   │
                    │ Pydantic model      │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │ ChromaDB similarity │
                    │ search (k=3 docs)   │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │ Build prompt with   │
                    │ tone + length       │
                    │ instructions        │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │ Groq LLM invoke     │
                    │ (LLaMA 3.3 70B)     │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │ Response success?   │
                    └────────┬────────────┘
                        ┌────┴────┐
                       YES        NO
                        │          │
               ┌────────▼──┐  ┌───▼──────────┐
               │ Render     │  │ Show error   │
               │ report via │  │ message      │
               │ ReportRenderer  └────────────┘
               └────────┬──┘
                        │
               ┌────────▼──────────┐
               │ saveReport() →    │
               │ localStorage      │
               └────────┬──────────┘
                        │
               ┌────────▼──────────┐
               │ User can Copy /   │
               │ Download (PDF,    │
               │ Word, TXT)        │
               └───────────────────┘
```

---

## 4. Application Design

### 4.1 Process Flow

The system follows a linear request-response flow with no server-side session state. All persistence is handled client-side via `localStorage`.

```
[User Input] → [Form Validation] → [HTTP POST] → [RAG Pipeline]
     → [LLM Generation] → [Markdown Response] → [Render + Save]
```

**Report Generation Process:**
1. User fills the form on `NewReport.tsx` with project metadata and site activity description
2. Client validates that the `topic` field is non-empty
3. A `POST /generate-report` request is sent with a JSON body
4. FastAPI validates the body against `ReportRequest` Pydantic model
5. `ConstructionRAG.generate_report()` performs a vector similarity search on ChromaDB using the topic as query
6. Top 3 matching document chunks are retrieved as context
7. A structured prompt is assembled with tone/length instructions, project info, context, and topic
8. The prompt is sent to Groq's LLaMA 3.3 70B model via LangChain
9. The Markdown response is returned to the frontend
10. `ReportRenderer` renders it using `react-markdown` + `remark-gfm`
11. The report is saved to `localStorage` via `saveReport()`

**Chat Process:**
1. User types a message in `Chat.tsx`
2. `POST /chat` is sent with `{ message: string }`
3. `ConstructionRAG.chat()` retrieves 3 relevant context chunks from ChromaDB
4. A grounded prompt is built with strict "do not fabricate" instructions
5. LLM response is returned and rendered via `ReactMarkdown`
6. Full conversation is persisted in `localStorage`

---

### 4.2 Information Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     INFORMATION FLOW                        │
│                                                             │
│  Form Fields (projectName, date, location, etc.)           │
│       │                                                     │
│       ▼                                                     │
│  ReportRequest JSON payload                                 │
│       │                                                     │
│       ▼                                                     │
│  FastAPI → ConstructionRAG.generate_report()               │
│       │                                                     │
│       ├──▶ ChromaDB.similarity_search(topic, k=3)          │
│       │         └──▶ Returns: List[Document]               │
│       │                                                     │
│       ├──▶ PromptTemplate.format(topic, context)           │
│       │         └──▶ Returns: str (full prompt)            │
│       │                                                     │
│       ├──▶ ChatGroq.invoke(prompt)                         │
│       │         └──▶ Returns: AIMessage.content (Markdown) │
│       │                                                     │
│       ▼                                                     │
│  ReportResponse { report, success, message }               │
│       │                                                     │
│       ▼                                                     │
│  Frontend: setGeneratedReport(data.report)                 │
│       │                                                     │
│       ├──▶ ReportRenderer (react-markdown display)         │
│       └──▶ saveReport() → localStorage                     │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.3 Components Design

#### Frontend Components

| Component | File | Responsibility |
|---|---|---|
| `App` | `App.tsx` | Root router, wraps all pages in `Layout` |
| `Layout` | `Layout.tsx` | Renders `Sidebar` + `main-content` wrapper |
| `Sidebar` | `Sidebar.tsx` | Fixed floating nav dock with 4 route links |
| `Header` | `Header.tsx` | Top bar with app name and branding |
| `ReportRenderer` | `ReportRenderer.tsx` | Renders Markdown string via react-markdown + remark-gfm |
| `Home` | `pages/Home.tsx` | Landing page with hero section and 3 feature cards |
| `NewReport` | `pages/NewReport.tsx` | Report generation form, progress bar, output display |
| `Chat` | `pages/Chat.tsx` | Chat interface with message history, suggestions, clear button |
| `History` | `pages/History.tsx` | Report list with search, view, download, delete |

#### Backend Components

| Component | File | Responsibility |
|---|---|---|
| `FastAPI app` | `main.py` | HTTP server, CORS, route definitions, Pydantic models |
| `ConstructionRAG` | `rag.py` | RAG pipeline: embeddings, vector search, prompt building, LLM call |
| `ChromaDB` | `chroma_db/` | Local persistent vector store for construction knowledge |
| `HuggingFace Embeddings` | `rag.py` | Converts text to vectors using `all-MiniLM-L6-v2` |
| `ChatGroq` | `rag.py` | LangChain wrapper for Groq API calls |
| `ingest_docs.py` | `ingest_docs.py` | One-time script to embed and store construction documents |

#### Storage Layer

| Store | Key | Contents |
|---|---|---|
| `localStorage` | `construction_reports` | Array of `SavedReport` objects |
| `localStorage` | `chatMessages` | Array of `Message` objects for chat history |
| `chroma_db/` | SQLite + bin files | Embedded construction document vectors |

---

## 5. LLM Selection & Rationale

### Selected Model: LLaMA 3.3 70B Versatile via Groq API

| Property | Value |
|---|---|
| Model | `llama-3.3-70b-versatile` |
| Provider | Groq Cloud |
| Temperature | `0.1` |
| Max Tokens | `4096` |
| Orchestration | LangChain (`langchain-groq`) |

### Rationale

**Why LLaMA 3.3 70B?**

- **Size and capability:** At 70 billion parameters, LLaMA 3.3 provides near-GPT-4-level reasoning and instruction following, which is essential for generating structured, multi-section professional reports
- **Instruction adherence:** The model reliably follows complex formatting instructions (Markdown tables, section headings, bullet points) without deviation
- **Low hallucination at low temperature:** At `temperature=0.1`, the model stays close to the provided context and input data, minimising fabrication of project details

**Why Groq?**

- **Inference speed:** Groq's LPU (Language Processing Unit) hardware delivers significantly faster token generation than standard GPU-based providers, resulting in sub-5-second report generation
- **Free tier availability:** Groq provides a generous free API tier suitable for development and demonstration
- **LangChain integration:** `langchain-groq` provides a drop-in replacement for other LangChain LLM providers, making the integration clean and maintainable

**Why not GPT-4 or Gemini?**

| Criterion | GPT-4 | Gemini 2.5 Flash | LLaMA 3.3 70B (Groq) |
|---|---|---|---|
| Speed | Moderate | Fast | Very Fast |
| Cost | High | Moderate | Free tier available |
| Hallucination control | Good | Moderate | Good at low temp |
| Open source | No | No | Yes (Meta) |
| LangChain support | Yes | Yes | Yes |

The combination of speed, cost, and quality made Groq + LLaMA 3.3 70B the optimal choice for this use case.

---

## 6. Approach Toward Solving the Problem Statement

### Problem Statement

Construction site managers spend significant time writing daily site reports manually. These reports must be professional, structured, accurate, and consistent — yet the process is repetitive and error-prone when done by hand.

### Solution Approach

The solution is built around three core design principles:

#### 1. Structured Input → Grounded Output

Rather than asking the LLM to generate a report from a vague prompt, the system collects structured metadata (project name, date, location, contractor, weather) and combines it with a detailed site activity description. This structured input is embedded directly into the prompt, preventing the model from inventing project details.

Prompt engineering rules enforce this:
- "Do NOT invent, assume, or fabricate any details not explicitly given"
- "If a field is empty or unknown, write 'Not specified' — never guess"

#### 2. RAG for Domain Grounding

A Retrieval-Augmented Generation pipeline using ChromaDB ensures that the LLM's responses are grounded in real construction knowledge. When a report topic is submitted, the top 3 most semantically similar document chunks are retrieved and injected into the prompt as context. This means the model can reference actual construction standards, safety procedures, and best practices rather than relying solely on its training data.

#### 3. Tone and Length as Explicit Instructions

Rather than passing `tone=formal` as a label and hoping the model interprets it correctly, the system maps each option to a concrete instruction:

- `formal` → "Write in third person. Avoid contractions. Use precise technical terminology suitable for client or regulatory submission."
- `brief` → "Total report should be under 300 words. Only include the most critical information."

This ensures the user's selection has a measurable, consistent effect on the output.

#### 4. Client-Side Persistence

Reports are saved to `localStorage` immediately after generation. This eliminates the need for a database, reduces backend complexity, and ensures the user's data is always available offline. The History page provides full CRUD operations (view, download, delete) on saved reports.

#### 5. Multi-Format Export

Reports are exported in three formats to serve different professional needs:
- **PDF** — via jsPDF, with proper title, divider, and auto page breaks
- **Word (.doc)** — styled HTML wrapped in a Word-compatible document
- **TXT** — plain text with all Markdown symbols stripped

---

## 7. Key Design Considerations

### 7.1 Hallucination Mitigation

| Technique | Implementation |
|---|---|
| Low temperature | `temperature=0.1` on ChatGroq |
| Explicit prompt rules | "Do not invent names, numbers, dates, or events not mentioned" |
| RAG context injection | Top 3 ChromaDB chunks grounding each response |
| Fallback instruction | "Write 'Not specified' for unknown fields — never fabricate" |
| Domain restriction | System prompt restricts model to construction topics only |

### 7.2 Separation of Concerns

- The frontend has zero AI logic — it only sends HTTP requests and renders responses
- The backend has zero UI logic — it only processes requests and returns structured JSON
- The RAG class is fully decoupled from FastAPI routes, making it independently testable

### 7.3 Stateless Backend

The FastAPI backend is fully stateless. No session data, user data, or report content is stored server-side. All persistence is the client's responsibility via `localStorage`. This simplifies deployment and eliminates database dependencies.

### 7.4 CSS Architecture

The frontend uses a custom CSS variable system (`global.css`) with a single light theme. No Tailwind or CSS-in-JS is used. This keeps the bundle size minimal and gives full control over the design system. All colours, spacing, shadows, and typography are defined as CSS custom properties and reused consistently across all component stylesheets.

### 7.5 Markdown as the Report Format

The LLM outputs Markdown, which is:
- Easy to render in the browser via `react-markdown`
- Easy to convert to PDF, Word, and TXT on the client
- Human-readable in its raw form
- Consistent and structured (headings, tables, bullet points)

This avoids the complexity of generating HTML or PDF directly from the LLM.

---

## 8. API Catalogue

### Base URL
```
http://localhost:8000
```

---

### GET /
**Description:** Health check root endpoint

**Response:**
```json
{
  "message": "Construction Content Generator API",
  "status": "running"
}
```

---

### GET /health
**Description:** Service health check

**Response:**
```json
{
  "status": "healthy"
}
```

---

### POST /generate-report
**Description:** Generate a structured construction site report using the RAG pipeline

**Request Body:**
```json
{
  "project_name": "string",
  "project_number": "string (optional)",
  "date": "string (YYYY-MM-DD)",
  "location": "string",
  "contractor": "string",
  "weather": "string (optional)",
  "report_type": "string",
  "topic": "string",
  "tone": "formal | standard | detailed (optional, default: standard)",
  "length": "brief | standard | detailed (optional, default: detailed)",
  "include_safety": "boolean (optional, default: true)",
  "include_materials": "boolean (optional, default: true)",
  "include_photos": "boolean (optional, default: true)"
}
```

**Response (200):**
```json
{
  "report": "string (Markdown formatted report)",
  "success": true,
  "message": "Report generated successfully"
}
```

**Response (500):**
```json
{
  "detail": "string (error message)"
}
```

---

### POST /chat
**Description:** Send a message to the construction AI assistant

**Request Body:**
```json
{
  "message": "string"
}
```

**Response (200):**
```json
{
  "response": "string (Markdown formatted reply)",
  "success": true
}
```

**Response (500):**
```json
{
  "detail": "string (error message)"
}
```

---

### GET /report-types
**Description:** Returns the list of supported report types

**Response:**
```json
{
  "report_types": [
    "Daily Site Report",
    "Safety Inspection Report",
    "Progress Report",
    "Quality Control Report",
    "Material Inspection Report",
    "Equipment Status Report",
    "Incident Report"
  ]
}
```

---

## 9. References

| Resource | URL |
|---|---|
| FastAPI Documentation | https://fastapi.tiangolo.com |
| LangChain Documentation | https://python.langchain.com |
| LangChain Groq Integration | https://python.langchain.com/docs/integrations/chat/groq |
| Groq API Documentation | https://console.groq.com/docs |
| Meta LLaMA 3.3 Model Card | https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct |
| ChromaDB Documentation | https://docs.trychroma.com |
| HuggingFace sentence-transformers | https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 |
| React Documentation | https://react.dev |
| React Router v6 | https://reactrouter.com |
| react-markdown | https://github.com/remarkjs/react-markdown |
| remark-gfm | https://github.com/remarkjs/remark-gfm |
| jsPDF | https://github.com/parallax/jsPDF |
| Vite | https://vitejs.dev |

---

*Document prepared for ConstructionGen — AI-Powered Construction Documentation System*
*Version 1.0*
