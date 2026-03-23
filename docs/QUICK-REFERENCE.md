# Quick Reference Guide

## Start the Application

```bash
# Terminal 1 - Backend
cd construction-ai/backend
source venv/bin/activate
python main.py

# Terminal 2 - Frontend  
cd construction-ai/frontend
npm run dev
```

Open: http://localhost:5173

## Features Overview

### 1. New Report (Home Page)
- Fill project info and report details
- Click "Generate Report"
- Download as PDF, Word, or TXT
- Reports auto-save to History

### 2. History
- View all generated reports
- Search by project name or topic
- Filter by report type
- View, download, or delete reports

### 3. Templates
- Click "+ Create New Template"
- Fill in template details
- Click "Use Template" to load in New Report
- Templates save your preferred settings

### 4. Analytics
- View total reports, projects, templates
- See bar chart of reports by type
- Updates automatically as you create reports

### 5. Chat
- Ask construction-related questions
- Click suggested questions or type your own
- AI responds with construction-specific knowledge

### 6. Settings
- View user profile and preferences
- (Currently display-only)

## Report Types Available

1. Daily Site Report
2. Safety Inspection Report
3. Progress Report
4. Quality Control Report
5. Material Inspection Report
6. Equipment Status Report
7. Incident Report

## Data Storage

All data stored in browser localStorage:
- `construction_reports` - Report history
- `construction_templates` - Saved templates

To clear all data:
```javascript
localStorage.clear()
```

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus search (in History)
- `Enter` - Submit chat message
- `Ctrl/Cmd + C` - Copy report (when focused)

## Tips

1. **Use Templates** - Save time by creating templates for common reports
2. **Quick Actions** - Use the quick action buttons for faster report type selection
3. **Search History** - Use search to quickly find past reports
4. **Export Options** - Choose PDF for formal documents, TXT for editing
5. **Chat for Help** - Ask the AI for construction guidance anytime

## Troubleshooting

**Backend not responding?**
- Check if backend is running on port 8000
- Verify .env has valid GOOGLE_API_KEY

**Reports not saving?**
- Check browser console for errors
- Ensure localStorage is enabled

**Templates not loading?**
- Navigate to New Report page after clicking "Use Template"
- Check for alert message confirmation

## API Key Setup

1. Get free API key: https://makersuite.google.com/app/apikey
2. Add to `backend/.env`:
   ```
   GOOGLE_API_KEY=your_key_here
   ```
3. Restart backend server

## Browser Support

- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

## File Locations

- Reports: localStorage → `construction_reports`
- Templates: localStorage → `construction_templates`
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

---

**Need more help?** See `TESTING-GUIDE.md` for detailed testing instructions.
