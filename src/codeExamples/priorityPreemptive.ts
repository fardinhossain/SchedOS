/**
 * Educational reference implementations of Priority Scheduling (preemptive).
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

export const priorityPreemptiveCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>
#include <string.h>

/* Priority Scheduling — PREEMPTIVE (also called SRTF-priority).
   Convention: lower priority number = higher priority (1 beats 4).
   Rule: every time unit, re-evaluate; the arrived process with the
   lowest priority number runs.  A new arrival that has a lower priority
   number immediately preempts the running process.

   Tie-breaking: equal priority -> earlier arrival wins -> lower index.
   On an exact tie NO preemption occurs to avoid pointless context switches.

   STARVATION: low-priority processes can wait indefinitely.  Priority
   ageing — slowly raising effective priority with wait time — is the cure.

   The Gantt timeline records every time unit; adjacent identical segments
   are merged on output so that one process can appear as several blocks
   when it runs in non-contiguous bursts. */

#define MAXN 64

typedef struct {
    char  id[8];
    int   arrival;
    int   burst;
    int   priority;    /* lower number = higher priority */
    int   remaining;
    int   first_start; /* -1 = not yet started */
    int   completion;
    int   turnaround;
    int   waiting;
    int   response;
} Process;

/* Gantt segment after merging. */
typedef struct { char id[8]; int start; int end; } Segment;

void priority_preemptive(Process p[], int n, Segment seg[], int *nseg) {
    /* Initialise remaining and sentinel. */
    for (int i = 0; i < n; i++) {
        p[i].remaining   = p[i].burst;
        p[i].first_start = -1;
    }

    /* Find the time span we must simulate. */
    int clock = p[0].arrival;
    for (int i = 1; i < n; i++)
        if (p[i].arrival < clock) clock = p[i].arrival;

    int total_burst = 0;
    for (int i = 0; i < n; i++) total_burst += p[i].burst;
    int end_time = clock + total_burst + n; /* upper bound */

    *nseg = 0;
    char cur_id[8] = "";
    int  cur_start = clock;

    int done = 0;
    while (done < n) {
        /* Pick the arrived process with the lowest priority number.
           Ties: earlier arrival; still tied: lower index in array. */
        int best = -1;
        for (int i = 0; i < n; i++) {
            if (p[i].remaining <= 0 || p[i].arrival > clock) continue;
            if (best == -1) { best = i; continue; }
            if (p[i].priority < p[best].priority) { best = i; continue; }
            if (p[i].priority == p[best].priority) {
                if (p[i].arrival < p[best].arrival) best = i;
                /* Lower index wins on further ties — no preemption needed. */
            }
        }

        if (best == -1) {
            /* CPU is idle this tick; record IDLE segment. */
            if (strcmp(cur_id, "IDLE") != 0) {
                if (cur_id[0] != '\\0' && *nseg < MAXN) {
                    strncpy(seg[*nseg].id, cur_id, 7);
                    seg[*nseg].start = cur_start;
                    seg[*nseg].end   = clock;
                    (*nseg)++;
                }
                strncpy(cur_id, "IDLE", 7);
                cur_start = clock;
            }
            clock++;
            continue;
        }

        /* Record first-start for response time. */
        if (p[best].first_start == -1)
            p[best].first_start = clock;

        /* Merge adjacent identical segments. */
        if (strcmp(cur_id, p[best].id) != 0) {
            if (cur_id[0] != '\\0' && *nseg < MAXN) {
                strncpy(seg[*nseg].id, cur_id, 7);
                seg[*nseg].start = cur_start;
                seg[*nseg].end   = clock;
                (*nseg)++;
            }
            strncpy(cur_id, p[best].id, 7);
            cur_start = clock;
        }

        p[best].remaining--;
        clock++;

        if (p[best].remaining == 0) {
            p[best].completion = clock;
            p[best].turnaround = clock - p[best].arrival;
            p[best].waiting    = p[best].turnaround - p[best].burst;
            p[best].response   = p[best].first_start - p[best].arrival;
            done++;
        }
    }

    /* Flush the last open segment. */
    if (cur_id[0] != '\\0' && *nseg < MAXN) {
        strncpy(seg[*nseg].id, cur_id, 7);
        seg[*nseg].start = cur_start;
        seg[*nseg].end   = clock;
        (*nseg)++;
    }
}

