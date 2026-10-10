import { useRef, useState } from 'react';
import {
  Sun, Moon, Monitor, Download, Upload, Trash2, Timer, Volume2, VolumeX,
  Zap, ZapOff, Info, Shield, Database,
} from 'lucide-react';
import type { Settings, ThemeMode, Task } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { downloadExport, parseImportData, type ImportResult } from '../utils/exportImport';

interface SettingsViewProps {
  settings: Settings;
  tasks: Task[];
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onClearAll: () => void;
  onClearCompleted: () => void;
  onReplaceAll: (tasks: Task[]) => void;
  onReplaceSettings: (settings: Settings) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function SettingsView({
  settings,
  tasks,
  onUpdateSettings,
  onClearAll,
  onClearCompleted,
  onReplaceAll,
  onReplaceSettings,
  onToast,
}: SettingsViewProps) {
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [clearCompletedOpen, setClearCompletedOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'Auto', icon: Monitor },
  ];

  function handleExport() {
    downloadExport(tasks, settings);
    onToast('Data exported successfully', 'success');
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = parseImportData(text);
      if (result.success) {
        setImportResult(result);
        setImportPreviewOpen(true);
      } else {
        onToast(result.error ?? 'Import failed', 'error');
      }
    };
    reader.onerror = () => onToast('Failed to read file', 'error');
    reader.readAsText(file);

    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  function confirmImport() {
    if (!importResult) return;
    onReplaceAll(importResult.tasks);
    if (importResult.settings) {
      onReplaceSettings(importResult.settings);
    }
    setImportPreviewOpen(false);
    onToast(
      `Imported ${importResult.tasks.length} task${importResult.tasks.length !== 1 ? 's' : ''}${
        importResult.skipped > 0 ? `, skipped ${importResult.skipped} invalid` : ''
      }`,
      'success'
    );
    setImportResult(null);
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-default">Settings</h1>
        <p className="text-sm text-muted mt-0.5">Personalize your DaySpark experience.</p>
      </div>

      {/* Appearance */}
      <Section title="Appearance" icon={Sun}>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = settings.theme === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => onUpdateSettings({ theme: opt.mode })}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-spark-400 bg-spark-50 dark:bg-spark-900/20'
                    : 'border-default bg-subtle hover:bg-paper-100 dark:hover:bg-ink-700'
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-spark-500' : 'text-muted'}
                  strokeWidth={2}
                />
                <span className={`text-xs font-medium ${isActive ? 'text-spark-600 dark:text-spark-400' : 'text-muted'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Focus Timer */}
      <Section title="Focus Timer" icon={Timer}>
        <div className="space-y-4">
          <SliderRow
            label="Focus duration"
            value={settings.focusDurationMinutes}
            unit="min"
            min={5}
            max={90}
            step={5}
            onChange={(v) => onUpdateSettings({ focusDurationMinutes: v })}
          />
          <SliderRow
            label="Short break"
            value={settings.shortBreakMinutes}
            unit="min"
            min={1}
            max={30}
            step={1}
            onChange={(v) => onUpdateSettings({ shortBreakMinutes: v })}
          />
          <SliderRow
            label="Long break"
            value={settings.longBreakMinutes}
            unit="min"
            min={5}
            max={60}
            step={5}
            onChange={(v) => onUpdateSettings({ longBreakMinutes: v })}
          />
          <SliderRow
            label="Sessions before long break"
            value={settings.sessionsBeforeLongBreak}
            unit=""
            min={2}
            max={8}
            step={1}
            onChange={(v) => onUpdateSettings({ sessionsBeforeLongBreak: v })}
          />

          <ToggleRow
            label="Auto-start breaks"
            icon={settings.autoStartBreaks ? Zap : ZapOff}
            value={settings.autoStartBreaks}
            onChange={(v) => onUpdateSettings({ autoStartBreaks: v })}
          />
          <ToggleRow
            label="Sound notifications"
            icon={settings.soundEnabled ? Volume2 : VolumeX}
            value={settings.soundEnabled}
            onChange={(v) => onUpdateSettings({ soundEnabled: v })}
          />
        </div>
      </Section>

      {/* Data Management */}
      <Section title="Data Management" icon={Database}>
        <div className="space-y-3">
          <ActionRow
            icon={Download}
            label="Export data"
            description="Download all tasks and settings as a JSON file"
            onClick={handleExport}
          />
          <ActionRow
            icon={Upload}
            label="Import data"
            description="Restore from a previously exported JSON file"
            onClick={handleImportClick}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          {completedCount > 0 && (
            <ActionRow
              icon={Trash2}
              label="Clear completed tasks"
              description={`Remove ${completedCount} completed task${completedCount !== 1 ? 's' : ''}`}
              onClick={() => setClearCompletedOpen(true)}
              destructive
            />
          )}
          <ActionRow
            icon={Trash2}
            label="Clear all data"
            description="Permanently delete all tasks and settings"
            onClick={() => setClearAllOpen(true)}
            destructive
          />
        </div>
      </Section>

      {/* Privacy & Info */}
      <Section title="Privacy" icon={Shield}>
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <div className="flex items-start gap-2.5">
            <Shield size={16} className="text-sage-500 flex-shrink-0 mt-0.5" />
            <p>
              DaySpark stores all data locally on this device. Your tasks never leave your browser
              and are never sent to any server.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <Info size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p>
              Clearing your browser data or site storage can erase saved tasks. Use Export to
              create a backup before clearing browser data.
            </p>
          </div>
        </div>
      </Section>

      <p className="text-center text-2xs text-faint pt-4 pb-2">
        DaySpark — Make today manageable
      </p>

      {/* Dialogs */}
      <ConfirmDialog
        open={clearAllOpen}
        title="Clear all data?"
        message="This will permanently delete all tasks and settings. This cannot be undone. Consider exporting a backup first."
        confirmLabel="Delete everything"
        destructive
        onConfirm={() => {
          onClearAll();
          setClearAllOpen(false);
          onToast('All data cleared', 'success');
        }}
        onCancel={() => setClearAllOpen(false)}
      />
      <ConfirmDialog
        open={clearCompletedOpen}
        title="Clear completed tasks?"
        message={`This will remove ${completedCount} completed task${completedCount !== 1 ? 's' : ''}. Incomplete tasks will remain.`}
        confirmLabel="Clear completed"
        destructive
        onConfirm={() => {
          onClearCompleted();
          setClearCompletedOpen(false);
          onToast('Completed tasks cleared', 'success');
        }}
        onCancel={() => setClearCompletedOpen(false)}
      />

      {/* Import preview modal */}
      <Modal
        open={importPreviewOpen}
        onClose={() => {
          setImportPreviewOpen(false);
          setImportResult(null);
        }}
        title="Confirm Import"
        footer={
          <>
            <button
              onClick={() => {
                setImportPreviewOpen(false);
                setImportResult(null);
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-default bg-subtle hover:bg-paper-200 dark:hover:bg-ink-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmImport}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-spark-500 hover:bg-spark-600 transition-colors"
            >
              Import & Replace
            </button>
          </>
        }
      >
        {importResult && (
          <div className="space-y-3">
            <p className="text-sm text-default">
              This will <strong>replace all current data</strong> with the imported file:
            </p>
            <div className="bg-subtle rounded-xl p-4 space-y-2">
              <Row label="Tasks to import" value={importResult.tasks.length.toString()} />
              {importResult.skipped > 0 && (
                <Row label="Skipped (invalid)" value={importResult.skipped.toString()} highlight />
              )}
              {importResult.settings && <Row label="Settings" value="Included" />}
              <Row label="Current tasks" value={`${tasks.length} (will be replaced)`} />
            </div>
            <p className="text-xs text-muted">
              Tip: Export your current data first if you want to keep a backup.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Sun; children: React.ReactNode }) {
  return (
    <div className="bg-elevated border border-default rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-muted" strokeWidth={2} />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SliderRow({
  label, value, unit, min, max, step, onChange,
}: {
  label: string; value: number; unit: string; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-default">{label}</span>
        <span className="text-sm font-medium text-spark-500 tabular-nums">
          {value}{unit && ` ${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full"
      />
    </div>
  );
}

function ToggleRow({
  label, icon: Icon, value, onChange,
}: {
  label: string; icon: typeof Zap; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-1 group"
    >
      <div className="flex items-center gap-2.5">
        <Icon size={16} className="text-muted" strokeWidth={2} />
        <span className="text-sm text-default">{label}</span>
      </div>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          value ? 'bg-spark-500' : 'bg-paper-200 dark:bg-ink-700'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-soft transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}

function ActionRow({
  icon: Icon, label, description, onClick, destructive,
}: {
  icon: typeof Download; label: string; description: string; onClick: () => void; destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left p-3 rounded-xl hover:bg-subtle transition-colors group"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          destructive
            ? 'bg-clay-50 dark:bg-clay-900/20 text-clay-500'
            : 'bg-subtle text-muted group-hover:text-spark-500'
        } transition-colors`}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${destructive ? 'text-clay-500' : 'text-default'}`}>{label}</p>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
    </button>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs font-medium ${highlight ? 'text-clay-500' : 'text-default'}`}>{value}</span>
    </div>
  );
}
