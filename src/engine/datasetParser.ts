/**
 * Robust text parser for scheduling datasets.
 *
 * Supports:
 *  - Key-value pairs: "P1 AT=0 BT=5 PRI=2", "P1 at:0 bt:5"
 *  - Table rows: "P1 0 5 2", "P1, 0, 5, 2", "P1\t0\t5\t2"
 *  - Markdown tables: "| Process | Arrival | Burst | Priority |"
 *  - Natural language sentences: "Process P1 arrival 0 burst 5 priority 2"
 *  - Headless numbers: "0 5", "0 5 1"
 */
import type { ProcessInput } from '../types/scheduling';

export interface ParseResult {
  success: boolean;
  processes: ProcessInput[];
  error?: string;
  detectedFormat?: string;
  warnings?: string[];
}

/** Check if a line is likely a header row. */
function isHeaderLine(line: string): boolean {
  const clean = line.replace(/[|\t,;:]/g, ' ').toLowerCase().trim();
  const words = clean.split(/\s+/);
  const headerTerms = ['pid', 'process', 'job', 'p_id', 'arrival', 'burst', 'at', 'bt', 'pri', 'priority', 'time'];
  const matches = words.filter((w) => headerTerms.includes(w));
  // If at least 2 words match standard header terms, it is a header row
  return matches.length >= 2;
}

