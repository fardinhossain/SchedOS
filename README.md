# SchedOS — Interactive CPU Scheduling Laboratory

**Visualize. Simulate. Understand.**

An educational web application for visualizing, simulating and comparing CPU scheduling
algorithms. Everything runs client-side; there is no backend and nothing is precomputed.

---

## Running it

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + single-file production build into dist/
npm run test     # 537 engine tests
```

`npm run build` emits a **single self-contained `dist/index.html`** (via
`vite-plugin-singlefile`) — copy that one file anywhere and it works offline.

---

## The eight algorithms

| | Algorithm | Category | Rule |
|---|---|---|---|
| 1 | **FCFS** | Non-preemptive | Execute the process that arrives first |
| 2 | **SJF** | Non-preemptive | Select the available process with the shortest burst time |
| 3 | **LJF** | Non-preemptive | Select the available process with the longest burst time |
| 4 | **Priority** | Non-preemptive | Highest-priority available process, run to completion |
| 5 | **SRTF** | Preemptive | Execute the available process with the shortest remaining time |
| 6 | **LRTF** | Preemptive | Execute the available process with the longest remaining time |
| 7 | **Round Robin** | Preemptive | Fixed time quantum, cyclic FIFO order |
| 8 | **Priority** | Preemptive | Select by priority, preempting on a better arrival |

---

## Architecture

The scheduling engine is **plain TypeScript with no React dependency**, which is what allows it
to be unit-tested in complete isolation from the interface.

```
src/
├── algorithms/          # one selection rule per file, all returning SchedulingResult
├── engine/
│   ├── scheduler.ts     # the three shared runners (non-preemptive, preemptive, round robin)
│   ├── metrics.ts       # derives EVERY reported number from the emitted timeline
│   ├── timeline.ts      # turns a result into replayable simulation frames
│   ├── validation.ts    # input validation, returns all issues at once
│   └── comparison.ts    # multi-algorithm comparison + generated observations
├── codeExamples/        # 8 algorithms × 3 languages = 24 reference implementations
├── components/          # UI primitives and instruments
├── pages/               # Home, Visualizer, Compare, Algorithms, Learn, About
├── types/scheduling.ts  # shared data model
├── data/examples.ts     # 7 prebuilt datasets
└── test/                # Vitest suite
```

### The governing design rule

**The Gantt timeline is the single source of truth.** Algorithms emit a timeline; `metrics.ts`
then derives completion, turnaround, waiting and response times *from that timeline*. No
algorithm computes its own metrics. This makes the classic "chart disagrees with the table" bug
structurally impossible rather than merely unlikely.

---

## Engine conventions

These are stated explicitly because every number on screen depends on them.

- **Priority: a lower number means higher priority.** Priority 1 outranks priority 4.
- **The schedule starts at the first arrival.** Total elapsed time runs from the earliest arrival
  to the final completion. Time before any process exists is *not* counted as CPU idleness,
  because the CPU had nothing it could have run.
- **Ties are broken deterministically:** the algorithm's own key first, then earlier arrival time,
  then the lower process number (compared naturally, so `P2` precedes `P10`). Identical input
  always produces an identical schedule.
- **Round Robin queue ordering:** a process arriving at the *exact* instant a quantum expires is
  enqueued **before** the preempted process is requeued. Getting this backwards is the most
  common bug in student implementations, and it has a dedicated test.
- **Preemptive algorithms are evaluated every time unit.** This is what makes LRTF correct: a
  running process's remaining time shrinks, so it can stop being the longest mid-burst. Adjacent
  same-process segments are then merged for readability — except in Round Robin, where every
  quantum segment stays visible.

---

## Testing

```bash
npm run test
```

537 tests in two layers:

1. **Structural invariants**, run across every algorithm × every dataset — contiguous timeline
   with no gaps or overlaps, no process running before it arrives, each process served exactly
   its burst time, `busy + idle == total`, `TAT == CT − AT`, `WT == TAT − BT`,
   `RT == firstStart − AT`, averages matching their per-process values, and utilization
   consistent with busy/total.
2. **Hand-computed cases** pinning exact timelines and metrics worked out on paper, so a
   plausible-but-wrong schedule cannot pass.

Plus the edge cases: single process, late-arriving single process, empty list, equal bursts,
equal priorities, arrival mid-execution, idle gaps, large burst times, 50 processes, Round Robin
with quantum 1 and with a quantum exceeding every burst, and missing priority values.

---

## The animated hero

The homepage hero is a **door**: a full-viewport entrance you pass through on the way into the
laboratory. Text is stripped to the wordmark and the tagline, so the visual carries the page —
a **live CPU die schematic** cycling through all eight algorithms, with processes flowing along
buses into a pulsing core, a ready queue that reorders, and a Gantt strip drawing itself in real
time. The bottom rail carries a door into each of the five sections plus a scroll cue;
everything explanatory sits below the fold.

It is driven by the **real engine** — `data/heroShowcase.ts` calls the same `SCHEDULERS`
registry and `buildFrames` replayer the Visualizer uses, so the animation cannot drift out of
sync with the algorithms it depicts. The "up next" marker on the ready queue is read from the
scheduler's own event log rather than by re-implementing each selection rule in the UI.

The showcase dataset is chosen, not arbitrary. Its priorities follow **neither arrival order nor
burst order**, because priority ordered by arrival collapses Priority (Non-Preemptive) into
FCFS, and priority ordered by burst collapses Priority (Preemptive) into SRTF. Decorrelating
them yields eight visibly distinct timelines, with average waiting time spanning 3.00 (SRTF) to
8.50 (LRTF) on identical work. The dataset is displayed on the homepage directly beneath the
animation so the figures can be checked by hand.

The animation stops when the tab is hidden, when it scrolls out of view, and while hovered;
`prefers-reduced-motion` replaces it with a static final-state diagram.

## Design

A "Retro-Future Operating System Laboratory" identity: 1980s terminal + engineering laboratory +
technical blueprint + modern information design. Warm bone canvas, near-black instrument
surfaces, and CRT green / signal orange / machine yellow used as *semantic state signals* rather
than decoration. Deliberately contains no purple and does not use blue as a primary colour.

Accessibility: process state is carried by icon, border and text label as well as colour;
Gantt blocks are focusable and individually labelled; focus rings are always visible; the
simulation has keyboard shortcuts (`Space` play/pause, `→` step, `R` reset); and
`prefers-reduced-motion` disables animation.

---

## Stack

React · TypeScript · Vite · Tailwind CSS · Recharts · Prism · Lucide · Vitest

The 24 code samples in the viewer are **educational reference implementations only** — they are
displayed, never executed. The simulator always runs the TypeScript engine in `src/algorithms`.
