/**
 * Educational reference implementations of Priority Scheduling (non-preemptive).
 * Same logic in every language; only the syntax differs.
 * These are displayed for learning only — never executed by the simulator.
 *
 * CONVENTION: a LOWER priority number means HIGHER priority.
 *   e.g. priority 1 preempts priority 4.
 *
 * STARVATION WARNING: low-priority processes may wait indefinitely if
 *   high-priority processes keep arriving.  Priority ageing (gradually
 *   increasing a process's effective priority the longer it waits) is the
 *   standard remedy but is not shown here.
 */
import type { SupportedLanguage } from '../types/scheduling';

export const priorityNonPreemptiveCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>

/* Priority Scheduling — NON-PREEMPTIVE.
   Convention: lower priority number = higher priority (1 beats 4).
   Rule: among arrived processes, pick the one with the lowest priority
   number and run it to completion.  A later arrival with higher priority
   must wait until the running process finishes.

   STARVATION: low-priority processes can wait indefinitely when a steady
   stream of high-priority work arrives.  Priority ageing — slowly raising
   a process's effective priority the longer it waits — is the cure. */

typedef struct {
    char  id[8];
    int   arrival;
    int   burst;
    int   priority;   /* lower number = higher priority */
    int   completion;
    int   turnaround;
    int   waiting;
    int   response;
} Process;

/* Non-preemptive priority: run the single next winner to completion. */
void priority_np(Process p[], int n) {
    int done[64] = {0};
    int clock = 0;
    int finished = 0;

    while (finished < n) {
        /* Find arrived, not-yet-done process with the best (lowest) priority.
           Ties: earlier arrival wins; further ties: lower index (input order). */
        int best = -1;
        for (int i = 0; i < n; i++) {
            if (done[i] || p[i].arrival > clock) continue;
            if (best == -1) { best = i; continue; }
            if (p[i].priority < p[best].priority) { best = i; continue; }
            if (p[i].priority == p[best].priority) {
                /* Equal priority — earlier arrival wins. */
                if (p[i].arrival < p[best].arrival) { best = i; continue; }
                /* Still tied — lower index (earlier in input) wins. */
            }
        }

        if (best == -1) {
            /* No process has arrived yet; advance clock to next arrival. */
            int next = -1;
            for (int i = 0; i < n; i++) {
                if (!done[i] && (next == -1 || p[i].arrival < p[next].arrival))
                    next = i;
            }
            clock = p[next].arrival;
            continue;
        }

        p[best].response   = clock - p[best].arrival;
        clock             += p[best].burst;
        p[best].completion = clock;
        p[best].turnaround = p[best].completion - p[best].arrival;
        p[best].waiting    = p[best].turnaround - p[best].burst;
        done[best] = 1;
        finished++;
    }
}

