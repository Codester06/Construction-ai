# Construction Content Generator

AI-powered construction report generator using RAG (Retrieval-Augmented Generation).

## Tech Stack

**Frontend:**
- React + TypeScript
- Custom CSS
- SVG Icons

**Backend:**
- Python FastAPI
- LangChain
- Google Gemini API
- Chroma Vector DB
- Hugging Face Embeddings

## Project Structure

```
construction-ai/
├── frontend/          # React + TypeScript
├── backend/           # Python FastAPI
├── data/             # Sample construction documents
└── README.md
```

## Setup Instructions

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python ingest_docs.py  # Load documents into vector DB
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `.env` files:

**backend/.env:**
```
GOOGLE_API_KEY=your_gemini_api_key
```

## Features

- Multiple report types (Daily, Safety, Progress, etc.)
- RAG-based content generation
- Report history
- Templates
- Analytics
- Export to PDF/Word
