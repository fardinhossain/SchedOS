/**
 * SchedOS — simulation core.
 *
 * Both runners below emit a raw unit/slice timeline. `metrics.ts` then derives
 * every reported number from that timeline, so the Gantt chart is by
 * construction the single source of truth (spec §37).
 *
 * Tie-breaking is deliberate and uniform across every algorithm:
 *   1. the requested key (burst / remaining / priority),
 *   2. then earlier arrival time,
 *   3. then process id, compared naturally so P2 sorts before P10.
 * Making this explicit keeps results deterministic and reproducible.
 */
import type { GanttBlock, LogEvent, ProcessInput } from '../types/scheduling';
import { IDLE_ID } from '../types/scheduling';

export interface RuntimeProcess extends ProcessInput {
  remaining: number;
  completed: boolean;
  /** Monotonic counter used to keep sorts stable when all keys tie. */
  order: number;
}

/** Natural comparison so "P2" < "P10" rather than string order. */
export function compareIds(a: string, b: string): number {
  const na = /^\D*(\d+)\D*$/.exec(a);
  const nb = /^\D*(\d+)\D*$/.exec(b);
  if (na && nb) {
    const diff = Number(na[1]) - Number(nb[1]);
    if (diff !== 0) return diff;
  }
  return a.localeCompare(b);
}

/** Shared tie-break tail: earlier arrival wins, then natural id order. */
export function tieBreak(a: RuntimeProcess, b: RuntimeProcess): number {
  if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
  return compareIds(a.id, b.id);
}

/** Picks the preferred process from the eligible set, or null if none. */
export type Picker = (ready: RuntimeProcess[], time: number) => RuntimeProcess | null;

interface RawTimeline {
  blocks: GanttBlock[];
  log: LogEvent[];
}

function toRuntime(processes: ProcessInput[]): RuntimeProcess[] {
  return processes.map((p, i) => ({
    ...p,
    remaining: p.burstTime,
    completed: false,
    order: i,
  }));
}

function pad(time: number): string {
  return String(time).padStart(2, '0');
}

/**
 * Merges adjacent spans belonging to the same process. Unit-granularity
 * preemptive runs produce one block per tick; coalescing turns those back into
 * readable spans while preserving every genuine context switch.
 */
export function coalesce(blocks: GanttBlock[]): GanttBlock[] {
  const out: GanttBlock[] = [];
  for (const block of blocks) {
    const prev = out[out.length - 1];
    if (prev && prev.processId === block.processId && prev.endTime === block.startTime) {
      prev.endTime = block.endTime;
    } else {
      out.push({ ...block });
    }
  }
  return out;
}

/**
 * Announces every process that has arrived at or before `time` and has not been
 * announced yet, so the system log reads chronologically.
 */
function announceArrivals(
  procs: RuntimeProcess[],
  time: number,
  announced: Set<string>,
  log: LogEvent[],
): void {
  procs
    .filter((p) => p.arrivalTime <= time && !announced.has(p.id))
    .sort((a, b) => a.arrivalTime - b.arrivalTime || compareIds(a.id, b.id))
    .forEach((p) => {
      announced.add(p.id);
      log.push({
        time: p.arrivalTime,
        type: 'ARRIVE',
        processId: p.id,
        message: `${p.id} entered READY QUEUE (AT=${p.arrivalTime}, BT=${p.burstTime})`,
      });
    });
}

/**
 * Called only when nothing is runnable, which means every uncompleted process
 * arrives strictly after `time`. Emits one IDLE block and jumps the clock.
 */
function skipIdle(
  procs: RuntimeProcess[],
  time: number,
  blocks: GanttBlock[],
  log: LogEvent[],
): number {
  const pending = procs.filter((p) => !p.completed).map((p) => p.arrivalTime);
  if (!pending.length) return time;
  const resume = Math.min(...pending);
  if (resume <= time) return time; // defensive: never emit a zero/negative span
  blocks.push({ processId: IDLE_ID, startTime: time, endTime: resume });
  log.push({
    time,
    type: 'IDLE_START',
    processId: IDLE_ID,
    message: `CPU IDLE for ${resume - time} unit(s) — no process available`,
  });
  return resume;
}

/**
 * Non-preemptive runner: once dispatched, a process holds the CPU until it
 * finishes. Arrivals during execution are queued but cannot interrupt.
 */
export function runNonPreemptive(processes: ProcessInput[], pick: Picker): RawTimeline {
  const procs = toRuntime(processes);
  const blocks: GanttBlock[] = [];
  const log: LogEvent[] = [];
  const announced = new Set<string>();
  if (!procs.length) return { blocks, log };

  let time = Math.min(...procs.map((p) => p.arrivalTime));
  let remainingCount = procs.length;

  while (remainingCount > 0) {
    announceArrivals(procs, time, announced, log);
    const ready = procs.filter((p) => !p.completed && p.arrivalTime <= time);

    if (!ready.length) {
      time = skipIdle(procs, time, blocks, log);
      continue;
    }

    const chosen = pick(ready, time);
    if (!chosen) break;

    const start = time;
    const end = time + chosen.remaining;
    blocks.push({ processId: chosen.id, startTime: start, endTime: end });
    log.push({
      time: start,
      type: 'DISPATCH',
      processId: chosen.id,
      message: `CPU assigned -> ${chosen.id} (runs ${chosen.remaining} unit(s))`,
    });

    chosen.remaining = 0;
    chosen.completed = true;
    remainingCount -= 1;
    time = end;
    log.push({
      time: end,
      type: 'COMPLETE',
      processId: chosen.id,
      message: `${chosen.id} COMPLETED at t=${pad(end)}`,
    });
  }

  return { blocks: coalesce(blocks), log };
}

