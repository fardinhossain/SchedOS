/**
 * Learn mode (spec §24).
 *
 * The quiz is generated from a REAL scheduler run: we find an actual dispatch
 * decision in the timeline, reconstruct what was eligible at that instant, and
 * the correct answer is whatever the engine genuinely chose. Nothing is
 * hard-coded, so the questions stay correct if the engine ever changes.
 *
 * Entirely optional — it never touches the main simulator's state.
 */
import { useCallback, useMemo, useState } from 'react';
import { Check, GraduationCap, RefreshCw, X } from 'lucide-react';
import type { LabState } from '../App';
import type { AlgorithmId, ProcessInput, SchedulingResult } from '../types/scheduling';
import { ALGORITHM_MAP, SCHEDULERS } from '../algorithms';
import { EXAMPLES } from '../data/examples';
import { compareIds } from '../engine/scheduler';
import { PageHeader } from '../components/Sidebar';
import { Panel } from '../components/Panel';

/** A candidate process as it stood at one decision instant. */
interface Candidate {
  id: string;
  remaining: number;
  burstTime: number;
  arrivalTime: number;
  priority?: number;
}

interface Question {
  algorithmId: AlgorithmId;
  time: number;
  candidates: Candidate[];
  answerId: string;
  quantum: number;
  datasetName: string;
}

/** CPU time a process had already received strictly before `time`. */
function servedBefore(result: SchedulingResult, id: string, time: number): number {
  return result.gantt
    .filter((b) => b.processId === id && b.startTime < time)
    .reduce((sum, b) => sum + (Math.min(b.endTime, time) - b.startTime), 0);
}

/**
 * Finds a genuine, non-trivial dispatch decision: an instant where the
 * scheduler dispatched a process and had at least two eligible choices.
 */
function buildQuestion(seed: number): Question | null {
  // Priority variants are excluded from the pool only when a dataset lacks
  // priorities; every bundled example has them, so all eight are eligible.
  const pool: AlgorithmId[] = ['fcfs', 'sjf', 'ljf', 'srtf', 'priority-np', 'priority-p', 'rr'];
  const algorithmId = pool[seed % pool.length];

  const dataset = EXAMPLES[(seed * 3 + 1) % EXAMPLES.length];
  const quantum = dataset.timeQuantum ?? 2;
  const result = SCHEDULERS[algorithmId](dataset.processes, { timeQuantum: quantum });

  const dispatches = result.log.filter((e) => e.type === 'DISPATCH');

  // Walk dispatches (offset by the seed so repeats vary) for one with a real choice.
  for (let i = 0; i < dispatches.length; i += 1) {
    const event = dispatches[(i + seed) % dispatches.length];
    const time = event.time;

    const candidates: Candidate[] = dataset.processes
      .map((p: ProcessInput) => {
        const served = servedBefore(result, p.id, time);
        return {
          id: p.id,
          remaining: p.burstTime - served,
          burstTime: p.burstTime,
          arrivalTime: p.arrivalTime,
          priority: p.priority,
        };
      })
      .filter((c) => {
        const arrived = c.arrivalTime <= time;
        return arrived && c.remaining > 0;
      })
      .sort((a, b) => compareIds(a.id, b.id));

    if (candidates.length >= 2 && candidates.some((c) => c.id === event.processId)) {
      return {
        algorithmId,
        time,
        candidates,
        answerId: event.processId,
        quantum,
        datasetName: dataset.name,
      };
    }
  }

  // Signals "no non-trivial decision in this dataset" so the caller reseeds
  // rather than showing a question with only one possible answer.
  return null;
}

