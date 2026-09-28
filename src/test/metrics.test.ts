import { describe, expect, it } from 'vitest';
import { calculateThroughput, countContextSwitches } from '../engine/metrics';
import { SCHEDULERS } from '../algorithms';
import { EXAMPLES } from '../data/examples';

describe('Performance metrics extensions', () => {
  it('counts context switches correctly across non-idle transitions', () => {
    // P1 -> P2 -> P3 -> P1 (3 switches)
    const gantt1 = [
      { processId: 'P1', startTime: 0, endTime: 2 },
      { processId: 'P2', startTime: 2, endTime: 4 },
      { processId: 'P3', startTime: 4, endTime: 6 },
      { processId: 'P1', startTime: 6, endTime: 8 },
    ];
    expect(countContextSwitches(gantt1)).toBe(3);

    // P1 -> IDLE -> P2 (1 switch)
    const gantt2 = [
      { processId: 'P1', startTime: 0, endTime: 2 },
      { processId: 'IDLE', startTime: 2, endTime: 5 },
      { processId: 'P2', startTime: 5, endTime: 7 },
    ];
    expect(countContextSwitches(gantt2)).toBe(1);

    // Single process (0 switches)
    const gantt3 = [
      { processId: 'P1', startTime: 0, endTime: 5 },
    ];
    expect(countContextSwitches(gantt3)).toBe(0);
  });

  it('calculates throughput accurately', () => {
    expect(calculateThroughput(4, 10)).toBe(0.4);
    expect(calculateThroughput(0, 10)).toBe(0);
    expect(calculateThroughput(4, 0)).toBe(0);
  });

  it('computes throughput and context switches in SCHEDULERS result', () => {
    const res = SCHEDULERS.fcfs(EXAMPLES[0].processes, { timeQuantum: 2, priorityOrder: 'lower-is-higher' });
    expect(res.throughput).toBeGreaterThan(0);
    expect(typeof res.contextSwitches).toBe('number');
    expect(res.contextSwitches).toBeGreaterThanOrEqual(0);
  });
});
