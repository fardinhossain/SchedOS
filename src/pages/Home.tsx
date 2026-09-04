/**
 * Home / Lab Console.
 *
 * Top section: Preserved retro-future terminal entrance with live animated CPU die.
 * Bottom section: Replaces the static dataset table/panels with a modern interactive
 * showcase of floating, tilted, and layered Algorithm UI cards around central CTAs.
 */
import { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircuitBoard,
  Code2,
  GitCompareArrows,
  Info,
  ListTree,
  Play,
  Sparkles,
} from 'lucide-react';
import type { PageId } from '../components/Sidebar';
import { HERO_PROCESSES, HERO_QUANTUM } from '../data/heroShowcase';
import { Panel } from '../components/Panel';
import { HeroAnimation } from '../components/HeroAnimation';
import { buildColorMap } from '../components/processColors';
import type { AlgorithmId } from '../types/scheduling';

interface HomeProps {
  onNavigate: (page: PageId) => void;
  onSelectAlgorithm?: (id: AlgorithmId) => void;
}

/** The section doors along the bottom rail of the hero door. */
const DOORS: { page: PageId; code: string; label: string; icon: React.ReactNode }[] = [
  { page: 'visualizer', code: '01', label: 'Visualizer', icon: <CircuitBoard className="h-4 w-4" /> },
  { page: 'compare', code: '02', label: 'Compare', icon: <GitCompareArrows className="h-4 w-4" /> },
  { page: 'algorithms', code: '03', label: 'Algorithms', icon: <ListTree className="h-4 w-4" /> },
  { page: 'code', code: '04', label: 'Code Examples', icon: <Code2 className="h-4 w-4" /> },
  { page: 'learn', code: '05', label: 'Learn', icon: <BookOpen className="h-4 w-4" /> },
  { page: 'about', code: '06', label: 'About', icon: <Info className="h-4 w-4" /> },
];