/** Clean OCR noise like pipes, brackets, and extra punctuation. */
function cleanLine(raw: string): string {
  return raw
    .trim()
    .replace(/^[|\-_+=~`*#\s]+|[|\-_+=~`*#\s]+$/g, '')
    .trim();
}

/** Safely parses a token into a number, handling OCR edge cases (e.g. 'O'/'o' for 0, stray brackets). */
function parseCleanNumber(token: string | undefined): number {
  if (token === undefined) return NaN;
  const t = token.trim();
  if (/^[Oo]$/.test(t)) return 0;
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  const stripped = t.replace(/[^\d-]/g, '');
  if (!stripped) return NaN;
  return parseInt(stripped, 10);
}

/**
 * Attempts to parse a single line into a ProcessInput.
 */
function parseLine(line: string, defaultIndex: number): ProcessInput | null {
  const trimmed = cleanLine(line);
  if (!trimmed || isHeaderLine(trimmed) || /^[-\s|=+]+$/.test(trimmed)) {
    return null;
  }

  // 1. Try Key-Value format: "P1 AT=0 BT=5 PRI=2", "Process P1 at:0, bt:5, pri:1"
  const kvIdMatch = trimmed.match(/(?:(?:PID|Process|Job)\s*[:=]?\s*|^)([A-Za-z]\w*|\d+)/i);
  const kvAtMatch = trimmed.match(/(?:AT|Arrival(?:\s*Time)?)\s*[:=]\s*(\d+)/i);
  const kvBtMatch = trimmed.match(/(?:BT|Burst(?:\s*Time)?)\s*[:=]\s*(\d+)/i);
  const kvPriMatch = trimmed.match(/(?:PRI|Priority)\s*[:=]\s*(\d+)/i);

  if (kvAtMatch && kvBtMatch) {
    const id = kvIdMatch ? kvIdMatch[1].toUpperCase() : `P${defaultIndex}`;
    const formattedId = id.startsWith('P') ? id : `P${id}`;
    const pri = kvPriMatch ? parseInt(kvPriMatch[1], 10) : undefined;
    return {
      id: formattedId,
      arrivalTime: parseInt(kvAtMatch[1], 10),
      burstTime: Math.max(1, parseInt(kvBtMatch[1], 10)),
      ...(pri !== undefined && !isNaN(pri) ? { priority: pri } : {}),
    };
  }

  // 2. Try Natural language format: "Process P1 with arrival time 0 and burst 5"
  const nlAtMatch = trimmed.match(/arrival(?:\s*time)?\s*(?:is|at)?\s*(\d+)/i);
  const nlBtMatch = trimmed.match(/burst(?:\s*time)?\s*(?:is|of)?\s*(\d+)/i);
  const nlPriMatch = trimmed.match(/priority\s*(?:is|of)?\s*(\d+)/i);
  const nlIdMatch = trimmed.match(/process\s+([A-Za-z0-9]+)/i);

  if (nlAtMatch && nlBtMatch) {
    const id = nlIdMatch ? nlIdMatch[1].toUpperCase() : `P${defaultIndex}`;
    const formattedId = id.startsWith('P') ? id : `P${id}`;
    const pri = nlPriMatch ? parseInt(nlPriMatch[1], 10) : undefined;
    return {
      id: formattedId,
      arrivalTime: parseInt(nlAtMatch[1], 10),
      burstTime: Math.max(1, parseInt(nlBtMatch[1], 10)),
      ...(pri !== undefined && !isNaN(pri) ? { priority: pri } : {}),
    };
  }

  // 3. Delimited row format (table / CSV / TSV / space / Markdown table)
  // Replace delimiters with single space
  const normalized = trimmed
    .replace(/[|\t,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = normalized.split(' ');

  if (tokens.length >= 2) {
    // Check if first token is PID (e.g. "P1", "p2", "Job1", "A") or a number
    const isFirstTokenId = /^[A-Za-z]\w*$/i.test(tokens[0]);

    if (isFirstTokenId) {
      const id = tokens[0].toUpperCase();
      const at = parseCleanNumber(tokens[1]);
      const bt = parseCleanNumber(tokens[2]);
      const pri = tokens[3] !== undefined ? parseCleanNumber(tokens[3]) : undefined;

      if (!isNaN(at) && !isNaN(bt)) {
        return {
          id: id.startsWith('P') || isNaN(Number(id.slice(1))) ? id : id,
          arrivalTime: Math.max(0, at),
          burstTime: Math.max(1, bt),
          ...(pri !== undefined && !isNaN(pri) ? { priority: pri } : {}),
        };
      }
    } else {
      // First token is a number: e.g. "1 0 5 2" (PID=1, AT=0, BT=5, PRI=2) or "0 5" (AT=0, BT=5)
      const num0 = parseCleanNumber(tokens[0]);
      const num1 = parseCleanNumber(tokens[1]);
      const num2 = tokens[2] !== undefined ? parseCleanNumber(tokens[2]) : undefined;
      const num3 = tokens[3] !== undefined ? parseCleanNumber(tokens[3]) : undefined;

      // 4 numbers: PID AT BT PRI (e.g. 1 0 5 2)
      if (
        tokens.length >= 4 &&
        !isNaN(num0) &&
        !isNaN(num1) &&
        num2 !== undefined &&
        !isNaN(num2) &&
        num3 !== undefined &&
        !isNaN(num3)
      ) {
        return {
          id: `P${num0}`,
          arrivalTime: Math.max(0, num1),
          burstTime: Math.max(1, num2),
          priority: num3,
        };
      }

      // 3 numbers: could be (PID AT BT) or (AT BT PRI)
      if (tokens.length === 3 && !isNaN(num0) && !isNaN(num1) && num2 !== undefined && !isNaN(num2)) {
        // If first number looks like a sequence 1, 2, 3... treat as PID AT BT (no priority)
        if (num0 === defaultIndex || num0 <= 50) {
          return {
            id: `P${num0}`,
            arrivalTime: Math.max(0, num1),
            burstTime: Math.max(1, num2),
          };
        }
        return {
          id: `P${defaultIndex}`,
          arrivalTime: Math.max(0, num0),
          burstTime: Math.max(1, num1),
          priority: num2,
        };
      }

      // 2 numbers: AT BT
      if (!isNaN(num0) && !isNaN(num1)) {
        return {
          id: `P${defaultIndex}`,
          arrivalTime: Math.max(0, num0),
          burstTime: Math.max(1, num1),
        };
      }
    }
  }

  return null;
}

/**
 * Parses multi-line scheduling dataset text into ProcessInput[].
 */
export function parseDatasetText(text: string): ParseResult {
  if (!text || !text.trim()) {
    return {
      success: false,
      processes: [],
      error: 'Input text is empty. Please paste your scheduling data.',
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const processes: ProcessInput[] = [];
  const warnings: string[] = [];

  let processIndex = 1;
  for (const line of lines) {
    if (isHeaderLine(line) || /^[|\s\-+=:]+$/.test(line)) {
      continue;
    }
    const proc = parseLine(line, processIndex);
    if (proc) {
      processes.push(proc);
      processIndex++;
    } else {
      // Don't warn for single words or comments
      if (line.length > 3 && !line.startsWith('#') && !line.startsWith('//')) {
        warnings.push(`Skipped unrecognized line: "${line.slice(0, 40)}"`);
      }
    }
  }

  if (processes.length === 0) {
    return {
      success: false,
      processes: [],
      error:
        'Could not detect any valid processes. Expected columns like: Process ID, Arrival Time, and Burst Time (e.g. "P1 AT=0 BT=5" or "P1 0 5").',
      warnings,
    };
  }

  // Ensure unique process IDs
  const seenIds = new Set<string>();
  const deduplicatedProcesses = processes.map((p, idx) => {
    let finalId = p.id;
    if (seenIds.has(finalId)) {
      finalId = `${p.id}_${idx + 1}`;
    }
    seenIds.add(finalId);
    return {
      ...p,
      id: finalId,
    };
  });

  return {
    success: true,
    processes: deduplicatedProcesses,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