/** Explains WHY the engine made this choice, in the algorithm's own terms. */
function explain(question: Question): string {
  const { algorithmId, answerId, candidates, time } = question;
  const winner = candidates.find((c) => c.id === answerId);
  if (!winner) return '';

  const others = candidates.filter((c) => c.id !== answerId);
  const list = (pick: (c: Candidate) => number | undefined): string =>
    others.map((c) => `${c.id}=${pick(c)}`).join(', ');

  switch (algorithmId) {
    case 'fcfs':
      return `FCFS ignores burst time entirely and dispatches whichever eligible process has waited longest. ${answerId} arrived at t=${winner.arrivalTime}, earlier than the alternatives (${list((c) => c.arrivalTime)}), so it goes first.`;
    case 'sjf':
      return `SJF selects the smallest burst time among processes that have already arrived. ${answerId} needs ${winner.burstTime} units, less than the alternatives (${list((c) => c.burstTime)}). It then runs to completion, because SJF is non-preemptive.`;
    case 'ljf':
      return `LJF selects the largest burst time among arrived processes. ${answerId} needs ${winner.burstTime} units, more than the alternatives (${list((c) => c.burstTime)}) — the deliberate opposite of SJF, and the reason its average waiting time is so poor.`;
    case 'srtf':
      return `SRTF compares REMAINING time, not original burst time. At t=${time}, ${answerId} has ${winner.remaining} units left, fewer than the alternatives (${list((c) => c.remaining)}). Because SRTF is preemptive, this decision is re-made at every arrival.`;
    case 'lrtf':
      return `LRTF picks the largest remaining time. At t=${time}, ${answerId} has ${winner.remaining} units left, more than the alternatives (${list((c) => c.remaining)}).`;
    case 'priority-np':
      return `Priority scheduling picks the most important arrived process, where a LOWER number means HIGHER priority. ${answerId} has priority ${winner.priority}, better than the alternatives (${list((c) => c.priority)}). Being non-preemptive, it now keeps the CPU until it finishes.`;
    case 'priority-p':
      return `Preemptive Priority re-checks continuously. At t=${time}, ${answerId} has the best (lowest) priority value of ${winner.priority} against the alternatives (${list((c) => c.priority)}), so it takes the CPU immediately.`;
    case 'rr':
      return `Round Robin does not compare burst or priority at all — it dispatches whatever is at the FRONT of the FIFO ready queue, for at most one quantum of ${question.quantum} units. At t=${time} that was ${answerId}, which will then move to the back of the queue if it has work left.`;
    default:
      return '';
  }
}

const CONCEPTS = [
  {
    term: 'Arrival Time (AT)',
    body: 'The instant a process enters the system and becomes eligible for the CPU. Before this moment the scheduler cannot select it, no matter how urgent it is.',
  },
  {
    term: 'Burst Time (BT)',
    body: 'Total CPU time the process needs. Real schedulers rarely know this in advance, which is precisely why SJF and SRTF — though provably optimal — cannot be implemented exactly.',
  },
  {
    term: 'Completion Time (CT)',
    body: 'The instant the process finishes its final CPU burst. Read directly off the right-hand edge of its last Gantt block.',
  },
  {
    term: 'Turnaround Time (TAT)',
    body: 'CT − AT. Total time the process spent in the system, running and waiting alike. This is what a user actually experiences as "how long it took".',
  },
  {
    term: 'Waiting Time (WT)',
    body: 'TAT − BT. Time spent in the ready queue doing nothing. Since burst time is fixed, minimising waiting time is the only lever a scheduler really has.',
  },
  {
    term: 'Response Time (RT)',
    body: 'First CPU start − AT. How long until the process first shows signs of life. For interactive systems this matters far more than turnaround time.',
  },
  {
    term: 'CPU Utilization',
    body: '(busy ÷ total elapsed) × 100. Falls below 100% only when the CPU sits idle waiting for a process to arrive — never because of the ordering itself.',
  },
  {
    term: 'Preemption',
    body: 'Taking the CPU away from a running process before it finishes. Improves responsiveness, costs a context switch, and is the single dividing line between the two algorithm families.',
  },
  {
    term: 'Convoy Effect',
    body: 'Under FCFS, one long process forces every short process behind it to wait. The classic argument for preemption — and the thing the Long Process example dataset is built to show.',
  },
  {
    term: 'Starvation',
    body: 'A process that never gets the CPU because better candidates keep arriving. Afflicts SJF, SRTF and Priority. The usual remedy is ageing: gradually improving the priority of processes that have waited a long time.',
  },
];

