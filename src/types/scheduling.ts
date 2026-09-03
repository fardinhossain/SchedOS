/**
 * SchedOS — shared scheduling data model.
 *
 * Every algorithm in `src/algorithms` consumes `ProcessInput[]` and returns a
 * `SchedulingResult` built by `engine/metrics.ts`. That uniformity is what makes
 * the Compare page and the simulation player algorithm-agnostic.
 */

/** A single process as entered by the user. */
export interface ProcessInput {
  id: string;
  arrivalTime: number;
  burstTime: number;
  /** Lower number = higher priority. Only meaningful for Priority algorithms. */
  priority?: number;
}

/**
 * One contiguous span of the CPU timeline. `processId === IDLE_ID` marks a gap
 * where no process was available to run — rendered with hatching, never treated
 * as a normal process.
 */
export interface GanttBlock {
  processId: string;
  startTime: number;
  endTime: number;
}

export const IDLE_ID = 'IDLE' as const;

/** Per-process outcome, all values derived from the emitted timeline. */
export interface ProcessResult extends ProcessInput {
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  firstStartTime: number;
}

/** A single observable event, used to drive the system log and animations. */
export type LogEventType =
  | 'ARRIVE'
  | 'DISPATCH'
  | 'PREEMPT'
  | 'COMPLETE'
  | 'IDLE_START'
  | 'QUANTUM_EXPIRE';

export interface LogEvent {
  time: number;
  type: LogEventType;
  processId: string;
  message: string;
}

export interface SchedulingResult {
  gantt: GanttBlock[];
  processes: ProcessResult[];
  log: LogEvent[];

  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;

  cpuBusyTime: number;
  cpuIdleTime: number;
  cpuUtilization: number;

  /** Wall-clock span of the simulation: last completion minus first arrival. */
  totalTime: number;
  /** Absolute instant the timeline ends (useful for axis rendering). */
  endTime: number;
  /** Absolute instant the timeline begins (the earliest arrival). */
  startTime: number;
}

export type AlgorithmId =
  | 'fcfs'
  | 'sjf'
  | 'ljf'
  | 'priority-np'
  | 'srtf'
  | 'lrtf'
  | 'rr'
  | 'priority-p';

export type AlgorithmCategory = 'non-preemptive' | 'preemptive';

export interface AlgorithmOptions {
  /** Required (and validated) for Round Robin only. */
  timeQuantum?: number;
}

export type SchedulerFn = (
  processes: ProcessInput[],
  options?: AlgorithmOptions,
) => SchedulingResult;

export interface AlgorithmMeta {
  id: AlgorithmId;
  name: string;
  shortName: string;
  category: AlgorithmCategory;
  /** One-line scheduling rule, shown on the Algorithms page. */
  rule: string;
  summary: string;
  advantages: string[];
  disadvantages: string[];
  /** True when the algorithm reads `priority`. */
  usesPriority: boolean;
  /** True when the algorithm reads `timeQuantum`. */
  usesTimeQuantum: boolean;
  /** How ties between equally-eligible processes are resolved. */
  tieBreak: string;
}

export type SupportedLanguage = 'c' | 'python' | 'typescript';

export interface ValidationIssue {
  /** Index into the process array, or null for whole-form issues. */
  row: number | null;
  field: 'id' | 'arrivalTime' | 'burstTime' | 'priority' | 'timeQuantum' | 'form';
  message: string;
}
