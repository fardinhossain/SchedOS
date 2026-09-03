/**
 * Code Examples page — dedicated section for exam-ready, memorable reference implementations.
 * All implementations take live user input in C, Python, and TypeScript.
 */
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  FileCode2,
  Lock,
  Play,
  Terminal,
  Zap,
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import type { LabState } from '../App';
import type { PageId } from '../components/Sidebar';
import { PageHeader } from '../components/Sidebar';
import { Panel } from '../components/Panel';
import type { AlgorithmId, SupportedLanguage } from '../types/scheduling';
import { ALGORITHMS, ALGORITHM_MAP } from '../algorithms';
import { LANGUAGES, getCode } from '../codeExamples';

interface CodeExamplesProps {
  lab: LabState;
  onNavigate: (page: PageId) => void;
}

const MEMORY_TIPS: Record<
  AlgorithmId,
  {
    ruleSummary: string;
    stepLogic: string;
    examTrap: string;
    sampleInput: string[];
    sampleOutput: string[];
  }
> = {
  fcfs: {
    ruleSummary: 'First Come First Serve: execute processes in arrival order.',
    stepLogic:
      'Sort by AT. Then for each process: CT = max(currentTime, AT) + BT. TAT = CT - AT, WT = TAT - BT.',
    examTrap:
      'Remember CPU idle periods: if arrival time > current time, current time must jump forward to AT!',
    sampleInput: [
      'Enter number of processes: 3',
      'Process 1 (ID Arrival Burst): P1 0 5',
      'Process 2 (ID Arrival Burst): P2 1 3',
      'Process 3 (ID Arrival Burst): P3 2 1',
    ],
    sampleOutput: [
      'PID\tAT\tBT\tCT\tTAT\tWT\tRT',
      'P1\t0\t5\t5\t5\t0\t0',
      'P2\t1\t3\t8\t7\t4\t4',
      'P3\t2\t1\t9\t7\t6\t6',
      '',
      'Average Turnaround Time: 6.33',
      'Average Waiting Time   : 3.33',
    ],
  },
  sjf: {
    ruleSummary: 'Shortest Job First: pick arrived process with minimum burst time (run to completion).',
    stepLogic:
      'Loop while completed < n: scan arrived processes (AT <= currentTime), pick minimum BT, run for full BT, mark done.',
    examTrap:
      'Only consider processes that have already ARRIVED (AT <= currentTime). If none arrived, increment time by 1.',
    sampleInput: [
      'Enter number of processes: 4',
      'Process 1 (ID Arrival Burst): P1 0 7',
      'Process 2 (ID Arrival Burst): P2 2 4',
      'Process 3 (ID Arrival Burst): P3 4 1',
      'Process 4 (ID Arrival Burst): P4 5 4',
    ],
    sampleOutput: [
      'PID\tAT\tBT\tCT\tTAT\tWT\tRT',
      'P1\t0\t7\t7\t7\t0\t0',
      'P3\t4\t1\t8\t4\t3\t3',
      'P2\t2\t4\t12\t10\t6\t6',
      'P4\t5\t4\t16\t11\t7\t7',
      '',
      'Average Turnaround Time: 8.00',
      'Average Waiting Time   : 4.00',
    ],
  },
  ljf: {
    ruleSummary: 'Longest Job First: pick arrived process with maximum burst time (run to completion).',
    stepLogic:
      'Exact mirror of SJF: among arrived processes (AT <= currentTime), pick maximum BT, run to completion.',
    examTrap:
      'Used as a theoretical counter-example demonstrating maximum convoy effect and worst waiting times.',
    sampleInput: [
      'Enter number of processes: 3',
      'Process 1 (ID Arrival Burst): P1 0 2',
      'Process 2 (ID Arrival Burst): P2 0 8',
      'Process 3 (ID Arrival Burst): P3 0 4',
    ],
    sampleOutput: [
      'PID\tAT\tBT\tCT\tTAT\tWT\tRT',
      'P2\t0\t8\t8\t8\t0\t0',
      'P3\t0\t4\t12\t12\t8\t8',
      'P1\t0\t2\t14\t14\t12\t12',
      '',
      'Average Turnaround Time: 11.33',
      'Average Waiting Time   : 6.67',
    ],
  },
  'priority-np': {
    ruleSummary: 'Priority Non-Preemptive: pick arrived process with highest priority (lowest number).',
    stepLogic:
      'Scan arrived & unfinished processes, pick min priority value, run to completion, advance time = CT.',
    examTrap:
      'Convention: Lower numerical value means HIGHER priority (e.g. Priority 1 > Priority 4).',
    sampleInput: [
      'Enter number of processes: 3',
      'Process 1 (ID Arrival Burst Priority): P1 0 4 2',
      'Process 2 (ID Arrival Burst Priority): P2 1 3 1',
      'Process 3 (ID Arrival Burst Priority): P3 2 1 3',
    ],
    sampleOutput: [
      'PID\tAT\tBT\tPRI\tCT\tTAT\tWT\tRT',
      'P1\t0\t4\t2\t4\t4\t0\t0',
      'P2\t1\t3\t1\t7\t6\t3\t3',
      'P3\t2\t1\t3\t8\t6\t5\t5',
      '',
      'Average Turnaround Time: 5.33',
      'Average Waiting Time   : 2.67',
    ],
  },
  srtf: {
    ruleSummary: 'Shortest Remaining Time First: at each time tick, pick process with shortest remaining burst.',
    stepLogic:
      'Tick-by-tick simulation: find arrived process with min remaining_bt > 0. Decrement remaining_bt by 1, time by 1. When remaining reaches 0, CT = currentTime.',
    examTrap:
      'Response time (RT) is recorded only on the FIRST time a process is dispatched: RT = first_start - AT.',
    sampleInput: [
      'Enter number of processes: 4',
      'Process 1 (ID Arrival Burst): P1 0 8',
      'Process 2 (ID Arrival Burst): P2 1 4',
      'Process 3 (ID Arrival Burst): P3 2 2',
      'Process 4 (ID Arrival Burst): P4 3 1',
    ],
    sampleOutput: [
      'PID\tAT\tBT\tCT\tTAT\tWT\tRT',
      'P1\t0\t8\t15\t15\t7\t0',
      'P2\t1\t4\t8\t7\t3\t0',
      'P3\t2\t2\t5\t3\t1\t0',
      'P4\t3\t1\t4\t1\t0\t0',
      '',
      'Average Turnaround Time: 6.50',
      'Average Waiting Time   : 2.75',
    ],
  },
  lrtf: {
    ruleSummary: 'Longest Remaining Time First: at each time tick, pick process with longest remaining burst.',
    stepLogic:
      'Tick-by-tick simulation: find arrived process with max remaining_bt > 0. Decrement by 1, time by 1. Preempts continuously.',
    examTrap:
      'LRTF produces frequent context switches because as the running process works, its remaining time shrinks below its peers.',
    sampleInput: [
      'Enter number of processes: 3',
      'Process 1 (ID Arrival Burst): P1 0 2',
      'Process 2 (ID Arrival Burst): P2 1 4',
      'Process 3 (ID Arrival Burst): P3 2 6',
    ],
    sampleOutput: [
      'PID\tAT\tBT\tCT\tTAT\tWT\tRT',
      'P1\t0\t2\t10\t10\t8\t0',
      'P2\t1\t4\t11\t10\t6\t0',
      'P3\t2\t6\t12\t10\t4\t0',
      '',
      'Average Turnaround Time: 10.00',
      'Average Waiting Time   : 6.00',
    ],
  },
  rr: {
    ruleSummary: 'Round Robin: cyclic queue with fixed time quantum.',
    stepLogic:
      'Pop front of queue. Run for slice = min(quantum, remaining). Enqueue arrivals that reached up to currentTime. If unfinished, re-enqueue current.',
    examTrap:
      'Crucial viva question: Any newcomer arriving at the exact quantum expiration must be added to the queue BEFORE the preempted process is put back!',
    sampleInput: [
      'Enter number of processes: 3',
      'Process 1 (ID Arrival Burst): P1 0 5',
      'Process 2 (ID Arrival Burst): P2 1 4',
      'Process 3 (ID Arrival Burst): P3 2 2',
      'Enter Time Quantum: 2',
    ],
    sampleOutput: [
      'PID\tAT\tBT\tCT\tTAT\tWT\tRT',
      'P1\t0\t5\t11\t11\t6\t0',
      'P2\t1\t4\t10\t9\t5\t1',
      'P3\t2\t2\t6\t4\t2\t2',
      '',
      'Average Turnaround Time: 8.00',
      'Average Waiting Time   : 4.33',
    ],
  },
  'priority-p': {
    ruleSummary: 'Priority Preemptive: at each tick, pick arrived process with highest priority (lowest number).',
    stepLogic:
      'Tick-by-tick simulation: pick process with min priority among arrived with remaining_bt > 0. Decrement by 1. Preempts immediately if a better priority arrives.',
    examTrap:
      'Tie-breaking: if two arrived processes share the same priority, the earlier arrival or lower process number runs.',
    sampleInput: [
      'Enter number of processes: 3',
      'Process 1 (ID Arrival Burst Priority): P1 0 6 3',
      'Process 2 (ID Arrival Burst Priority): P2 1 4 1',
      'Process 3 (ID Arrival Burst Priority): P3 2 2 2',
    ],
    sampleOutput: [
      'PID\tAT\tBT\tPRI\tCT\tTAT\tWT\tRT',
      'P1\t0\t6\t3\t12\t12\t6\t0',
      'P2\t1\t4\t1\t5\t4\t0\t0',
      'P3\t2\t2\t2\t7\t5\t3\t3',
      '',
      'Average Turnaround Time: 7.00',
      'Average Waiting Time   : 3.00',
    ],
  },
};

