import { useState, useEffect } from 'react';
import '../styles/newreport.css';
import { 
  CalendarIcon, 
  RocketIcon, 
  CopyIcon, 
  DownloadIcon, 
  RefreshIcon,
  DocumentIcon,
} from '../components/Icons';
import { saveReport } from '../utils/storage';
import { exportToDocx } from '../utils/wordExport';
import ReportRenderer from '../components/ReportRenderer';
import { useToast } from '../components/Toast';

interface ReportData {
  projectName: string;
  projectNumber: string;
  date: string;
  location: string;
  contractor: string;
  weather: string;
  reportType: string;
  topic: string;
  tone: string;
  length: string;
}

function NewReport() {
  const [formData, setFormData] = useState<ReportData>({
    projectName: '',
    projectNumber: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    contractor: '',
    weather: 'Sunny',
    reportType: 'Daily Site Report',
    topic: '',
    tone: 'standard',
    length: 'detailed',
  });

  const [generatedReport, setGeneratedReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showToast, ToastComponent } = useToast();
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState('');


  useEffect(() => {
    sessionStorage.removeItem('selectedTemplate');
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      setError('Please enter a topic/description');
      return;
    }

    setLoading(true);
    setError('');
    setProgress(0);
    setProgressMessage('Initializing...');

    try {
      const progressStages = [
        { percent: 15, message: 'Analyzing project details...' },
        { percent: 30, message: 'Processing report requirements...' },
        { percent: 50, message: 'Generating report content...' },
        { percent: 70, message: 'Formatting sections...' },
        { percent: 85, message: 'Adding final touches...' },
        { percent: 95, message: 'Finalizing report...' },
      ];

      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProgress(progressStages[currentStage].percent);
          setProgressMessage(progressStages[currentStage].message);
          currentStage++;
        }
      }, 800);

      const response = await fetch('http://localhost:8000/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: formData.projectName,
          project_number: formData.projectNumber,
          date: formData.date,
          location: formData.location,
          contractor: formData.contractor,
          weather: formData.weather,
          report_type: formData.reportType,
          topic: formData.topic,
          tone: formData.tone,
          length: formData.length,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage('Complete!');

      const data = await response.json();

      if (data.success) {
        setGeneratedReport(data.report);
        saveReport({
          projectName: formData.projectName,
          projectNumber: formData.projectNumber,
          date: formData.date,
          location: formData.location,
          contractor: formData.contractor,
          reportType: formData.reportType,
          topic: formData.topic,
          content: data.report,
        });
        setTimeout(() => {
          showToast('Report generated and saved to history!');
          setProgress(0);
          setProgressMessage('');
        }, 500);
      } else {
        setError('Failed to generate report');
        setProgress(0);
        setProgressMessage('');
      }
    } catch (err) {
      setError('Error connecting to server. Make sure the backend is running.');
      setProgress(0);
      setProgressMessage('');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReport);
    showToast('Report copied to clipboard!', 'info');
  };

  const handleDownload = (format: string) => {
    const title = formData.projectName || 'Construction Report';
    const filename = `${title}-${formData.date}`;

    if (format === 'pdf') {
      import('jspdf').then(({ jsPDF }) => {
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxW = pageW - margin * 2;
        let y = margin;

        // Strip markdown symbols for clean PDF text
        const clean = generatedReport
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/^\|.*\|$/gm, (row) =>
            row.split('|').filter(c => c.trim() && !/^[-\s]+$/.test(c)).map(c => c.trim()).join('   |   ')
          )
          .replace(/^[-*]\s+/gm, '• ')
          .replace(/^---+$/gm, '─'.repeat(60));

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(title, margin, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(120, 100, 90);
        doc.text(`Daily Site Report  •  ${formData.date}`, margin, y);
        y += 4;

        // Divider
        doc.setDrawColor(220, 210, 200);
        doc.line(margin, y, pageW - margin, y);
        y += 8;

        doc.setTextColor(42, 36, 32);
        doc.setFontSize(10);

        const lines = clean.split('\n');
        for (const line of lines) {
          if (y > pageH - margin) {
            doc.addPage();
            y = margin;
          }
          if (line.trim() === '') {
            y += 4;
            continue;
          }
          if (line.startsWith('─')) {
            doc.setDrawColor(220, 210, 200);
            doc.line(margin, y, pageW - margin, y);
            y += 5;
            continue;
          }
          const wrapped = doc.splitTextToSize(line, maxW);
          doc.text(wrapped, margin, y);
          y += wrapped.length * 5 + 1;
        }

        doc.save(`${filename}.pdf`);
      });
      return;
    }

    if (format === 'docx') {
      exportToDocx(generatedReport, title, `Daily Site Report  •  ${formData.date}`, filename);
      return;
    }

    // TXT — strip markdown
    const txt = generatedReport
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^\|.*\|$/gm, (row) =>
        row.split('|').filter(c => c.trim() && !/^[-\s]+$/.test(c)).map(c => c.trim()).join('  |  ')
      );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = `${filename}.txt`;
    a.click();
  };

  return (
    <div className="new-report">
      {ToastComponent}
      <div className="page-header">
        <div className="page-header-icon">
          <DocumentIcon />
        </div>
        <div className="page-header-text">
          <h1>Generate New Report</h1>
          <p className="page-header-subtitle">Fill in the details below to create your report</p>
        </div>
      </div>

      <div className="card form-card">
        <h2 className="form-main-title">Report Details</h2>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="projectName">Project Name</label>
            <input type="text" id="projectName" name="projectName" value={formData.projectName} onChange={handleInputChange} placeholder="Enter project name" />
          </div>

          <div className="form-group">
            <label htmlFor="projectNumber">Project Number</label>
            <input type="text" id="projectNumber" name="projectNumber" value={formData.projectNumber} onChange={handleInputChange} placeholder="Enter project number" />
          </div>

          <div className="form-group">
            <label htmlFor="date"><CalendarIcon /> Date</label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label htmlFor="weather">Weather</label>
            <select id="weather" name="weather" value={formData.weather} onChange={handleInputChange}>
              <option>Sunny</option>
              <option>Cloudy</option>
              <option>Rainy</option>
              <option>Windy</option>
              <option>Snowy</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="Site location/address" />
          </div>

          <div className="form-group">
            <label htmlFor="contractor">Contractor</label>
            <input type="text" id="contractor" name="contractor" value={formData.contractor} onChange={handleInputChange} placeholder="Contractor name" />
          </div>

          <div className="form-group form-group-row">
            <div className="form-subgroup">
              <label htmlFor="tone">Tone</label>
              <select id="tone" name="tone" value={formData.tone} onChange={handleInputChange}>
                <option value="formal">Formal</option>
                <option value="standard">Standard</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
            <div className="form-subgroup">
              <label htmlFor="length">Length</label>
              <select id="length" name="length" value={formData.length} onChange={handleInputChange}>
                <option value="brief">Brief</option>
                <option value="standard">Standard</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-group form-group-full">
          <label htmlFor="topic">Site Activity Description <span style={{color:'#EF4444'}}>*</span><span style={{color:'#9E8E82', fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6, fontSize:'0.75rem'}}>— be specific to avoid vague output</span></label>
          <textarea
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            placeholder={`Describe site activities with specific details. Include key points like:\n• Work completed: "Poured 45m³ concrete for ground floor slab, Zone B"\n• Workers & equipment: "12 workers on site, 1 excavator, 2 concrete mixers"\n• Safety: "Toolbox talk held, all PPE compliant, no incidents"\n• Materials: "Delivered 200 steel rebar units, stored in Yard C"\n• Issues/delays: "Work halted 2hrs due to heavy rain at 14:00"\n• Progress: "Foundation 70% complete, on schedule"`}
            rows={7}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && (
          <div className="progress-compact">
            <div className="progress-compact-bar">
              <div className="progress-compact-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-compact-msg">{progressMessage}</span>
          </div>
        )}

        <div className="button-container">
          <button
            className="btn btn-primary btn-generate"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (<><div className="spinner"></div>Generating Report...</>) : (<><RocketIcon />Generate Report</>)}
          </button>
        </div>
      </div>

      {generatedReport && (
        <div className="card report-output">
          <div className="section-header">
            <DocumentIcon />
            <h2>Generated Report</h2>
          </div>
          <div className="report-content">
            <ReportRenderer content={generatedReport} />
          </div>
          <div className="report-actions">
            <button className="btn btn-secondary" onClick={handleCopy}><CopyIcon /> Copy</button>
            <button className="btn btn-secondary" onClick={() => handleDownload('pdf')}><DownloadIcon /> PDF</button>
            <button className="btn btn-secondary" onClick={() => handleDownload('docx')}><DownloadIcon /> Word</button>
            <button className="btn btn-secondary" onClick={() => handleDownload('txt')}><DownloadIcon /> TXT</button>
            <button className="btn btn-outline" onClick={handleGenerate}><RefreshIcon /> Regenerate</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewReport;