export function Home({ onNavigate, onSelectAlgorithm }: HomeProps) {
  const heroColors = useMemo(() => buildColorMap(HERO_PROCESSES.map((p) => p.id)), []);

  const openVisualizerWith = (algoId: AlgorithmId) => {
    if (onSelectAlgorithm) {
      onSelectAlgorithm(algoId);
    }
    onNavigate('visualizer');
  };

  return (
    <div className="space-y-6">
      {/* ── TOP OF HERO SECTION: PREVIOUS ICONIC STYLE ────────── */}
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
            8 Algorithms · Client-Side · No Backend
          </span>
        </div>

        {/* Centre — wordmark + live CPU die schematic */}
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

        {/* Bottom rail of hero door — section doors */}
        <nav
          aria-label="Enter a section"
          className="shrink-0 border-t border-ink-3"
        >
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {DOORS.map((door) => (
              <li key={door.page} className="border-r border-b border-ink-3 last:border-r-0">
                <button
                  type="button"
                  onClick={() => onNavigate(door.page)}
                  className="group relative flex w-full items-center gap-2.5 px-3 py-3 text-left transition-colors hover:bg-ink-2"
                >
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
            Scroll for live algorithm instruments and showcase
          </p>
        </nav>
      </section>

      {/* ── BOTTOM OF HERO: FLOATING, TILTED & LAYERED ALGORITHM UI CARDS ── */}
      <section
        className="scanlines relative border border-ink bg-ink p-4 sm:p-8 lg:p-10"
        aria-label="Algorithm laboratory showcase"
      >
        {/* Background blueprint grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'radial-gradient(var(--color-crt) 1px, transparent 1px), radial-gradient(var(--color-crt) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* ── Central Heading & CTAs for the Showcase ──────────── */}
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 border border-crt/40 bg-crt/10 px-3 py-1 text-[11px] font-semibold text-crt mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-crt blink" />
            ALGORITHM INSTRUMENTS &amp; LIVE BENCHMARKS
          </div>

          <h2 className="tabular text-3xl font-bold tracking-tight text-bone sm:text-5xl">
            INTERACTIVE <span className="text-crt">ALGORITHM</span> SHOWCASE
          </h2>

          <p className="label mt-2 text-xs tracking-widest text-machine sm:text-sm">
            TILTED INSTRUMENTS · LIVE TIMELINES · DYNAMIC QUEUES
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm leading-relaxed text-bone/75">
            Preview the scheduling engine across six interactive instrument cards. Inspect preemption
            events, Round Robin quantum slicing, SJF optimal waiting times, and side-by-side comparative
            benchmarks.
          </p>

          {/* Central CTAs */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('visualizer')}
              className="group flex items-center gap-2 border border-crt bg-crt px-4 py-2 text-xs sm:text-sm font-bold text-ink transition-all hover:bg-crt-dim hover:shadow-lg hover:shadow-crt/25"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              [ OPEN FULL SIMULATOR ]
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('compare')}
              className="flex items-center gap-2 border border-ink-3 bg-ink-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-bone transition-colors hover:border-bone/40 hover:bg-ink-3"
            >
              <GitCompareArrows className="h-3.5 w-3.5 text-electric" />
              Compare 8 Policies
            </button>

            <button
              type="button"
              onClick={() => onNavigate('code')}
              className="flex items-center gap-2 border border-ink-3 bg-ink-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-bone transition-colors hover:border-bone/40 hover:bg-ink-3"
            >
              <Code2 className="h-3.5 w-3.5 text-machine" />
              Exam Code Reference
            </button>
          </div>
        </div>

        {/* ── Multiple Floating, Tilted, Layered Cards ────────── */}
        <div className="relative z-10 mt-8 sm:mt-10">
          <div className="mb-3 flex items-center justify-between border-b border-ink-3 pb-2">
            <span className="label text-muted-2 flex items-center gap-1.5 text-[10px]">
              <Sparkles className="h-3 w-3 text-crt" />
              Algorithm UI Cards &amp; Screenshots (Hover to un-tilt · Click to launch)
            </span>
            <span className="label text-[9px] text-crt hidden sm:inline">
              LIVE ENGINE SIMULATIONS
            </span>
          </div>

          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* ── CARD 1: SRTF Preemptive Execution ──────────────── */}
            <div
              onClick={() => openVisualizerWith('srtf')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openVisualizerWith('srtf')}
              aria-label="Open SRTF Visualizer"
              className="group registered relative transform transition-all duration-300 ease-out border border-ink-3 bg-ink-2 p-3.5 shadow-xl shadow-black/40 cursor-pointer -rotate-1 hover:rotate-0 hover:scale-[1.025] hover:z-30 hover:border-crt hover:shadow-2xl hover:shadow-black/60 sm:-rotate-2"
            >
              <div className="flex items-center justify-between border-b border-ink-3 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-signal blink" />
                  <span className="label text-[11px] font-bold text-bone">ALG-05 · SRTF</span>
                </div>
                <span className="border border-signal/40 bg-signal/15 px-1.5 py-0.5 text-[9px] font-bold text-signal">
                  PREEMPTIVE
                </span>
              </div>

              {/* Alert strip */}
              <div className="mt-2.5 border-l-2 border-signal bg-signal/15 px-2 py-1 text-[11px] text-signal flex items-center justify-between">
                <span className="font-mono">t=1: P1 PREEMPTED by P2</span>
                <span className="text-[10px] text-bone/70">Remaining: 7 &gt; 2</span>
              </div>

              {/* Mini Gantt Chart */}
              <div className="mt-3">
                <p className="label text-[9px] text-muted-2 mb-1">Gantt Timeline</p>
                <div className="flex h-6 w-full overflow-hidden border border-ink-3 text-[10px] font-bold text-ink">
                  <div className="flex items-center justify-center bg-signal" style={{ width: '12%' }} title="P1: 0-1">
                    P1
                  </div>
                  <div className="flex items-center justify-center bg-crt" style={{ width: '28%' }} title="P2: 1-5">
                    P2
                  </div>
                  <div className="flex items-center justify-center bg-machine" style={{ width: '18%' }} title="P3: 5-7">
                    P3
                  </div>
                  <div className="flex items-center justify-center bg-electric" style={{ width: '12%' }} title="P4: 7-8">
                    P4
                  </div>
                  <div className="flex items-center justify-center bg-signal/90" style={{ width: '30%' }} title="P1: 8-15">
                    P1
                  </div>
                </div>
                <div className="flex justify-between font-mono text-[9px] text-muted-2 mt-0.5">
                  <span>0</span>
                  <span>1</span>
                  <span>5</span>
                  <span>7</span>
                  <span>8</span>
                  <span>15</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-ink-3 pt-2 font-mono text-[10px]">
                <div className="bg-black/30 p-1.5 text-center">
                  <span className="text-muted-2 block text-[9px]">Avg WT</span>
                  <span className="text-crt font-bold">2.75</span>
                </div>
                <div className="bg-black/30 p-1.5 text-center">
                  <span className="text-muted-2 block text-[9px]">Avg TAT</span>
                  <span className="text-bone font-bold">6.50</span>
                </div>
                <div className="bg-black/30 p-1.5 text-center">
                  <span className="text-muted-2 block text-[9px]">Util</span>
                  <span className="text-machine font-bold">100%</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-2 group-hover:text-crt">
                <span>Shortest Remaining Time First</span>
                <span className="flex items-center gap-1 font-semibold">
                  Launch Visualizer <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* ── CARD 2: Round Robin Cyclic Queue ───────────────── */}
            <div
              onClick={() => openVisualizerWith('rr')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openVisualizerWith('rr')}
              aria-label="Open Round Robin Visualizer"
              className="group registered relative transform transition-all duration-300 ease-out border border-ink-3 bg-bone-2 p-3.5 shadow-xl shadow-black/40 cursor-pointer rotate-1 hover:rotate-0 hover:scale-[1.025] hover:z-30 hover:border-ink hover:shadow-2xl hover:shadow-black/60 sm:rotate-2"
            >
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-machine" />
                  <span className="label text-[11px] font-bold text-ink">ALG-07 · ROUND ROBIN</span>
                </div>
                <span className="border border-machine bg-machine/20 px-1.5 py-0.5 text-[9px] font-bold text-ink">
                  QUANTUM q={HERO_QUANTUM}
                </span>
              </div>

              {/* Ready Queue track */}
              <div className="mt-2.5 rounded-none border border-rule bg-bone p-2 text-xs">
                <p className="label text-[9px] text-muted-2 mb-1">FIFO Ready Queue State</p>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="bg-ink text-bone px-1.5 py-0.5 font-bold">CPU: P2</span>
                  <span className="text-muted-2">←</span>
                  <span className="bg-bone-3 px-1.5 py-0.5 border border-rule">P3</span>
                  <span className="text-muted-2">←</span>
                  <span className="bg-bone-3 px-1.5 py-0.5 border border-rule">P4</span>
                  <span className="text-muted-2">←</span>
                  <span className="bg-bone-3 px-1.5 py-0.5 border border-rule text-signal">P1 (requeued)</span>
                </div>
              </div>

              {/* Quantum Slices */}
              <div className="mt-3">
                <p className="label text-[9px] text-muted-2 mb-1">Visible Quantum Slices (q=2)</p>
                <div className="flex h-6 w-full overflow-hidden border border-ink text-[9px] font-bold text-ink">
                  <div className="flex items-center justify-center bg-signal border-r border-ink/40" style={{ width: '20%' }}>
                    P1 [2]
                  </div>
                  <div className="flex items-center justify-center bg-crt border-r border-ink/40" style={{ width: '20%' }}>
                    P2 [2]
                  </div>
                  <div className="flex items-center justify-center bg-machine border-r border-ink/40" style={{ width: '20%' }}>
                    P3 [2]
                  </div>
                  <div className="flex items-center justify-center bg-signal border-r border-ink/40" style={{ width: '20%' }}>
                    P1 [2]
                  </div>
                  <div className="flex items-center justify-center bg-electric" style={{ width: '20%' }}>
                    P4 [2]
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-rule pt-2 font-mono text-[10px]">
                <div className="bg-bone p-1.5 text-center border border-rule/60">
                  <span className="text-muted-2 block text-[9px]">Avg RT</span>
                  <span className="text-ink font-bold">1.25</span>
                </div>
                <div className="bg-bone p-1.5 text-center border border-rule/60">
                  <span className="text-muted-2 block text-[9px]">Avg WT</span>
                  <span className="text-ink font-bold">4.25</span>
                </div>
                <div className="bg-bone p-1.5 text-center border border-rule/60">
                  <span className="text-muted-2 block text-[9px]">Fairness</span>
                  <span className="text-crt-dim font-bold">100%</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-2 group-hover:text-ink">
                <span>Fair time-sliced cyclic order</span>
                <span className="flex items-center gap-1 font-semibold">
                  Launch Visualizer <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* ── CARD 3: SJF Provably Optimal Waiting Time ──────── */}
            <div
              onClick={() => openVisualizerWith('sjf')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openVisualizerWith('sjf')}
              aria-label="Open SJF Visualizer"
              className="group registered relative transform transition-all duration-300 ease-out border border-ink-3 bg-ink-2 p-3.5 shadow-xl shadow-black/40 cursor-pointer -rotate-1 hover:rotate-0 hover:scale-[1.025] hover:z-30 hover:border-crt hover:shadow-2xl hover:shadow-black/60 sm:-rotate-2"
            >
              <div className="flex items-center justify-between border-b border-ink-3 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-crt" />
                  <span className="label text-[11px] font-bold text-bone">ALG-02 · SJF</span>
                </div>
                <span className="border border-crt/40 bg-crt/15 px-1.5 py-0.5 text-[9px] font-bold text-crt">
                  OPTIMAL BATCH
                </span>
              </div>

              {/* Sorted Burst order */}
              <div className="mt-2.5 border border-ink-3 bg-black/30 p-2 font-mono text-[11px] text-bone/90">
                <p className="label text-[9px] text-muted-2 mb-1">Execution By Shortest Burst</p>
                <div className="flex items-center justify-between">
                  <span className="text-crt font-bold">P2 (BT:2)</span>
                  <span className="text-muted-2">→</span>
                  <span className="text-electric font-bold">P4 (BT:3)</span>
                  <span className="text-muted-2">→</span>
                  <span className="text-machine font-bold">P3 (BT:4)</span>
                  <span className="text-muted-2">→</span>
                  <span className="text-signal font-bold">P1 (BT:7)</span>
                </div>
              </div>

              {/* Full timeline */}
              <div className="mt-3">
                <p className="label text-[9px] text-muted-2 mb-1">Non-Preemptive Run</p>
                <div className="flex h-6 w-full overflow-hidden border border-ink-3 text-[10px] font-bold text-ink">
                  <div className="flex items-center justify-center bg-signal" style={{ width: '43%' }}>
                    P1 (0..7)
                  </div>
                  <div className="flex items-center justify-center bg-crt" style={{ width: '13%' }}>
                    P2
                  </div>
                  <div className="flex items-center justify-center bg-electric" style={{ width: '19%' }}>
                    P4
                  </div>
                  <div className="flex items-center justify-center bg-machine" style={{ width: '25%' }}>
                    P3
                  </div>
                </div>
                <div className="flex justify-between font-mono text-[9px] text-muted-2 mt-0.5">
                  <span>t=0</span>
                  <span>t=7</span>
                  <span>t=9</span>
                  <span>t=12</span>
                  <span>t=16</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-ink-3 pt-2 font-mono text-[10px]">
                <div className="bg-black/30 p-1.5 text-center">
                  <span className="text-muted-2 block text-[9px]">Avg WT</span>
                  <span className="text-crt font-bold">3.25</span>
                </div>
                <div className="bg-black/30 p-1.5 text-center">
                  <span className="text-muted-2 block text-[9px]">Avg TAT</span>
                  <span className="text-bone font-bold">7.25</span>
                </div>
                <div className="bg-black/30 p-1.5 text-center">
                  <span className="text-muted-2 block text-[9px]">Throughput</span>
                  <span className="text-crt font-bold">MAX</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-2 group-hover:text-crt">
                <span>Minimum cumulative waiting</span>
                <span className="flex items-center gap-1 font-semibold">
                  Launch Visualizer <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* ── CARD 4: Priority Preemptive Engine ─────────────── */}
            <div
              onClick={() => openVisualizerWith('priority-p')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openVisualizerWith('priority-p')}
              aria-label="Open Priority Preemptive Visualizer"
              className="group registered relative transform transition-all duration-300 ease-out border border-ink-3 bg-bone-2 p-3.5 shadow-xl shadow-black/40 cursor-pointer rotate-1 hover:rotate-0 hover:scale-[1.025] hover:z-30 hover:border-ink hover:shadow-2xl hover:shadow-black/60 sm:rotate-2"
            >
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-signal" />
                  <span className="label text-[11px] font-bold text-ink">ALG-08 · PRIORITY PREEMPT</span>
                </div>
                <span className="border border-signal/40 bg-signal/15 px-1.5 py-0.5 text-[9px] font-bold text-signal">
                  PRIORITY 1 HIGH
                </span>
              </div>

              {/* Priority Status Table */}
              <div className="mt-2.5 rounded border border-rule bg-bone p-2 font-mono text-[11px]">
                <p className="label text-[9px] text-muted-2 mb-1">Priority Hierarchy (1 = Highest)</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-signal font-bold bg-signal/10 px-1">
                    <span>★ P4: Priority 1</span>
                    <span>SEIZED CPU AT t=4</span>
                  </div>
                  <div className="flex items-center justify-between text-text/80 px-1">
                    <span>• P1: Priority 2</span>
                    <span className="text-muted-2">Preempted &amp; Waiting</span>
                  </div>
                  <div className="flex items-center justify-between text-text/70 px-1">
                    <span>• P2: Priority 3</span>
                    <span className="text-muted-2">Ready</span>
                  </div>
                </div>
              </div>

              {/* Urgent Dispatch Gantt */}
              <div className="mt-3">
                <p className="label text-[9px] text-muted-2 mb-1">Urgent Interruption Timeline</p>
                <div className="flex h-6 w-full overflow-hidden border border-ink text-[9px] font-bold text-ink">
                  <div className="flex items-center justify-center bg-signal border-r border-ink" style={{ width: '25%' }}>
                    P1 [0-4]
                  </div>
                  <div className="flex items-center justify-center bg-electric border-r border-ink" style={{ width: '20%' }}>
                    P4 [Pri 1]
                  </div>
                  <div className="flex items-center justify-center bg-signal border-r border-ink" style={{ width: '20%' }}>
                    P1 [Fin]
                  </div>
                  <div className="flex items-center justify-center bg-crt border-r border-ink" style={{ width: '15%' }}>
                    P2
                  </div>
                  <div className="flex items-center justify-center bg-machine" style={{ width: '20%' }}>
                    P3
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-rule pt-2 font-mono text-[10px]">
                <div className="bg-bone p-1.5 text-center border border-rule/60">
                  <span className="text-muted-2 block text-[9px]">Urgent RT</span>
                  <span className="text-signal font-bold">0 ticks</span>
                </div>
                <div className="bg-bone p-1.5 text-center border border-rule/60">
                  <span className="text-muted-2 block text-[9px]">Avg WT</span>
                  <span className="text-ink font-bold">3.75</span>
                </div>
                <div className="bg-bone p-1.5 text-center border border-rule/60">
                  <span className="text-muted-2 block text-[9px]">Switches</span>
                  <span className="text-ink font-bold">4</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-2 group-hover:text-ink">
                <span>Immediate high-priority override</span>
                <span className="flex items-center gap-1 font-semibold">
                  Launch Visualizer <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* ── CARD 5: Comparative Benchmark Matrix ───────────── */}
            <div
              onClick={() => onNavigate('compare')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate('compare')}
              aria-label="Open Comparative Analysis"
              className="group registered relative transform transition-all duration-300 ease-out border border-ink-3 bg-ink-2 p-3.5 shadow-xl shadow-black/40 cursor-pointer -rotate-1 hover:rotate-0 hover:scale-[1.025] hover:z-30 hover:border-crt hover:shadow-2xl hover:shadow-black/60 sm:-rotate-2"
            >
              <div className="flex items-center justify-between border-b border-ink-3 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-electric" />
                  <span className="label text-[11px] font-bold text-bone">CMP-01 · BENCHMARK MATRIX</span>
                </div>
                <span className="border border-electric/40 bg-electric/15 px-1.5 py-0.5 text-[9px] font-bold text-electric">
                  4 ALGORITHMS
                </span>
              </div>

              {/* Comparative waiting time bars */}
              <div className="mt-2.5 space-y-2 font-mono text-[11px]">
                <div>
                  <div className="flex justify-between text-crt text-[10px] font-bold mb-0.5">
                    <span>SRTF (Shortest Remaining)</span>
                    <span>2.75 Avg WT ★ WINNER</span>
                  </div>
                  <div className="h-2 w-full bg-black/40">
                    <div className="h-full bg-crt" style={{ width: '38%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-bone/90 text-[10px] mb-0.5">
                    <span>SJF (Shortest Job First)</span>
                    <span>3.25 Avg WT</span>
                  </div>
                  <div className="h-2 w-full bg-black/40">
                    <div className="h-full bg-machine" style={{ width: '45%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-bone/90 text-[10px] mb-0.5">
                    <span>Round Robin (q=2)</span>
                    <span>4.25 Avg WT</span>
                  </div>
                  <div className="h-2 w-full bg-black/40">
                    <div className="h-full bg-electric" style={{ width: '58%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-signal text-[10px] mb-0.5">
                    <span>FCFS (Convoy Effect)</span>
                    <span>7.25 Avg WT</span>
                  </div>
                  <div className="h-2 w-full bg-black/40">
                    <div className="h-full bg-signal" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-ink-3 pt-2 text-[10px] text-muted-2 leading-relaxed">
                Identical work: <strong className="text-bone">16 units</strong>. Scheduling policy creates a{' '}
                <span className="text-crt font-bold">62% waiting time reduction</span>.
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-2 group-hover:text-crt">
                <span>Side-by-side performance evaluation</span>
                <span className="flex items-center gap-1 font-semibold">
                  Compare Page <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* ── CARD 6: CPU Hardware Registers & Telemetry ─────── */}
            <div
              onClick={() => onNavigate('visualizer')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate('visualizer')}
              aria-label="Open Visualizer Telemetry"
              className="group registered relative transform transition-all duration-300 ease-out border border-ink-3 bg-ink-2 p-3.5 shadow-xl shadow-black/40 cursor-pointer rotate-1 hover:rotate-0 hover:scale-[1.025] hover:z-30 hover:border-crt hover:shadow-2xl hover:shadow-black/60 sm:rotate-2"
            >
              <div className="flex items-center justify-between border-b border-ink-3 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-crt blink" />
                  <span className="label text-[11px] font-bold text-bone">HW-01 · CORE-0 REGISTERS</span>
                </div>
                <span className="border border-crt/40 bg-crt/15 px-1.5 py-0.5 text-[9px] font-bold text-crt">
                  3.20 GHz SIM
                </span>
              </div>

              {/* Hardware registers readout */}
              <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div className="bg-black/30 p-2 border border-ink-3">
                  <span className="text-muted-2 block text-[9px]">ACTIVE DISPATCH</span>
                  <span className="text-crt font-bold text-sm">P2 (RUNNING)</span>
                </div>
                <div className="bg-black/30 p-2 border border-ink-3">
                  <span className="text-muted-2 block text-[9px]">PROGRAM CLOCK</span>
                  <span className="text-machine font-bold text-sm">t = 04 ticks</span>
                </div>
              </div>

              {/* Utilization bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-mono text-muted-2 mb-1">
                  <span>CPU Busy Time</span>
                  <span className="text-crt font-bold">100% UTILIZATION</span>
                </div>
                <div className="h-2 w-full bg-black/40 overflow-hidden border border-ink-3">
                  <div className="h-full bg-crt" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Instruction cycle summary */}
              <div className="mt-3 border-t border-ink-3 pt-2 grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="text-muted-2">
                  Queued: <span className="text-bone font-bold">3 processes</span>
                </div>
                <div className="text-muted-2">
                  Completed: <span className="text-crt font-bold">2 processes</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-2 group-hover:text-crt">
                <span>Cycle-accurate telemetry engine</span>
                <span className="flex items-center gap-1 font-semibold">
                  Open Visualizer <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Suggested demonstration path ─────────────────────── */}
      <Panel
        title="Suggested Walkthrough"
        code="SEQ-01"
        note="A five-minute guided tour through the CPU scheduling laboratory."
      >
        <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              step: '01',
              title: 'Run a simulation',
              body: 'Open Visualizer, load Preemption example, pick SRTF and press Play.',
              page: 'visualizer' as PageId,
            },
            {
              step: '02',
              title: 'Read the metrics',
              body: 'Check CT, TAT, WT and RT derived directly from the Gantt timeline.',
              page: 'visualizer' as PageId,
            },
            {
              step: '03',
              title: 'Compare algorithms',
              body: 'Run FCFS, SJF, SRTF and Round Robin on identical work side-by-side.',
              page: 'compare' as PageId,
            },
            {
              step: '04',
              title: 'Study exam code',
              body: 'Read clean, memorable implementations taking user input in C, Python, and TS.',
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
