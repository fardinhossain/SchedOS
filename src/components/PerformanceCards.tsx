/**
 * Performance readout (spec §12).
 * All seven required metrics, always visible — nothing is hidden behind a
 * toggle. Rendered as instrument rows rather than decorative cards.
 */
import type { SchedulingResult } from '../types/scheduling';
import { fmt } from '../engine/metrics';

interface PerformanceCardsProps {
  result: SchedulingResult;
}

export function PerformanceCards({ result }: PerformanceCardsProps) {
  const rows: { label: string; value: string; hint: string; accent?: 'crt' | 'signal' | 'machine' }[] =
    [
      {
        label: 'Avg Wait',
        value: fmt(result.averageWaitingTime),
        hint: 'Σ(TAT − BT) ÷ n',
        accent: 'signal',
      },
      {
        label: 'Avg Turnaround',
        value: fmt(result.averageTurnaroundTime),
        hint: 'Σ(CT − AT) ÷ n',
      },
      {
        label: 'Avg Response',
        value: fmt(result.averageResponseTime),
        hint: 'Σ(first start − AT) ÷ n',
      },
      {
        label: 'CPU Utilization',
        value: `${fmt(result.cpuUtilization)}%`,
        hint: '(busy ÷ total) × 100',
        accent: 'crt',
      },
      { label: 'CPU Idle', value: String(result.cpuIdleTime), hint: 'total − busy', accent: 'machine' },
      { label: 'CPU Busy', value: String(result.cpuBusyTime), hint: 'Σ execution time' },
      {
        label: 'Total Time',
        value: String(result.totalTime),
        hint: `t=${result.startTime} → t=${result.endTime}`,
      },
    ];

  return (
    <dl className="divide-y divide-ink-3 border border-ink bg-ink">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3 px-3 py-2">
          <div className="min-w-0">
            <dt className="label text-muted">{row.label}</dt>
            <p className="tabular mt-0.5 text-[10px] text-muted-2">{row.hint}</p>
          </div>
          <dd
            className={[
              'tabular shrink-0 text-lg leading-none font-bold',
              row.accent === 'crt'
                ? 'text-crt'
                : row.accent === 'signal'
                  ? 'text-signal'
                  : row.accent === 'machine'
                    ? 'text-machine'
                    : 'text-bone',
            ].join(' ')}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Utilization gauge — a horizontal bar with the busy/idle split shown
 * proportionally, so the number has a visual counterpart.
 */
export function UtilizationGauge({ result }: { result: SchedulingResult }) {
  const busyPct = result.totalTime > 0 ? (result.cpuBusyTime / result.totalTime) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="label text-muted-2">CPU Utilization</span>
        <span className="tabular text-sm font-bold">{fmt(result.cpuUtilization)}%</span>
      </div>
      <div
        className="flex h-5 w-full overflow-hidden border border-ink"
        role="img"
        aria-label={`CPU busy for ${result.cpuBusyTime} units, idle for ${result.cpuIdleTime} units`}
      >
        <div
          className="flex items-center justify-center bg-crt transition-[width] duration-300"
          style={{ width: `${busyPct}%` }}
        >
          {busyPct > 22 && (
            <span className="label text-ink">Busy {result.cpuBusyTime}</span>
          )}
        </div>
        <div className="hatch-idle flex flex-1 items-center justify-center">
          {100 - busyPct > 18 && (
            <span className="label text-ink/70">Idle {result.cpuIdleTime}</span>
          )}
        </div>
      </div>
    </div>
  );
}