int main(void) {
    int n;
    printf("Number of processes: ");
    if (scanf("%d", &n) != 1 || n <= 0) return 1;

    Process p[64];
    for (int i = 0; i < n; i++) {
        printf("PID, arrival, burst, priority for process %d: ", i + 1);
        scanf("%7s %d %d %d", p[i].id, &p[i].arrival, &p[i].burst, &p[i].priority);
    }

    priority_np(p, n);

    double total_wt = 0, total_tat = 0, total_rt = 0;
    int busy = 0, last = 0, first_arrival = p[0].arrival;
    for (int i = 1; i < n; i++)
        if (p[i].arrival < first_arrival) first_arrival = p[i].arrival;

    printf("\\nPID  AT  BT PRI  CT  TAT  WT  RT\\n");
    for (int i = 0; i < n; i++) {
        printf("%-4s %3d %3d %3d %3d %4d %3d %3d\\n",
               p[i].id, p[i].arrival, p[i].burst, p[i].priority,
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

  python: `"""Priority Scheduling — NON-PREEMPTIVE.
Convention: lower priority number = higher priority (1 beats 4).
Rule: among arrived processes, pick the lowest priority number and run it
to completion.  A later arrival with a better priority must wait.

STARVATION: low-priority processes can wait indefinitely when a steady
stream of high-priority work arrives.  Priority ageing — slowly raising
a process's effective priority the longer it waits — is the cure.
"""
from dataclasses import dataclass, field


@dataclass
class Process:
    pid: str
    arrival: int
    burst: int
    priority: int              # lower number = higher priority
    completion: int = field(default=0)
    turnaround: int = field(default=0)
    waiting: int = field(default=0)
    response: int = field(default=0)


def priority_np(processes: list[Process]) -> list[tuple[str, int, int]]:
    """Schedules the processes in place (non-preemptive priority) and returns
    the Gantt timeline as a list of (pid, start, end) tuples.
    'IDLE' marks CPU gaps."""

    remaining = list(processes)   # shallow copy — we pop as we schedule
    timeline: list[tuple[str, int, int]] = []
    clock = 0

    while remaining:
        # Collect all processes that have arrived by now.
        arrived = [p for p in remaining if p.arrival <= clock]

        if not arrived:
            # CPU is idle until the next process arrives.
            next_arrival = min(p.arrival for p in remaining)
            timeline.append(("IDLE", clock, next_arrival))
            clock = next_arrival
            continue

        # Pick lowest priority number; ties: earliest arrival; further ties: pid.
        # Tie-breaking is explicit so the schedule is fully deterministic.
        best = min(arrived, key=lambda p: (p.priority, p.arrival, p.pid))

        start = clock
        best.response = start - best.arrival
        clock += best.burst
        best.completion = clock
        best.turnaround = best.completion - best.arrival
        best.waiting = best.turnaround - best.burst
        timeline.append((best.pid, start, clock))
        remaining.remove(best)

    return timeline


def report(processes: list[Process], timeline: list[tuple[str, int, int]]) -> None:
    n = len(processes)
    busy = sum(p.burst for p in processes)
    first_arrival = min(p.arrival for p in processes)
    last_completion = max(p.completion for p in processes)
    total_time = last_completion - first_arrival

    print("PID  AT  BT PRI  CT  TAT  WT  RT")
    for p in sorted(processes, key=lambda x: x.pid):
        print(f"{p.pid:<4} {p.arrival:3} {p.burst:3} {p.priority:3} {p.completion:3} "
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
        Process("P1", arrival=0, burst=6, priority=4),
        Process("P2", arrival=2, burst=4, priority=1),
        Process("P3", arrival=4, burst=3, priority=2),
        Process("P4", arrival=6, burst=5, priority=3),
    ]
    report(demo, priority_np(demo))`,

  typescript: `/**
 * Priority Scheduling — NON-PREEMPTIVE.
 * Convention: lower priority number = higher priority (1 beats 4).
 * Rule: among arrived processes, pick the lowest priority number and run
 * it to completion.  A later arrival with a better priority must wait.
 *
 * STARVATION: low-priority processes can wait indefinitely when a steady
 * stream of high-priority work arrives.  Priority ageing is the cure.
 */

interface ProcessInput {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number; // lower number = higher priority
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

function priorityNonPreemptive(input: ProcessInput[]): SchedulingResult {
  const remaining = input.map((p) => ({ ...p }));
  const gantt: GanttBlock[] = [];
  const processes: ProcessResult[] = [];
  let clock = 0;

  while (remaining.length > 0) {
    // Collect processes that have already arrived.
    const arrived = remaining.filter((p) => p.arrivalTime <= clock);

    if (arrived.length === 0) {
      // CPU is idle; jump to the next arrival.
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      gantt.push({ processId: 'IDLE', startTime: clock, endTime: nextArrival });
      clock = nextArrival;
      continue;
    }

    // Pick the highest-priority arrived process.
    // Ties: lower priority number wins; then earlier arrival; then id (determinism).
    arrived.sort(
      (a, b) =>
        a.priority - b.priority ||
        a.arrivalTime - b.arrivalTime ||
        a.id.localeCompare(b.id),
    );
    const best = arrived[0];

    const startTime = clock;
    clock += best.burstTime;

    gantt.push({ processId: best.id, startTime, endTime: clock });
    processes.push({
      ...best,
      completionTime: clock,
      turnaroundTime: clock - best.arrivalTime,
      waitingTime: clock - best.arrivalTime - best.burstTime,
      responseTime: startTime - best.arrivalTime,
    });

    // Remove the scheduled process from the remaining list.
    const idx = remaining.findIndex((p) => p.id === best.id);
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
  { id: 'P1', arrivalTime: 0, burstTime: 6, priority: 4 },
  { id: 'P2', arrivalTime: 2, burstTime: 4, priority: 1 },
  { id: 'P3', arrivalTime: 4, burstTime: 3, priority: 2 },
  { id: 'P4', arrivalTime: 6, burstTime: 5, priority: 3 },
];

const result = priorityNonPreemptive(demo);
console.table(result.processes);
console.log('Average WT :', result.averageWaitingTime);
console.log('CPU util   :', result.cpuUtilization + '%');`,
};
