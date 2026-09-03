/**
 * Editable process table (spec §9).
 *
 * Priority column appears only for Priority algorithms; the time-quantum field
 * only for Round Robin. Irrelevant inputs are hidden rather than left to
 * confuse. Validation messages are inline, per cell, and announced to screen
 * readers.
 */
import { AlertTriangle, Plus, Trash2, X } from 'lucide-react';
import type { AlgorithmMeta, ProcessInput, ValidationIssue } from '../types/scheduling';
import { issuesFor } from '../engine/validation';
import { EXAMPLES } from '../data/examples';
import { FieldLabel } from './Panel';

interface ProcessTableProps {
  processes: ProcessInput[];
  algorithm: AlgorithmMeta;
  timeQuantum: number;
  issues: ValidationIssue[];
  colors: Record<string, string>;
  onChange: (processes: ProcessInput[]) => void;
  onTimeQuantum: (value: number) => void;
  onLoadExample: (exampleId: string) => void;
  onRun: () => void;
  disabled?: boolean;
}

export function ProcessTable({
  processes,
  algorithm,
  timeQuantum,
  issues,
  colors,
  onChange,
  onTimeQuantum,
  onLoadExample,
  onRun,
  disabled,
}: ProcessTableProps) {
  const showPriority = algorithm.usesPriority;
  const showQuantum = algorithm.usesTimeQuantum;
  const formIssues = issues.filter((i) => i.row === null);

  const update = (index: number, patch: Partial<ProcessInput>): void => {
    onChange(processes.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const addProcess = (): void => {
    // Next free P-number, so adding after a removal doesn't collide.
    const used = new Set(processes.map((p) => p.id.toUpperCase()));
    let n = processes.length + 1;
    while (used.has(`P${n}`)) n += 1;
    onChange([
      ...processes,
      { id: `P${n}`, arrivalTime: 0, burstTime: 1, priority: processes.length + 1 },
    ]);
  };

  const removeProcess = (index: number): void => {
    onChange(processes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[9rem] flex-1">
          <FieldLabel htmlFor="example-select">Dataset</FieldLabel>
          <select
            id="example-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onLoadExample(e.target.value);
              e.currentTarget.selectedIndex = 0;
            }}
            className="w-full border border-rule bg-bone-2 px-2 py-1.5 font-mono text-xs focus:border-ink"
          >
            <option value="">Load example…</option>
            {EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {showQuantum && (
          <div className="w-28">
            <FieldLabel htmlFor="time-quantum">Time Quantum</FieldLabel>
            <input
              id="time-quantum"
              type="number"
              min={1}
              step={1}
              value={Number.isFinite(timeQuantum) ? timeQuantum : ''}
              onChange={(e) => onTimeQuantum(Number(e.target.value))}
              aria-invalid={issues.some((i) => i.field === 'timeQuantum')}
              className={[
                'tabular w-full border bg-bone-2 px-2 py-1.5 text-xs focus:border-ink',
                issues.some((i) => i.field === 'timeQuantum')
                  ? 'border-signal bg-signal/10'
                  : 'border-rule',
              ].join(' ')}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="thin-scroll overflow-x-auto border border-rule">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Editable process input table. Columns: process id, arrival time, burst time
            {showPriority ? ', priority' : ''} and remove.
          </caption>
          <thead>
            <tr className="border-b border-rule bg-bone-3/60">
              <th scope="col" className="label px-2 py-2 text-muted-2">
                PID
              </th>
              <th scope="col" className="label px-2 py-2 text-muted-2">
                Arrival
              </th>
              <th scope="col" className="label px-2 py-2 text-muted-2">
                Burst
              </th>
              {showPriority && (
                <th scope="col" className="label px-2 py-2 text-muted-2">
                  Priority
                </th>
              )}
              <th scope="col" className="label px-2 py-2 text-right text-muted-2">
                <span className="sr-only">Remove</span>
                Del
              </th>
            </tr>
          </thead>
          <tbody>
            {!processes.length && (
              <tr>
                <td colSpan={showPriority ? 5 : 4} className="px-2 py-6 text-center">
                  <p className="tabular text-xs text-muted-2">
                    No processes defined. Add one or load an example dataset.
                  </p>
                </td>
              </tr>
            )}
            {processes.map((p, row) => (
              <tr key={row} className="border-b border-rule/60 last:border-b-0 hover:bg-bone-2/60">
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-3 w-1 shrink-0"
                      style={{ backgroundColor: colors[p.id] ?? '#A7A49B' }}
                    />
                    <Cell
                      value={p.id}
                      onChange={(v) => update(row, { id: String(v) })}
                      issues={issuesFor(issues, row, 'id')}
                      label={`Process id, row ${row + 1}`}
                      width="w-16"
                    />
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <Cell
                    value={p.arrivalTime}
                    numeric
                    min={0}
                    onChange={(v) => update(row, { arrivalTime: Number(v) })}
                    issues={issuesFor(issues, row, 'arrivalTime')}
                    label={`Arrival time, row ${row + 1}`}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Cell
                    value={p.burstTime}
                    numeric
                    min={1}
                    onChange={(v) => update(row, { burstTime: Number(v) })}
                    issues={issuesFor(issues, row, 'burstTime')}
                    label={`Burst time, row ${row + 1}`}
                  />
                </td>
                {showPriority && (
                  <td className="px-2 py-1.5">
                    <Cell
                      value={p.priority ?? ''}
                      numeric
                      min={0}
                      onChange={(v) => update(row, { priority: Number(v) })}
                      issues={issuesFor(issues, row, 'priority')}
                      label={`Priority, row ${row + 1}`}
                    />
                  </td>
                )}
                <td className="px-2 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => removeProcess(row)}
                    aria-label={`Remove process ${p.id}`}
                    className="border border-transparent p-1 text-muted-2 transition-colors hover:border-signal hover:text-signal"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPriority && (
        <p className="tabular text-[10px] text-muted-2">
          Convention: a LOWER priority number means HIGHER priority.
        </p>
      )}

      {/* Form-level validation */}
      {formIssues.length > 0 && (
        <ul className="space-y-1" role="alert">
          {formIssues.map((issue, i) => (
            <li
              key={i}
              className="tabular flex items-start gap-1.5 border-l-2 border-signal bg-signal/10 px-2 py-1 text-[11px]"
            >
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 text-signal" />
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={addProcess}
          className="flex items-center gap-1.5 border border-rule bg-bone-2 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:border-ink hover:bg-bone-3"
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          Add Process
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          disabled={!processes.length}
          className="flex items-center gap-1.5 border border-rule bg-bone-2 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          Clear All
        </button>
        <button
          type="button"
          onClick={onRun}
          disabled={disabled}
          className="ml-auto flex items-center gap-1.5 border border-ink bg-ink px-3.5 py-1.5 text-xs font-bold text-bone transition-colors hover:bg-ink-3 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Run Simulation
        </button>
      </div>
    </div>
  );
}

function Cell({
  value,
  onChange,
  issues,
  label,
  numeric,
  min,
  width = 'w-14',
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  issues: ValidationIssue[];
  label: string;
  numeric?: boolean;
  min?: number;
  width?: string;
}) {
  const invalid = issues.length > 0;
  return (
    <div className={width}>
      <input
        type={numeric ? 'number' : 'text'}
        min={min}
        step={numeric ? 1 : undefined}
        value={value}
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${label.replace(/\s+/g, '-')}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'tabular w-full border px-1.5 py-1 text-xs focus:border-ink',
          invalid ? 'border-signal bg-signal/10' : 'border-rule bg-bone',
        ].join(' ')}
      />
      {invalid && (
        <p
          id={`${label.replace(/\s+/g, '-')}-err`}
          className="tabular mt-0.5 text-[10px] leading-tight text-signal"
        >
          {issues[0].message}
        </p>
      )}
    </div>
  );
}
