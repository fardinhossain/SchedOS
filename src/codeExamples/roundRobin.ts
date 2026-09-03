/**
 * Educational reference implementations of Round Robin (RR).
 * Same logic in every language; only the syntax differs.
 * These are displayed for learning only — never executed by the simulator.
 */
import type { SupportedLanguage } from '../types/scheduling';

export const roundRobinCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>
#include <string.h>

/* Round Robin (RR) — preemptive with a fixed time quantum.
   Rule: each process runs for at most one quantum, then goes to the BACK
   of the FIFO ready queue.

   CRITICAL correctness rule: when a process ARRIVES at the exact instant
   a quantum expires, that arriving process must be enqueued BEFORE the
   preempted process is re-queued.  Getting this order backwards causes the
   just-preempted process to run again immediately, violating fairness and
   producing wrong completion times.  This is the most common bug in student
   Round Robin implementations.

   The ready queue is an explicit FIFO array; no selection key is used. */

#define MAXN   64
#define MAXQ   (MAXN * 300)
#define MAXSEG (MAXN * 300)

typedef struct {
    char id[8];
    int  arrival;
    int  burst;
    int  remaining;
    int  first_start; /* -1 until first scheduled */
    int  completion;
    int  turnaround;
    int  waiting;
    int  response;
} Process;

typedef struct { char id[8]; int start; int end; } Segment;

/* Array-backed FIFO queue storing process indices. */
typedef struct { int data[MAXQ]; int head, tail; } Queue;
void q_push(Queue *q, int idx) { q->data[q->tail++] = idx; }
int  q_pop (Queue *q)          { return q->data[q->head++]; }
int  q_empty(Queue *q)         { return q->head == q->tail; }

/* Sort by arrival so that the enqueue loops always add processes in the
   correct chronological order when multiple arrivals occur together. */
void sort_arrival(Process p[], int n) {
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - 1 - i; j++)
            if (p[j].arrival > p[j + 1].arrival) {
                Process tmp = p[j]; p[j] = p[j + 1]; p[j + 1] = tmp;
            }
}

void round_robin(Process p[], int n, int quantum, Segment segs[], int *nseg) {
    sort_arrival(p, n);
    for (int i = 0; i < n; i++) {
        p[i].remaining   = p[i].burst;
        p[i].first_start = -1;
    }

    Queue q = {.head = 0, .tail = 0};
    int enq[MAXN] = {0};  /* enq[i]=1 once process i has entered the queue */
    int clock = 0, done = 0;
    *nseg = 0;

    while (done < n) {
        /* Seed: enqueue any process that has arrived by the current clock. */
        for (int i = 0; i < n; i++) {
            if (!enq[i] && p[i].arrival <= clock) {
                q_push(&q, i);
                enq[i] = 1;
            }
        }

        if (q_empty(&q)) {
            /* CPU idle — fast-forward to the next unqueued arrival. */
            int earliest = -1;
            for (int i = 0; i < n; i++) {
                if (!enq[i] && (earliest == -1 || p[i].arrival < earliest))
                    earliest = p[i].arrival;
            }
            if (earliest == -1) break;
            strcpy(segs[*nseg].id, "IDLE");
            segs[*nseg].start = clock;
            segs[*nseg].end   = earliest;
            (*nseg)++;
            clock = earliest;
            continue;
        }

        int idx = q_pop(&q);
        if (p[idx].first_start == -1) p[idx].first_start = clock;

        int run       = p[idx].remaining < quantum ? p[idx].remaining : quantum;
        int seg_start = clock;
        clock        += run;
        p[idx].remaining -= run;

        /* Each quantum is its own Gantt segment — do NOT merge adjacent
           same-process blocks.  Every block represents one time slice; merging
           would hide the quantum boundaries and make preemption invisible. */
        strcpy(segs[*nseg].id, p[idx].id);
        segs[*nseg].start = seg_start;
        segs[*nseg].end   = clock;
        (*nseg)++;

        if (p[idx].remaining == 0) {
            p[idx].completion = clock;
            done++;
            /* Still enqueue any process that arrived while this quantum ran. */
            for (int i = 0; i < n; i++) {
                if (!enq[i] && p[i].arrival <= clock) {
                    q_push(&q, i);
                    enq[i] = 1;
                }
            }
        } else {
            /* CRITICAL: enqueue NEW ARRIVALS first, THEN re-queue the preempted
               process.  A process whose arrival == clock (the quantum-expiry
               instant) must enter the queue BEFORE the process just preempted;
               reversing this order is the most common student mistake. */
            for (int i = 0; i < n; i++) {
                if (!enq[i] && p[i].arrival <= clock) {
                    q_push(&q, i);
                    enq[i] = 1;
                }
            }
            q_push(&q, idx);   /* preempted process goes to the back */
        }
    }

    for (int i = 0; i < n; i++) {
        p[i].turnaround = p[i].completion - p[i].arrival;
        p[i].waiting    = p[i].turnaround - p[i].burst;
        p[i].response   = p[i].first_start - p[i].arrival;
    }
}

