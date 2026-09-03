/**
 * Educational reference implementations of LRTF.
 * Same logic in every language; only the syntax differs.
 * These are displayed for learning only — never executed by the simulator.
 */
import type { SupportedLanguage } from '../types/scheduling';

export const lrtfCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>
#include <string.h>

/* Longest Remaining Time First (LRTF) — preemptive.
   Rule: at every clock tick, run the arrived process with the MOST
   remaining time. Preempt the running process when a longer job arrives.

   Why this is a cautionary example: because the running process's remaining
   time shrinks by 1 each tick, it will soon have LESS remaining than a
   process that arrived later. The scheduler then switches to the new longest
   job — which also begins to shrink — and switches again. The CPU thrashes
   between the longest jobs, and every process waits far longer than necessary.
   LRTF maximises average waiting time.

   Tie-break (applied in this order):
     1. Largest remaining time.
     2. If equal: earlier arrival time.
     3. If still equal: lower process id (lexicographic).
   On a tie with the currently running process, NO preemption occurs. */

#define MAXN   64
#define MAXSEG 4096

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

/* Return the index of the best process to run at time 'now'.
   'cur' is the index of the currently running process (-1 if idle). */
int pick_lrtf(Process p[], int n, int now, int cur) {
    int best = -1;
    for (int i = 0; i < n; i++) {
        if (p[i].arrival > now || p[i].remaining <= 0) continue;
        if (best == -1) { best = i; continue; }
        if (p[i].remaining < p[best].remaining) continue;   /* prefer MOST */
        if (p[i].remaining > p[best].remaining) { best = i; continue; }
        /* Equal remaining: the running process keeps the CPU (no preemption). */
        if (best == cur) continue;
        if (i    == cur) { best = i; continue; }
        /* Neither is running: earlier arrival wins. */
        if (p[i].arrival > p[best].arrival) continue;
        if (p[i].arrival < p[best].arrival) { best = i; continue; }
        /* Still tied: lower id (lexicographic) wins. */
        if (strcmp(p[i].id, p[best].id) < 0) best = i;
    }
    return best;
}

/* Run LRTF tick-by-tick and fill segs[] with the Gantt timeline.
   Adjacent ticks of the same process are merged; non-adjacent blocks of
   the same process show where it was preempted and later resumed. */
void lrtf(Process p[], int n, Segment segs[], int *nseg) {
    for (int i = 0; i < n; i++) {
        p[i].remaining   = p[i].burst;
        p[i].first_start = -1;
    }
    int clock = 0, done = 0, cur = -1;
    *nseg = 0;

    while (done < n) {
        int next = pick_lrtf(p, n, clock, cur);

        if (next == -1) {
            /* CPU idle — fast-forward to next arrival. */
            int earliest = -1;
            for (int i = 0; i < n; i++) {
                if (p[i].remaining > 0 &&
                    (earliest == -1 || p[i].arrival < earliest))
                    earliest = p[i].arrival;
            }
            if (earliest == -1) break;
            if (*nseg > 0 && strcmp(segs[*nseg - 1].id, "IDLE") == 0)
                segs[*nseg - 1].end = earliest;
            else {
                strcpy(segs[*nseg].id, "IDLE");
                segs[*nseg].start = clock;
                segs[*nseg].end   = earliest;
                (*nseg)++;
            }
            clock = earliest;
            cur   = -1;
            continue;
        }

        if (p[next].first_start == -1) p[next].first_start = clock;

        /* Extend the last segment when the same process continues, otherwise
           open a new one.  The thrashing caused by LRTF means the same
           process will appear as many small non-adjacent blocks. */
        if (*nseg > 0 && strcmp(segs[*nseg - 1].id, p[next].id) == 0)
            segs[*nseg - 1].end = clock + 1;
        else {
            strcpy(segs[*nseg].id, p[next].id);
            segs[*nseg].start = clock;
            segs[*nseg].end   = clock + 1;
            (*nseg)++;
        }

        cur = next;
        p[cur].remaining--;
        clock++;

        if (p[cur].remaining == 0) {
            p[cur].completion = clock;
            done++;
            cur = -1;
        }
    }

    for (int i = 0; i < n; i++) {
        p[i].turnaround = p[i].completion - p[i].arrival;
        p[i].waiting    = p[i].turnaround - p[i].burst;
        p[i].response   = p[i].first_start - p[i].arrival;
    }
}

