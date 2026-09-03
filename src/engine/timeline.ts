/**
 * SchedOS — simulation frames.
 *
 * The scheduler computes the whole result synchronously up front; the player
 * then *replays* that timeline against a clock. Deriving frames from the final
 * timeline means the animation can never drift out of sync with the reported
 * metrics, and stepping stays instant even with 50 processes.
 */
import type { GanttBlock, LogEvent, ProcessResult, SchedulingResult } from '../types/scheduling';
import { IDLE_ID } from '../types/scheduling';
import { compareIds } from './scheduler';

export type ProcessPhase = 'unarrived' | 'ready' | 'running' | 'completed';

export interface SimulationFrame {
  /** Clock value at the START of this frame. */
  time: number;
  /** Process currently holding the CPU, or null when idle. */
  runningId: string | null;
  /** Ready-queue contents, in the order they would be considered. */
  readyIds: string[];
  completedIds: string[];
  phase: Record<string, ProcessPhase>;
  /** Events that occurred exactly at this instant. */
  events: LogEvent[];
  /** Gantt blocks fully or partially revealed by this instant. */
  revealedUpTo: number;
  cpuBusySoFar: number;
  utilizationSoFar: number;
}

function blockAt(gantt: GanttBlock[], time: number): GanttBlock | undefined {
  return gantt.find((b) => time >= b.startTime && time < b.endTime);
}

/**
 * Builds one frame per time unit, from the first arrival to the final
 * completion, plus a terminal frame showing the finished state.
 */
export function buildFrames(result: SchedulingResult): SimulationFrame[] {
  if (!result.gantt.length) return [];

  const { startTime, endTime, gantt, processes } = result;
  const frames: SimulationFrame[] = [];

  // Guard against pathological inputs producing an unbounded frame list.
  const span = Math.min(endTime - startTime, 20000);

  for (let offset = 0; offset <= span; offset += 1) {
    const time = startTime + offset;
    const active = blockAt(gantt, time);
    const runningId = active && active.processId !== IDLE_ID ? active.processId : null;

    const completed: string[] = [];
    const ready: string[] = [];
    const phase: Record<string, ProcessPhase> = {};

    processes.forEach((p: ProcessResult) => {
      if (p.completionTime <= time) {
        phase[p.id] = 'completed';
        completed.push(p.id);
      } else if (p.id === runningId) {
        phase[p.id] = 'running';
      } else if (p.arrivalTime <= time) {
        phase[p.id] = 'ready';
        ready.push(p.id);
      } else {
        phase[p.id] = 'unarrived';
      }
    });

    const cpuBusySoFar = gantt
      .filter((b) => b.processId !== IDLE_ID && b.startTime < time)
      .reduce((sum, b) => sum + (Math.min(b.endTime, time) - b.startTime), 0);
    const elapsed = time - startTime;

    frames.push({
      time,
      runningId,
      readyIds: ready.sort(compareIds),
      completedIds: completed.sort(compareIds),
      phase,
      events: result.log.filter((e) => e.time === time),
      revealedUpTo: time,
      cpuBusySoFar,
      utilizationSoFar: elapsed > 0 ? (cpuBusySoFar / elapsed) * 100 : 0,
    });
  }

  return frames;
}
