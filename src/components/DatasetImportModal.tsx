/**
 * Modal dialog for importing scheduling datasets from Images (OCR) or Paste Box.
 * Supports image drag-and-drop, file browsing, and direct clipboard image pasting (Ctrl+V).
 * Solid non-transparent retro styling with dynamic priority column detection.
 */
import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  ClipboardPaste,
  FileImage,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import type { ProcessInput } from '../types/scheduling';
import { parseDatasetText } from '../engine/datasetParser';

interface DatasetImportModalProps {
  isOpen: boolean;
  initialTab?: 'image' | 'paste';
  onClose: () => void;
  onApply: (processes: ProcessInput[]) => void;
}

const SAMPLE_PASTE_TEXT = `P1  AT=0  BT=5  PRI=2
P2  AT=1  BT=3  PRI=1
P3  AT=2  BT=8  PRI=3
P4  AT=3  BT=4  PRI=2`;

export function DatasetImportModal({
  isOpen,
  initialTab = 'paste',
  onClose,
  onApply,
}: DatasetImportModalProps) {
  const [tab, setTab] = useState<'image' | 'paste'>(initialTab);

  // Paste Box state — empty by default, no pre-arranged text
  const [pastedText, setPastedText] = useState('');
  const [parsedFromPaste, setParsedFromPaste] = useState(parseDatasetText(''));

  // Image Upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [parsedFromImage, setParsedFromImage] = useState<ProcessInput[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showRawOcr, setShowRawOcr] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  // Live parse text when pastedText changes
  useEffect(() => {
    setParsedFromPaste(parseDatasetText(pastedText));
  }, [pastedText]);

  // Handle clipboard paste for images (e.g. screenshot pasted with Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // If user is pasting into the textarea while in 'paste' tab, let text paste happen normally
      if (tab === 'paste' && (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setTab('image');
            handleImageFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, tab]);

  // Handle image selection
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }
    setImageFile(file);
    setImageError(null);
    setParsedFromImage([]);
    setOcrText('');

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Run OCR
    setIsOcrLoading(true);
    setOcrProgress(0);
    setOcrStatus('Initializing OCR engine…');

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round((m.progress || 0) * 100));
            setOcrStatus(`Analyzing image (${Math.round((m.progress || 0) * 100)}%)…`);
          } else {
            setOcrStatus(m.status);
          }
        },
      });

      const ret = await worker.recognize(file);
      await worker.terminate();

      const recognized = ret.data.text;
      setOcrText(recognized);

      const parsed = parseDatasetText(recognized);
      if (parsed.success && parsed.processes.length > 0) {
        setParsedFromImage(parsed.processes);
        setImageError(null);
      } else {
        setImageError(
          parsed.error ||
            'Could not detect valid processes in the image. Please verify the table contains Process ID, Arrival Time, and Burst Time.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process image';
      setImageError(`OCR Error: ${msg}. You can try the Paste Box instead.`);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handlePasteImageFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.read) {
        setImageError('Direct clipboard read requires permission or Ctrl+V in your browser.');
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'clipboard-image.png', { type: imageType });
          handleImageFile(file);
          return;
        }
      }
      setImageError('No image found in clipboard. Please copy an image or take a screenshot first.');
    } catch {
      setImageError('Please press Ctrl+V while this dialog is open to paste your clipboard image.');
    }
  };

  const handleApplyPaste = () => {
    if (parsedFromPaste.success && parsedFromPaste.processes.length > 0) {
      onApply(parsedFromPaste.processes);
      onClose();
    }
  };

  const handleApplyImage = () => {
    if (parsedFromImage.length > 0) {
      onApply(parsedFromImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  const hasPastePriority = parsedFromPaste.processes.some((p) => p.priority !== undefined);
  const hasImagePriority = parsedFromImage.some((p) => p.priority !== undefined);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dataset-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col border-2 border-ink bg-bone text-text shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-rule bg-bone-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="h-2.5 w-2.5 bg-crt" />
            <h2 id="import-dataset-title" className="label text-sm font-bold text-text">
              Import Scheduling Dataset
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-rule p-1 text-muted-2 transition-colors hover:border-ink hover:text-text"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Tab switch */}
        <div className="flex border-b border-rule bg-bone-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('image')}
            className={[
              'flex flex-1 items-center justify-center gap-2 border-r border-rule py-2.5 transition-colors',
              tab === 'image'
                ? 'bg-bone font-bold text-crt border-b-2 border-b-crt'
                : 'text-muted-2 hover:bg-bone-3 hover:text-text',
            ].join(' ')}
          >
            <FileImage className="h-4 w-4" />
            From Image (OCR & Paste)
          </button>
          <button
            type="button"
            onClick={() => setTab('paste')}
            className={[
              'flex flex-1 items-center justify-center gap-2 py-2.5 transition-colors',
              tab === 'paste'
                ? 'bg-bone font-bold text-crt border-b-2 border-b-crt'
                : 'text-muted-2 hover:bg-bone-3 hover:text-text',
            ].join(' ')}
          >
            <ClipboardPaste className="h-4 w-4" />
            From Paste Box
          </button>
        </div>

        {/* Body */}
        <div className="thin-scroll flex-1 overflow-y-auto bg-bone p-4 space-y-4">
          {tab === 'image' ? (
            /* ── Image Upload Mode ────────────────────────────────── */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleImageFile(e.dataTransfer.files[0]);
                  }
                }}
                className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-ink/40 bg-bone-2 p-6 text-center transition-colors hover:border-ink hover:bg-bone-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                  }}
                />
                <Upload className="mb-2 h-7 w-7 text-muted-2" />
                <p className="text-xs font-bold text-text">
                  Drag & Drop an image, or <span className="text-crt underline">browse files</span>
                </p>
                <p className="mt-1 text-[11px] text-muted-2">
                  Or paste directly from clipboard using <kbd className="border border-rule bg-bone px-1 py-0.5 font-mono text-[10px] text-text font-bold">Ctrl+V</kbd>
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePasteImageFromClipboard();
                  }}
                  className="mt-3 flex items-center gap-1.5 border border-ink bg-bone px-2.5 py-1 text-[11px] font-bold text-text transition-colors hover:bg-ink hover:text-bone"
                >
                  <ClipboardPaste className="h-3.5 w-3.5 text-crt" />
                  Paste from Clipboard
                </button>
              </div>

              {/* Progress bar */}
              {isOcrLoading && (
                <div className="border border-rule bg-bone-2 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-mono text-muted">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-crt" />
                      {ocrStatus}
                    </span>
                    <span className="font-mono font-bold text-crt">{ocrProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden bg-bone-3">
                    <div
                      className="h-full bg-crt transition-all duration-200"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* File details & extracted count */}
              {imagePreview && (
                <div className="flex items-center gap-3 border border-rule bg-bone-2 p-2.5">
                  <img
                    src={imagePreview}
                    alt="Uploaded table preview"
                    className="max-h-24 max-w-[120px] rounded border border-rule object-contain bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate text-text">{imageFile?.name}</p>
                    <p className="font-mono text-[11px] text-muted-2">
                      {imageFile ? (imageFile.size / 1024).toFixed(1) + ' KB' : ''}
                    </p>
                    {parsedFromImage.length > 0 && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded bg-crt/15 px-1.5 py-0.5 text-[10px] font-bold text-crt">
                        <Check className="h-3 w-3" />
                        {parsedFromImage.length} processes extracted
                      </span>
                    )}
                  </div>
                </div>
              )}

              {imageError && (
                <div className="flex items-start gap-2 border border-signal bg-signal/10 p-3 text-xs text-signal">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-bold">Extraction Failed</p>
                    <p className="mt-0.5 leading-relaxed">{imageError}</p>
                  </div>
                </div>
              )}

              {/* Extracted table preview */}
              {parsedFromImage.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="label text-xs font-bold text-text">
                      Extracted Process Data (Verify before applying):
                    </h3>
                    {ocrText && (
                      <button
                        type="button"
                        onClick={() => setShowRawOcr(!showRawOcr)}
                        className="text-[11px] font-mono text-muted-2 underline hover:text-text"
                      >
                        {showRawOcr ? 'Hide Raw OCR' : 'View Raw OCR'}
                      </button>
                    )}
                  </div>

                  <div className="thin-scroll max-h-48 overflow-auto border border-rule">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="sticky top-0 bg-bone-3 border-b border-rule">
                        <tr>
                          <th className="px-2 py-1.5 font-bold">PID</th>
                          <th className="px-2 py-1.5 font-bold">Arrival Time (AT)</th>
                          <th className="px-2 py-1.5 font-bold">Burst Time (BT)</th>
                          {hasImagePriority && (
                            <th className="px-2 py-1.5 font-bold">Priority</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule/60 font-mono">
                        {parsedFromImage.map((p, idx) => (
                          <tr key={idx} className="hover:bg-bone-2/50">
                            <td className="px-2 py-1.5 font-bold text-crt">{p.id}</td>
                            <td className="px-2 py-1.5">{p.arrivalTime}</td>
                            <td className="px-2 py-1.5">{p.burstTime}</td>
                            {hasImagePriority && (
                              <td className="px-2 py-1.5">{p.priority ?? '—'}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {showRawOcr && (
                    <pre className="max-h-24 overflow-auto border border-rule bg-bone-3/60 p-2 font-mono text-[10px] text-muted">
                      {ocrText}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── Paste Box Mode ──────────────────────────────────── */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="dataset-textarea" className="label text-xs text-muted-2">
                  Paste scheduling problem or table:
                </label>
                <button
                  type="button"
                  onClick={() => setPastedText(SAMPLE_PASTE_TEXT)}
                  className="flex items-center gap-1 font-mono text-[11px] text-crt hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  Load Sample Text
                </button>
              </div>

              <textarea
                id="dataset-textarea"
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste scheduling questions or table here, e.g.:&#10;P1  AT=0  BT=5  PRI=2&#10;P2  AT=1  BT=3  PRI=1&#10;P3  AT=2  BT=8  PRI=3"
                className="w-full border border-rule bg-bone-2 p-2.5 font-mono text-xs text-text focus:border-ink focus:outline-none"
              />

              {/* Status and preview table based on pasted text */}
              {!pastedText.trim() ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-rule bg-bone-2/60 p-6 text-center text-xs text-muted-2">
                  <p className="font-semibold text-text">Paste your scheduling data above to generate the process table</p>
                  <p className="mt-1 text-[11px]">
                    Supports space/tab separated values, CSV, Markdown tables, or key-value format (e.g. P1 AT=0 BT=5 PRI=2).
                  </p>
                </div>
              ) : parsedFromPaste.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-crt">
                    <Check className="h-3.5 w-3.5" />
                    <span>Successfully parsed {parsedFromPaste.processes.length} processes:</span>
                  </div>

                  <div className="thin-scroll max-h-48 overflow-auto border border-rule">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="sticky top-0 bg-bone-3 border-b border-rule">
                        <tr>
                          <th className="px-2 py-1.5 font-bold">PID</th>
                          <th className="px-2 py-1.5 font-bold">Arrival Time (AT)</th>
                          <th className="px-2 py-1.5 font-bold">Burst Time (BT)</th>
                          {hasPastePriority && (
                            <th className="px-2 py-1.5 font-bold">Priority</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule/60 font-mono">
                        {parsedFromPaste.processes.map((p, idx) => (
                          <tr key={idx} className="hover:bg-bone-2/50">
                            <td className="px-2 py-1.5 font-bold text-crt">{p.id}</td>
                            <td className="px-2 py-1.5">{p.arrivalTime}</td>
                            <td className="px-2 py-1.5">{p.burstTime}</td>
                            {hasPastePriority && (
                              <td className="px-2 py-1.5">{p.priority ?? '—'}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 border border-signal bg-signal/10 p-2.5 text-xs text-signal">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{parsedFromPaste.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-rule bg-bone-3 px-4 py-2.5">
          <p className="font-mono text-[11px] text-muted-2">
            Tip: Process IDs, arrival times, and burst times are validated automatically.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-rule px-3 py-1.5 text-xs font-semibold text-muted hover:border-ink hover:text-text"
            >
              Cancel
            </button>
            {tab === 'image' ? (
              <button
                type="button"
                onClick={handleApplyImage}
                disabled={parsedFromImage.length === 0}
                className="flex items-center gap-1.5 border border-ink bg-crt px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-crt-dim disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" />
                Apply Extracted Dataset
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyPaste}
                disabled={!parsedFromPaste.success || parsedFromPaste.processes.length === 0}
                className="flex items-center gap-1.5 border border-ink bg-crt px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-crt-dim disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" />
                Apply Dataset
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
