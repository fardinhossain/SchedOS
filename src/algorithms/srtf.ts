/**
 * SRTF — Shortest Remaining Time First (preemptive SJF).
 * Rule: at every instant, run the arrived process with least remaining time.
 */
import type { SchedulerFn } from '../types/scheduling';
import { buildResult } from '../engine/metrics';
import { runPreemptive, tieBreak } from '../engine/scheduler';

export const srtf: SchedulerFn = (processes) => {
  const { blocks, log } = runPreemptive(processes, (ready) =>
    [...ready].sort((a, b) => a.remaining - b.remaining || tieBreak(a, b))[0] ?? null,
  );
  return buildResult(processes, blocks, log);
};
