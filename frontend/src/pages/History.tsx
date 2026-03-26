import { useState, useEffect } from 'react';
import '../styles/history.css';
import { SearchIcon, HistoryIcon, FileTextIcon, DownloadIcon, TrashIcon } from '../components/Icons';
import { getReports, deleteReport, SavedReport } from '../utils/storage';
import { exportToDocx } from '../utils/wordExport';
import ReportRenderer from '../components/ReportRenderer';
import { useToast } from '../components/Toast';

function History() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [downloadMenuId, setDownloadMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => setReports(getReports());

  const handleDelete = (id: string) => {
    deleteReport(id);
    loadReports();
    if (selectedReport?.id === id) setSelectedReport(null);
    setConfirmDeleteId(null);
    showToast('Report deleted.', 'error');
  };

  const handleDownload = (report: SavedReport, format: string) => {
    const filename = `${report.projectName || 'report'}-${report.date}`;

    if (format === 'pdf') {
      import('jspdf').then(({ jsPDF }) => {
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxW = pageW - margin * 2;
        let y = margin;

        const clean = report.content
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/^\|.*\|$/gm, (row) =>
            row.split('|').filter(c => c.trim() && !/^[-\s]+$/.test(c)).map(c => c.trim()).join('   |   ')
          )
          .replace(/^[-*]\s+/gm, '• ')
          .replace(/^---+$/gm, '─'.repeat(60));

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(report.projectName || 'Construction Report', margin, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(120, 100, 90);
        doc.text(`${report.reportType}  •  ${report.date}`, margin, y);
        y += 4;

        doc.setDrawColor(220, 210, 200);
        doc.line(margin, y, pageW - margin, y);
        y += 8;

        doc.setTextColor(42, 36, 32);
        doc.setFontSize(10);

        for (const line of clean.split('\n')) {
          if (y > pageH - margin) { doc.addPage(); y = margin; }
          if (line.trim() === '') { y += 4; continue; }
          if (line.startsWith('─')) {
            doc.setDrawColor(220, 210, 200);
            doc.line(margin, y, pageW - margin, y);
            y += 5; continue;
          }
          const wrapped = doc.splitTextToSize(line, maxW);
          doc.text(wrapped, margin, y);
          y += wrapped.length * 5 + 1;
        }

        doc.save(`${filename}.pdf`);
      });
      setDownloadMenuId(null);
      showToast('PDF downloaded.');
      return;
    }

    if (format === 'doc') {
      exportToDocx(report.content, report.projectName || 'Construction Report', `${report.reportType}  •  ${report.date}`, filename);
      setDownloadMenuId(null);
      showToast('Word document downloaded.');
      return;
    }

    // TXT
    const txt = report.content
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
    setDownloadMenuId(null);
    showToast('TXT downloaded.');
  };

  const filteredReports = reports.filter(r =>
    r.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="history-page">
      {ToastComponent}

      {confirmDeleteId && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <div className="confirm-icon">
              <TrashIcon />
            </div>
            <h3>Delete Report?</h3>
            <p>This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="btn btn-sm btn-delete-confirm" onClick={() => handleDelete(confirmDeleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {!selectedReport && (
        <>
          <div className="page-header">
            <div className="page-header-icon">
              <HistoryIcon />
            </div>
            <div className="page-header-text">
              <h1>Report History</h1>
              <p className="page-header-subtitle">View, download, and manage your saved reports</p>
            </div>
            <span className="page-header-brand">Construction Report Generator</span>
          </div>
          <div className="history-controls">
            <div className="search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {selectedReport ? (
        <div className="report-viewer">
          <button className="btn btn-outline back-btn" onClick={() => setSelectedReport(null)}>
            ← Back to List
          </button>
          <div className="report-viewer-container">
            <div className="report-viewer-sidebar">
              <div className="report-info-card">
                <h3>Report Details</h3>
                <div className="info-item">
                  <span className="info-label">Project</span>
                  <span className="info-value">{selectedReport.projectName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date</span>
                  <span className="info-value">{new Date(selectedReport.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">{selectedReport.location}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Contractor</span>
                  <span className="info-value">{selectedReport.contractor}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Project #</span>
                  <span className="info-value">{selectedReport.projectNumber}</span>
                </div>
              </div>
              <div className="report-actions-sidebar">
                <button className="btn btn-secondary btn-full" onClick={() => handleDownload(selectedReport, 'txt')}><DownloadIcon /> TXT</button>
                <button className="btn btn-secondary btn-full" onClick={() => handleDownload(selectedReport, 'pdf')}><DownloadIcon /> PDF</button>
                <button className="btn btn-secondary btn-full" onClick={() => handleDownload(selectedReport, 'doc')}><DownloadIcon /> Word</button>
                <button className="btn btn-outline btn-full btn-delete" onClick={() => setConfirmDeleteId(selectedReport.id)}><TrashIcon /> Delete</button>
              </div>
            </div>
            <div className="report-viewer-main">
              <div className="report-content-card">
                <div className="report-content-header">
                  <h2>{selectedReport.projectName}</h2>
                  <p className="report-subtitle">{selectedReport.reportType}</p>
                </div>
                <div className="report-content-body">
                  <ReportRenderer content={selectedReport.content} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="history-list">
          {filteredReports.length > 0 ? filteredReports.map((report) => (
            <div key={report.id} className="history-item">
              <div className="history-item-top">
                <div className="history-item-name">{report.projectName || 'Untitled Report'}</div>
                <div className="history-item-date">{new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div className="history-item-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedReport(report)}>View</button>
                <div className="download-wrapper">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDownloadMenuId(downloadMenuId === report.id ? null : report.id)}
                  >
                    <DownloadIcon /> Download
                  </button>
                  {downloadMenuId === report.id && (
                    <div className="download-menu">
                      <button onClick={() => handleDownload(report, 'txt')}>TXT</button>
                      <button onClick={() => handleDownload(report, 'pdf')}>PDF</button>
                      <button onClick={() => handleDownload(report, 'doc')}>Word</button>
                    </div>
                  )}
                </div>
                <button className="btn btn-outline btn-sm btn-delete" onClick={() => setConfirmDeleteId(report.id)}>
                  <TrashIcon /> Delete
                </button>
              </div>
            </div>
          )) : (
            <div className="empty-state">
              <FileTextIcon />
              <h3>No Reports Yet</h3>
              <p>Generate your first report to see it here!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default History;
