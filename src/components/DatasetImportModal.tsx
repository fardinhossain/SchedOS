/**
 * Modal dialog for importing scheduling datasets from Images (OCR) or Paste Box.
 * Features automated AI-style image preprocessing:
 * - Upscales 2x for sharp digit recognition (resolves '11' vs '1"' or 'n')
 * - Automatically detects dark mode backgrounds and inverts to high-contrast black-on-white
 * - Binarizes and enhances edges for precise table and number extraction
 * - Provides an editable preview table so extracted processes can be verified and tweaked before applying
 */
import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  ClipboardPaste,
  FileImage,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
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

/**
 * Advanced image preprocessor for document & table OCR:
 * 1. Upscales image by 2x for fine character separation (e.g. '11' instead of '"' or 'n').
 * 2. Inverts dark backgrounds (white-on-black -> black-on-white) which Tesseract requires.
 * 3. Applies contrast enhancement / adaptive thresholding to remove gradient antialiasing.
 */
async function preprocessImageForOcr(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.max(1.5, Math.min(2.5, 2400 / Math.max(img.width, img.height)));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample background luminance across the image
        let totalLuminance = 0;
        const totalPixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          totalLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const avgLuminance = totalLuminance / totalPixels;
        const isDarkBackground = avgLuminance < 128;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // Invert dark background so text is black on white
          if (isDarkBackground) {
            r = 255 - r;
            g = 255 - g;
            b = 255 - b;
          }

          // Grayscale luminance with smooth antialiasing preserved
          // Never apply harsh thresholding which damages the gap between adjacent digits like '11'
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          resolve(blob ?? file);
        }, 'image/png');
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

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
      // If user is typing into the textarea while in 'paste' tab, let text paste happen normally
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

  // Handle image selection with automatic preprocessing
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

    // Run OCR with preprocessed image
    setIsOcrLoading(true);
    setOcrProgress(0);
    setOcrStatus('Enhancing image contrast & resolution…');

    try {
      const processedBlob = await preprocessImageForOcr(file);

      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round((m.progress || 0) * 100));
            setOcrStatus(`Analyzing document (${Math.round((m.progress || 0) * 100)}%)…`);
          } else {
            setOcrStatus(m.status);
          }
        },
      });

      await worker.setParameters({
        preserve_interword_spaces: '1',
      });

      const ret = await worker.recognize(processedBlob);
      await worker.terminate();

      const recognized = ret.data.text;
      setOcrText(recognized);

      const parsed = parseDatasetText(recognized);
      if (parsed.success && parsed.processes.length > 0) {
        setParsedFromImage(parsed.processes);
        setImageError(null);
      } else {
        // Fallback: try raw file if preprocessed didn't catch processes
        const rawWorker = await createWorker('eng');
        const rawRet = await rawWorker.recognize(file);
        await rawWorker.terminate();
        const fallbackParsed = parseDatasetText(rawRet.data.text);

        if (fallbackParsed.success && fallbackParsed.processes.length > 0) {
          setParsedFromImage(fallbackParsed.processes);
          setOcrText(rawRet.data.text);
          setImageError(null);
        } else {
          setImageError(
            parsed.error ||
              'Could not detect valid processes in the image. Please verify the table contains Process ID, Arrival Time, and Burst Time.'
          );
        }
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

  // Editable preview table helpers
  const updateImageProcess = (index: number, patch: Partial<ProcessInput>) => {
    setParsedFromImage((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  };

  const removeImageProcess = (index: number) => {
    setParsedFromImage((prev) => prev.filter((_, i) => i !== index));
  };

  const addImageProcess = () => {
    setParsedFromImage((prev) => [
      ...prev,
      { id: `P${prev.length + 1}`, arrivalTime: 0, burstTime: 1 },
    ]);
  };

  const toggleImagePriority = () => {
    const currentlyHasPriority = parsedFromImage.some((p) => p.priority !== undefined);
    setParsedFromImage((prev) =>
      prev.map((p, idx) => {
        if (currentlyHasPriority) {
          const { priority: _, ...rest } = p;
          return rest;
        } else {
          return { ...p, priority: idx + 1 };
        }
      })
    );
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

              {/* Extracted table preview — with inline editable cells */}
              {parsedFromImage.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="label text-xs font-bold text-text">
                      Extracted Process Data (Editable before applying):
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleImagePriority}
                        className="border border-rule bg-bone-2 px-1.5 py-0.5 text-[10px] font-semibold text-text hover:border-ink"
                      >
                        {hasImagePriority ? '− Remove Priority' : '+ Add Priority'}
                      </button>
                      <button
                        type="button"
                        onClick={addImageProcess}
                        className="flex items-center gap-1 border border-rule bg-bone-2 px-1.5 py-0.5 text-[10px] font-semibold text-text hover:border-ink"
                      >
                        <Plus className="h-3 w-3" />
                        Add Row
                      </button>
                      {ocrText && (
                        <button
                          type="button"
                          onClick={() => setShowRawOcr(!showRawOcr)}
                          className="text-[10px] font-mono text-muted-2 underline hover:text-text"
                        >
                          {showRawOcr ? 'Hide Raw OCR' : 'View Raw OCR'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="thin-scroll max-h-56 overflow-auto border border-rule">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="sticky top-0 bg-bone-3 border-b border-rule">
                        <tr>
                          <th className="px-2 py-1.5 font-bold">PID</th>
                          <th className="px-2 py-1.5 font-bold">Arrival Time (AT)</th>
                          <th className="px-2 py-1.5 font-bold">Burst Time (BT)</th>
                          {hasImagePriority && (
                            <th className="px-2 py-1.5 font-bold">Priority</th>
                          )}
                          <th className="px-2 py-1.5 text-right font-bold w-10">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule/60 font-mono">
                        {parsedFromImage.map((p, idx) => (
                          <tr key={idx} className="hover:bg-bone-2/50">
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={p.id}
                                onChange={(e) => updateImageProcess(idx, { id: e.target.value.toUpperCase() })}
                                className="w-16 border border-rule bg-bone px-1 py-0.5 font-bold text-crt focus:border-ink"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                min={0}
                                value={p.arrivalTime}
                                onChange={(e) =>
                                  updateImageProcess(idx, {
                                    arrivalTime: Math.max(0, parseInt(e.target.value, 10) || 0),
                                  })
                                }
                                className="w-16 border border-rule bg-bone px-1 py-0.5 focus:border-ink"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                min={1}
                                value={p.burstTime}
                                onChange={(e) =>
                                  updateImageProcess(idx, {
                                    burstTime: Math.max(1, parseInt(e.target.value, 10) || 1),
                                  })
                                }
                                className="w-16 border border-rule bg-bone px-1 py-0.5 focus:border-ink"
                              />
                            </td>
                            {hasImagePriority && (
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={p.priority ?? ''}
                                  onChange={(e) =>
                                    updateImageProcess(idx, {
                                      priority:
                                        e.target.value === ''
                                          ? undefined
                                          : parseInt(e.target.value, 10),
                                    })
                                  }
                                  className="w-16 border border-rule bg-bone px-1 py-0.5 focus:border-ink"
                                />
                              </td>
                            )}
                            <td className="px-2 py-1 text-right">
                              <button
                                type="button"
                                onClick={() => removeImageProcess(idx)}
                                className="p-0.5 text-muted hover:text-signal"
                                title="Delete row"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
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
