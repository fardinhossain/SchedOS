/**
 * Hero showcase data.
 *
 * The homepage animation replays REAL scheduler output — it imports the same
 * `SCHEDULERS` registry and `buildFrames` replayer the Visualizer uses. Nothing
 * about the hero is a hand-animated decorative loop, so it cannot drift out of
 * sync with the algorithms it claims to depict (spec §39).
 *
 * The dataset below is chosen, not arbitrary. Priorities deliberately follow
 * NEITHER arrival order nor burst order, because:
 *   - priority ordered by arrival collapses Priority (NP) into FCFS, and
 *   - priority ordered by burst collapses Priority (P) into SRTF.
 * With this set all eight algorithms produce a visibly different timeline, and
 * average waiting time spreads from 3.00 (SRTF) to 8.50 (LRTF) — so the tour
 * demonstrates a real performance gap rather than eight near-identical charts.
 */
import type { AlgorithmMeta, ProcessInput, SchedulingResult } from '../types/scheduling';
import { ALGORITHM_MAP, SCHEDULERS } from '../algorithms';
import { buildFrames } from '../engine/timeline';
import type { SimulationFrame } from '../engine/timeline';
import type { AlgorithmId } from '../types/scheduling';

export const HERO_QUANTUM = 2;

export const HERO_PROCESSES: ProcessInput[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 7, priority: 2 },
  { id: 'P2', arrivalTime: 1, burstTime: 2, priority: 3 },
  { id: 'P3', arrivalTime: 3, burstTime: 4, priority: 4 },
  { id: 'P4', arrivalTime: 4, burstTime: 3, priority: 1 },
];

/**
 * Tour order: alternate non-preemptive and preemptive so the contrast between
 * the two families reads immediately, rather than showing four calm schedules
 * followed by four busy ones.
 */
const SHOWCASE_ORDER: AlgorithmId[] = [
  'fcfs',
  'srtf',
  'sjf',
  'rr',
  'ljf',
  'priority-p',
  'priority-np',
  'lrtf',
];

export interface ShowcaseEntry {
  meta: AlgorithmMeta;
  result: SchedulingResult;
  frames: SimulationFrame[];
  /** Label including the quantum, for Round Robin. */
  label: string;
}

/**
 * Runs every algorithm once. Called a single time and memoised by the hook, so
 * the animation costs no scheduling work per frame.
 */
export function buildShowcase(): ShowcaseEntry[] {
  return SHOWCASE_ORDER.map((id) => {
    const meta = ALGORITHM_MAP[id];
    const result = SCHEDULERS[id](HERO_PROCESSES, { timeQuantum: HERO_QUANTUM });
    return {
      meta,
      result,
      frames: buildFrames(result),
      label: meta.usesTimeQuantum ? `${meta.shortName} · q=${HERO_QUANTUM}` : meta.shortName,
    };
  });
}

/**
 * The process the scheduler will dispatch next, read out of the event log.
 *
 * Deriving this from the log rather than re-implementing each selection rule in
 * the UI is deliberate: the ready queue can visibly reorder per algorithm
 * without any risk of the animation disagreeing with the engine.
 */
export function nextDispatch(result: SchedulingResult, time: number): string | null {
  const upcoming = result.log
    .filter((e) => e.type === 'DISPATCH' && e.time > time)
    .sort((a, b) => a.time - b.time);
  return upcoming.length ? upcoming[0].processId : null;
}
