/**
 * SchedOS — prebuilt datasets.
 * Each one isolates a specific scheduling behaviour, so a demonstration can
 * show a phenomenon on demand rather than hoping random input produces it.
 */
import type { AlgorithmId, ProcessInput } from '../types/scheduling';

export interface ExampleDataset {
  id: string;
  name: string;
  /** What this dataset is designed to reveal. */
  purpose: string;
  processes: ProcessInput[];
  timeQuantum?: number;
  /** Algorithm that best demonstrates the point. */
  suggests?: AlgorithmId;
}

export const EXAMPLES: ExampleDataset[] = [
  {
    id: 'basic',
    name: 'Basic Example',
    purpose:
      'Four staggered processes with mixed burst times. A clean starting point where every algorithm produces a readable, distinct schedule.',
    processes: [
      { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 2 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 2, priority: 3 },
      { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 4 },
    ],
    timeQuantum: 2,
  },
  {
    id: 'idle',
    name: 'CPU Idle Example',
    purpose:
      'Arrival gaps force the CPU to sit idle. Use this to show hatched idle blocks on the Gantt chart and a CPU utilization below 100%.',
    processes: [
      { id: 'P1', arrivalTime: 0, burstTime: 3, priority: 2 },
      { id: 'P2', arrivalTime: 7, burstTime: 4, priority: 1 },
      { id: 'P3', arrivalTime: 15, burstTime: 2, priority: 3 },
    ],
    timeQuantum: 2,
    suggests: 'fcfs',
  },
  {
    id: 'preemption',
    name: 'Preemption Example',
    purpose:
      'A long job starts first, then progressively shorter jobs arrive. Under SRTF the CPU is repeatedly seized, splitting P1 across the timeline.',
    processes: [
      { id: 'P1', arrivalTime: 0, burstTime: 9, priority: 3 },
      { id: 'P2', arrivalTime: 1, burstTime: 5, priority: 2 },
      { id: 'P3', arrivalTime: 2, burstTime: 3, priority: 1 },
      { id: 'P4', arrivalTime: 3, burstTime: 1, priority: 4 },
    ],
    timeQuantum: 3,
    suggests: 'srtf',
  },
  {
    id: 'round-robin',
    name: 'Round Robin Example',
    purpose:
      'Five similar processes and a small quantum, producing many cyclic slices. Shows how RR bounds response time while stretching turnaround time.',
    processes: [
      { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 2 },
      { id: 'P2', arrivalTime: 1, burstTime: 6, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 3, priority: 3 },
      { id: 'P4', arrivalTime: 3, burstTime: 7, priority: 2 },
      { id: 'P5', arrivalTime: 4, burstTime: 4, priority: 1 },
    ],
    timeQuantum: 2,
    suggests: 'rr',
  },
  {
    id: 'same-arrival',
    name: 'Same Arrival Time Example',
    purpose:
      'Every process arrives at t=0, so arrival order is irrelevant and the algorithm’s selection rule is the only thing that matters. The clearest way to contrast SJF against LJF.',
    processes: [
      { id: 'P1', arrivalTime: 0, burstTime: 7, priority: 3 },
      { id: 'P2', arrivalTime: 0, burstTime: 2, priority: 1 },
      { id: 'P3', arrivalTime: 0, burstTime: 5, priority: 4 },
      { id: 'P4', arrivalTime: 0, burstTime: 1, priority: 2 },
    ],
    timeQuantum: 2,
    suggests: 'sjf',
  },
  {
    id: 'priority',
    name: 'Priority Example',
    purpose:
      'Priorities deliberately run against arrival order, so a late-arriving urgent process must overtake. Compare the preemptive and non-preemptive variants on this set.',
    processes: [
      { id: 'P1', arrivalTime: 0, burstTime: 6, priority: 4 },
      { id: 'P2', arrivalTime: 2, burstTime: 4, priority: 1 },
      { id: 'P3', arrivalTime: 4, burstTime: 3, priority: 2 },
      { id: 'P4', arrivalTime: 6, burstTime: 5, priority: 3 },
    ],
    timeQuantum: 2,
    suggests: 'priority-p',
  },
  {
    id: 'long-process',
    name: 'Long Process Example',
    purpose:
      'One very long job alongside several short ones — the convoy effect. Under FCFS the short jobs wait a long time; under SJF or SRTF they do not.',
    processes: [
      { id: 'P1', arrivalTime: 0, burstTime: 20, priority: 3 },
      { id: 'P2', arrivalTime: 1, burstTime: 2, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 3, priority: 2 },
      { id: 'P4', arrivalTime: 3, burstTime: 1, priority: 4 },
      { id: 'P5', arrivalTime: 4, burstTime: 2, priority: 2 },
    ],
    timeQuantum: 4,
    suggests: 'fcfs',
  },
];

export const DEFAULT_PROCESSES: ProcessInput[] = EXAMPLES[0].processes;

export function getExample(id: string): ExampleDataset | undefined {
  return EXAMPLES.find((e) => e.id === id);
}
