/**
 * About page (spec §35).
 * What the project is, how it is built, and — importantly for a viva — the
 * exact conventions the engine follows, so no number on screen is ambiguous.
 */
import { ArrowRight, Cpu, FlaskConical, Ruler } from 'lucide-react';
import type { PageId } from '../components/Sidebar';
import { PageHeader } from '../components/Sidebar';
import { Panel } from '../components/Panel';
import { ALGORITHMS } from '../algorithms';
import { EXAMPLES } from '../data/examples';

const STACK = [
  { name: 'React + TypeScript', role: 'Component UI with a fully typed scheduling engine' },
  { name: 'Vite', role: 'Build tooling and dev server' },
  { name: 'Tailwind CSS', role: 'Design tokens and layout' },
  { name: 'Recharts', role: 'Comparison bar charts' },
  { name: 'Prism', role: 'Syntax highlighting in the code viewer' },
  { name: 'Lucide', role: 'Interface icons' },
  { name: 'Vitest', role: `${537} engine tests covering every algorithm and edge case` },
];

const CONVENTIONS = [
  {
    title: 'The timeline is the source of truth',
    body: 'Algorithms emit a Gantt timeline; every reported metric is then derived from that timeline by a single shared module. No algorithm computes its own completion times, so the chart and the tables cannot disagree.',
  },
  {
    title: 'Priority: lower number means higher priority',
    body: 'A process with priority 1 outranks one with priority 4. Both Priority variants use this convention consistently.',
  },
  {
    title: 'The schedule starts at the first arrival',
    body: 'Total elapsed time runs from the earliest arrival to the final completion. Time before any process exists is not counted as CPU idleness, because the CPU had nothing it could have run.',
  },
  {
    title: 'Ties are broken deterministically',
    body: 'Equal keys fall back to earlier arrival time, then to the lower process number. Identical input therefore always produces an identical schedule — nothing is left to chance.',
  },
  {
    title: 'Round Robin queue ordering',
    body: 'A process arriving at the exact instant a quantum expires is enqueued BEFORE the preempted process is requeued. Every quantum segment is drawn separately, so no dispatch boundary is hidden.',
  },
  {
    title: 'Preemptive algorithms are evaluated every time unit',
    body: 'This is what makes LRTF correct: a running process’s remaining time shrinks, so it can stop being the longest mid-burst. Adjacent segments are merged for readability without losing any real context switch.',
  },
];

interface AboutProps {
  onNavigate: (page: PageId) => void;
}

