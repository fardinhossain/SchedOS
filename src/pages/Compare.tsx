/**
 * Compare page (spec §14, §15, §16).
 *
 * One shared dataset is run through every selected algorithm, so the only
 * variable is the scheduling policy. Winners in the table are computed from the
 * results — never hard-coded — and observations are generated from the data.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, Lightbulb, Play, Trophy } from 'lucide-react';
import type { LabState } from '../App';
import type { AlgorithmId } from '../types/scheduling';
import { IDLE_ID } from '../types/scheduling';
import { ALGORITHM_MAP, NON_PREEMPTIVE, PREEMPTIVE } from '../algorithms';
import { validate } from '../engine/validation';
import { METRIC_SPECS, isBest, observations, runComparison } from '../engine/comparison';
import type { ComparisonRow, MetricSpec } from '../engine/comparison';
import { fmt } from '../engine/metrics';
import { PageHeader } from '../components/Sidebar';
import { Panel } from '../components/Panel';
import { ProcessTable } from '../components/ProcessTable';
import { GanttChart, GanttLegend } from '../components/GanttChart';
import { ComparisonChart } from '../components/ComparisonChart';
import { EmptyState } from '../components/EmptyState';

interface CompareProps {
  lab: LabState;
}

export function Compare({ lab }: CompareProps) {
  const { processes, timeQuantum, colors } = lab;
  const [selected, setSelected] = useState<AlgorithmId[]>(['fcfs', 'sjf', 'srtf', 'rr']);
  const [rows, setRows] = useState<ComparisonRow[] | null>(null);
  const [metric, setMetric] = useState<MetricSpec>(METRIC_SPECS[0]);

  // Validate against the strictest requirements across the chosen algorithms:
  // if any needs priority, priority is required; likewise the quantum.
  const strictestMeta = useMemo(() => {
    const metas = selected.map((id) => ALGORITHM_MAP[id]);
    return {
      ...ALGORITHM_MAP[selected[0] ?? 'fcfs'],
      usesPriority: metas.some((m) => m.usesPriority),
      usesTimeQuantum: metas.some((m) => m.usesTimeQuantum),
    };
  }, [selected]);

  const issues = useMemo(
    () => validate({ processes, algorithm: strictestMeta, timeQuantum }),
    [processes, strictestMeta, timeQuantum],
  );

  const tooFew = selected.length < 2;
  const canRun = issues.length === 0 && !tooFew;

  const toggle = (id: AlgorithmId): void => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setRows(null);
  };

  const run = (): void => {
    if (!canRun) return;
    try {
      setRows(runComparison(selected, processes, { timeQuantum }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Comparison failed', error);
      setRows(null);
    }
  };

  const notes = rows ? observations(rows) : [];
  const processIds = processes.map((p) => p.id);

  return (
    <div className="space-y-4">
      <PageHeader
        code="02"
        title="Comparative Analysis"
        subtitle="Run one process set through several algorithms and see exactly what the scheduling policy costs or saves."
        actions={
          <button
            type="button"
            onClick={run}
            disabled={!canRun}
            className="flex items-center gap-1.5 border border-ink bg-crt px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-crt-dim disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play aria-hidden="true" className="h-3.5 w-3.5" />
            Run Comparison
          </button>
        }
      />

      {/* ── Selection + shared input ─────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel
          title="Select Algorithms"
          code="CMP-01"
          note="Choose two or more. The same dataset is used for all of them."
          actions={
            <span className="tabular text-[10px] text-muted-2">
              {String(selected.length).padStart(2, '0')} selected
            </span>
          }
        >
          <div className="space-y-3">
            <CheckGroup
              title="Non-Preemptive"
              ids={NON_PREEMPTIVE.map((a) => a.id)}
              selected={selected}
              onToggle={toggle}
              timeQuantum={timeQuantum}
            />
            <CheckGroup
              title="Preemptive"
              ids={PREEMPTIVE.map((a) => a.id)}
              selected={selected}
              onToggle={toggle}
              timeQuantum={timeQuantum}
            />

            {tooFew && (
              <p
                role="alert"
                className="tabular flex items-start gap-1.5 border-l-2 border-signal bg-signal/10 px-2 py-1.5 text-[11px]"
              >
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 text-signal" />
                Select at least two algorithms to compare.
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Shared Process Input" code="INP-02">
          <ProcessTable
            processes={processes}
            algorithm={strictestMeta}
            timeQuantum={timeQuantum}
            issues={issues}
            colors={colors}
            onChange={(next) => {
              lab.setProcesses(next);
              setRows(null);
            }}
            onTimeQuantum={(q) => {
              lab.setTimeQuantum(q);
              setRows(null);
            }}
            onLoadExample={(id) => {
              lab.loadExample(id);
              setRows(null);
            }}
            onRun={run}
            disabled={!canRun}
          />
        </Panel>
      </div>

      {!rows ? (
        <Panel title="Results" code="CMP-02">
          <EmptyState
            title="No comparison run yet"
            body={
              tooFew
                ? 'Select at least two algorithms, then run the comparison.'
                : issues.length
                  ? 'Fix the input errors above before running the comparison.'
                  : `Ready to run ${selected.length} algorithms against ${processes.length} processes.`
            }
            action={canRun ? { label: 'Run Comparison', onClick: run } : undefined}
          />
        </Panel>
      ) : (
        <>
          {/* ── Comparison table ──────────────────────────────── */}
          <Panel
            title="Performance Comparison"
            code="CMP-02"
            note="Best value in each column is marked. Winners are computed from these results, not predetermined."
          >
            <div className="thin-scroll overflow-x-auto border border-rule">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Algorithm performance comparison across five metrics.
                </caption>
                <thead>
                  <tr className="border-b border-ink bg-bone-3/60">
                    <th scope="col" className="label px-2 py-2 text-muted-2">
                      Algorithm
                    </th>
                    {METRIC_SPECS.map((spec) => (
                      <th
                        key={spec.key}
                        scope="col"
                        className="label px-2 py-2 text-muted-2"
                        title={`${spec.label} — ${spec.goal === 'min' ? 'lower is better' : 'higher is better'}`}
                      >
                        {spec.short}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-rule/60 last:border-b-0 hover:bg-bone-2/60"
                    >
                      <th scope="row" className="px-2 py-1.5 text-left">
                        <span className="tabular text-xs font-bold">{row.label}</span>
                        <span className="label ml-1.5 text-muted-2">
                          {ALGORITHM_MAP[row.id].category === 'preemptive' ? 'P' : 'NP'}
                        </span>
                      </th>
                      {METRIC_SPECS.map((spec) => {
                        const best = isBest(rows, spec, row);
                        return (
                          <td key={spec.key} className="px-2 py-1.5">
                            <span
                              className={[
                                'tabular inline-flex items-center gap-1 text-xs',
                                best ? 'font-bold' : 'text-text/75',
                              ].join(' ')}
                            >
                              {best && (
                                <Trophy
                                  aria-label="best"
                                  className="h-3 w-3 shrink-0 text-crt-dim"
                                />
                              )}
                              {fmt(row.result[spec.key])}
                              {spec.unit ?? ''}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* ── Chart + observations ──────────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Panel title="Metric Chart" code="CMP-03">
              <ComparisonChart rows={rows} metric={metric} onMetric={setMetric} />
            </Panel>

            <Panel
              title="Generated Observations"
              code="CMP-04"
              note="Derived from the results above."
            >
              <ul className="space-y-2">
                {notes.map((note, i) => (
                  <li
                    key={i}
                    className="flex gap-2 border-l-2 border-machine bg-bone-2/60 px-2.5 py-2"
                  >
                    <Lightbulb
                      aria-hidden="true"
                      className="mt-0.5 h-3 w-3 shrink-0 text-machine"
                    />
                    <span className="text-xs leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {/* ── Individual Gantt charts ───────────────────────── */}
          <Panel
            title="Timelines Side by Side"
            code="CMP-05"
            note="Same processes, same total work — only the ordering differs."
          >
            <div className="space-y-4">
              <GanttLegend
                ids={processIds}
                colors={colors}
                hasIdle={rows.some((r) =>
                  r.result.gantt.some((b) => b.processId === IDLE_ID),
                )}
              />
              {rows.map((row) => (
                <div key={row.id} className="border-t border-rule pt-3 first:border-t-0 first:pt-0">
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="tabular text-xs font-bold">{row.label}</h3>
                    <p className="tabular text-[10px] text-muted-2">
                      WT {fmt(row.result.averageWaitingTime)} · TAT{' '}
                      {fmt(row.result.averageTurnaroundTime)} · RT{' '}
                      {fmt(row.result.averageResponseTime)} · UTIL{' '}
                      {fmt(row.result.cpuUtilization)}% · {row.result.gantt.length} blocks
                    </p>
                  </div>
                  <GanttChart result={row.result} colors={colors} compact />
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function CheckGroup({
  title,
  ids,
  selected,
  onToggle,
  timeQuantum,
}: {
  title: string;
  ids: AlgorithmId[];
  selected: AlgorithmId[];
  onToggle: (id: AlgorithmId) => void;
  timeQuantum: number;
}) {
  return (
    <fieldset>
      <legend className="label mb-1.5 text-muted-2">{title}</legend>
      <div className="space-y-1">
        {ids.map((id) => {
          const meta = ALGORITHM_MAP[id];
          const checked = selected.includes(id);
          return (
            <label
              key={id}
              className={[
                'flex cursor-pointer items-center gap-2 border px-2 py-1.5 transition-colors',
                checked ? 'border-ink bg-bone-3/70' : 'border-rule bg-bone-2/50 hover:border-ink',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(id)}
                className="h-3.5 w-3.5 shrink-0 accent-crt-dim"
              />
              <span className="tabular min-w-0 flex-1 text-[11px] font-bold">
                {meta.shortName}
              </span>
              <span className="min-w-0 truncate text-[10px] text-muted-2">
                {meta.usesTimeQuantum ? `quantum = ${timeQuantum}` : meta.name.replace(/ \(.*\)/, '')}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
