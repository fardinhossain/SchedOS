/**
 * Home / lab console (spec §19, §35).
 *
 * The hero is deliberately a DOOR: a full-viewport entrance you pass through
 * on the way into the laboratory. Text is stripped back to the wordmark and
 * tagline so the live CPU die schematic carries the page, with a row of
 * section doors and a scroll cue along the bottom edge.
 *
 * Everything explanatory lives below the fold, where it belongs.
 */
import { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircuitBoard,
  Code2,
  Cpu,
  GitCompareArrows,
  Info,
  Layers,
  ListTree,
} from 'lucide-react';
import type { PageId } from '../components/Sidebar';
import { ALGORITHMS, NON_PREEMPTIVE, PREEMPTIVE } from '../algorithms';
import { EXAMPLES } from '../data/examples';
import { HERO_PROCESSES, HERO_QUANTUM } from '../data/heroShowcase';
import { Panel } from '../components/Panel';
import { HeroAnimation } from '../components/HeroAnimation';
import { buildColorMap } from '../components/processColors';
import { LANGUAGES } from '../codeExamples';

interface HomeProps {
  onNavigate: (page: PageId) => void;
}

/** The doors. Dashboard is omitted — you are already standing in it. */
const DOORS: { page: PageId; code: string; label: string; icon: React.ReactNode }[] = [
  { page: 'visualizer', code: '01', label: 'Visualizer', icon: <CircuitBoard className="h-4 w-4" /> },
  { page: 'compare', code: '02', label: 'Compare', icon: <GitCompareArrows className="h-4 w-4" /> },
  { page: 'algorithms', code: '03', label: 'Algorithms', icon: <ListTree className="h-4 w-4" /> },
  { page: 'code', code: '04', label: 'Code Examples', icon: <Code2 className="h-4 w-4" /> },
  { page: 'learn', code: '05', label: 'Learn', icon: <BookOpen className="h-4 w-4" /> },
  { page: 'about', code: '06', label: 'About', icon: <Info className="h-4 w-4" /> },
];

