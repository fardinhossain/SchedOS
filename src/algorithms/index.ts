/**
 * SchedOS — algorithm registry.
 * The single list every UI surface reads from: selector, Compare page,
 * Algorithms catalogue and code viewer all derive their options from here.
 */
import type { AlgorithmId, AlgorithmMeta, SchedulerFn } from '../types/scheduling';
import { fcfs } from './fcfs';
import { sjf } from './sjf';
import { ljf } from './ljf';
import { priorityNonPreemptive } from './priorityNonPreemptive';
import { srtf } from './srtf';
import { lrtf } from './lrtf';
import { roundRobin } from './roundRobin';
import { priorityPreemptive } from './priorityPreemptive';

export const SCHEDULERS: Record<AlgorithmId, SchedulerFn> = {
  fcfs,
  sjf,
  ljf,
  'priority-np': priorityNonPreemptive,
  srtf,
  lrtf,
  rr: roundRobin,
  'priority-p': priorityPreemptive,
};

const ARRIVAL_TIE = 'Earlier arrival time wins; if still tied, the lower process number wins.';

export const ALGORITHMS: AlgorithmMeta[] = [
  {
    id: 'fcfs',
    name: 'First Come First Serve',
    shortName: 'FCFS',
    category: 'non-preemptive',
    rule: 'Execute the process that arrives first.',
    summary:
      'The ready queue is a plain FIFO. Whichever process has been waiting longest runs next, and it keeps the CPU until it finishes. FCFS is the baseline every other algorithm is measured against.',
    advantages: [
      'Trivially simple and completely fair in arrival order',
      'No starvation — every process eventually runs',
      'Zero scheduling overhead and fully predictable',
    ],
    disadvantages: [
      'Suffers the convoy effect: one long job delays everything behind it',
      'Average waiting time is often poor',
      'Bad for interactive systems — response time is unbounded',
    ],
    usesPriority: false,
    usesTimeQuantum: false,
    tieBreak: 'Processes arriving at the same instant run in process-number order.',
  },
  {
    id: 'sjf',
    name: 'Shortest Job First',
    shortName: 'SJF',
    category: 'non-preemptive',
    rule: 'Select the available process with the shortest burst time.',
    summary:
      'Among the processes that have arrived, the one needing the least CPU time runs next and runs to completion. SJF is provably optimal for average waiting time among non-preemptive algorithms.',
    advantages: [
      'Provably minimises average waiting time for a fixed process set',
      'Maximises throughput by clearing short jobs quickly',
      'Excellent for batch workloads with known burst times',
    ],
    disadvantages: [
      'Requires knowing burst times in advance — usually impossible',
      'Long jobs can starve if short jobs keep arriving',
      'Poor response time for large processes',
    ],
    usesPriority: false,
    usesTimeQuantum: false,
    tieBreak: `Equal burst times: ${ARRIVAL_TIE}`,
  },
  {
    id: 'ljf',
    name: 'Longest Job First',
    shortName: 'LJF',
    category: 'non-preemptive',
    rule: 'Select the available process with the longest burst time.',
    summary:
      'The mirror image of SJF: the largest available job runs first. Chiefly studied as a counter-example that shows how badly average waiting time degrades when you schedule long work ahead of short work.',
    advantages: [
      'Long batch jobs finish earlier, useful when they hold scarce resources',
      'Useful teaching contrast that isolates why SJF works',
    ],
    disadvantages: [
      'Worst-case average waiting time — the opposite of optimal',
      'Short interactive jobs starve behind long ones',
      'Almost never appropriate in a real system',
    ],
    usesPriority: false,
    usesTimeQuantum: false,
    tieBreak: `Equal burst times: ${ARRIVAL_TIE}`,
  },
  {
    id: 'priority-np',
    name: 'Priority (Non-Preemptive)',
    shortName: 'Priority NP',
    category: 'non-preemptive',
    rule: 'Select the highest-priority available process, then run it to completion.',
    summary:
      'Each process carries an externally assigned priority. The scheduler picks the most important available process, but a higher-priority arrival must wait until the running process finishes. Lower priority number means higher priority.',
    advantages: [
      'Lets the system express importance rather than just timing',
      'Lower context-switch overhead than the preemptive variant',
      'Critical work can be favoured explicitly',
    ],
    disadvantages: [
      'Low-priority processes may starve indefinitely without ageing',
      'An urgent arrival still waits for the current process',
      'Priority assignment is a policy problem in its own right',
    ],
    usesPriority: true,
    usesTimeQuantum: false,
    tieBreak: `Equal priorities: ${ARRIVAL_TIE}`,
  },
  {
    id: 'srtf',
    name: 'Shortest Remaining Time First',
    shortName: 'SRTF',
    category: 'preemptive',
    rule: 'Execute the available process with the shortest remaining time.',
    summary:
      'The preemptive form of SJF. Every arrival is a decision point: if the newcomer needs less time than what is left of the running process, it takes the CPU immediately. Optimal for average waiting time overall.',
    advantages: [
      'Optimal average waiting time across all scheduling algorithms',
      'Very responsive to short arriving jobs',
      'Reacts immediately to new information',
    ],
    disadvantages: [
      'Needs continuous knowledge of remaining times',
      'Frequent context switches add real overhead',
      'Long processes can starve badly',
    ],
    usesPriority: false,
    usesTimeQuantum: false,
    tieBreak: `Equal remaining times: ${ARRIVAL_TIE} A tie also means no preemption occurs, avoiding pointless switching.`,
  },
  {
    id: 'lrtf',
    name: 'Longest Remaining Time First',
    shortName: 'LRTF',
    category: 'preemptive',
    rule: 'Execute the available process with the longest remaining time.',
    summary:
      'Re-evaluated every time unit, this drives all remaining times towards each other, so processes tend to finish together near the end of the schedule. It produces heavy context switching and poor turnaround — a deliberate worst case.',
    advantages: [
      'Keeps remaining work balanced across processes',
      'Illuminates why preemption alone does not mean efficiency',
    ],
    disadvantages: [
      'Very high context-switch count',
      'Nearly every process completes late, hurting turnaround time',
      'No practical use — purely instructive',
    ],
    usesPriority: false,
    usesTimeQuantum: false,
    tieBreak: `Equal remaining times: ${ARRIVAL_TIE}`,
  },
  {
    id: 'rr',
    name: 'Round Robin',
    shortName: 'RR',
    category: 'preemptive',
    rule: 'Execute processes using a fixed time quantum in cyclic order.',
    summary:
      'Each process gets at most one quantum of CPU, then moves to the back of the FIFO queue. Round Robin is the classic time-sharing scheduler: it trades a little throughput for a strong guarantee on response time.',
    advantages: [
      'Bounded response time — no process waits more than (n−1) quanta',
      'Starvation-free and fair by construction',
      'Needs no knowledge of burst times, so it works in reality',
    ],
    disadvantages: [
      'Average turnaround time is mediocre',
      'Too small a quantum means overhead dominates',
      'Too large a quantum degenerates into FCFS',
    ],
    usesPriority: false,
    usesTimeQuantum: true,
    tieBreak:
      'A process arriving exactly when a quantum expires is enqueued BEFORE the preempted process is requeued.',
  },
  {
    id: 'priority-p',
    name: 'Priority (Preemptive)',
    shortName: 'Priority P',
    category: 'preemptive',
    rule: 'Select by priority, preempting the running process when a better one arrives.',
    summary:
      'Like non-preemptive Priority, but the scheduler re-checks continuously: the moment a higher-priority process becomes available it seizes the CPU. Lower priority number means higher priority.',
    advantages: [
      'Urgent work starts almost immediately',
      'Best fit for real-time and interactive requirements',
      'Importance is honoured continuously, not just at dispatch',
    ],
    disadvantages: [
      'Starvation of low-priority processes is severe without ageing',
      'Highest context-switch overhead of the priority schemes',
      'Risk of priority inversion when locks are involved',
    ],
    usesPriority: true,
    usesTimeQuantum: false,
    tieBreak: `Equal priorities: ${ARRIVAL_TIE} No preemption on a tie.`,
  },
];

export const ALGORITHM_MAP: Record<AlgorithmId, AlgorithmMeta> = ALGORITHMS.reduce(
  (acc, meta) => ({ ...acc, [meta.id]: meta }),
  {} as Record<AlgorithmId, AlgorithmMeta>,
);

export function getAlgorithm(id: AlgorithmId): AlgorithmMeta {
  return ALGORITHM_MAP[id];
}

export const NON_PREEMPTIVE = ALGORITHMS.filter((a) => a.category === 'non-preemptive');
export const PREEMPTIVE = ALGORITHMS.filter((a) => a.category === 'preemptive');
