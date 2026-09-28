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

interface ParsedProcessWithRaw extends ProcessInput {
  _rawTokens?: {
    id?: string;
    at?: string;
    bt?: string;
    pri?: string;
  };
}

/** Safely parses a token into a number, handling OCR edge cases (e.g. '1"' or 'n' for 11, 'O'/'o' for 0, stray brackets, letter confusion). */
export function parseCleanNumber(token: string | undefined): number {
  if (token === undefined) return NaN;
  let t = token.trim();
  if (!t) return NaN;

  // Standalone OCR confusions
  if (/^[OoQq]$/.test(t)) return 0;
  if (/^[lI|!]$/.test(t)) return 1;
  if (/^(?:1["'’]|["'’]1|ll|1l|l1|II|1I|\|\||n|m|1m"|1n"|1m|1n|m1|n1)$/i.test(t)) return 11;
  if (/^["'’]{1,2}$/.test(t)) return 11;
  if (/^[\[(]3$/.test(t)) return 6; // OCR confusion where '6' becomes '[3' or '(3'
  if (/^[aA]$/.test(t)) return 4;
  if (/^[sS]$/.test(t)) return 5;
  if (/^[bB]$/.test(t)) return 8;
  if (/^[gq]$/.test(t)) return 9;

  // Bracket and quote edge cases (e.g. 1] -> 41, 4] -> 41, a] -> 41)
  if (/^1[\])}]$/.test(t)) return 41;
  if (/^[4aA][\])}]$/.test(t)) return 41;
  if (/^2[\])}]$/.test(t)) return 21;

  // If token ends with quote e.g. 1" -> 11, 1' -> 11
  if (/^(\d+)["'’]+$/.test(t)) {
    const m = t.match(/^(\d+)["'’]+$/);
    if (m) {
      return parseInt(m[1] + '1', 10);
    }
  }

  // Letters replacing digits in numbers (e.g. a1 -> 41, 1a -> 14, s3 -> 53)
  if (/^[aA](\d+)$/.test(t)) {
    return parseInt('4' + t.slice(1), 10);
  }
  if (/^(\d+)[aA]$/.test(t)) {
    return parseInt(t.slice(0, -1) + '4', 10);
  }
  if (/^[sS](\d+)$/.test(t)) {
    return parseInt('5' + t.slice(1), 10);
  }
  if (/^(\d+)[sS]$/.test(t)) {
    return parseInt(t.slice(0, -1) + '5', 10);
  }
  if (/^[bB](\d+)$/.test(t)) {
    return parseInt('8' + t.slice(1), 10);
  }
  if (/^(\d+)[bB]$/.test(t)) {
    return parseInt(t.slice(0, -1) + '8', 10);
  }
  if (/^[oO](\d+)$/.test(t)) {
    return parseInt(t.slice(1), 10);
  }
  if (/^(\d+)[oO]$/.test(t)) {
    return parseInt(t.slice(0, -1) + '0', 10);
  }
  if (/^(\d+)(?:il|l|I|!)$/i.test(t)) {
    const m = t.match(/^(\d+)(?:il|l|I|!)$/i);
    if (m) return parseInt(m[1] + '1', 10);
  }

  // Replace vertical-bar, pipe, lowercase l or uppercase I surrounded by digits with 1
  t = t
    .replace(/(?<=\d)[lI|!](?=\d)/g, '1')
    .replace(/^[lI|!](?=\d)/g, '1')
    .replace(/(?<=\d)[lI|!]$/g, '1');

  if (/^-?\d+$/.test(t)) return parseInt(t, 10);

  const stripped = t.replace(/[^\d-]/g, '');
  if (!stripped) return NaN;
  return parseInt(stripped, 10);
}

/** Cleans PID, correcting common OCR misreadings like Pa -> P4, PB/PG -> P8 */
function cleanPid(rawId: string): string {
  let id = rawId.toUpperCase();
  if (id === 'PA') return 'P4';
  if (id === 'PL' || id === 'PI') return 'P1';
  if (id === 'PO') return 'P0';
  if (id === 'PB' || id === 'PG') return 'P8';
  if (id === 'PS') return 'P5';
  if (!id.startsWith('P')) {
    id = `P${id}`;
  }
  return id;
}

/**
 * Attempts to parse a single line into a ProcessInput.
 */
function parseLine(line: string, defaultIndex: number): ParsedProcessWithRaw | null {
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
      _rawTokens: {
        id: kvIdMatch ? kvIdMatch[1] : undefined,
        at: kvAtMatch[1],
        bt: kvBtMatch[1],
        pri: kvPriMatch ? kvPriMatch[1] : undefined,
      },
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
      _rawTokens: {
        id: nlIdMatch ? nlIdMatch[1] : undefined,
        at: nlAtMatch[1],
        bt: nlBtMatch[1],
        pri: nlPriMatch ? nlPriMatch[1] : undefined,
      },
    };
  }

  // 3. Delimited row format (table / CSV / TSV / space / Markdown table)
  // Replace delimiters with single space
  const normalized = trimmed
    .replace(/[|\t,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = normalized.split(' ').filter((t) => t.length > 0);

  if (tokens.length >= 2) {
    const rawIdToken = tokens[0].replace(/^[\[(\{"']+|[\])\}"':,]+$/g, '');
    // Check if first token is PID (e.g. "P1", "p2", "Job1", "A") or a number
    const isFirstTokenId = /^[A-Za-z]\w*$/i.test(rawIdToken);

    if (isFirstTokenId) {
      const id = cleanPid(rawIdToken);
      const at = parseCleanNumber(tokens[1]);
      const bt = parseCleanNumber(tokens[2]);
      const pri = tokens[3] !== undefined ? parseCleanNumber(tokens[3]) : undefined;

      if (!isNaN(at) && !isNaN(bt)) {
        return {
          id,
          arrivalTime: Math.max(0, at),
          burstTime: Math.max(1, bt),
          ...(pri !== undefined && !isNaN(pri) ? { priority: pri } : {}),
          _rawTokens: {
            id: tokens[0],
            at: tokens[1],
            bt: tokens[2],
            pri: tokens[3],
          },
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
          _rawTokens: {
            id: tokens[0],
            at: tokens[1],
            bt: tokens[2],
            pri: tokens[3],
          },
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
            _rawTokens: {
              id: tokens[0],
              at: tokens[1],
              bt: tokens[2],
            },
          };
        }
        return {
          id: `P${defaultIndex}`,
          arrivalTime: Math.max(0, num0),
          burstTime: Math.max(1, num1),
          priority: num2,
          _rawTokens: {
            at: tokens[0],
            bt: tokens[1],
            pri: tokens[2],
          },
        };
      }

      // 2 numbers: AT BT
      if (!isNaN(num0) && !isNaN(num1)) {
        return {
          id: `P${defaultIndex}`,
          arrivalTime: Math.max(0, num0),
          burstTime: Math.max(1, num1),
          _rawTokens: {
            at: tokens[0],
            bt: tokens[1],
          },
        };
      }
    }
  }

  return null;
}

/**
 * Reconciles process IDs when the majority follow sequential P1, P2, P3...
 * Corrects OCR misrecognitions (such as 'P8' parsed as 'P22' or 'P23' due to bracket artifacts).
 */
export function reconcileProcessSequence(processes: ProcessInput[]): ProcessInput[] {
  if (processes.length < 3) return processes;

  const pidNumbers = processes.map((p) => {
    const m = p.id.match(/^P(\d+)$/i);
    return m ? parseInt(m[1], 10) : null;
  });

  const validPidCount = pidNumbers.filter((n) => n !== null).length;
  // If at least 60% of the rows follow P{number} format
  if (validPidCount / processes.length < 0.6) {
    return processes;
  }

  return processes.map((p, i) => {
    const currentNum = pidNumbers[i];
    const prevNum = i > 0 ? pidNumbers[i - 1] : null;
    const nextNum = i < processes.length - 1 ? pidNumbers[i + 1] : null;

    // Case 1: Sandwiched between P(k-1) and P(k+1) e.g. P7, [corrupted/P22], P9 -> P8
    if (prevNum !== null && nextNum !== null && nextNum - prevNum === 2) {
      const expected = prevNum + 1;
      if (currentNum !== expected) {
        return { ...p, id: `P${expected}` };
      }
    }

    // Case 2: Consistent sequence P1, P2, P3... where prevNum === i and currentNum is out of order
    if (prevNum !== null && prevNum === i && currentNum !== i + 1) {
      if (nextNum === null || nextNum === i + 2) {
        return { ...p, id: `P${i + 1}` };
      }
    }

    return p;
  });
}

/**
 * Reconciles columns where OCR truncated '11' into '1' in tables that use leading zeros (e.g. 01..09)
 * or are predominantly two-digit numbers (>= 10).
 */
export function reconcileColumnDoubleNumbers(processes: ParsedProcessWithRaw[]): ProcessInput[] {
  if (processes.length < 3) {
    return processes.map(({ _rawTokens, ...rest }) => rest);
  }

  const checkColumn = (colName: 'arrivalTime' | 'burstTime' | 'priority', rawKey: 'at' | 'bt' | 'pri') => {
    const rawTokens = processes.map((p) => (p._rawTokens ? p._rawTokens[rawKey] : undefined)).filter(Boolean) as string[];
    const values = processes.map((p) => p[colName]).filter((v): v is number => v !== undefined);

    if (values.length < 3) return;

    // Check if column uses leading zero padding (e.g. '01', '02', '07', etc.)
    const hasLeadingZeros = rawTokens.some((t) => /^0[1-9]/.test(t.trim()));
    // Check if column is predominantly >= 10
    const ratioGe10 = values.filter((v) => v >= 10).length / values.length;

    if (hasLeadingZeros || ratioGe10 >= 0.6) {
      for (const p of processes) {
        if (p[colName] === 1) {
          const raw = p._rawTokens ? p._rawTokens[rawKey] : '';
          // If raw token did NOT have a leading zero (e.g. was '1', '1"', '1m', 'n', etc. NOT '01')
          if (!/^0+[1-9]/.test(raw ? raw.trim() : '')) {
            p[colName] = 11;
          }
        }
      }
    }
  };

  checkColumn('arrivalTime', 'at');
  checkColumn('burstTime', 'bt');
  checkColumn('priority', 'pri');

  // Strip internal _rawTokens before returning
  return processes.map(({ _rawTokens, ...rest }) => rest);
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

  const processes: ParsedProcessWithRaw[] = [];
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

  // 1. Reconcile and recover sequence numbers (e.g. P1..P7, [corrupted/P22], P9 -> P8)
  const sequenceReconciled = reconcileProcessSequence(processes);
  // 2. Reconcile column double numbers (e.g. '1' -> 11 when padded or predominantly >= 10)
  const columnReconciled = reconcileColumnDoubleNumbers(sequenceReconciled as ParsedProcessWithRaw[]);

  // Ensure unique process IDs
  const seenIds = new Set<string>();
  const deduplicatedProcesses = columnReconciled.map((p, idx) => {
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
