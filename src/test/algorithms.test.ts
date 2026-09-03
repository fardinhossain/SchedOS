/**
 * SchedOS — scheduling engine test suite (spec §32).
 *
 * Two layers:
 *   1. INVARIANTS run every algorithm against every dataset and assert the
 *      structural properties that must hold universally. These catch the whole
 *      class of "chart disagrees with table" bugs.
 *   2. HAND-COMPUTED CASES pin exact timelines and metrics that were worked out
 *      on paper, so a plausible-but-wrong schedule cannot pass.
 */
import { describe, expect, it } from 'vitest';
import type { AlgorithmId, ProcessInput, SchedulingResult } from '../types/scheduling';
import { IDLE_ID } from '../types/scheduling';
import { ALGORITHMS, SCHEDULERS } from '../algorithms';
import { EXAMPLES } from '../data/examples';

const ALL_IDS = ALGORITHMS.map((a) => a.id);

/** Compact "P1:0-2,P2:2-4" form, for readable timeline assertions. */
function timeline(result: SchedulingResult): string {
  return result.gantt.map((b) => `${b.processId}:${b.startTime}-${b.endTime}`).join(',');
}

function run(id: AlgorithmId, processes: ProcessInput[], timeQuantum = 2): SchedulingResult {
  return SCHEDULERS[id](processes, { timeQuantum });
}

describe('structural invariants (every algorithm × every dataset)', () => {
  for (const example of EXAMPLES) {
    for (const id of ALL_IDS) {
      describe(`${id} / ${example.name}`, () => {
        const result = run(id, example.processes, example.timeQuantum ?? 2);

        it('emits a contiguous timeline with no gaps or overlaps', () => {
          for (let i = 1; i < result.gantt.length; i += 1) {
            expect(result.gantt[i].startTime).toBe(result.gantt[i - 1].endTime);
          }
          result.gantt.forEach((b) => expect(b.endTime).toBeGreaterThan(b.startTime));
        });

        it('never runs a process before it arrives', () => {
          result.gantt
            .filter((b) => b.processId !== IDLE_ID)
            .forEach((b) => {
              const proc = example.processes.find((p) => p.id === b.processId);
              expect(proc).toBeDefined();
              expect(b.startTime).toBeGreaterThanOrEqual(proc!.arrivalTime);
            });
        });

        it('gives each process exactly its burst time of CPU', () => {
          example.processes.forEach((p) => {
            const served = result.gantt
              .filter((b) => b.processId === p.id)
              .reduce((sum, b) => sum + (b.endTime - b.startTime), 0);
            expect(served).toBe(p.burstTime);
          });
        });

        it('reports CPU busy time equal to the sum of all bursts', () => {
          const totalBurst = example.processes.reduce((s, p) => s + p.burstTime, 0);
          expect(result.cpuBusyTime).toBe(totalBurst);
        });

        it('keeps busy + idle equal to total elapsed time', () => {
          expect(result.cpuBusyTime + result.cpuIdleTime).toBe(result.totalTime);
        });

        it('derives every per-process metric consistently from the timeline', () => {
          result.processes.forEach((p) => {
            // TAT = CT - AT and WT = TAT - BT must hold exactly.
            expect(p.turnaroundTime).toBe(p.completionTime - p.arrivalTime);
            expect(p.waitingTime).toBe(p.turnaroundTime - p.burstTime);
            expect(p.responseTime).toBe(p.firstStartTime - p.arrivalTime);
            expect(p.waitingTime).toBeGreaterThanOrEqual(0);
            expect(p.responseTime).toBeGreaterThanOrEqual(0);
            // A process cannot respond after it completes.
            expect(p.firstStartTime).toBeLessThan(p.completionTime);
            // Completion must match the last block the timeline gave it.
            const own = result.gantt.filter((b) => b.processId === p.id);
            expect(p.completionTime).toBe(Math.max(...own.map((b) => b.endTime)));
          });
        });

        it('reports averages matching the per-process values', () => {
          const n = result.processes.length;
          const avg = (pick: (p: (typeof result.processes)[number]) => number): number =>
            Math.round((result.processes.reduce((s, p) => s + pick(p), 0) / n) * 100) / 100;
          expect(result.averageWaitingTime).toBe(avg((p) => p.waitingTime));
          expect(result.averageTurnaroundTime).toBe(avg((p) => p.turnaroundTime));
          expect(result.averageResponseTime).toBe(avg((p) => p.responseTime));
        });

        it('reports a utilization consistent with busy and total time', () => {
          const expected = Math.round((result.cpuBusyTime / result.totalTime) * 10000) / 100;
          expect(result.cpuUtilization).toBeCloseTo(expected, 2);
          expect(result.cpuUtilization).toBeGreaterThan(0);
          expect(result.cpuUtilization).toBeLessThanOrEqual(100);
        });

        it('never places two idle blocks back to back', () => {
          for (let i = 1; i < result.gantt.length; i += 1) {
            const bothIdle =
              result.gantt[i].processId === IDLE_ID &&
              result.gantt[i - 1].processId === IDLE_ID;
            expect(bothIdle).toBe(false);
          }
        });
      });
    }
  }
});