int main(void) {
    int n;
    printf("Number of processes: ");
    if (scanf("%d", &n) != 1 || n <= 0) return 1;

    Process p[MAXN];
    for (int i = 0; i < n; i++) {
        printf("PID, arrival, burst for process %d: ", i + 1);
        scanf("%7s %d %d", p[i].id, &p[i].arrival, &p[i].burst);
    }

    Segment segs[MAXSEG];
    int nseg = 0;
    lrtf(p, n, segs, &nseg);

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

  python: `"""Longest Remaining Time First (LRTF) — preemptive.
Rule: at every clock tick, run the arrived process with the MOST remaining time.

Why this is a cautionary example: each tick reduces the running process's
remaining time by 1, so it quickly drops out of first place. The scheduler
switches to the next longest job — which also begins to shrink — and switches
again. The CPU thrashes between the longest jobs, and every process finishes
far later than necessary. LRTF maximises average waiting time, making it a
textbook example of a pathological scheduling policy.

Tie-break (applied in order):
  1. Largest remaining time.
  2. If equal: earlier arrival time.
  3. If still equal: lower pid (lexicographic).
On a tie with the currently running process, no preemption occurs.
"""
from dataclasses import dataclass, field


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


def pick_lrtf(
    processes: list[Process], now: int, cur_pid: str | None
) -> Process | None:
    """Return the process to run at time 'now', or None if the CPU must idle.
    Selects the process with the MOST remaining time.
    On a remaining-time tie, the running process keeps the CPU."""
    candidates = [p for p in processes if p.arrival <= now and p.remaining > 0]
    if not candidates:
        return None

    def key(p: Process) -> tuple:
        not_running = 0 if p.pid == cur_pid else 1   # running process beats all ties
        return (-p.remaining, not_running, p.arrival, p.pid)  # negate for MOST

    return min(candidates, key=key)


def lrtf(processes: list[Process]) -> list[tuple[str, int, int]]:
    """Simulates LRTF tick-by-tick, mutates processes in place, and returns
    the Gantt timeline as a list of (pid, start, end) tuples.

    Adjacent ticks of the same process are merged, but because LRTF causes
    frequent preemptions the chart still shows many small non-adjacent blocks
    for each process — visible evidence of the scheduler's thrashing."""
    for p in processes:
        p.remaining   = p.burst
        p.first_start = -1

    timeline: list[tuple[str, int, int]] = []
    clock: int = 0
    done: int = 0
    n: int = len(processes)
    cur_pid: str | None = None

    while done < n:
        chosen = pick_lrtf(processes, clock, cur_pid)

        if chosen is None:
            next_arr = min(p.arrival for p in processes if p.remaining > 0)
            if timeline and timeline[-1][0] == "IDLE":
                timeline[-1] = ("IDLE", timeline[-1][1], next_arr)
            else:
                timeline.append(("IDLE", clock, next_arr))
            clock   = next_arr
            cur_pid = None
            continue

        if chosen.first_start == -1:
            chosen.first_start = clock

        if timeline and timeline[-1][0] == chosen.pid:
            timeline[-1] = (chosen.pid, timeline[-1][1], clock + 1)
        else:
            timeline.append((chosen.pid, clock, clock + 1))

        cur_pid = chosen.pid
        chosen.remaining -= 1
        clock += 1

        if chosen.remaining == 0:
            chosen.completion = clock
            chosen.turnaround = chosen.completion - chosen.arrival
            chosen.waiting    = chosen.turnaround  - chosen.burst
            chosen.response   = chosen.first_start - chosen.arrival
            done    += 1
            cur_pid  = None

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
        Process("P1", arrival=0, burst=9),
        Process("P2", arrival=1, burst=5),
        Process("P3", arrival=2, burst=3),
        Process("P4", arrival=3, burst=1),
    ]
    report(demo, lrtf(demo))`,

  typescript: `/**
 * Longest Remaining Time First (LRTF) — preemptive.
 * Rule: at every clock tick, run the arrived process with the MOST
 * remaining time. Preempt whenever a longer job is available.
 *
 * Why this is a cautionary example: each tick reduces the running
 * process's remaining time by 1, so it soon falls behind another process.
 * The scheduler switches to the new longest job — which also begins to
 * shrink — and switches again. The CPU thrashes between the longest jobs,
 * and everything finishes late. LRTF maximises average waiting time and
 * is studied as a textbook example of a pathological policy.
 *
 * Tie-break (applied in order):
 *   1. Largest remaining time.
 *   2. If equal: earlier arrival time.
 *   3. If still equal: lower process id (lexicographic).
 * On a tie with the currently running process, no preemption occurs.
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

interface SimState {
  remaining: number;
  firstStart: number; // -1 until first scheduled
}

/** Return the process to run at 'now', or null if the CPU must idle.
 *  Selects the process with the MOST remaining time.
 *  Equal remaining -> the running process keeps the CPU (no preemption). */
function pickLrtf(
  input: ProcessInput[],
  state: Map<string, SimState>,
  now: number,
  curId: string,
): ProcessInput | null {
  let best: ProcessInput | null = null;
  for (const p of input) {
    const s = state.get(p.id)!;
    if (p.arrivalTime > now || s.remaining <= 0) continue;
    if (best === null) { best = p; continue; }
    const bs = state.get(best.id)!;
    if (s.remaining < bs.remaining) continue;   // prefer MOST remaining
    if (s.remaining > bs.remaining) { best = p; continue; }
    // Equal remaining: keep the running process (no preemption on tie).
    if (best.id === curId) continue;
    if (p.id    === curId) { best = p; continue; }
    // Neither is running: earlier arrival wins.
    if (p.arrivalTime > best.arrivalTime) continue;
    if (p.arrivalTime < best.arrivalTime) { best = p; continue; }
    // Still tied: lower id wins.
    if (p.id < best.id) best = p;
  }
  return best;
}

function lrtf(input: ProcessInput[]): SchedulingResult {
  const state = new Map<string, SimState>(
    input.map((p) => [p.id, { remaining: p.burstTime, firstStart: -1 }]),
  );

  const gantt: GanttBlock[] = [];
  const processes: ProcessResult[] = [];
  let clock = 0;
  let done = 0;
  let curId = '';
  const n = input.length;

  while (done < n) {
    const chosen = pickLrtf(input, state, clock, curId);

    if (chosen === null) {
      let nextArrival = Infinity;
      for (const p of input) {
        const s = state.get(p.id)!;
        if (s.remaining > 0 && p.arrivalTime < nextArrival)
          nextArrival = p.arrivalTime;
      }
      if (!isFinite(nextArrival)) break;
      const last = gantt[gantt.length - 1];
      if (last && last.processId === 'IDLE') last.endTime = nextArrival;
      else gantt.push({ processId: 'IDLE', startTime: clock, endTime: nextArrival });
      clock = nextArrival;
      curId = '';
      continue;
    }

    const s = state.get(chosen.id)!;
    if (s.firstStart === -1) s.firstStart = clock;

    // Extend the last Gantt block or open a new one (adjacency merge).
    // LRTF thrashing means many small non-adjacent blocks per process.
    const last = gantt[gantt.length - 1];
    if (last && last.processId === chosen.id) last.endTime = clock + 1;
    else gantt.push({ processId: chosen.id, startTime: clock, endTime: clock + 1 });

    curId = chosen.id;
    s.remaining -= 1;
    clock += 1;

    if (s.remaining === 0) {
      processes.push({
        id: chosen.id,
        arrivalTime: chosen.arrivalTime,
        burstTime: chosen.burstTime,
        completionTime: clock,
        turnaroundTime: clock - chosen.arrivalTime,
        waitingTime: clock - chosen.arrivalTime - chosen.burstTime,
        responseTime: s.firstStart - chosen.arrivalTime,
      });
      done += 1;
      curId = '';
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
  { id: 'P1', arrivalTime: 0, burstTime: 9 },
  { id: 'P2', arrivalTime: 1, burstTime: 5 },
  { id: 'P3', arrivalTime: 2, burstTime: 3 },
  { id: 'P4', arrivalTime: 3, burstTime: 1 },
];

const result = lrtf(demo);
console.table(result.processes);
console.log('Average WT :', result.averageWaitingTime);
console.log('CPU util   :', result.cpuUtilization + '%');`,
};
