/**
 * SchedOS — metric derivation.
 *
 * This module is the ONLY place performance numbers are produced, and it reads
 * exclusively from the emitted Gantt timeline. No algorithm computes its own
 * completion times, which is what guarantees the chart and the tables can never
 * disagree (spec §37).
 *
 * Timeline convention: the schedule begins at the earliest arrival time, not at
 * t=0. Time before any process exists is not counted as CPU idleness, since the
 * CPU had nothing it could possibly have run. This is stated in the UI so the
 * definition is never ambiguous to a reader.
 */
import type {
  GanttBlock,
  LogEvent,
  ProcessInput,
  ProcessResult,
  SchedulingResult,
} from '../types/scheduling';
import { IDLE_ID } from '../types/scheduling';
import { compareIds } from './scheduler';

/** Rounds to at most 2 decimals, avoiding 3.3300000000000005-style artefacts. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Formats a number for display: 3.333333 -> "3.33", 4 -> "4". */
export function fmt(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = round2(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
}

export function fmtPercent(value: number): string {
  return `${fmt(value)}%`;
}

export const EMPTY_RESULT: SchedulingResult = {
  gantt: [],
  processes: [],
  log: [],
  averageWaitingTime: 0,
  averageTurnaroundTime: 0,
  averageResponseTime: 0,
  cpuBusyTime: 0,
  cpuIdleTime: 0,
  cpuUtilization: 0,
  totalTime: 0,
  endTime: 0,
  startTime: 0,
};

/**
 * Builds the uniform `SchedulingResult` every algorithm returns.
 * @param inputs the original user input, used for arrival/burst/priority
 * @param gantt the emitted timeline — the source of truth
 * @param log chronological events for the system log
 */
export function buildResult(
  inputs: ProcessInput[],
  gantt: GanttBlock[],
  log: LogEvent[],
): SchedulingResult {
  if (!inputs.length || !gantt.length) return { ...EMPTY_RESULT };

  const startTime = Math.min(...inputs.map((p) => p.arrivalTime));
  const endTime = Math.max(...gantt.map((b) => b.endTime));
  const totalTime = endTime - startTime;

  const cpuBusyTime = gantt
    .filter((b) => b.processId !== IDLE_ID)
    .reduce((sum, b) => sum + (b.endTime - b.startTime), 0);
  const cpuIdleTime = Math.max(0, totalTime - cpuBusyTime);
  const cpuUtilization = totalTime > 0 ? (cpuBusyTime / totalTime) * 100 : 0;

  const processes: ProcessResult[] = inputs.map((input) => {
    const own = gantt.filter((b) => b.processId === input.id);
    // A process with no timeline presence would be a scheduler bug; surface it
    // as NaN-free zeros rather than crashing the UI.
    const firstStartTime = own.length ? Math.min(...own.map((b) => b.startTime)) : input.arrivalTime;
    const completionTime = own.length ? Math.max(...own.map((b) => b.endTime)) : input.arrivalTime;
    const turnaroundTime = completionTime - input.arrivalTime;
    const waitingTime = turnaroundTime - input.burstTime;
    const responseTime = firstStartTime - input.arrivalTime;
    return {
      ...input,
      firstStartTime,
      completionTime,
      turnaroundTime,
      // Clamp guards against float noise only; a real negative would be a bug
      // that the test suite is designed to catch.
      waitingTime: Math.max(0, waitingTime),
      responseTime: Math.max(0, responseTime),
    };
  });

  const n = processes.length;
  const sum = (pick: (p: ProcessResult) => number): number =>
    processes.reduce((acc, p) => acc + pick(p), 0);

  return {
    gantt,
    processes: [...processes].sort((a, b) => compareIds(a.id, b.id)),
    log: [...log].sort((a, b) => a.time - b.time),
    averageWaitingTime: round2(sum((p) => p.waitingTime) / n),
    averageTurnaroundTime: round2(sum((p) => p.turnaroundTime) / n),
    averageResponseTime: round2(sum((p) => p.responseTime) / n),
    cpuBusyTime,
    cpuIdleTime,
    cpuUtilization: round2(cpuUtilization),
    totalTime,
    endTime,
    startTime,
  };
}
