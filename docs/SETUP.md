# Setup Guide - Construction Content Generator

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ and npm installed
- Google Gemini API key (free from https://makersuite.google.com/app/apikey)

## Backend Setup

### 1. Navigate to backend directory
```bash
cd construction-ai/backend
```

### 2. Create virtual environment
```bash
python -m venv venv
```

### 3. Activate virtual environment

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Create .env file
```bash
cp .env.example .env
```

Edit `.env` and add your Google Gemini API key:
```
GOOGLE_API_KEY=your_actual_api_key_here
```

### 6. Ingest construction documents into vector database
```bash
python ingest_docs.py
```

You should see:
```
✅ Successfully ingested construction documents into vector database!
   Total documents: 6
   Total chunks: XX
   Storage location: ./chroma_db
```

### 7. Start the backend server
```bash
uvicorn main:app --reload
```

Backend will run at: http://localhost:8000

Test it: http://localhost:8000/health

---

## Frontend Setup

### 1. Open a new terminal and navigate to frontend directory
```bash
cd construction-ai/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

Frontend will run at: http://localhost:5173

---

## Usage

1. Open your browser to http://localhost:5173
2. Fill in the project information
3. Select a report type
4. Enter a topic/description
5. Click "Generate Report"
6. Wait 10-30 seconds for the AI to generate your report
7. Copy, download, or edit the generated report

---

## Troubleshooting

### Backend Issues

**Error: "No module named 'langchain'"**
- Make sure you activated the virtual environment
- Run `pip install -r requirements.txt` again

**Error: "GOOGLE_API_KEY not found"**
- Check that you created the `.env` file in the backend directory
- Make sure your API key is correct

**Error: "Chroma DB not found"**
- Run `python ingest_docs.py` to create the vector database

### Frontend Issues

**Error: "Cannot connect to server"**
- Make sure the backend is running on port 8000
- Check that CORS is enabled in the backend

**Blank page or errors**
- Check the browser console for errors
- Make sure you ran `npm install`
- Try clearing browser cache

### API Issues

**Slow generation (>60 seconds)**
- This is normal for the first request (model loading)
- Subsequent requests should be faster (10-30 seconds)

**Error: "Rate limit exceeded"**
- Google Gemini free tier has rate limits
- Wait a minute and try again

---

## Project Structure

```
construction-ai/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── rag.py               # RAG implementation
│   ├── ingest_docs.py       # Document ingestion script
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # API keys (create this)
│   └── chroma_db/           # Vector database (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── styles/          # CSS files
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## Next Steps

1. Customize the construction documents in `backend/ingest_docs.py`
2. Add your own templates and report formats
3. Implement report history with a database
4. Add PDF/Word export functionality
5. Deploy to production (Vercel + Railway/Render)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the backend logs in the terminal
3. Check the browser console for frontend errors
4. Ensure all dependencies are installed correctly