export function About({ onNavigate }: AboutProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        code="05"
        title="About SchedOS"
        subtitle="An interactive operating-system laboratory for understanding CPU scheduling."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Purpose" code="DOC-01">
          <div className="space-y-3 text-xs leading-relaxed text-text/80">
            <p>
              CPU scheduling is usually taught with static Gantt diagrams drawn on a whiteboard.
              The diagram shows the <em>outcome</em> but hides the reasoning: why the scheduler
              chose one process over another at a particular instant.
            </p>
            <p>
              SchedOS makes that reasoning observable. You supply the processes; the simulator
              runs the algorithm one clock tick at a time and shows exactly what was in the ready
              queue at each decision point, what the CPU picked, and what the choice cost in
              waiting and turnaround time.
            </p>
            <p>
              Everything runs in your browser. There is no backend, nothing is uploaded, and no
              results are precomputed — the timelines and metrics are calculated live from your
              own input each time you press Run.
            </p>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-rule pt-3">
            <Stat value={String(ALGORITHMS.length)} label="Algorithms" />
            <Stat value={String(EXAMPLES.length)} label="Datasets" />
            <Stat value="24" label="Code Samples" />
          </dl>
        </Panel>

        <Panel title="Technology" code="DOC-02">
          <dl className="space-y-2">
            {STACK.map((item) => (
              <div key={item.name} className="border-l-2 border-rule pl-2.5">
                <dt className="tabular text-xs font-bold">{item.name}</dt>
                <dd className="mt-0.5 text-[11px] leading-relaxed text-text/65">{item.role}</dd>
              </div>
            ))}
          </dl>
          <p className="tabular mt-3 border-t border-rule pt-2.5 text-[10px] leading-relaxed text-muted-2">
            The scheduling engine is plain TypeScript with no React dependency, which is what
            allows it to be unit-tested in isolation from the interface.
          </p>
        </Panel>
      </div>

      {/* Conventions — the part that matters under questioning */}
      <Panel
        title="Engine Conventions"
        code="DOC-03"
        note="Every definition the numbers on screen depend on, stated explicitly."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {CONVENTIONS.map((item) => (
            <div key={item.title} className="border border-rule bg-bone-2/50 p-3">
              <div className="mb-1.5 flex items-start gap-2">
                <Ruler aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 text-muted-2" />
                <h3 className="text-xs font-bold">{item.title}</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-text/70">{item.body}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Formula reference */}
      <Panel title="Metric Definitions" code="DOC-04">
        <div className="thin-scroll overflow-x-auto border border-ink">
          <table className="w-full border-collapse bg-ink text-left">
            <caption className="sr-only">Scheduling metric formulas</caption>
            <thead>
              <tr className="border-b border-ink-3">
                <th scope="col" className="label px-3 py-2 text-muted">
                  Metric
                </th>
                <th scope="col" className="label px-3 py-2 text-muted">
                  Formula
                </th>
                <th scope="col" className="label px-3 py-2 text-muted">
                  Meaning
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Completion Time', 'CT', 'Instant the process finishes its last burst'],
                ['Turnaround Time', 'TAT = CT − AT', 'Total time spent in the system'],
                ['Waiting Time', 'WT = TAT − BT', 'Time spent in the ready queue'],
                ['Response Time', 'RT = first start − AT', 'Delay before the process first runs'],
                ['Average WT', 'Σ WT ÷ n', 'Mean waiting time across all processes'],
                ['Average TAT', 'Σ TAT ÷ n', 'Mean turnaround time'],
                ['Average RT', 'Σ RT ÷ n', 'Mean response time'],
                ['CPU Busy', 'Σ execution time', 'Equals the sum of all burst times'],
                ['CPU Idle', 'total − busy', 'Time the CPU had nothing to run'],
                ['CPU Utilization', '(busy ÷ total) × 100', 'Percentage of elapsed time doing work'],
              ].map(([metric, formula, meaning]) => (
                <tr key={metric} className="border-b border-ink-3/60 last:border-b-0">
                  <th scope="row" className="px-3 py-1.5 text-left">
                    <span className="text-xs font-semibold text-bone">{metric}</span>
                  </th>
                  <td className="tabular px-3 py-1.5 text-xs text-crt">{formula}</td>
                  <td className="px-3 py-1.5 text-[11px] text-muted">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Next steps */}
      <div className="grid gap-4 sm:grid-cols-3">
        <NextCard
          icon={<Cpu aria-hidden="true" className="h-4 w-4" />}
          title="Run a simulation"
          body="Enter processes, pick an algorithm, and step through the schedule tick by tick."
          onClick={() => onNavigate('visualizer')}
        />
        <NextCard
          icon={<FlaskConical aria-hidden="true" className="h-4 w-4" />}
          title="Compare policies"
          body="Run one dataset through several algorithms and see which metric each one wins."
          onClick={() => onNavigate('compare')}
        />
        <NextCard
          icon={<Ruler aria-hidden="true" className="h-4 w-4" />}
          title="Read the reference"
          body="All eight algorithms with rules, trade-offs and source code in three languages."
          onClick={() => onNavigate('algorithms')}
        />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="label text-muted-2">{label}</dt>
      <dd className="tabular mt-0.5 text-2xl leading-none font-bold">{value}</dd>
    </div>
  );
}

function NextCard({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="registered group border border-rule bg-bone-2/50 p-3.5 text-left transition-colors hover:border-ink hover:bg-bone-3/60"
    >
      <span className="text-muted-2">{icon}</span>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-text/65">{body}</p>
      <span className="label mt-2.5 flex items-center gap-1 text-muted-2 transition-colors group-hover:text-ink">
        Open
        <ArrowRight aria-hidden="true" className="h-2.5 w-2.5" />
      </span>
    </button>
  );
}
