import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/report-renderer.css';

interface ReportRendererProps {
  content: string;
}

function ReportRenderer({ content }: ReportRendererProps) {
  return (
    <div className="report-renderer">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default ReportRenderer;
