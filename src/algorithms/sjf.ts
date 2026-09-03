/** SJF — Shortest Job First. Rule: among arrived processes, run the shortest burst. */
import type { SchedulerFn } from '../types/scheduling';
import { buildResult } from '../engine/metrics';
import { runNonPreemptive, tieBreak } from '../engine/scheduler';

export const sjf: SchedulerFn = (processes) => {
  const { blocks, log } = runNonPreemptive(processes, (ready) =>
    [...ready].sort((a, b) => a.burstTime - b.burstTime || tieBreak(a, b))[0] ?? null,
  );
  return buildResult(processes, blocks, log);
};
