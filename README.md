# ConstructionGen

AI-powered construction documentation platform. Generate professional Daily Site Reports and chat with a construction-domain AI assistant.

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- [Groq API key](https://console.groq.com/)

---

## Setup

### 1. Clone & navigate

```bash
git clone <repo-url>
cd construction-ai
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your Groq API key:
# GROQ_API_KEY=your_key_here

# Ingest knowledge base into ChromaDB (run once)
python ingest_docs.py

# Start the backend server
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

App runs at **http://localhost:5173**  
API runs at **http://localhost:8000**

---

## Commands Reference

| Command | Location | Description |
|---------|----------|-------------|
| `python ingest_docs.py` | `backend/` | Populate ChromaDB (run once, or after updating docs) |
| `uvicorn main:app --reload --port 8000` | `backend/` | Start FastAPI backend |
| `npm install` | `frontend/` | Install frontend dependencies |
| `npm run dev` | `frontend/` | Start Vite dev server |
| `npm run build` | `frontend/` | Production build → `dist/` |
| `npm run preview` | `frontend/` | Preview production build locally |

---

## Project Structure

```
construction-ai/
├── backend/
│   ├── main.py            # FastAPI app — routes, CORS, Pydantic models
│   ├── rag.py             # ConstructionRAG — LLM, embeddings, vector search
│   ├── ingest_docs.py     # One-time ChromaDB population script
│   ├── requirements.txt
│   ├── .env               # GROQ_API_KEY (not committed)
│   └── chroma_db/         # Persisted vector store (auto-created)
├── frontend/
│   ├── src/
│   │   ├── pages/         # Home, NewReport, Chat, History
│   │   ├── components/    # Layout, Sidebar, ReportRenderer, Toast, Icons
│   │   ├── styles/        # All CSS files
│   │   └── utils/         # storage.ts, wordExport.ts
│   └── package.json
└── docs/                  # HLD, LLD, GenAI documentation
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq Cloud API key — get from [console.groq.com](https://console.groq.com/) |