describe('FCFS — hand-computed', () => {
  const procs = EXAMPLES[0].processes; // P1(0,8) P2(1,4) P3(2,2) P4(3,6)
  const r = run('fcfs', procs);

  it('runs strictly in arrival order', () => {
    expect(timeline(r)).toBe('P1:0-8,P2:8-12,P3:12-14,P4:14-20');
  });

  it('matches paper metrics', () => {
    expect(r.averageWaitingTime).toBe(7);
    expect(r.averageTurnaroundTime).toBe(12);
    expect(r.averageResponseTime).toBe(7);
    expect(r.cpuUtilization).toBe(100);
    expect(r.cpuIdleTime).toBe(0);
    expect(r.totalTime).toBe(20);
  });
});

describe('SJF — hand-computed', () => {
  const r = run('sjf', EXAMPLES[0].processes);

  it('picks P3 over P2 and P4 once P1 releases the CPU', () => {
    expect(timeline(r)).toBe('P1:0-8,P3:8-10,P2:10-14,P4:14-20');
  });

  it('beats FCFS on average waiting time for the same set', () => {
    expect(r.averageWaitingTime).toBe(6.5);
    expect(r.averageTurnaroundTime).toBe(11.5);
    expect(r.averageWaitingTime).toBeLessThan(run('fcfs', EXAMPLES[0].processes).averageWaitingTime);
  });
});

describe('LJF — hand-computed', () => {
  // Same arrival time isolates the selection rule completely.
  const procs = EXAMPLES[4].processes; // all AT=0: 7, 2, 5, 1
  const r = run('ljf', procs);

  it('runs longest to shortest', () => {
    expect(timeline(r)).toBe('P1:0-7,P3:7-12,P2:12-14,P4:14-15');
  });

  it('produces a worse average wait than SJF on the same set', () => {
    expect(r.averageWaitingTime).toBe(8.25);
    expect(run('sjf', procs).averageWaitingTime).toBeLessThan(r.averageWaitingTime);
  });
});

describe('SRTF — hand-computed', () => {
  const r = run('srtf', EXAMPLES[2].processes); // P1(0,9) P2(1,5) P3(2,3) P4(3,1)

  it('preempts on each shorter arrival, splitting P1 and P3', () => {
    expect(timeline(r)).toBe('P1:0-1,P2:1-2,P3:2-3,P4:3-4,P3:4-6,P2:6-10,P1:10-18');
  });

  it('matches paper metrics and gives every process a zero response time', () => {
    expect(r.averageWaitingTime).toBe(3.5);
    expect(r.averageTurnaroundTime).toBe(8);
    expect(r.averageResponseTime).toBe(0);
  });

  it('is at least as good as SJF on average waiting time', () => {
    const sjfResult = run('sjf', EXAMPLES[2].processes);
    expect(r.averageWaitingTime).toBeLessThanOrEqual(sjfResult.averageWaitingTime);
  });
});

describe('LRTF — hand-computed', () => {
  const procs: ProcessInput[] = [
    { id: 'P1', arrivalTime: 0, burstTime: 4 },
    { id: 'P2', arrivalTime: 0, burstTime: 2 },
  ];
  const r = run('lrtf', procs);

  it('alternates as remaining times converge, then finishes both', () => {
    expect(timeline(r)).toBe('P1:0-3,P2:3-4,P1:4-5,P2:5-6');
  });

  it('completes every process exactly once at the right instant', () => {
    const byId = Object.fromEntries(r.processes.map((p) => [p.id, p]));
    expect(byId.P1.completionTime).toBe(5);
    expect(byId.P2.completionTime).toBe(6);
    expect(r.averageWaitingTime).toBe(2.5);
  });
});