/**
 * Preemptive runner at unit granularity. Re-deciding every tick is what makes
 * LRTF correct — the running process's remaining time shrinks, so it can stop
 * being the longest mid-burst. SRTF and preemptive Priority reach the same
 * answer this way; coalescing hides the per-tick bookkeeping.
 */
export function runPreemptive(processes: ProcessInput[], pick: Picker): RawTimeline {
  const procs = toRuntime(processes);
  const blocks: GanttBlock[] = [];
  const log: LogEvent[] = [];
  const announced = new Set<string>();
  if (!procs.length) return { blocks, log };

  let time = Math.min(...procs.map((p) => p.arrivalTime));
  let remainingCount = procs.length;
  let running: RuntimeProcess | null = null;

  while (remainingCount > 0) {
    announceArrivals(procs, time, announced, log);
    const ready = procs.filter((p) => !p.completed && p.arrivalTime <= time);

    if (!ready.length) {
      running = null;
      time = skipIdle(procs, time, blocks, log);
      continue;
    }

    const chosen = pick(ready, time);
    if (!chosen) break;

    if (running && running !== chosen && !running.completed) {
      log.push({
        time,
        type: 'PREEMPT',
        processId: running.id,
        message: `${running.id} PREEMPTED by ${chosen.id} (remaining ${running.remaining})`,
      });
    }
    if (running !== chosen) {
      log.push({
        time,
        type: 'DISPATCH',
        processId: chosen.id,
        message: `CPU assigned -> ${chosen.id}`,
      });
    }

    blocks.push({ processId: chosen.id, startTime: time, endTime: time + 1 });
    chosen.remaining -= 1;
    time += 1;
    running = chosen;

    if (chosen.remaining === 0) {
      chosen.completed = true;
      remainingCount -= 1;
      running = null;
      log.push({
        time,
        type: 'COMPLETE',
        processId: chosen.id,
        message: `${chosen.id} COMPLETED at t=${pad(time)}`,
      });
    }
  }

  return { blocks: coalesce(blocks), log };
}

/**
 * Round Robin needs its own runner because correctness hinges on queue order,
 * not on a selection key.
 *
 * The subtle case — and a favourite viva question — is a process arriving at
 * the exact instant the running process's quantum expires. The arriving process
 * must be enqueued BEFORE the preempted process is put back, otherwise the
 * preempted process unfairly jumps ahead of it.
 */
export function runRoundRobin(processes: ProcessInput[], quantum: number): RawTimeline {
  const procs = toRuntime(processes);
  const blocks: GanttBlock[] = [];
  const log: LogEvent[] = [];
  const announced = new Set<string>();
  if (!procs.length) return { blocks, log };

  const byArrival = [...procs].sort(
    (a, b) => a.arrivalTime - b.arrivalTime || compareIds(a.id, b.id),
  );

  let time = byArrival[0].arrivalTime;
  let remainingCount = procs.length;
  let cursor = 0;
  const queue: RuntimeProcess[] = [];

  /** Moves every process that has arrived by `upto` into the FIFO queue. */
  const enqueueArrived = (upto: number): void => {
    while (cursor < byArrival.length && byArrival[cursor].arrivalTime <= upto) {
      queue.push(byArrival[cursor]);
      cursor += 1;
    }
    announceArrivals(procs, upto, announced, log);
  };

  enqueueArrived(time);

  while (remainingCount > 0) {
    if (!queue.length) {
      // No runnable process: fast-forward to the next arrival.
      if (cursor >= byArrival.length) break;
      const resume = byArrival[cursor].arrivalTime;
      if (resume > time) {
        blocks.push({ processId: IDLE_ID, startTime: time, endTime: resume });
        log.push({
          time,
          type: 'IDLE_START',
          processId: IDLE_ID,
          message: `CPU IDLE for ${resume - time} unit(s) — ready queue empty`,
        });
        time = resume;
      }
      enqueueArrived(time);
      continue;
    }

    const current = queue.shift() as RuntimeProcess;
    const slice = Math.min(quantum, current.remaining);
    const start = time;
    const end = start + slice;

    blocks.push({ processId: current.id, startTime: start, endTime: end });
    log.push({
      time: start,
      type: 'DISPATCH',
      processId: current.id,
      message: `CPU assigned -> ${current.id} (quantum ${quantum}, runs ${slice})`,
    });

    current.remaining -= slice;
    time = end;

    // Order matters: admit arrivals up to and including `time` first...
    enqueueArrived(time);

    if (current.remaining === 0) {
      current.completed = true;
      remainingCount -= 1;
      log.push({
        time,
        type: 'COMPLETE',
        processId: current.id,
        message: `${current.id} COMPLETED at t=${pad(time)}`,
      });
    } else {
      // ...then requeue the preempted process behind them.
      queue.push(current);
      log.push({
        time,
        type: 'QUANTUM_EXPIRE',
        processId: current.id,
        message: `${current.id} quantum expired -> requeued (remaining ${current.remaining})`,
      });
    }
  }

  // Deliberately NOT coalesced: spec §8 requires every quantum segment to be
  // visible on the Gantt chart. When a process is alone in the queue it takes
  // consecutive quanta, and merging those would hide real dispatch boundaries.
  return { blocks, log };
}