interface LearnProps {
  lab: LabState;
}

export function Learn({ lab }: LearnProps) {
  const [seed, setSeed] = useState(1);
  const [choice, setChoice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });

  // Try successive seeds until a non-degenerate question is produced.
  const question = useMemo(() => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const q = buildQuestion(seed + attempt);
      if (q) return q;
    }
    return null;
  }, [seed]);

  const next = useCallback(() => {
    setSeed((prev) => prev + 1);
    setChoice(null);
    setSubmitted(false);
  }, []);

  const submit = (): void => {
    if (!choice || !question) return;
    setSubmitted(true);
    setScore((prev) => ({
      right: prev.right + (choice === question.answerId ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const correct = submitted && question && choice === question.answerId;
  const meta = question ? ALGORITHM_MAP[question.algorithmId] : null;

  return (
    <div className="space-y-4">
      <PageHeader
        code="04"
        title="Learn Mode"
        subtitle="Predict the scheduler's next decision, then check your reasoning against what the engine actually did."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* ── Quiz ──────────────────────────────────────────── */}
        <Panel
          title="Decision Quiz"
          code="LRN-01"
          actions={
            score.total > 0 ? (
              <span className="tabular text-[10px] text-muted-2">
                SCORE {score.right}/{score.total}
              </span>
            ) : undefined
          }
        >
          {!question || !meta ? (
            <p className="tabular py-6 text-center text-xs text-muted-2">
              Unable to generate a question. Try again.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Scenario */}
              <div className="scanlines border border-ink bg-ink p-3">
                <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-3 pb-2">
                  <span className="tabular text-xs font-bold text-crt">{meta.shortName}</span>
                  <span className="label text-muted-2">{question.datasetName}</span>
                </div>

                <p className="tabular text-xs text-bone/80">
                  CURRENT TIME: <span className="font-bold text-machine">
                    {String(question.time).padStart(2, '0')}
                  </span>
                </p>

                <p className="label mt-2.5 mb-1.5 text-muted-2">Eligible Processes</p>
                <ul className="space-y-1">
                  {question.candidates.map((c) => (
                    <li key={c.id} className="tabular flex gap-3 text-[11px] text-bone/75">
                      <span className="w-8 shrink-0 font-bold text-bone">{c.id}</span>
                      <span className="w-16">AT={c.arrivalTime}</span>
                      <span className="w-16">BT={c.burstTime}</span>
                      <span className="w-20">REM={c.remaining}</span>
                      {meta.usesPriority && <span>PRI={c.priority}</span>}
                    </li>
                  ))}
                </ul>

                {meta.usesTimeQuantum && (
                  <p className="tabular mt-2 text-[10px] text-muted-2">
                    Time quantum = {question.quantum}
                  </p>
                )}
              </div>

              {/* Question */}
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">
                  Which process should {meta.shortName} select next?
                </legend>
                <div className="space-y-1.5">
                  {question.candidates.map((c) => {
                    const isAnswer = c.id === question.answerId;
                    const isChoice = choice === c.id;
                    return (
                      <label
                        key={c.id}
                        className={[
                          'flex cursor-pointer items-center gap-2.5 border px-2.5 py-2 transition-colors',
                          submitted && isAnswer
                            ? 'border-crt-dim bg-crt/15'
                            : submitted && isChoice
                              ? 'border-signal bg-signal/10'
                              : isChoice
                                ? 'border-ink bg-bone-3/70'
                                : 'border-rule bg-bone-2/50 hover:border-ink',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="quiz-choice"
                          value={c.id}
                          checked={isChoice}
                          disabled={submitted}
                          onChange={() => setChoice(c.id)}
                          className="h-3.5 w-3.5 shrink-0 accent-crt-dim"
                        />
                        <span className="tabular flex-1 text-xs font-bold">{c.id}</span>
                        {submitted && isAnswer && (
                          <span className="label flex items-center gap-1 text-crt-dim">
                            <Check aria-hidden="true" className="h-3 w-3" />
                            Correct
                          </span>
                        )}
                        {submitted && isChoice && !isAnswer && (
                          <span className="label flex items-center gap-1 text-signal">
                            <X aria-hidden="true" className="h-3 w-3" />
                            Your answer
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Actions + explanation */}
              {!submitted ? (
                <button
                  type="button"
                  onClick={submit}
                  disabled={!choice}
                  className="w-full border border-ink bg-ink px-3 py-2 text-xs font-bold text-bone transition-colors hover:bg-ink-3 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Submit
                </button>
              ) : (
                <div className="space-y-2.5">
                  <div
                    className={[
                      'border-l-2 px-3 py-2.5',
                      correct
                        ? 'border-crt-dim bg-crt/10'
                        : 'border-signal bg-signal/10',
                    ].join(' ')}
                  >
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold">
                      {correct ? (
                        <>
                          <Check aria-hidden="true" className="h-3.5 w-3.5 text-crt-dim" />
                          Correct.
                        </>
                      ) : (
                        <>
                          <X aria-hidden="true" className="h-3.5 w-3.5 text-signal" />
                          Not quite — the answer is {question.answerId}.
                        </>
                      )}
                    </p>
                    <p className="text-xs leading-relaxed text-text/80">{explain(question)}</p>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={next}
                      className="flex flex-1 items-center justify-center gap-1.5 border border-ink bg-crt px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-crt-dim"
                    >
                      <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                      Next Question
                    </button>
                    <button
                      type="button"
                      onClick={() => lab.setAlgorithm(question.algorithmId)}
                      className="border border-rule bg-bone-2 px-3 py-2 text-xs font-semibold transition-colors hover:border-ink"
                      title={`Select ${meta.shortName} in the Visualizer`}
                    >
                      Use {meta.shortName}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* ── Concepts ──────────────────────────────────────── */}
        <Panel
          title="Core Concepts"
          code="LRN-02"
          note="The vocabulary every metric on the Visualizer page is built from."
        >
          <dl className="space-y-2.5">
            {CONCEPTS.map((concept) => (
              <div key={concept.term} className="border-l-2 border-rule pl-2.5">
                <dt className="tabular text-xs font-bold">{concept.term}</dt>
                <dd className="mt-0.5 text-[11px] leading-relaxed text-text/70">
                  {concept.body}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      {/* ── Study path ────────────────────────────────────── */}
      <Panel title="How To Read A Schedule" code="LRN-03">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: '01',
              t: 'Follow the timeline first',
              b: 'Read the Gantt chart left to right and note every point where the running process changes. Each change is a scheduling decision you should be able to justify.',
            },
            {
              n: '02',
              t: 'Ask what was eligible',
              b: 'At each switch, list the processes that had arrived and were unfinished. The algorithm chose from exactly that set — nothing else was available to it.',
            },
            {
              n: '03',
              t: 'Apply the rule',
              b: 'Compare the candidates on whatever the algorithm cares about: arrival order, burst time, remaining time, priority, or queue position.',
            },
            {
              n: '04',
              t: 'Derive the metrics',
              b: 'Completion times come straight off the chart; turnaround, waiting and response times follow arithmetically. If a number surprises you, re-read the chart.',
            },
          ].map((item) => (
            <li key={item.n} className="border border-rule bg-bone-2/50 p-3">
              <div className="flex items-center gap-2">
                <GraduationCap aria-hidden="true" className="h-3.5 w-3.5 text-muted-2" />
                <span className="tabular text-[10px] font-bold text-signal">{item.n}</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold">{item.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-text/65">{item.b}</p>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