describe('Round Robin — hand-computed', () => {
  const r = run('rr', EXAMPLES[0].processes, 2);

  it('cycles processes one quantum at a time', () => {
    expect(timeline(r)).toBe(
      'P1:0-2,P2:2-4,P3:4-6,P1:6-8,P4:8-10,P2:10-12,P1:12-14,P4:14-16,P1:16-18,P4:18-20',
    );
  });

  it('matches paper metrics', () => {
    expect(r.averageWaitingTime).toBe(7.5);
    expect(r.averageTurnaroundTime).toBe(12.5);
    expect(r.averageResponseTime).toBe(2);
  });

  it('enqueues a process arriving at quantum expiry BEFORE requeuing the preempted one', () => {
    // P2 arrives exactly at t=2, the instant P1's first quantum expires.
    // Correct: P2 runs next. Incorrect: P1 jumps ahead of P2.
    const procs: ProcessInput[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 6 },
      { id: 'P2', arrivalTime: 2, burstTime: 2 },
    ];
    expect(timeline(run('rr', procs, 2))).toBe('P1:0-2,P2:2-4,P1:4-6,P1:6-8');
  });

  it('degenerates to FCFS when the quantum exceeds every burst', () => {
    const procs = EXAMPLES[0].processes;
    expect(timeline(run('rr', procs, 100))).toBe(timeline(run('fcfs', procs)));
  });

  it('handles a quantum of 1', () => {
    const procs: ProcessInput[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 3 },
      { id: 'P2', arrivalTime: 0, burstTime: 3 },
    ];
    const q1 = run('rr', procs, 1);
    expect(timeline(q1)).toBe('P1:0-1,P2:1-2,P1:2-3,P2:3-4,P1:4-5,P2:5-6');
    expect(q1.cpuUtilization).toBe(100);
  });
});

describe('Priority (non-preemptive) — hand-computed', () => {
  const r = run('priority-np', EXAMPLES[5].processes); // P1(0,6,p4) P2(2,4,p1) P3(4,3,p2) P4(6,5,p3)

  it('lets P1 finish despite lower priority, then honours priority order', () => {
    expect(timeline(r)).toBe('P1:0-6,P2:6-10,P3:10-13,P4:13-18');
  });

  it('matches paper metrics', () => {
    expect(r.averageWaitingTime).toBe(4.25);
    expect(r.averageTurnaroundTime).toBe(8.75);
    expect(r.averageResponseTime).toBe(4.25);
  });
});

describe('Priority (preemptive) — hand-computed', () => {
  const r = run('priority-p', EXAMPLES[5].processes);

  it('preempts P1 the moment higher-priority P2 arrives', () => {
    expect(timeline(r)).toBe('P1:0-2,P2:2-6,P3:6-9,P4:9-14,P1:14-18');
  });

  it('improves response time over the non-preemptive variant', () => {
    expect(r.averageResponseTime).toBe(1.25);
    expect(r.averageResponseTime).toBeLessThan(
      run('priority-np', EXAMPLES[5].processes).averageResponseTime,
    );
    // Same total work, so turnaround happens to match here — worth pinning.
    expect(r.averageTurnaroundTime).toBe(8.75);
  });
});

