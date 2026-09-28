/**
 * PerformanceSection — Unified performance display for SchedOS.
 * Placed directly below the System Log in Column 3.
 * Includes summary cards (Avg Wait, Avg Turnaround, Avg Response, CPU Utilization, Throughput, Context Switches),
 * CPU Utilization Gauge, and detailed per-process metrics table.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, RefreshCw, Zap } from 'lucide-react';
import type { ProcessResult, SchedulingResult } from '../types/scheduling';
import { calculateThroughput, countContextSwitches, fmt } from '../engine/metrics';
import { compareIds } from '../engine/scheduler';
import { UtilizationGauge } from './PerformanceCards';

interface PerformanceSectionProps {
  result: SchedulingResult | null;
  isStale?: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
  colors: Record<string, string>;
  showPriority: boolean;
  selectedProcess?: string | null;
  onSelectProcess?: (id: string | null) => void;
}

type SortKey = keyof Pick<
  ProcessResult,
  | 'id'
  | 'arrivalTime'
  | 'burstTime'
  | 'priority'
  | 'completionTime'
  | 'turnaroundTime'
  | 'waitingTime'
  | 'responseTime'
>;

interface Column {
  key: SortKey;
  label: string;
  title: string;
  priorityOnly?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'id', label: 'PID', title: 'Process identifier' },
  { key: 'arrivalTime', label: 'AT', title: 'Arrival Time' },
  { key: 'burstTime', label: 'BT', title: 'Burst Time' },
  { key: 'priority', label: 'PRI', title: 'Priority', priorityOnly: true },
  { key: 'completionTime', label: 'CT', title: 'Completion Time' },
  { key: 'turnaroundTime', label: 'TAT', title: 'Turnaround Time (CT − AT)' },
  { key: 'waitingTime', label: 'WT', title: 'Waiting Time (TAT − BT)' },
  { key: 'responseTime', label: 'RT', title: 'Response Time (First Start − AT)' },
];

export function PerformanceSection({
  result,
  isStale = false,
  onGenerate,
  canGenerate,
  colors,
  showPriority,
  selectedProcess,
  onSelectProcess,
}: PerformanceSectionProps) {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [asc, setAsc] = useState(true);

  const contextSwitches = useMemo(() => {
    if (!result) return 0;
    return result.contextSwitches ?? countContextSwitches(result.gantt);
  }, [result]);

  const throughput = useMemo(() => {
    if (!result) return 0;
    return result.throughput ?? calculateThroughput(result.processes.length, result.totalTime);
  }, [result]);

  const columns = useMemo(
    () => COLUMNS.filter((c) => !c.priorityOnly || showPriority),
    [showPriority],
  );

  const sortedProcesses = useMemo(() => {
    if (!result) return [];
    const rows = [...result.processes];
    rows.sort((a, b) => {
      if (sortKey === 'id') return asc ? compareIds(a.id, b.id) : compareIds(b.id, a.id);
      const av = (a[sortKey] as number | undefined) ?? 0;
      const bv = (b[sortKey] as number | undefined) ?? 0;
      return av === bv ? compareIds(a.id, b.id) : asc ? av - bv : bv - av;
    });
    return rows;
  }, [result, sortKey, asc]);

  const toggleSort = (key: SortKey): void => {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-rule bg-bone-2/40 px-4 py-8 text-center">
        <p className="tabular font-medium text-xs text-muted-2">
          Performance metrics have not been generated yet.
        </p>
        <p className="tabular mt-1 text-[11px] text-muted-2">
          Run simulation to completion or calculate directly with current dataset.
        </p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="mt-3.5 flex items-center gap-1.5 border border-ink bg-ink px-3 py-1.5 text-xs font-bold text-bone transition-colors hover:bg-ink-3 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Zap aria-hidden="true" className="h-3.5 w-3.5 text-crt" />
          Generate Performance
        </button>
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Avg Wait Time',
      value: fmt(result.averageWaitingTime),
      hint: 'Σ(TAT − BT) ÷ n',
      accent: 'signal',
    },
    {
      label: 'Avg Turnaround',
      value: fmt(result.averageTurnaroundTime),
      hint: 'Σ(CT − AT) ÷ n',
      accent: 'default',
    },
    {
      label: 'Avg Response',
      value: fmt(result.averageResponseTime),
      hint: 'Σ(start − AT) ÷ n',
      accent: 'default',
    },
    {
      label: 'CPU Utilization',
      value: `${fmt(result.cpuUtilization)}%`,
      hint: '(busy ÷ total) × 100',
      accent: 'crt',
    },
    {
      label: 'Throughput',
      value: `${fmt(throughput)} /t`,
      hint: 'n ÷ total time span',
      accent: 'crt',
    },
    {
      label: 'Context Switches',
      value: String(contextSwitches),
      hint: 'CPU process handovers',
      accent: 'machine',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Stale banner if input modified */}
      {isStale && (
        <div
          role="status"
          className="flex items-center justify-between gap-2 border-l-2 border-machine bg-machine/15 px-2.5 py-1.5"
        >
          <div className="flex items-center gap-1.5 text-machine">
            <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular text-[11px]">
              Inputs changed — metrics reflect previous state.
            </span>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="flex items-center gap-1 border border-ink bg-bone-2 px-1.5 py-0.5 text-[10px] font-bold transition-colors hover:bg-ink hover:text-bone disabled:opacity-40"
          >
            <RefreshCw aria-hidden="true" className="h-2.5 w-2.5" />
            Update
          </button>
        </div>
      )}

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col justify-between border border-ink-3 bg-ink p-2"
          >
            <div className="label text-[10px] text-muted">{card.label}</div>
            <div className="my-1">
              <span
                className={[
                  'tabular text-base font-bold sm:text-lg',
                  card.accent === 'crt'
                    ? 'text-crt'
                    : card.accent === 'signal'
                      ? 'text-signal'
                      : card.accent === 'machine'
                        ? 'text-machine'
                        : 'text-bone',
                ].join(' ')}
              >
                {card.value}
              </span>
            </div>
            <div className="tabular truncate text-[9px] text-muted-2" title={card.hint}>
              {card.hint}
            </div>
          </div>
        ))}
      </div>

      {/* CPU Utilization visual gauge */}
      <div className="border border-rule bg-bone-2/60 p-2">
        <UtilizationGauge result={result} />
      </div>

      {/* Per-process detailed performance table */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="label text-[11px] text-muted-2">Per-Process Timings</span>
          <span className="tabular text-[10px] text-muted-2">
            {result.processes.length} process{result.processes.length === 1 ? '' : 'es'}
          </span>
        </div>

        <div className="thin-scroll max-h-56 overflow-y-auto overflow-x-auto border border-rule">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Per-process scheduling metrics table with arrival, burst, completion, turnaround,
              waiting, and response times.
            </caption>
            <thead>
              <tr className="sticky top-0 z-10 border-b border-rule bg-bone-3/95 backdrop-blur-xs">
                {columns.map((col) => {
                  const active = sortKey === col.key;
                  return (
                    <th key={col.key} scope="col" className="p-0">
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        title={col.title}
                        aria-sort={active ? (asc ? 'ascending' : 'descending') : 'none'}
                        className="label flex w-full items-center gap-1 px-2 py-1 text-[10px] text-muted-2 transition-colors hover:bg-bone-3 hover:text-text"
                      >
                        <span>{col.label}</span>
                        {active && (
                          asc ? (
                            <ArrowUp aria-hidden="true" className="h-2.5 w-2.5 text-crt" />
                          ) : (
                            <ArrowDown aria-hidden="true" className="h-2.5 w-2.5 text-crt" />
                          )
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedProcesses.map((p) => {
                const isSelected = selectedProcess === p.id;
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProcess?.(isSelected ? null : p.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectProcess?.(isSelected ? null : p.id);
                      }
                    }}
                    className={[
                      'cursor-pointer border-b border-rule/50 transition-colors last:border-b-0 hover:bg-bone-2',
                      isSelected ? 'bg-signal/10' : '',
                    ].join(' ')}
                  >
                    <td className="px-2 py-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-1 shrink-0"
                          style={{ backgroundColor: colors[p.id] ?? '#A7A49B' }}
                        />
                        <span className="font-bold">{p.id}</span>
                      </div>
                    </td>
                    <td className="tabular px-2 py-1 text-xs">{p.arrivalTime}</td>
                    <td className="tabular px-2 py-1 text-xs">{p.burstTime}</td>
                    {showPriority && (
                      <td className="tabular px-2 py-1 text-xs">{p.priority ?? '—'}</td>
                    )}
                    <td className="tabular px-2 py-1 text-xs">{p.completionTime}</td>
                    <td className="tabular px-2 py-1 text-xs font-semibold">{p.turnaroundTime}</td>
                    <td className="tabular px-2 py-1 text-xs font-semibold text-signal">
                      {p.waitingTime}
                    </td>
                    <td className="tabular px-2 py-1 text-xs">{p.responseTime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
