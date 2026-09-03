/**
 * Educational reference implementations of FCFS.
 * Same logic in every language; only the syntax differs.
 * These are displayed for learning only — never executed by the simulator.
 */
import type { SupportedLanguage } from '../types/scheduling';

export const fcfsCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>

/* First Come First Serve (FCFS) — non-preemptive.
   Rule: run whichever process arrived first, to completion. */

typedef struct {
    char  id[8];
    int   arrival;
    int   burst;
    int   completion;
    int   turnaround;
    int   waiting;
    int   response;
} Process;

/* Sort by arrival time; ties broken by original input order. */
void sort_by_arrival(Process p[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (p[j].arrival > p[j + 1].arrival) {
                Process tmp = p[j];
                p[j] = p[j + 1];
                p[j + 1] = tmp;
            }
        }
    }
}

void fcfs(Process p[], int n) {
    sort_by_arrival(p, n);

    int clock = 0;
    for (int i = 0; i < n; i++) {
        /* If the CPU is free before the process arrives, it sits idle. */
        if (clock < p[i].arrival) {
            clock = p[i].arrival;
        }

        p[i].response   = clock - p[i].arrival;   /* first start - arrival */
        clock          += p[i].burst;
        p[i].completion = clock;
        p[i].turnaround = p[i].completion - p[i].arrival;
        p[i].waiting    = p[i].turnaround - p[i].burst;
    }
}

int main(void) {
    int n;
    printf("Number of processes: ");
    if (scanf("%d", &n) != 1 || n <= 0) return 1;

    Process p[64];
    for (int i = 0; i < n; i++) {
        printf("PID, arrival, burst for process %d: ", i + 1);
        scanf("%7s %d %d", p[i].id, &p[i].arrival, &p[i].burst);
    }

    fcfs(p, n);

    double total_wt = 0, total_tat = 0, total_rt = 0;
    int busy = 0, last = 0, first_arrival = p[0].arrival;

    printf("\\nPID  AT  BT  CT  TAT  WT  RT\\n");
    for (int i = 0; i < n; i++) {
        printf("%-4s %3d %3d %3d %4d %3d %3d\\n",
               p[i].id, p[i].arrival, p[i].burst,
               p[i].completion, p[i].turnaround,
               p[i].waiting, p[i].response);
        total_wt  += p[i].waiting;
        total_tat += p[i].turnaround;
        total_rt  += p[i].response;
        busy      += p[i].burst;
        if (p[i].completion > last) last = p[i].completion;
    }

    int total_time = last - first_arrival;
    printf("\\nAverage WT  : %.2f\\n", total_wt  / n);
    printf("Average TAT : %.2f\\n", total_tat / n);
    printf("Average RT  : %.2f\\n", total_rt  / n);
    printf("CPU busy    : %d\\n", busy);
    printf("CPU idle    : %d\\n", total_time - busy);
    printf("CPU util    : %.2f%%\\n", 100.0 * busy / total_time);
    return 0;
}`,

  python: `"""First Come First Serve (FCFS) — non-preemptive.
Rule: run whichever process arrived first, to completion.
"""
from dataclasses import dataclass, field


@dataclass
class Process:
    pid: str
    arrival: int
    burst: int
    completion: int = field(default=0)
    turnaround: int = field(default=0)
    waiting: int = field(default=0)
    response: int = field(default=0)


def fcfs(processes: list[Process]) -> list[tuple[str, int, int]]:
    """Schedules the processes in place and returns the Gantt timeline
    as a list of (pid, start, end) tuples. 'IDLE' marks CPU gaps."""
    # Sort by arrival; ties keep their original relative order (stable sort).
    order = sorted(processes, key=lambda p: p.arrival)

    timeline: list[tuple[str, int, int]] = []
    clock = 0

    for p in order:
        # If the CPU is free before this process arrives, it sits idle.
        if clock < p.arrival:
            timeline.append(("IDLE", clock, p.arrival))
            clock = p.arrival

        start = clock
        p.response = start - p.arrival          # first start - arrival
        clock += p.burst
        p.completion = clock
        p.turnaround = p.completion - p.arrival
        p.waiting = p.turnaround - p.burst
        timeline.append((p.pid, start, clock))

    return timeline


