# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Get Your API Key (2 minutes)
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

### Step 2: Backend Setup (2 minutes)
```bash
cd construction-ai/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:
```bash
echo "GOOGLE_API_KEY=your_key_here" > .env
```

Ingest documents and start server:
```bash
python ingest_docs.py
uvicorn main:app --reload
```

### Step 3: Frontend Setup (1 minute)
Open new terminal:
```bash
cd construction-ai/frontend
npm install
npm run dev
```

### Step 4: Use the App
1. Open http://localhost:5173
2. Fill in project details
3. Enter topic: "Foundation inspection for Building A"
4. Click "Generate Report"
5. Wait 10-30 seconds
6. Done! 🎉

---

## 📝 Example Topics to Try

1. "Foundation inspection completed, concrete quality good, minor cracks observed"
2. "Safety inspection of scaffolding on west side, found loose connections"
3. "Daily progress: framing 80% complete, electrical rough-in started"
4. "Material delivery inspection: 50 tons of rebar received, all specifications met"
5. "Equipment status check: excavator needs hydraulic repair"

---

## 🎯 Quick Tips

- **First generation is slow** (30-60s) - subsequent ones are faster
- **Be specific** in your topic description for better results
- **Use Quick Actions** for common report types
- **Check all sections** you want included before generating
- **Copy button** copies the entire report to clipboard

---

## ⚠️ Common Issues

**"Cannot connect to server"**
→ Make sure backend is running on port 8000

**"API key error"**
→ Check your .env file has the correct key

**"Slow generation"**
→ Normal for first request, faster after that

**"Empty report"**
→ Make sure you ran `python ingest_docs.py`

---

## 📚 What's Included

- 7 report types
- RAG-based generation (uses construction knowledge)
- Professional formatting
- Copy/download functionality
- Responsive design
- Free to use (Google Gemini free tier)

---

## 🎨 Color Palette Used

- Dark Blue: #1B3C53
- Medium Blue: #234C6A
- Steel Blue: #456882
- Light Beige: #D2C1B6
- Background: #F8F6F4

---

## 📦 Tech Stack

**Backend:** Python, FastAPI, LangChain, Gemini, Chroma
**Frontend:** React, TypeScript, Custom CSS, Vite

---

## 🔗 Useful Links

- Google Gemini API: https://makersuite.google.com/app/apikey
- LangChain Docs: https://python.langchain.com/
- FastAPI Docs: https://fastapi.tiangolo.com/
- React Docs: https://react.dev/

---

## 💡 Next Steps

1. Try generating different report types
2. Customize the construction documents in `ingest_docs.py`
3. Add your own templates
4. Implement report history with a database
5. Deploy to production

Enjoy building! 🏗️