int main(void) {
    int n, quantum;
    printf("Number of processes: ");
    if (scanf("%d", &n) != 1 || n <= 0) return 1;

    Process p[MAXN];
    for (int i = 0; i < n; i++) {
        printf("PID, arrival, burst for process %d: ", i + 1);
        scanf("%7s %d %d", p[i].id, &p[i].arrival, &p[i].burst);
    }
    printf("Time quantum: ");
    if (scanf("%d", &quantum) != 1 || quantum <= 0) return 1;

    Segment segs[MAXSEG];
    int nseg = 0;
    round_robin(p, n, quantum, segs, &nseg);

    int first_arrival = p[0].arrival;
    for (int i = 1; i < n; i++)
        if (p[i].arrival < first_arrival) first_arrival = p[i].arrival;

    double total_wt = 0, total_tat = 0, total_rt = 0;
    int busy = 0, last = 0;

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
    printf("\\nGantt: ");
    for (int i = 0; i < nseg; i++) {
        if (i > 0) printf(" | ");
        printf("%s %d-%d", segs[i].id, segs[i].start, segs[i].end);
    }
    printf("\\n\\nAverage WT  : %.2f\\n", total_wt  / n);
    printf("Average TAT : %.2f\\n", total_tat / n);
    printf("Average RT  : %.2f\\n", total_rt  / n);
    printf("CPU busy    : %d\\n", busy);
    printf("CPU idle    : %d\\n", total_time - busy);
    printf("CPU util    : %.2f%%\\n", 100.0 * busy / total_time);
    return 0;
}`,

  python: `"""Round Robin (RR) — preemptive with a fixed time quantum.
Rule: each process runs for at most one quantum, then goes to the BACK
of the FIFO ready queue.

CRITICAL correctness rule: when a process ARRIVES at the exact instant a
quantum expires, that arriving process must be enqueued BEFORE the preempted
process is re-queued.  Reversing this order causes the just-preempted process
to run again immediately, violating fairness.  This is the most common bug in
student Round Robin implementations.

The ready queue is an explicit collections.deque; no selection key is used.
"""
from collections import deque
from dataclasses import dataclass, field

QUANTUM = 2   # time slices per turn


@dataclass
class Process:
    pid: str
    arrival: int
    burst: int
    remaining: int = field(default=0)
    first_start: int = field(default=-1)
    completion: int = field(default=0)
    turnaround: int = field(default=0)
    waiting: int = field(default=0)
    response: int = field(default=0)


def round_robin(
    processes: list[Process],
    quantum: int = QUANTUM,
) -> list[tuple[str, int, int]]:
    """Schedules with Round Robin, mutates processes in place, and returns
    the Gantt timeline as a list of (pid, start, end) tuples.

    Each tuple represents ONE quantum slice.  Adjacent same-process slices
    are NOT merged: every block shows one time-slice boundary, which is the
    information a Round Robin Gantt chart exists to communicate."""
    for p in processes:
        p.remaining   = p.burst
        p.first_start = -1

    # Sort by arrival so enqueue loops add processes in the correct order.
    by_arrival = sorted(processes, key=lambda p: (p.arrival, p.pid))
    enqueued: set[str] = set()
    ready: deque[Process] = deque()
    timeline: list[tuple[str, int, int]] = []
    clock = 0
    done  = 0
    n     = len(processes)

    def enqueue_arrivals(up_to: int) -> None:
        """Enqueue all unqueued processes that have arrived by 'up_to'."""
        for p in by_arrival:
            if p.pid not in enqueued and p.arrival <= up_to:
                ready.append(p)
                enqueued.add(p.pid)

    while done < n:
        enqueue_arrivals(clock)

        if not ready:
            # CPU idle: fast-forward to the next unqueued arrival.
            next_arr = min(p.arrival for p in processes if p.pid not in enqueued)
            timeline.append(("IDLE", clock, next_arr))
            clock = next_arr
            enqueue_arrivals(clock)

        proc = ready.popleft()
        if proc.first_start == -1:
            proc.first_start = clock

        run        = min(quantum, proc.remaining)
        seg_start  = clock
        clock     += run
        proc.remaining -= run

        # Each quantum is its own tuple — do NOT merge adjacent same-process
        # entries.  Every entry represents one time slice; merging would hide
        # the quantum boundaries and make preemption invisible in the chart.
        timeline.append((proc.pid, seg_start, clock))

        if proc.remaining == 0:
            proc.completion = clock
            proc.turnaround = proc.completion - proc.arrival
            proc.waiting    = proc.turnaround  - proc.burst
            proc.response   = proc.first_start - proc.arrival
            done += 1
            # Enqueue processes that arrived while this quantum was running.
            enqueue_arrivals(clock)
        else:
            # CRITICAL: enqueue new arrivals FIRST, then the preempted process.
            # A process with arrival == clock arrived at the quantum-expiry
            # instant and must go ahead of the process just preempted.
            # Getting this backwards is the most common Round Robin bug.
            enqueue_arrivals(clock)
            ready.append(proc)   # preempted process goes to the back

    return timeline


