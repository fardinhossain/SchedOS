/**
 * Priority (Non-Preemptive). Rule: run the highest-priority arrived process,
 * then let it finish. Convention: LOWER priority number = HIGHER priority.
 */
import type { SchedulerFn } from '../types/scheduling';
import { buildResult } from '../engine/metrics';
import { runNonPreemptive, tieBreak } from '../engine/scheduler';

export const priorityNonPreemptive: SchedulerFn = (processes, options) => {
  const higherIsHigher = options?.priorityOrder === 'higher-is-higher';
  const { blocks, log } = runNonPreemptive(processes, (ready) =>
    [...ready].sort(
      (a, b) =>
        (higherIsHigher
          ? (b.priority ?? 0) - (a.priority ?? 0)
          : (a.priority ?? 0) - (b.priority ?? 0)) || tieBreak(a, b),
    )[0] ?? null,
  );
  return buildResult(processes, blocks, log);
};
