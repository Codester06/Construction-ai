import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const show = setTimeout(() => setVisible(true), 10);
    // Auto dismiss after 3s
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [onClose]);

  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    info: 'i',
  };

  const colors: Record<string, string> = {
    success: '#10B981',
    error: '#EF4444',
    info: '#0EA5E9',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 28,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '-20px'})`,
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 9999,
        background: '#FFFFFF',
        border: `1.5px solid ${colors[type]}`,
        borderRadius: '12px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: '260px',
        maxWidth: '420px',
        pointerEvents: 'none',
      }}
    >
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        background: colors[type], color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 700, flexShrink: 0,
      }}>
        {icons[type]}
      </span>
      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#2A2420' }}>
        {message}
      </span>
    </div>
  );
}

// Hook for easy usage
import { useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null;

  return { showToast, ToastComponent };
}
