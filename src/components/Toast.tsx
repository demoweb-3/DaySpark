import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../hooks/useToast';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((t) => {
        const Icon =
          t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info;
        const color =
          t.type === 'success'
            ? 'text-sage-500'
            : t.type === 'error'
            ? 'text-clay-500'
            : 'text-spark-500';
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 bg-elevated border border-default rounded-2xl shadow-soft-lg px-4 py-3 animate-slide-up"
          >
            <Icon size={18} className={color} strokeWidth={2} />
            <p className="text-sm text-default flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              className="p-0.5 text-faint hover:text-default transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
