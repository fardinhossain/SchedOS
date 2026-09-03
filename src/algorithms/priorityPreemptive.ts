/**
 * Priority (Preemptive). Rule: a higher-priority arrival immediately preempts
 * the running process. Convention: LOWER priority number = HIGHER priority.
 */
import type { SchedulerFn } from '../types/scheduling';
import { buildResult } from '../engine/metrics';
import { runPreemptive, tieBreak } from '../engine/scheduler';

export const priorityPreemptive: SchedulerFn = (processes) => {
  const { blocks, log } = runPreemptive(processes, (ready) =>
    [...ready].sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0) || tieBreak(a, b),
    )[0] ?? null,
  );
  return buildResult(processes, blocks, log);
};