def report(processes: list[Process], timeline: list[tuple[str, int, int]]) -> None:
    n = len(processes)
    busy            = sum(p.burst      for p in processes)
    first_arrival   = min(p.arrival    for p in processes)
    last_completion = max(p.completion for p in processes)
    total_time      = last_completion - first_arrival

    print("PID  AT  BT  CT  TAT  WT  RT")
    for p in sorted(processes, key=lambda x: x.pid):
        print(f"{p.pid:<4} {p.arrival:3} {p.burst:3} {p.completion:3} "
              f"{p.turnaround:4} {p.waiting:3} {p.response:3}")

    print()
    print("Gantt:", " | ".join(f"{pid} {s}-{e}" for pid, s, e in timeline))
    print(f"Average WT  : {sum(p.waiting    for p in processes) / n:.2f}")
    print(f"Average TAT : {sum(p.turnaround for p in processes) / n:.2f}")
    print(f"Average RT  : {sum(p.response   for p in processes) / n:.2f}")
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
    report(demo, round_robin(demo, quantum=QUANTUM))`,

  typescript: `/**
 * Round Robin (RR) — preemptive with a fixed time quantum.
 * Rule: each process runs for at most one quantum, then goes to the BACK
 * of the FIFO ready queue.
 *
 * CRITICAL correctness rule: when a process ARRIVES at the exact instant
 * a quantum expires, that arriving process must be enqueued BEFORE the
 * preempted process is re-queued.  Reversing this order causes the
 * just-preempted process to run again immediately, violating fairness.
 * This is the most common bug in student Round Robin implementations.
 *
 * The ready queue is an explicit FIFO array (push/shift); no selection
 * key is used.
 */

const QUANTUM = 2; // time slices per turn

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

function roundRobin(
  input: ProcessInput[],
  quantum: number = QUANTUM,
): SchedulingResult {
  // Sort by arrival so enqueue loops add processes in chronological order.
  const byArrival = [...input].sort(
    (a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id),
  );

  const state = new Map<string, { remaining: number; firstStart: number }>(
    input.map((p) => [p.id, { remaining: p.burstTime, firstStart: -1 }]),
  );
  const enqueued = new Set<string>();
  const ready: ProcessInput[] = []; // FIFO queue: push to end, shift from front
  const gantt: GanttBlock[] = [];
  const processes: ProcessResult[] = [];
  let clock = 0;
  let done = 0;
  const n = input.length;

  /** Enqueue all unqueued processes that have arrived by 'upTo'. */
  function enqueueArrivals(upTo: number): void {
    for (const p of byArrival) {
      if (!enqueued.has(p.id) && p.arrivalTime <= upTo) {
        ready.push(p);
        enqueued.add(p.id);
      }
    }
  }

  while (done < n) {
    enqueueArrivals(clock);

    if (ready.length === 0) {
      // CPU idle: fast-forward to the next unqueued arrival.
      let nextArrival = Infinity;
      for (const p of input) {
        if (!enqueued.has(p.id) && p.arrivalTime < nextArrival)
          nextArrival = p.arrivalTime;
      }
      if (!isFinite(nextArrival)) break;
      gantt.push({ processId: 'IDLE', startTime: clock, endTime: nextArrival });
      clock = nextArrival;
      enqueueArrivals(clock);
    }

    const proc = ready.shift()!;
    const s = state.get(proc.id)!;
    if (s.firstStart === -1) s.firstStart = clock;

    const run = Math.min(quantum, s.remaining);
    const segStart = clock;
    clock += run;
    s.remaining -= run;

    // Each quantum is its own Gantt block — do NOT merge adjacent same-process
    // blocks. Every block represents one time slice; merging would make the
    // quantum boundaries and preemption points invisible in the chart.
    gantt.push({ processId: proc.id, startTime: segStart, endTime: clock });

    if (s.remaining === 0) {
      processes.push({
        id: proc.id,
        arrivalTime: proc.arrivalTime,
        burstTime: proc.burstTime,
        completionTime: clock,
        turnaroundTime: clock - proc.arrivalTime,
        waitingTime: clock - proc.arrivalTime - proc.burstTime,
        responseTime: s.firstStart - proc.arrivalTime,
      });
      done += 1;
      // Enqueue processes that arrived while this quantum was running.
      enqueueArrivals(clock);
    } else {
      // CRITICAL: enqueue new arrivals FIRST, then the preempted process.
      // Any process with arrivalTime === clock arrived at the quantum-expiry
      // instant and must enter the queue BEFORE the process just preempted.
      // Getting this backwards is the most common Round Robin bug.
      enqueueArrivals(clock);
      ready.push(proc); // preempted process goes to the back
    }
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

// -- Demo ------------------------------------------------
const demo: ProcessInput[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 8 },
  { id: 'P2', arrivalTime: 1, burstTime: 4 },
  { id: 'P3', arrivalTime: 2, burstTime: 2 },
  { id: 'P4', arrivalTime: 3, burstTime: 6 },
];

const result = roundRobin(demo, QUANTUM);
console.table(result.processes);
console.log('Average WT :', result.averageWaitingTime);
console.log('CPU util   :', result.cpuUtilization + '%');`,
};
