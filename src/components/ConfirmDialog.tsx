import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-muted text-sm leading-relaxed">{message}</p>
      <div className="flex gap-3 justify-end mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-default bg-subtle hover:bg-paper-200 dark:hover:bg-ink-700 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
            destructive
              ? 'bg-clay-500 hover:bg-clay-600'
              : 'bg-spark-500 hover:bg-spark-600'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