describe('CPU idle handling', () => {
  const procs = EXAMPLES[1].processes; // P1(0,3) P2(7,4) P3(15,2)

  it('emits hatchable IDLE blocks in the arrival gaps', () => {
    expect(timeline(run('fcfs', procs))).toBe(
      'P1:0-3,IDLE:3-7,P2:7-11,IDLE:11-15,P3:15-17',
    );
  });

  it('computes idle time and utilization from those gaps', () => {
    const r = run('fcfs', procs);
    expect(r.cpuBusyTime).toBe(9);
    expect(r.cpuIdleTime).toBe(8);
    expect(r.totalTime).toBe(17);
    expect(r.cpuUtilization).toBe(52.94);
  });

  it('never yields a negative response time across an idle gap', () => {
    ALL_IDS.forEach((id) => {
      run(id, procs).processes.forEach((p) => {
        expect(p.responseTime).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('reports zero waiting for every process when the CPU is always free on arrival', () => {
    run('fcfs', procs).processes.forEach((p) => expect(p.waitingTime).toBe(0));
  });
});

describe('edge cases', () => {
  it('handles a single process under every algorithm', () => {
    const one: ProcessInput[] = [{ id: 'P1', arrivalTime: 0, burstTime: 5, priority: 1 }];
    ALL_IDS.forEach((id) => {
      const r = run(id, one);
      expect(r.processes).toHaveLength(1);
      expect(r.processes[0].completionTime).toBe(5);
      expect(r.processes[0].waitingTime).toBe(0);
      expect(r.cpuUtilization).toBe(100);
      expect(r.cpuIdleTime).toBe(0);
    });
  });

  it('handles a single late-arriving process without inventing leading idle time', () => {
    const late: ProcessInput[] = [{ id: 'P1', arrivalTime: 9, burstTime: 4, priority: 1 }];
    ALL_IDS.forEach((id) => {
      const r = run(id, late);
      expect(r.startTime).toBe(9);
      expect(r.cpuIdleTime).toBe(0);
      expect(r.processes[0].completionTime).toBe(13);
    });
  });

  it('handles an empty process list without throwing', () => {
    ALL_IDS.forEach((id) => {
      const r = run(id, []);
      expect(r.gantt).toHaveLength(0);
      expect(r.processes).toHaveLength(0);
      expect(r.averageWaitingTime).toBe(0);
    });
  });

  it('handles equal burst times deterministically', () => {
    const equal: ProcessInput[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, priority: 1 },
      { id: 'P2', arrivalTime: 0, burstTime: 4, priority: 1 },
      { id: 'P3', arrivalTime: 0, burstTime: 4, priority: 1 },
    ];
    ALL_IDS.forEach((id) => {
      // Determinism: identical input must give a byte-identical timeline.
      expect(timeline(run(id, equal))).toBe(timeline(run(id, equal)));
    });
    expect(timeline(run('sjf', equal))).toBe('P1:0-4,P2:4-8,P3:8-12');
  });

  it('handles equal priorities by falling back to arrival order', () => {
    const equal: ProcessInput[] = [
      { id: 'P1', arrivalTime: 2, burstTime: 3, priority: 5 },
      { id: 'P2', arrivalTime: 0, burstTime: 3, priority: 5 },
    ];
    expect(timeline(run('priority-np', equal))).toBe('P2:0-3,P1:3-6');
  });

  it('handles a process arriving mid-execution', () => {
    const procs: ProcessInput[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 10, priority: 2 },
      { id: 'P2', arrivalTime: 5, burstTime: 2, priority: 1 },
    ];
    // Non-preemptive must ignore the arrival; preemptive must react to it.
    expect(timeline(run('fcfs', procs))).toBe('P1:0-10,P2:10-12');
    expect(timeline(run('srtf', procs))).toBe('P1:0-5,P2:5-7,P1:7-12');
  });

  it('handles large burst times and stays exact', () => {
    const big: ProcessInput[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 500, priority: 2 },
      { id: 'P2', arrivalTime: 100, burstTime: 300, priority: 1 },
    ];
    ALL_IDS.forEach((id) => {
      const r = run(id, big, 50);
      expect(r.cpuBusyTime).toBe(800);
      expect(r.cpuUtilization).toBe(100);
    });
  });

  it('stays responsive and correct with 50 processes', () => {
    const many: ProcessInput[] = Array.from({ length: 50 }, (_, i) => ({
      id: `P${i + 1}`,
      arrivalTime: i,
      burstTime: ((i * 7) % 11) + 1,
      priority: (i % 5) + 1,
    }));
    ALL_IDS.forEach((id) => {
      const started = Date.now();
      const r = run(id, many, 3);
      expect(r.processes).toHaveLength(50);
      expect(Date.now() - started).toBeLessThan(1500);
      const totalBurst = many.reduce((s, p) => s + p.burstTime, 0);
      expect(r.cpuBusyTime).toBe(totalBurst);
    });
  });

  it('treats a missing priority as 0 rather than crashing', () => {
    const noPriority: ProcessInput[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 3 },
      { id: 'P2', arrivalTime: 1, burstTime: 2 },
    ];
    expect(() => run('priority-np', noPriority)).not.toThrow();
    expect(run('priority-np', noPriority).processes).toHaveLength(2);
  });
});
