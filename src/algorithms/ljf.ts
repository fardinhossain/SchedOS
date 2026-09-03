/** LJF — Longest Job First. Rule: among arrived processes, run the longest burst. */
import type { SchedulerFn } from '../types/scheduling';
import { buildResult } from '../engine/metrics';
import { runNonPreemptive, tieBreak } from '../engine/scheduler';

export const ljf: SchedulerFn = (processes) => {
  const { blocks, log } = runNonPreemptive(processes, (ready) =>
    [...ready].sort((a, b) => b.burstTime - a.burstTime || tieBreak(a, b))[0] ?? null,
  );
  return buildResult(processes, blocks, log);
};
