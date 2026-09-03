/**
 * SchedOS — comparative analysis.
 * Winners are computed from the actual results; nothing is hard-coded (spec §15).
 */
import type { AlgorithmId, AlgorithmOptions, ProcessInput, SchedulingResult } from '../types/scheduling';
import { ALGORITHM_MAP, SCHEDULERS } from '../algorithms';
import { fmt } from './metrics';

export interface ComparisonRow {
  id: AlgorithmId;
  label: string;
  result: SchedulingResult;
}

export type ComparisonMetric =
  | 'averageWaitingTime'
  | 'averageTurnaroundTime'
  | 'averageResponseTime'
  | 'cpuUtilization'
  | 'cpuIdleTime';

export interface MetricSpec {
  key: ComparisonMetric;
  label: string;
  short: string;
  /** 'min' = lower is better, 'max' = higher is better. */
  goal: 'min' | 'max';
  unit?: string;
}

export const METRIC_SPECS: MetricSpec[] = [
  { key: 'averageWaitingTime', label: 'Average Waiting Time', short: 'Avg WT', goal: 'min' },
  { key: 'averageTurnaroundTime', label: 'Average Turnaround Time', short: 'Avg TAT', goal: 'min' },
  { key: 'averageResponseTime', label: 'Average Response Time', short: 'Avg RT', goal: 'min' },
  { key: 'cpuUtilization', label: 'CPU Utilization', short: 'CPU Util', goal: 'max', unit: '%' },
  { key: 'cpuIdleTime', label: 'CPU Idle Time', short: 'CPU Idle', goal: 'min' },
];

export function runComparison(
  ids: AlgorithmId[],
  processes: ProcessInput[],
  options: AlgorithmOptions,
): ComparisonRow[] {
  return ids.map((id) => {
    const meta = ALGORITHM_MAP[id];
    const label = meta.usesTimeQuantum
      ? `${meta.shortName} (q=${options.timeQuantum ?? 2})`
      : meta.shortName;
    return { id, label, result: SCHEDULERS[id](processes, options) };
  });
}

/** The best value present for a metric, or null when there is nothing to compare. */
export function bestValue(rows: ComparisonRow[], spec: MetricSpec): number | null {
  if (!rows.length) return null;
  const values = rows.map((r) => r.result[spec.key]);
  return spec.goal === 'min' ? Math.min(...values) : Math.max(...values);
}

export function isBest(rows: ComparisonRow[], spec: MetricSpec, row: ComparisonRow): boolean {
  const best = bestValue(rows, spec);
  return best !== null && row.result[spec.key] === best;
}

/**
 * Generates prose observations from the comparison data — phrased so they stay
 * true whatever dataset the user supplies.
 */
export function observations(rows: ComparisonRow[]): string[] {
  if (rows.length < 2) return [];
  const notes: string[] = [];

  const winnerFor = (spec: MetricSpec): ComparisonRow[] =>
    rows.filter((r) => isBest(rows, spec, r));

  METRIC_SPECS.forEach((spec) => {
    const winners = winnerFor(spec);
    if (!winners.length) return;
    const value = `${fmt(winners[0].result[spec.key])}${spec.unit ?? ''}`;
    const names = winners.map((w) => w.label).join(', ');
    const direction = spec.goal === 'min' ? 'lowest' : 'highest';
    notes.push(
      winners.length === rows.length
        ? `All selected algorithms tie on ${spec.label} at ${value}.`
        : `${names} achieve${winners.length > 1 ? '' : 's'} the ${direction} ${spec.label} at ${value}.`,
    );
  });

  // Structural observation: identical busy time is expected and worth naming,
  // because it isolates *ordering* as the only thing the algorithms changed.
  const busy = new Set(rows.map((r) => r.result.cpuBusyTime));
  if (busy.size === 1) {
    notes.push(
      `CPU busy time is identical (${[...busy][0]} units) across every algorithm — the same total work is done, so the differences above come purely from the ORDER in which processes were scheduled.`,
    );
  }

  const spans = rows.map((r) => r.result.totalTime);
  if (new Set(spans).size > 1) {
    const longest = rows[spans.indexOf(Math.max(...spans))];
    notes.push(
      `Schedule length varies: ${longest.label} takes the longest at ${Math.max(...spans)} units, which raises its idle time and lowers utilization.`,
    );
  }

  return notes;
}
