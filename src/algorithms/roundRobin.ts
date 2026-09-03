/**
 * Round Robin. Rule: each process runs for at most one time quantum, then goes
 * to the back of the FIFO ready queue. Queue ordering (not a selection key) is
 * what defines the algorithm — see `runRoundRobin` for the arrival-vs-requeue
 * ordering rule.
 */
import type { SchedulerFn } from '../types/scheduling';
import { buildResult } from '../engine/metrics';
import { runRoundRobin } from '../engine/scheduler';

export const roundRobin: SchedulerFn = (processes, options) => {
  const quantum = Math.max(1, Math.floor(options?.timeQuantum ?? 2));
  const { blocks, log } = runRoundRobin(processes, quantum);
  return buildResult(processes, blocks, log);
};