def report(processes: list[Process], timeline: list[tuple[str, int, int]]) -> None:
    n = len(processes)
    busy = sum(p.burst for p in processes)
    first_arrival = min(p.arrival for p in processes)
    last_completion = max(p.completion for p in processes)
    total_time = last_completion - first_arrival

    print("PID  AT  BT  CT  TAT  WT  RT")
    for p in sorted(processes, key=lambda x: x.pid):
        print(f"{p.pid:<4} {p.arrival:3} {p.burst:3} {p.completion:3} "
              f"{p.turnaround:4} {p.waiting:3} {p.response:3}")

    print()
    print("Gantt:", " | ".join(f"{pid} {s}-{e}" for pid, s, e in timeline))
    print(f"Average WT  : {sum(p.waiting for p in processes) / n:.2f}")
    print(f"Average TAT : {sum(p.turnaround for p in processes) / n:.2f}")
    print(f"Average RT  : {sum(p.response for p in processes) / n:.2f}")
    print(f"CPU busy    : {busy}")
    print(f"CPU idle    : {total_time - busy}")
    print(f"CPU util    : {100 * busy / total_time:.2f}%")


if __name__ == "__main__":
    demo = [
        Process("P1", arrival=0, burst=8),
        Process("P2", arrival=1, burst=4),
        Process("P3", arrival=2, burst=2),
        Process("P4", arrival=3, burst=6),
    ]
    report(demo, fcfs(demo))`,

  typescript: `/**
 * First Come First Serve (FCFS) — non-preemptive.
 * Rule: run whichever process arrived first, to completion.
 */

interface ProcessInput {
  id: string;
  arrivalTime: number;
  burstTime: number;
}

interface GanttBlock {
  processId: string; // "IDLE" marks a CPU gap
  startTime: number;
  endTime: number;
}

interface ProcessResult extends ProcessInput {
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
}

interface SchedulingResult {
  gantt: GanttBlock[];
  processes: ProcessResult[];
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;
  cpuBusyTime: number;
  cpuIdleTime: number;
  cpuUtilization: number;
}

function fcfs(input: ProcessInput[]): SchedulingResult {
  // Sort by arrival time; ties fall back to process id for determinism.
  const order = [...input].sort(
    (a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id),
  );

  const gantt: GanttBlock[] = [];
  const processes: ProcessResult[] = [];
  let clock = 0;

  for (const p of order) {
    // If the CPU is free before this process arrives, it sits idle.
    if (clock < p.arrivalTime) {
      gantt.push({ processId: 'IDLE', startTime: clock, endTime: p.arrivalTime });
      clock = p.arrivalTime;
    }

    const startTime = clock;
    clock += p.burstTime;

    gantt.push({ processId: p.id, startTime, endTime: clock });
    processes.push({
      ...p,
      completionTime: clock,
      turnaroundTime: clock - p.arrivalTime,
      waitingTime: clock - p.arrivalTime - p.burstTime,
      responseTime: startTime - p.arrivalTime,
    });
  }

  return summarise(input, gantt, processes);
}

/** Derives every reported figure from the emitted timeline. */
function summarise(
  input: ProcessInput[],
  gantt: GanttBlock[],
  processes: ProcessResult[],
): SchedulingResult {
  const n = processes.length;
  const startTime = Math.min(...input.map((p) => p.arrivalTime));
  const endTime = Math.max(...gantt.map((b) => b.endTime));
  const totalTime = endTime - startTime;

  const cpuBusyTime = gantt
    .filter((b) => b.processId !== 'IDLE')
    .reduce((sum, b) => sum + (b.endTime - b.startTime), 0);

  const mean = (pick: (p: ProcessResult) => number): number =>
    Math.round((processes.reduce((s, p) => s + pick(p), 0) / n) * 100) / 100;

  return {
    gantt,
    processes,
    averageWaitingTime: mean((p) => p.waitingTime),
    averageTurnaroundTime: mean((p) => p.turnaroundTime),
    averageResponseTime: mean((p) => p.responseTime),
    cpuBusyTime,
    cpuIdleTime: totalTime - cpuBusyTime,
    cpuUtilization: Math.round((cpuBusyTime / totalTime) * 10000) / 100,
  };
}

// ── Demo ──────────────────────────────────────────────────────
const demo: ProcessInput[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 8 },
  { id: 'P2', arrivalTime: 1, burstTime: 4 },
  { id: 'P3', arrivalTime: 2, burstTime: 2 },
  { id: 'P4', arrivalTime: 3, burstTime: 6 },
];

const result = fcfs(demo);
console.table(result.processes);
console.log('Average WT :', result.averageWaitingTime);
console.log('CPU util   :', result.cpuUtilization + '%');`,
};
