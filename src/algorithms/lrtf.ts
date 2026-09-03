/**
 * LRTF — Longest Remaining Time First.
 * Rule: at every instant, run the arrived process with the most remaining time.
 *
 * Note the behaviour this produces: because the running process's remaining
 * time shrinks each tick, it repeatedly loses its lead and the CPU alternates
 * between the longest jobs. That heavy context switching is exactly why LRTF is
 * studied as a cautionary example rather than used in practice.
 */
import type { SchedulerFn } from '../types/scheduling';
import { buildResult } from '../engine/metrics';
import { runPreemptive, tieBreak } from '../engine/scheduler';

export const lrtf: SchedulerFn = (processes) => {
  const { blocks, log } = runPreemptive(processes, (ready) =>
    [...ready].sort((a, b) => b.remaining - a.remaining || tieBreak(a, b))[0] ?? null,
  );
  return buildResult(processes, blocks, log);
};