export function Home({ onNavigate }: HomeProps) {
  // The hero animation owns its own process set, so it needs its own colour
  // map — independent of whatever the user currently has in the Visualizer.
  const heroColors = useMemo(() => buildColorMap(HERO_PROCESSES.map((p) => p.id)), []);
  const codeSampleCount = ALGORITHMS.length * LANGUAGES.length;

  return (
    <div className="space-y-5">
      {/* ── Hero: the door ──────────────────────────────────── */}
      <section
        className="scanlines relative flex min-h-[calc(100dvh-6.5rem)] flex-col border border-ink bg-ink lg:min-h-[calc(100dvh-5.5rem)]"
        aria-label="SchedOS entrance"
      >
        {/* Top rail — machine identification */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-3 px-4 py-2">
          <span className="label flex items-center gap-2 text-crt">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-crt blink" />
            Process Lab v1.0
          </span>
          <span className="label hidden text-muted-2 sm:inline">
            {ALGORITHMS.length} Algorithms · Client-Side · No Backend
          </span>
        </div>

        {/* Centre — wordmark + live die */}
        <div className="grid flex-1 items-center gap-6 p-4 sm:p-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-stretch lg:gap-10">
          {/* Wordmark block stays vertically centred while the die stretches. */}
          <div className="flex min-w-0 flex-col justify-center">
            <h1 className="tabular text-[3.25rem] leading-[0.88] font-bold tracking-tighter text-bone sm:text-7xl lg:text-8xl">
              SCHED<span className="text-crt">OS</span>
            </h1>

            {/* The whole pitch, in one line. */}
            <p className="label mt-4 text-machine sm:text-xs">
              Visualize. Simulate. Understand.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('visualizer')}
                className="group flex items-center gap-2 border border-crt bg-crt px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-crt-dim"
              >
                [ INITIALIZE SIMULATION ]
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </div>

          {/* Live CPU die schematic — the hero's real content */}
          <HeroAnimation colors={heroColors} large />
        </div>

        {/* Bottom rail — the doors */}
        <nav
          aria-label="Enter a section"
          className="shrink-0 border-t border-ink-3"
        >
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {DOORS.map((door) => (
              <li key={door.page} className="border-r border-b border-ink-3 last:border-r-0">
                <button
                  type="button"
                  onClick={() => onNavigate(door.page)}
                  className="group relative flex w-full items-center gap-2.5 px-3 py-3 text-left transition-colors hover:bg-ink-2"
                >
                  {/* Door jamb: fills in on hover */}
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 h-full w-[3px] bg-transparent transition-colors group-hover:bg-crt"
                  />
                  <span aria-hidden="true" className="text-muted-2 transition-colors group-hover:text-crt">
                    {door.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="tabular block text-[10px] text-muted-2">{door.code}</span>
                    <span className="block truncate text-sm font-semibold text-bone/85 transition-colors group-hover:text-bone">
                      {door.label}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 text-muted-2 transition-all group-hover:translate-x-0.5 group-hover:text-crt"
                  />
                </button>
              </li>
            ))}
          </ul>

          {/* Scroll cue */}
          <p className="label flex items-center justify-center gap-1.5 py-2 text-muted-2">
            <ChevronDown aria-hidden="true" className="h-3 w-3" />
            Scroll for the showcase dataset and algorithm reference
          </p>
        </nav>
      </section>

      {/* ── Below the fold: showcase dataset ────────────────── */}
      <Panel
        title="Showcase Dataset"
        code="SEQ-00"
        note={`The exact process set the schematic above is scheduling — quantum ${HERO_QUANTUM} for Round Robin.`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="thin-scroll overflow-x-auto">
            <table className="border-collapse text-left">
              <caption className="sr-only">Processes used by the hero animation</caption>
              <thead>
                <tr className="border-b border-rule">
                  {['PID', 'AT', 'BT', 'PRI'].map((h) => (
                    <th key={h} scope="col" className="label px-2.5 py-1.5 text-muted-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HERO_PROCESSES.map((p) => (
                  <tr key={p.id} className="border-b border-rule/50 last:border-b-0">
                    <td className="px-2.5 py-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="h-3 w-1"
                          style={{ backgroundColor: heroColors[p.id] }}
                        />
                        <span className="tabular text-xs font-bold">{p.id}</span>
                      </span>
                    </td>
                    <td className="tabular px-2.5 py-1 text-xs">{p.arrivalTime}</td>
                    <td className="tabular px-2.5 py-1 text-xs">{p.burstTime}</td>
                    <td className="tabular px-2.5 py-1 text-xs">{p.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="max-w-md text-xs leading-relaxed text-text/65">
            This set is chosen, not arbitrary. The priorities follow neither arrival order nor
            burst order — if they matched arrival order, Priority (Non-Preemptive) would produce
            exactly the same schedule as FCFS; if they matched burst order, Priority (Preemptive)
            would collapse into SRTF. Decorrelating them makes all eight algorithms produce a
            visibly different timeline, with average waiting time ranging from 3.00 under SRTF to
            8.50 under LRTF on identical work.
          </p>
        </div>
      </Panel>

      {/* ── What this is ─────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Layers aria-hidden="true" className="h-4 w-4" />}
          value={String(ALGORITHMS.length)}
          label="Scheduling Algorithms"
          detail="Four non-preemptive, four preemptive — including both Priority variants."
        />
        <StatCard
          icon={<Cpu aria-hidden="true" className="h-4 w-4" />}
          value={String(EXAMPLES.length)}
          label="Example Datasets"
          detail="Each isolates one behaviour: idle CPU, preemption, convoy effect, ties."
        />
        <StatCard
          icon={<GitCompareArrows aria-hidden="true" className="h-4 w-4" />}
          value={String(codeSampleCount)}
          label="Code Samples"
          detail={`Every algorithm implemented in ${LANGUAGES.map((l) => l.label).join(', ')}.`}
        />
      </div>

      {/* ── Algorithm categories ─────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Non-Preemptive" code="CAT-01">
          <p className="mb-3 text-xs leading-relaxed text-text/70">
            Once a process holds the CPU it keeps it until it finishes. Simple, low overhead, and
            vulnerable to one long job blocking everything behind it.
          </p>
          <ul className="space-y-1.5">
            {NON_PREEMPTIVE.map((a) => (
              <AlgoRow key={a.id} name={a.shortName} full={a.name} rule={a.rule} />
            ))}
          </ul>
        </Panel>

        <Panel title="Preemptive" code="CAT-02">
          <p className="mb-3 text-xs leading-relaxed text-text/70">
            The scheduler can take the CPU away mid-execution when a better candidate appears.
            More responsive, at the cost of context-switching overhead.
          </p>
          <ul className="space-y-1.5">
            {PREEMPTIVE.map((a) => (
              <AlgoRow key={a.id} name={a.shortName} full={a.name} rule={a.rule} />
            ))}
          </ul>
        </Panel>
      </div>

      {/* ── Suggested demonstration path ─────────────────────── */}
      <Panel
        title="Suggested Walkthrough"
        code="SEQ-01"
        note="A four-minute path through the whole laboratory."
      >
        <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01',
              title: 'Run a simulation',
              body: 'Open the Visualizer, load the Preemption example, pick SRTF and press Play.',
              page: 'visualizer' as PageId,
            },
            {
              step: '02',
              title: 'Read the metrics',
              body: 'Check completion, turnaround, waiting and response times against the chart.',
              page: 'visualizer' as PageId,
            },
            {
              step: '03',
              title: 'Compare algorithms',
              body: 'Run FCFS, SJF, SRTF and Round Robin on one dataset and see which wins.',
              page: 'compare' as PageId,
            },
            {
              step: '04',
              title: 'Study the code',
              body: 'Read exam-ready, memorable implementations taking user input in C, Python, and TS.',
              page: 'code' as PageId,
            },
            {
              step: '05',
              title: 'Test yourself',
              body: 'Use Learn mode to predict the scheduler’s next choice before it happens.',
              page: 'learn' as PageId,
            },
          ].map((item) => (
            <li key={item.step}>
              <button
                type="button"
                onClick={() => onNavigate(item.page)}
                className="group h-full w-full border border-rule bg-bone-2/60 p-3 text-left transition-colors hover:border-ink hover:bg-bone-3/60"
              >
                <span className="tabular text-[10px] font-bold text-signal">{item.step}</span>
                <p className="mt-1 text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-text/65">{item.body}</p>
                <span className="label mt-2 flex items-center gap-1 text-muted-2 transition-colors group-hover:text-ink">
                  Open
                  <ArrowRight aria-hidden="true" className="h-2.5 w-2.5" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  detail,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="registered border border-rule bg-bone-2/50 p-3.5">
      <div className="flex items-start justify-between">
        <span className="tabular text-3xl leading-none font-bold">{value}</span>
        <span aria-hidden="true" className="text-muted-2">
          {icon}
        </span>
      </div>
      <p className="label mt-2 text-text/75">{label}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-text/60">{detail}</p>
    </div>
  );
}

function AlgoRow({ name, full, rule }: { name: string; full: string; rule: string }) {
  return (
    <li className="flex gap-2.5 border-l-2 border-rule pl-2.5">
      <span className="tabular w-20 shrink-0 text-xs font-bold">{name}</span>
      <span className="min-w-0">
        <span className="block text-xs font-medium">{full}</span>
        <span className="block text-[11px] leading-snug text-text/60">{rule}</span>
      </span>
    </li>
  );
}
