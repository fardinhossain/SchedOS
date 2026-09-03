/**
 * Educational reference implementations of LJF (non-preemptive).
 * Same logic in every language; only the syntax differs.
 * These are displayed for learning only — never executed by the simulator.
 */
import type { SupportedLanguage } from '../types/scheduling';

export const ljfCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>

/* Longest Job First (LJF) — non-preemptive.
   Rule: among all processes that have ARRIVED (arrival <= clock), pick
   the one with the LARGEST burst time and run it to completion.

   LJF is the pathological opposite of SJF: by always choosing the
   longest job it maximises average waiting time — short jobs get stuck
   waiting behind every large one, ballooning turnaround times.
   It is studied as the worst-case counterexample to SJF optimality. */

typedef struct {
    char  id[8];
    int   arrival;
    int   burst;
    int   completion;
    int   turnaround;
    int   waiting;
    int   response;
    int   done;      /* 1 once the process has been scheduled */
} Process;

/* Return the index of the arrived, unscheduled process with the
   longest burst.  Tie-break: earlier arrival wins; then lower index
   (i.e. the process that was entered first). */
int select_ljf(Process p[], int n, int clock) {
    int chosen = -1;
    for (int i = 0; i < n; i++) {
        if (p[i].done || p[i].arrival > clock) continue;   /* key guard */
        if (chosen == -1) { chosen = i; continue; }
        if (p[i].burst > p[chosen].burst ||
            (p[i].burst == p[chosen].burst &&
             p[i].arrival < p[chosen].arrival) ||
            (p[i].burst == p[chosen].burst &&
             p[i].arrival == p[chosen].arrival && i < chosen)) {
            chosen = i;
        }
    }
    return chosen;
}

/* Minimum arrival time among processes that have not yet been scheduled.
   Called only when no process is ready (CPU is idle). */
int next_arrival(Process p[], int n) {
    int t = -1;
    for (int i = 0; i < n; i++) {
        if (p[i].done) continue;
        if (t == -1 || p[i].arrival < t) t = p[i].arrival;
    }
    return t;
}

void ljf(Process p[], int n) {
    int clock = 0, scheduled = 0;
    while (scheduled < n) {
        int idx = select_ljf(p, n, clock);
        if (idx == -1) {
            /* No process has arrived yet — jump forward to avoid busy-wait. */
            clock = next_arrival(p, n);
            continue;
        }
        p[idx].response   = clock - p[idx].arrival;   /* first start - arrival */
        clock            += p[idx].burst;
        p[idx].completion = clock;
        p[idx].turnaround = p[idx].completion - p[idx].arrival;
        p[idx].waiting    = p[idx].turnaround - p[idx].burst;
        p[idx].done       = 1;
        scheduled++;
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
        p[i].done = 0;
    }

    ljf(p, n);

    double total_wt = 0, total_tat = 0, total_rt = 0;
    int busy = 0, last = 0;
    int first_arrival = p[0].arrival;
    for (int i = 1; i < n; i++)
        if (p[i].arrival < first_arrival) first_arrival = p[i].arrival;

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

  python: `"""Longest Job First (LJF) — non-preemptive.
Rule: among all processes that have ARRIVED (arrival <= clock),
pick the one with the LARGEST burst time and run it to completion.

LJF is the pathological opposite of SJF: always choosing the longest
job maximises average waiting time. Short processes get stuck waiting
behind every large one — a useful classroom counterexample showing
exactly why SJF is optimal.
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


def ljf(processes: list[Process]) -> list[tuple[str, int, int]]:
    """Schedules the processes in place and returns the Gantt timeline
    as a list of (pid, start, end) tuples. 'IDLE' marks CPU gaps."""
    remaining = list(processes)   # work list; entries removed as scheduled
    timeline: list[tuple[str, int, int]] = []
    clock = 0

    while remaining:
        # Key difference from FCFS: only consider processes that have arrived.
        ready = [p for p in remaining if p.arrival <= clock]

        if not ready:
            # No process is ready — advance to the nearest future arrival.
            next_arrival = min(p.arrival for p in remaining)
            timeline.append(("IDLE", clock, next_arrival))
            clock = next_arrival
            continue

        # LJF selection: largest burst wins (opposite of SJF).
        # Tie-break: earlier arrival, then lexicographic pid.
        chosen = sorted(ready, key=lambda p: (-p.burst, p.arrival, p.pid))[0]

        start = clock
        chosen.response = start - chosen.arrival          # first start - arrival
        clock += chosen.burst
        chosen.completion = clock
        chosen.turnaround = chosen.completion - chosen.arrival
        chosen.waiting = chosen.turnaround - chosen.burst

        timeline.append((chosen.pid, start, clock))
        remaining.remove(chosen)

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
    report(demo, ljf(demo))`,

  typescript: `/**
 * Longest Job First (LJF) — non-preemptive.
 * Rule: among all processes that have ARRIVED, pick the one with the
 * largest burst time and run it to completion.
 *
 * LJF is the pathological opposite of SJF: always choosing the longest
 * job maximises average waiting time. Short processes are perpetually
 * pushed to the back of the queue, making LJF a canonical worst-case
 * counterexample for non-preemptive scheduling analysis.
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

function ljf(input: ProcessInput[]): SchedulingResult {
  // Work on shallow copies so the caller's array is unchanged.
  const remaining: ProcessInput[] = input.map((p) => ({ ...p }));
  const gantt: GanttBlock[] = [];
  const processes: ProcessResult[] = [];
  let clock = 0;

  while (remaining.length > 0) {
    // Key difference from FCFS: only processes that have arrived are eligible.
    const ready = remaining.filter((p) => p.arrivalTime <= clock);

    if (ready.length === 0) {
      // No process has arrived yet — advance the clock to avoid busy-wait.
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      gantt.push({ processId: 'IDLE', startTime: clock, endTime: nextArrival });
      clock = nextArrival;
      continue;
    }

    // LJF selection: largest burst wins (opposite of SJF).
    // Tie-break: earlier arrival, then lexicographic id.
    ready.sort(
      (a, b) =>
        b.burstTime - a.burstTime ||
        a.arrivalTime - b.arrivalTime ||
        a.id.localeCompare(b.id),
    );
    const chosen = ready[0];

    const startTime = clock;
    clock += chosen.burstTime;

    gantt.push({ processId: chosen.id, startTime, endTime: clock });
    processes.push({
      ...chosen,
      completionTime: clock,
      turnaroundTime: clock - chosen.arrivalTime,
      waitingTime: clock - chosen.arrivalTime - chosen.burstTime,
      responseTime: startTime - chosen.arrivalTime,
    });

    // Remove scheduled process from the work list.
    const idx = remaining.findIndex((p) => p.id === chosen.id);
    remaining.splice(idx, 1);
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

const result = ljf(demo);
console.table(result.processes);
console.log('Average WT :', result.averageWaitingTime);
console.log('CPU util   :', result.cpuUtilization + '%');`,
};
