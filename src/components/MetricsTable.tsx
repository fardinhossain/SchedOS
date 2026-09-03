/**
 * Per-process metrics table (spec §13).
 * Sortable by any column, and clicking a row highlights that process's blocks
 * on the Gantt chart (the selection is shared state, so it works both ways).
 */
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ProcessResult } from '../types/scheduling';
import { compareIds } from '../engine/scheduler';

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
  /** Shown only when the algorithm uses priorities. */
  priorityOnly?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'id', label: 'PID', title: 'Process identifier' },
  { key: 'arrivalTime', label: 'AT', title: 'Arrival Time — when the process entered the system' },
  { key: 'burstTime', label: 'BT', title: 'Burst Time — total CPU time required' },
  { key: 'priority', label: 'PRI', title: 'Priority — lower number means higher priority', priorityOnly: true },
  { key: 'completionTime', label: 'CT', title: 'Completion Time — when the process finished' },
  { key: 'turnaroundTime', label: 'TAT', title: 'Turnaround Time = CT − AT' },
  { key: 'waitingTime', label: 'WT', title: 'Waiting Time = TAT − BT' },
  { key: 'responseTime', label: 'RT', title: 'Response Time = first CPU start − AT' },
];

interface MetricsTableProps {
  processes: ProcessResult[];
  colors: Record<string, string>;
  showPriority: boolean;
  selectedProcess?: string | null;
  onSelectProcess?: (id: string | null) => void;
}

export function MetricsTable({
  processes,
  colors,
  showPriority,
  selectedProcess,
  onSelectProcess,
}: MetricsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [asc, setAsc] = useState(true);

  const columns = COLUMNS.filter((c) => !c.priorityOnly || showPriority);

  const sorted = useMemo(() => {
    const rows = [...processes];
    rows.sort((a, b) => {
      if (sortKey === 'id') return asc ? compareIds(a.id, b.id) : compareIds(b.id, a.id);
      const av = (a[sortKey] as number | undefined) ?? 0;
      const bv = (b[sortKey] as number | undefined) ?? 0;
      // Stable secondary ordering keeps ties from jumping around on re-sort.
      return av === bv ? compareIds(a.id, b.id) : asc ? av - bv : bv - av;
    });
    return rows;
  }, [processes, sortKey, asc]);

  const toggle = (key: SortKey): void => {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };

  return (
    <div className="thin-scroll overflow-x-auto border border-rule">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Per-process scheduling metrics. Select a row to highlight that process on the Gantt
          chart.
        </caption>
        <thead>
          <tr className="border-b border-ink bg-bone-3/60">
            {columns.map((col) => {
              const active = sortKey === col.key;
              return (
                <th key={col.key} scope="col" className="p-0">
                  <button
                    type="button"
                    onClick={() => toggle(col.key)}
                    title={col.title}
                    aria-sort={active ? (asc ? 'ascending' : 'descending') : 'none'}
                    className="label flex w-full items-center gap-1 px-2 py-2 text-muted-2 transition-colors hover:bg-bone-3 hover:text-text"
                  >
                    {col.label}
                    {active &&
                      (asc ? (
                        <ArrowUp aria-hidden="true" className="h-2.5 w-2.5" />
                      ) : (
                        <ArrowDown aria-hidden="true" className="h-2.5 w-2.5" />
                      ))}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const selected = p.id === selectedProcess;
            return (
              <tr
                key={p.id}
                onClick={() => onSelectProcess?.(selected ? null : p.id)}
                className={[
                  'cursor-pointer border-b border-rule/60 transition-colors last:border-b-0',
                  selected ? 'bg-machine/25 ring-1 ring-inset ring-ink' : 'hover:bg-bone-2/70',
                ].join(' ')}
              >
                {columns.map((col) => {
                  if (col.key === 'id') {
                    return (
                      <td key={col.key} className="px-2 py-1.5">
                        <span className="flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className="h-3 w-1 shrink-0"
                            style={{ backgroundColor: colors[p.id] ?? '#A7A49B' }}
                          />
                          <span className="tabular text-xs font-bold">{p.id}</span>
                        </span>
                      </td>
                    );
                  }
                  const value = (p[col.key] as number | undefined) ?? '—';
                  const emphasised =
                    col.key === 'waitingTime' ||
                    col.key === 'turnaroundTime' ||
                    col.key === 'completionTime';
                  return (
                    <td
                      key={col.key}
                      className={[
                        'tabular px-2 py-1.5 text-xs',
                        emphasised ? 'font-semibold' : 'text-text/75',
                      ].join(' ')}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
