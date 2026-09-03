/** FCFS — First Come First Serve. Rule: run whichever process arrived first. */
import type { SchedulerFn } from '../types/scheduling';
import { buildResult } from '../engine/metrics';
import { runNonPreemptive, tieBreak } from '../engine/scheduler';

export const fcfs: SchedulerFn = (processes) => {
  const { blocks, log } = runNonPreemptive(processes, (ready) =>
    // tieBreak already orders by arrival then id, which IS the FCFS rule.
    [...ready].sort(tieBreak)[0] ?? null,
  );
  return buildResult(processes, blocks, log);
};
