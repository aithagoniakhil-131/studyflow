import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, dur) => showToast(msg, 'success', dur), [showToast]);
  const error = useCallback((msg, dur) => showToast(msg, 'error', dur), [showToast]);
  const info = useCallback((msg, dur) => showToast(msg, 'info', dur), [showToast]);
  const warning = useCallback((msg, dur) => showToast(msg, 'warning', dur), [showToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning, showToast, removeToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastCard = ({ toast, onClose }) => {
  const { id, message, type } = toast;

  const styles = {
    success: 'bg-[#10B98118] border-[#10B98135] text-emerald-400',
    error: 'bg-[#EF444418] border-[#EF444435] text-rose-400',
    info: 'bg-[#3B82F618] border-[#3B82F635] text-blue-400',
    warning: 'bg-[#FBBF2418] border-[#FBBF2435] text-amber-400'
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />,
    info: <Info className="w-5 h-5 flex-shrink-0 text-blue-400" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg animate-slide-in ${styles[type]}`}
      role="alert"
    >
      {icons[type]}
      <div className="flex-1 text-sm font-medium pr-2 leading-tight">
        {message}
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