export function CodeExamples({ lab, onNavigate }: CodeExamplesProps) {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmId>(lab.algorithm);
  const [language, setLanguage] = useState<SupportedLanguage>('c');
  const [copied, setCopied] = useState(false);

  const meta = ALGORITHM_MAP[selectedAlgo];
  const langMeta = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];
  const source = getCode(selectedAlgo, language);
  const tips = MEMORY_TIPS[selectedAlgo];

  const html = useMemo(() => {
    const grammar = Prism.languages[langMeta.grammar];
    if (!grammar) {
      return source.replace(/[&<>]/g, (ch) =>
        ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : '&gt;',
      );
    }
    return Prism.highlight(source, grammar, langMeta.grammar);
  }, [source, langMeta.grammar]);

  const lines = source.split('\n');

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleOpenInVisualizer = () => {
    lab.setAlgorithm(selectedAlgo);
    onNavigate('visualizer');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        code="04"
        title="Code Examples & Reference"
        subtitle="Clean, memorable implementations designed for university OS exams and lab vivas. Every implementation takes dynamic interactive input from the user."
        actions={
          <button
            type="button"
            onClick={handleOpenInVisualizer}
            className="flex items-center gap-1.5 border border-ink bg-crt px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-crt-dim"
          >
            <Play aria-hidden="true" className="h-3.5 w-3.5" />
            Simulate in Visualizer
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        }
      />

      {/* ── Algorithm Selection Pills ─────────────────────────── */}
      <div className="border border-rule bg-bone-2/50 p-2.5">
        <p className="label mb-2 text-muted-2">Select Algorithm</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-8">
          {ALGORITHMS.map((algo) => {
            const active = algo.id === selectedAlgo;
            const isPreemptive = algo.category === 'preemptive';
            return (
              <button
                key={algo.id}
                type="button"
                onClick={() => setSelectedAlgo(algo.id)}
                className={[
                  'flex flex-col items-start rounded-none border p-2 text-left transition-all',
                  active
                    ? 'border-ink bg-ink text-bone shadow-sm'
                    : 'border-rule bg-bone hover:border-ink hover:bg-bone-3/50',
                ].join(' ')}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="tabular text-xs font-bold">{algo.shortName}</span>
                  {isPreemptive ? (
                    <Zap
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 ${active ? 'text-signal' : 'text-signal/80'}`}
                    />
                  ) : (
                    <Lock
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 ${active ? 'text-crt' : 'text-crt-dim'}`}
                    />
                  )}
                </div>
                <span
                  className={`mt-1 text-[9px] uppercase tracking-wider ${
                    active ? 'text-bone/70' : 'text-muted-2'
                  }`}
                >
                  {isPreemptive ? 'Preemptive' : 'Non-Preempt'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Memory Cheat Sheet: Formula & Rule ────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-rule bg-bone-2/60 p-3">
          <p className="label mb-1 text-crt-dim font-bold">1. Selection Rule</p>
          <p className="text-xs leading-relaxed text-text/80">{tips.ruleSummary}</p>
          <p className="mt-2 text-[11px] text-muted-2 font-mono">{tips.stepLogic}</p>
        </div>

        <div className="border border-rule bg-bone-2/60 p-3">
          <p className="label mb-1 text-signal font-bold">2. Golden Formulas (Memorize)</p>
          <div className="space-y-1 font-mono text-[11px] text-text/80">
            <p className="bg-bone px-1.5 py-0.5 border border-rule/60">
              TAT = CT - AT <span className="text-muted-2">(Turnaround = Completion - Arrival)</span>
            </p>
            <p className="bg-bone px-1.5 py-0.5 border border-rule/60">
              WT = TAT - BT <span className="text-muted-2">(Waiting = Turnaround - Burst)</span>
            </p>
            <p className="bg-bone px-1.5 py-0.5 border border-rule/60">
              RT = FirstStart - AT <span className="text-muted-2">(Response = First CPU Start - Arrival)</span>
            </p>
          </div>
        </div>

        <div className="border border-rule bg-bone-2/60 p-3">
          <p className="label mb-1 text-machine font-bold">3. Viva / Exam Pitfall</p>
          <p className="text-xs leading-relaxed text-text/80">{tips.examTrap}</p>
          <p className="tabular mt-2 text-[10px] text-muted-2">
            Tie-breaker: {meta.tieBreak}
          </p>
        </div>
      </div>

      {/* ── Code Viewer Section ──────────────────────────────── */}
      <section className="registered border border-ink bg-ink">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-3 bg-ink-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <FileCode2 aria-hidden="true" className="h-4 w-4 shrink-0 text-crt" />
            <h2 className="label truncate text-bone font-bold">
              {meta.name} Implementation
            </h2>
            <span className="tabular hidden text-[11px] text-muted-2 sm:inline">
              {meta.shortName.toLowerCase().replace(/[\s-]+/g, '_')}.{langMeta.extension}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div
              className="flex border border-ink-3"
              role="radiogroup"
              aria-label="Programming Language"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  role="radio"
                  aria-checked={language === lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={[
                    'border-r border-ink-3 px-2.5 py-1 text-xs font-semibold transition-colors last:border-r-0',
                    language === lang.id
                      ? 'bg-crt text-ink'
                      : 'bg-ink text-muted hover:bg-ink-3 hover:text-bone',
                  ].join(' ')}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-1.5 border border-ink-3 px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:border-bone/40 hover:text-bone"
            >
              {copied ? (
                <>
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-crt" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </header>

        <div className="border-b border-ink-3 bg-ink-2/60 px-3 py-1.5 font-mono text-[11px] text-muted-2 flex items-center justify-between">
          <span>
            {langMeta.label === 'C' && 'Compile & run: gcc -o sched ' + meta.shortName.toLowerCase().replace(/[\s-]+/g, '_') + '.c && ./sched'}
            {langMeta.label === 'Python' && 'Run in terminal: python ' + meta.shortName.toLowerCase().replace(/[\s-]+/g, '_') + '.py'}
            {langMeta.label === 'TypeScript' && 'Run with tsx / bun / node: npx tsx ' + meta.shortName.toLowerCase().replace(/[\s-]+/g, '_') + '.ts'}
          </span>
          <span className="text-crt">Interactive user input enabled</span>
        </div>

        {/* Editor body with line numbers */}
        <div className="scanlines thin-scroll max-h-[36rem] overflow-auto">
          <div className="flex min-w-0">
            <div
              aria-hidden="true"
              className="tabular shrink-0 border-r border-ink-3 bg-black/30 px-2.5 py-3 text-right text-[13px] leading-[1.65] text-muted-2/50 select-none"
            >
              {lines.map((_, i) => (
                <div key={i}>{String(i + 1).padStart(2, '0')}</div>
              ))}
            </div>

            <pre className="min-w-0 flex-1 overflow-x-auto px-4 py-3">
              <code
                className={`language-${langMeta.grammar}`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </pre>
          </div>
        </div>
      </section>

      {/* ── Terminal Sample Run ───────────────────────────────── */}
      <Panel
        title="Sample Terminal Interaction (Input & Output)"
        code="CLI-01"
        note="Example of what running this program looks like in your terminal when entering data interactively."
      >
        <div className="rounded border border-ink bg-ink-2 p-3 font-mono text-xs text-bone">
          <div className="flex items-center gap-2 border-b border-ink-3 pb-2 text-muted-2 text-[11px]">
            <Terminal className="h-3.5 w-3.5 text-crt" />
            <span>Interactive Terminal Session</span>
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-muted-2">// User typed inputs:</p>
            {tips.sampleInput.map((line, idx) => (
              <p key={idx} className="text-crt font-medium">
                $ {line}
              </p>
            ))}
          </div>

          <div className="mt-4 space-y-1 border-t border-ink-3 pt-3">
            <p className="text-muted-2">// Program printed output table:</p>
            {tips.sampleOutput.map((line, idx) => (
              <p key={idx} className={line.startsWith('Average') ? 'text-machine font-bold' : 'text-bone/90'}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
