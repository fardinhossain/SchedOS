/**
 * Home / Lab Console.
 *
 * Showcases the SchedOS CPU scheduling laboratory with a central command
 * heading and CTAs, surrounded by interactive, floating, tilted, and layered
 * Algorithm UI cards/screenshots representing real engine execution.
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

/** The section doors along the bottom rail. */
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
      {/* ── Top Machine Status Bar ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-ink bg-ink px-4 py-2 text-xs">
        <span className="label flex items-center gap-2 text-crt">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-crt blink" />
          PROCESS LAB v1.0 · OPERATING SYSTEM LABORATORY
        </span>
        <div className="flex items-center gap-3">
          <span className="label hidden text-muted-2 sm:inline">
            8 Algorithms · Client-Side · 0 Backend · 537 Tests Passed
          </span>
          <span className="border border-crt/40 bg-crt/10 px-2 py-0.5 text-[10px] font-bold text-crt">
            READY
          </span>
        </div>
      </div>

      {/* ── Hero Center: Heading, CTAs & Layered Algorithm Showcase ── */}
      <section
        className="scanlines relative overflow-hidden border border-ink bg-ink p-4 sm:p-8 lg:p-10"
        aria-label="SchedOS laboratory entrance"
      >
        {/* Background blueprint grid watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(var(--color-crt) 1px, transparent 1px), radial-gradient(var(--color-crt) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* ── Central Heading & Action Row ────────────────────── */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 border border-crt/30 bg-crt/10 px-3 py-1 text-[11px] font-semibold text-crt mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-crt blink" />
            EDUCATIONAL CPU SCHEDULING LAB
          </div>

          <h1 className="tabular text-5xl font-bold tracking-tight text-bone sm:text-7xl lg:text-8xl leading-none">
            SCHED<span className="text-crt">OS</span>
          </h1>

          <p className="label mt-3 text-xs tracking-widest text-machine sm:text-sm font-semibold">
            VISUALIZE. SIMULATE. UNDERSTAND.
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm leading-relaxed text-bone/70">
            An interactive simulator for operating system scheduling algorithms. Observe real-time
            dispatching, analyze Gantt timelines, inspect ready queues, and benchmark algorithm
            performance live in your browser.
          </p>

          {/* Central CTAs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('visualizer')}
              className="group flex items-center gap-2 border border-crt bg-crt px-5 py-2.5 text-xs sm:text-sm font-bold text-ink transition-all hover:bg-crt-dim hover:shadow-lg hover:shadow-crt/25"
            >
              <Play className="h-4 w-4 fill-current" />
              [ INITIALIZE SIMULATION ]
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('compare')}
              className="flex items-center gap-2 border border-ink-3 bg-ink-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-bone transition-colors hover:border-bone/50 hover:bg-ink-3"
            >
              <GitCompareArrows className="h-4 w-4 text-electric" />
              Compare Policies
            </button>

            <button
              type="button"
              onClick={() => onNavigate('code')}
              className="flex items-center gap-2 border border-ink-3 bg-ink-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-bone transition-colors hover:border-bone/50 hover:bg-ink-3"
            >
              <Code2 className="h-4 w-4 text-machine" />
              Code Examples
            </button>
          </div>

          {/* Feature Badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-2">
            <span className="border border-ink-3 bg-ink-2/60 px-2.5 py-0.5">8 Algorithms</span>
            <span className="border border-ink-3 bg-ink-2/60 px-2.5 py-0.5">100% Client-Side</span>
            <span className="border border-ink-3 bg-ink-2/60 px-2.5 py-0.5">24 Code Implementations</span>
            <span className="border border-ink-3 bg-ink-2/60 px-2.5 py-0.5 text-crt">
              Deterministic Tie-Breaking
            </span>
          </div>
        </div>

        {/* ── Multiple Floating, Tilted, Layered Algorithm UI Cards ── */}
        <div className="relative z-10 mt-10 sm:mt-12">
          <div className="mb-3 flex items-center justify-between border-b border-ink-3 pb-2">
            <span className="label text-muted-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-crt" />
              Interactive Algorithm Lab Screenshots & Instruments
            </span>
            <span className="label text-[10px] text-muted-2 hidden sm:inline">
              Hover to un-tilt · Click any card to launch simulation
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
                <p className="label text-[9px] text-muted-2 mb-1">Timeline &amp; Slices</p>
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
                  Open Lab <ArrowRight className="h-3 w-3" />
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
                  Open Lab <ArrowRight className="h-3 w-3" />
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
                  Open Lab <ArrowRight className="h-3 w-3" />
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
                  Open Lab <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* ── CARD 5: Comparative Matrix Benchmark ───────────── */}
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

            {/* ── CARD 6: Live CPU Die & Execution Registers ─────── */}
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

              {/* Mini live die view */}
              <div className="mt-2.5 overflow-hidden rounded-none border border-ink-3 bg-black/50 p-1">
                <HeroAnimation colors={heroColors} />
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

        {/* ── Section Doors Navigation Rail ───────────────────── */}
        <nav aria-label="Enter a section" className="mt-10 border-t border-ink-3 pt-6">
          <p className="label text-muted-2 mb-3 text-center">Module Fast Gates</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {DOORS.map((door) => (
              <li key={door.page}>
                <button
                  type="button"
                  onClick={() => onNavigate(door.page)}
                  className="group relative flex w-full items-center gap-2 border border-ink-3 bg-ink-2 px-3 py-2.5 text-left transition-colors hover:border-crt hover:bg-ink-3"
                >
                  <span
                    aria-hidden="true"
                    className="text-muted-2 transition-colors group-hover:text-crt"
                  >
                    {door.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="tabular block text-[9px] text-muted-2">{door.code}</span>
                    <span className="block truncate text-xs font-semibold text-bone/85 transition-colors group-hover:text-bone">
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

          <p className="label flex items-center justify-center gap-1.5 pt-4 text-muted-2 text-[10px]">
            <ChevronDown aria-hidden="true" className="h-3 w-3" />
            Scroll for Suggested Walkthrough &amp; Demonstration Guide
          </p>
        </nav>
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
