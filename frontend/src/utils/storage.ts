// Local Storage utilities for saving reports, templates, and settings

export interface SavedReport {
  id: string;
  projectName: string;
  projectNumber: string;
  date: string;
  location: string;
  contractor: string;
  reportType: string;
  topic: string;
  content: string;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  reportType: string;
  defaultTone: string;
  defaultLength: string;
  includeSafety: boolean;
  includeMaterials: boolean;
  includePhotos: boolean;
  createdAt: string;
}

// Report History Functions
export const saveReport = (report: Omit<SavedReport, 'id' | 'createdAt'>): void => {
  const reports = getReports();
  const newReport: SavedReport = {
    ...report,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  reports.unshift(newReport);
  localStorage.setItem('construction_reports', JSON.stringify(reports));
};

export const getReports = (): SavedReport[] => {
  const data = localStorage.getItem('construction_reports');
  return data ? JSON.parse(data) : [];
};

export const deleteReport = (id: string): void => {
  const reports = getReports().filter(r => r.id !== id);
  localStorage.setItem('construction_reports', JSON.stringify(reports));
};

export const clearAllReports = (): void => {
  localStorage.setItem('construction_reports', JSON.stringify([]));
};

export const getReportById = (id: string): SavedReport | undefined => {
  return getReports().find(r => r.id === id);
};

// Template Functions
export const saveTemplate = (template: Omit<Template, 'id' | 'createdAt'>): void => {
  const templates = getTemplates();
  const newTemplate: Template = {
    ...template,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  localStorage.setItem('construction_templates', JSON.stringify(templates));
};

export const getTemplates = (): Template[] => {
  const data = localStorage.getItem('construction_templates');
  return data ? JSON.parse(data) : [];
};

export const deleteTemplate = (id: string): void => {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem('construction_templates', JSON.stringify(templates));
};

// Analytics Functions
export const getAnalytics = () => {
  const reports = getReports();
  const templates = getTemplates();
  
  // Count reports by type
  const reportsByType: Record<string, number> = {};
  reports.forEach(report => {
    reportsByType[report.reportType] = (reportsByType[report.reportType] || 0) + 1;
  });
  
  // Count unique projects
  const uniqueProjects = new Set(reports.map(r => r.projectName)).size;
  
  return {
    totalReports: reports.length,
    totalTemplates: templates.length,
    uniqueProjects,
    reportsByType,
  };
};
