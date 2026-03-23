# Testing Guide - Construction AI Content Generator

## Prerequisites
1. Backend server running on `http://localhost:8000`
2. Frontend server running on `http://localhost:5173`
3. Google Gemini API key configured in `backend/.env`

## Start the Application

### Terminal 1 - Backend
```bash
cd construction-ai/backend
source venv/bin/activate
python main.py
```

### Terminal 2 - Frontend
```bash
cd construction-ai/frontend
npm run dev
```

## Feature Testing Checklist

### ✅ 1. Generate New Report
**Location:** New Report page (default landing page)

**Steps:**
1. Fill in project information:
   - Project Name: "Downtown Plaza Construction"
   - Project Number: "DPC-2024-001"
   - Date: (today's date)
   - Location: "123 Main St, Downtown"
   - Contractor: "ABC Construction Co."
   - Weather: Select any option

2. Configure report:
   - Report Type: Select "Daily Site Report"
   - Topic: "Foundation work completed for Building A, concrete pouring in progress"
   - Tone: "Standard"
   - Length: "Detailed"
   - Check all sections (Safety, Materials, Photos)

3. Click "Generate Report"

**Expected Results:**
- Loading spinner appears
- Report generates within 5-10 seconds
- Formatted report displays with proper headers and bullet points
- Alert shows "Report generated and saved to history!"
- Action buttons appear: Copy, PDF, Word, TXT, Regenerate

**Test Actions:**
- Click "Copy" - should copy to clipboard
- Click "PDF" - should download PDF file
- Click "Word" - should download .doc file
- Click "TXT" - should download .txt file
- Click "Regenerate" - should generate a new version

---

### ✅ 2. View Report History
**Location:** History page (sidebar navigation)

**Steps:**
1. Navigate to History page
2. View the report you just generated

**Expected Results:**
- Report appears in the list
- Shows project name, date, type, location, and topic
- Has "View", "Download", and "Delete" buttons

**Test Actions:**
- Click "View" - should show full report content
- Click "Download" - should download as .txt
- Click "Delete" - should prompt confirmation and remove report
- Use search box - should filter reports by project name or topic
- Use filter dropdown - should filter by report type

---

### ✅ 3. Create and Use Templates
**Location:** Templates page (sidebar navigation)

**Steps to Create:**
1. Navigate to Templates page
2. Click "+ Create New Template"
3. Fill in template details:
   - Name: "Daily Foundation Inspection"
   - Description: "Standard template for daily foundation inspections"
   - Report Type: "Daily Site Report"
   - Default Tone: "Standard"
   - Default Length: "Detailed"
   - Check: Safety, Materials, Photos

4. Click "Create Template"

**Expected Results:**
- Alert shows "Template created successfully!"
- Template card appears in the grid
- Shows template name, type, description, and badges

**Steps to Use:**
1. Click "Use Template" on any template
2. Alert shows "Template loaded! Navigate to 'New Report' to use it."
3. Navigate to New Report page

**Expected Results:**
- Form is pre-filled with template settings
- Report Type, Tone, Length, and checkboxes match template
- Alert shows "Template loaded successfully!"

**Test Actions:**
- Create multiple templates with different settings
- Delete a template - should prompt confirmation
- Use different templates and verify settings load correctly

---

### ✅ 4. View Analytics
**Location:** Analytics page (sidebar navigation)

**Steps:**
1. Generate 2-3 reports of different types
2. Create 1-2 templates
3. Navigate to Analytics page

**Expected Results:**
- Stats cards show correct numbers:
  - Total Reports Generated
  - Unique Projects (based on project names)
  - Templates Created
- Chart displays "Reports by Type" with bars
- Each bar shows report type name and count
- Bar width represents percentage of total

**Test Empty State:**
- Clear localStorage: `localStorage.clear()` in browser console
- Refresh page
- Should show "No Data Yet" message

---

### ✅ 5. Chat with AI
**Location:** Chat page (sidebar navigation)

**Steps:**
1. Navigate to Chat page
2. Click a suggested question OR type your own
3. Examples:
   - "What safety equipment is required for concrete work?"
   - "How do I inspect foundation quality?"
   - "What are the steps for daily site reporting?"

**Expected Results:**
- Message appears in chat with user icon
- Typing indicator shows "AI is typing..."
- AI response appears with bot icon
- Response is construction-specific and detailed
- Can send multiple messages in conversation

---

### ✅ 6. Settings Page
**Location:** Settings page (sidebar navigation)

**Expected Results:**
- Shows user profile section
- Shows preferences section
- All UI elements display correctly in dark theme

---

### ✅ 7. Quick Actions
**Location:** New Report page

**Steps:**
1. Click "Daily Report" quick action button
2. Verify Report Type changes to "Daily Site Report"
3. Click "Safety Check" quick action button
4. Verify Report Type changes to "Safety Inspection Report"
5. Click "Progress Update" quick action button
6. Verify Report Type changes to "Progress Report"

---

### ✅ 8. Dark Theme Verification
**Check all pages for:**
- Dark background (#0F1419)
- Light text (#E8E9ED)
- Orange accents (#FF6B35) on buttons and highlights
- Card backgrounds (#242B35)
- Proper contrast and readability
- SVG icons display correctly

---

### ✅ 9. Responsive Design
**Test on different screen sizes:**
- Desktop (1920x1080)
- Tablet (768px width)
- Mobile (375px width)

**Expected Results:**
- Sidebar collapses on mobile
- Forms stack vertically on small screens
- Cards resize appropriately
- All buttons remain accessible

---

### ✅ 10. Error Handling

**Test Backend Offline:**
1. Stop backend server
2. Try to generate a report
3. Expected: "Error connecting to server. Make sure the backend is running."

**Test Empty Topic:**
1. Leave topic field empty
2. Click "Generate Report"
3. Expected: "Please enter a topic/description"

**Test Invalid API Key:**
1. Set invalid API key in backend/.env
2. Try to generate report
3. Expected: Error message from backend

---

## Data Persistence Testing

### LocalStorage Verification
Open browser console and run:
```javascript
// View all reports
JSON.parse(localStorage.getItem('construction_reports'))

// View all templates
JSON.parse(localStorage.getItem('construction_templates'))

// Clear all data
localStorage.clear()
```

---

## Performance Testing

1. Generate 10+ reports
2. Create 5+ templates
3. Check History page loads quickly
4. Check Analytics updates correctly
5. Verify no memory leaks or slowdowns

---

## Browser Compatibility

Test in:
- Chrome/Edge (Chromium)
- Firefox
- Safari

---

## Known Limitations

1. PDF export uses basic formatting (jsPDF library)
2. Word export is actually HTML format (.doc extension)
3. Data stored in localStorage (cleared if browser cache is cleared)
4. No user authentication (single-user application)
5. Backend must be running for report generation and chat

---

## Success Criteria

✅ All reports generate successfully with proper formatting
✅ Reports save to history and can be viewed/downloaded/deleted
✅ Templates can be created, used, and deleted
✅ Analytics show accurate statistics and charts
✅ Chat provides relevant construction-specific responses
✅ Dark theme displays correctly on all pages
✅ All SVG icons render properly
✅ No console errors or warnings
✅ Responsive design works on all screen sizes
✅ Data persists across page refreshes

---

## Troubleshooting

**Backend won't start:**
- Check Python version (3.8+)
- Verify virtual environment is activated
- Run `pip install -r requirements.txt`
- Check .env file has valid GOOGLE_API_KEY

**Frontend won't start:**
- Check Node.js version (16+)
- Run `npm install`
- Check port 5173 is available

**Reports not generating:**
- Check backend console for errors
- Verify API key is valid
- Check network tab in browser DevTools
- Ensure ChromaDB is initialized (run ingest_docs.py)

**Templates not loading in New Report:**
- Check browser console for errors
- Verify sessionStorage is working
- Try creating a new template

**Analytics not updating:**
- Generate a new report
- Refresh the Analytics page
- Check localStorage has data