int main(void) {
    int n;
    printf("Number of processes: ");
    if (scanf("%d", &n) != 1 || n <= 0) return 1;

    Process p[MAXN];
    for (int i = 0; i < n; i++) {
        printf("PID, arrival, burst, priority for process %d: ", i + 1);
        scanf("%7s %d %d %d", p[i].id, &p[i].arrival, &p[i].burst, &p[i].priority);
    }

    Segment seg[MAXN * 4];
    int nseg = 0;
    priority_preemptive(p, n, seg, &nseg);

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

    printf("\\nGantt: ");
    for (int i = 0; i < nseg; i++)
        printf("[%s %d-%d] ", seg[i].id, seg[i].start, seg[i].end);
    printf("\\n");

    int total_time = last - first_arrival;
    printf("\\nAverage WT  : %.2f\\n", total_wt  / n);
    printf("Average TAT : %.2f\\n", total_tat / n);
    printf("Average RT  : %.2f\\n", total_rt  / n);
    printf("CPU busy    : %d\\n", busy);
    printf("CPU idle    : %d\\n", total_time - busy);
    printf("CPU util    : %.2f%%\\n", 100.0 * busy / total_time);
    return 0;
}`,

  python: `"""Priority Scheduling — PREEMPTIVE.
Convention: lower priority number = higher priority (1 beats 4).
Rule: every time unit, re-evaluate; the arrived process with the lowest
priority number runs.  A new arrival that has a strictly lower priority
number immediately preempts the running process.

Tie-breaking: equal priority -> earlier arrival wins -> pid (alphabetic).
On an exact tie NO preemption occurs to avoid pointless context switches.

The simulation advances one time unit at a time.  Per-process metrics are
derived from the completed Gantt timeline rather than accumulated ad hoc,
which means a process can appear as MULTIPLE blocks in the Gantt chart
because it may run in non-contiguous bursts.  Adjacent identical segments
are merged when the timeline is emitted.

STARVATION: low-priority processes can wait indefinitely when a steady
stream of high-priority work arrives.  Priority ageing is the cure.
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


def priority_preemptive(processes: list[Process]) -> list[tuple[str, int, int]]:
    """Simulates one time unit at a time.  Returns the merged Gantt timeline
    as a list of (pid, start, end) tuples; 'IDLE' marks CPU gaps.

    Because a process can be preempted and later resumed, it may appear as
    MULTIPLE (pid, start, end) tuples in the returned list.  Adjacent tuples
    for the same process are merged so output stays readable.
    """
    remaining = {p.pid: p.burst for p in processes}
    first_start: dict[str, int] = {}          # sentinel: key absent = not started
    proc = {p.pid: p for p in processes}

    clock = min(p.arrival for p in processes)
    end_time = clock + sum(p.burst for p in processes)

    raw: list[tuple[str, int, int]] = []      # one entry per unit tick
    cur_pid: str | None = None
    cur_start = clock

    while any(v > 0 for v in remaining.values()):
        # Collect processes that have arrived and still have work left.
        candidates = [
            p for p in processes
            if p.arrival <= clock and remaining[p.pid] > 0
        ]

        if not candidates:
            # CPU is idle this tick.
            if cur_pid != "IDLE":
                if cur_pid is not None:
                    raw.append((cur_pid, cur_start, clock))
                cur_pid = "IDLE"
                cur_start = clock
            clock += 1
            continue

        # Pick the lowest priority number.
        # Ties: earlier arrival wins; still tied: lexicographic pid.
        # On an exact tie with the currently running process,
        # do NOT preempt — avoids pointless context switches.
        best = min(candidates, key=lambda p: (p.priority, p.arrival, p.pid))

        if best.pid not in first_start:
            first_start[best.pid] = clock

        # Switch if the selected process is different from the current one.
        if best.pid != cur_pid:
            if cur_pid is not None:
                raw.append((cur_pid, cur_start, clock))
            cur_pid = best.pid
            cur_start = clock

        remaining[best.pid] -= 1
        clock += 1

        if remaining[best.pid] == 0:
            proc[best.pid].completion = clock
            proc[best.pid].turnaround = clock - proc[best.pid].arrival
            proc[best.pid].waiting    = proc[best.pid].turnaround - proc[best.pid].burst
            proc[best.pid].response   = first_start[best.pid] - proc[best.pid].arrival

    # Flush the last open segment.
    if cur_pid is not None:
        raw.append((cur_pid, cur_start, clock))

    # Merge adjacent identical segments (a process may appear multiple times).
    timeline: list[tuple[str, int, int]] = []
    for pid, s, e in raw:
        if timeline and timeline[-1][0] == pid and timeline[-1][2] == s:
            timeline[-1] = (pid, timeline[-1][1], e)
        else:
            timeline.append((pid, s, e))

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
    report(demo, priority_preemptive(demo))`,

  typescript: `/**
 * Priority Scheduling — PREEMPTIVE.
 * Convention: lower priority number = higher priority (1 beats 4).
 * Rule: every time unit, re-evaluate; the arrived process with the lowest
 * priority number runs.  A new arrival with a strictly lower priority
 * number immediately preempts the running process.
 *
 * Tie-breaking: equal priority -> earlier arrivalTime -> id (localeCompare).
 * On an exact tie with the currently running process, NO preemption occurs
 * — this avoids a pointless context switch with zero benefit.
 *
 * Per-process metrics are derived from the completed Gantt timeline, not
 * accumulated ad hoc.  A process may appear as MULTIPLE GanttBlocks because
 * it can run in non-contiguous bursts; adjacent same-process blocks are
 * merged before being returned.
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

function priorityPreemptive(input: ProcessInput[]): SchedulingResult {
  // Per-process mutable state tracked during simulation.
  const remaining = new Map<string, number>(input.map((p) => [p.id, p.burstTime]));
  // firstStart uses -1 as sentinel meaning "not yet started".
  const firstStart = new Map<string, number>(input.map((p) => [p.id, -1]));
  const completionTime = new Map<string, number>();

  let clock = Math.min(...input.map((p) => p.arrivalTime));

  // Raw per-unit Gantt segments — will be merged at the end.
  const rawGantt: Array<{ processId: string; startTime: number; endTime: number }> = [];
  let curId: string | null = null;
  let curStart = clock;

  while ([...remaining.values()].some((r) => r > 0)) {
    // Gather processes that have arrived and still have remaining work.
    const candidates = input.filter(
      (p) => p.arrivalTime <= clock && (remaining.get(p.id) ?? 0) > 0,
    );

    if (candidates.length === 0) {
      // CPU is idle this tick; advance to next arrival.
      if (curId !== 'IDLE') {
        if (curId !== null) rawGantt.push({ processId: curId, startTime: curStart, endTime: clock });
        curId = 'IDLE';
        curStart = clock;
      }
      clock++;
      continue;
    }

    // Select the highest-priority (lowest number) arrived process.
    // Ties broken by arrivalTime, then id — fully deterministic.
    candidates.sort(
      (a, b) =>
        a.priority - b.priority ||
        a.arrivalTime - b.arrivalTime ||
        a.id.localeCompare(b.id),
    );
    const best = candidates[0];

    // Record first start (response-time sentinel).
    if (firstStart.get(best.id) === -1) firstStart.set(best.id, clock);

    // Emit a segment boundary only when the running process changes.
    // Equal-priority ties with the current process are NOT preempted.
    if (best.id !== curId) {
      if (curId !== null) rawGantt.push({ processId: curId, startTime: curStart, endTime: clock });
      curId = best.id;
      curStart = clock;
    }

    remaining.set(best.id, (remaining.get(best.id) ?? 0) - 1);
    clock++;

    if (remaining.get(best.id) === 0) {
      completionTime.set(best.id, clock);
    }
  }

  // Flush the last open segment.
  if (curId !== null) rawGantt.push({ processId: curId, startTime: curStart, endTime: clock });

  // Merge adjacent identical segments.
  // A single process may still appear as several blocks in the merged output
  // when it ran in non-contiguous bursts separated by preemption.
  const gantt: GanttBlock[] = [];
  for (const seg of rawGantt) {
    const last = gantt[gantt.length - 1];
    if (last && last.processId === seg.processId && last.endTime === seg.startTime) {
      last.endTime = seg.endTime;
    } else {
      gantt.push({ ...seg });
    }
  }

  // Derive per-process results from the completed timeline.
  const processes: ProcessResult[] = input.map((p) => {
    const ct = completionTime.get(p.id) ?? 0;
    const fs = firstStart.get(p.id) ?? p.arrivalTime;
    return {
      ...p,
      completionTime: ct,
      turnaroundTime: ct - p.arrivalTime,
      waitingTime: ct - p.arrivalTime - p.burstTime,
      responseTime: fs - p.arrivalTime,
    };
  });

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

const result = priorityPreemptive(demo);
console.table(result.processes);
console.log('Average WT :', result.averageWaitingTime);
console.log('CPU util   :', result.cpuUtilization + '%');`,
};
