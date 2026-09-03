/**
 * Animated CPU die schematic (hero visual).
 *
 * A technical diagram of a processor with processes flowing through it, cycling
 * through all eight scheduling algorithms. Every position, label and colour is
 * driven by real engine output — see `data/heroShowcase.ts`.
 *
 * Deliberately a schematic rather than illustration: spec §18 rules out
 * decorative imagery unrelated to the OS domain, and a rendered "glowing chip"
 * would undercut the credibility the rest of the application earns.
 *
 * The whole thing is aria-hidden with a text alternative alongside, because it
 * is a decorative restatement of what the Visualizer does properly.
 */
import { Pause, Zap, Lock } from 'lucide-react';
import { IDLE_ID } from '../types/scheduling';
import { nextDispatch } from '../data/heroShowcase';
import { useHeroCycle } from './useHeroCycle';
import { textOn } from './processColors';

interface HeroAnimationProps {
  colors: Record<string, string>;
  /** Scales the die up for a full-viewport hero. */
  large?: boolean;
}

/*
 * Note on where the live readout lives: it is rendered INSIDE this component
 * rather than reported upward to the hero's left column. Surfacing per-tick
 * state to a parent would re-render the whole homepage roughly six times a
 * second for a purely decorative counter, which is a bad trade.
 */

/** Pin rows along the die edges. Purely schematic, hence a fixed count. */
const PINS = Array.from({ length: 16 }, (_, i) => i);

export function HeroAnimation({ colors, large = false }: HeroAnimationProps) {
  const cycle = useHeroCycle();
  const { entry, entries, index, frameIndex, phase, reducedMotion } = cycle;

  const frame = entry.frames[frameIndex] ?? entry.frames[0];
  const wiping = phase === 'wiping';

  const running = wiping ? null : frame?.runningId ?? null;
  const clock = frame?.time ?? 0;
  const completed = frame?.completedIds ?? [];
  const ready = frame?.readyIds ?? [];
  const preempting = (frame?.events ?? []).some((e) => e.type === 'PREEMPT');

  // Order the ready queue so the process about to be dispatched sits first.
  // This is read from the engine's event log, NOT by re-implementing the
  // selection rule — so the queue visibly reorders per algorithm while staying
  // guaranteed-consistent with the scheduler.
  const upNext = frame ? nextDispatch(entry.result, frame.time) : null;
  const readyOrdered = [...ready].sort((a, b) => {
    if (a === upNext) return -1;
    if (b === upNext) return 1;
    return 0;
  });

  const unarrived = entry.result.processes
    .filter((p) => frame && p.arrivalTime > frame.time)
    .map((p) => p.id);

  const coreColor = running ? (colors[running] ?? '#A7A49B') : null;
  const preemptive = entry.meta.category === 'preemptive';

  return (
    <div
      ref={cycle.containerRef}
      onMouseEnter={() => cycle.setPaused(true)}
      onMouseLeave={() => cycle.setPaused(false)}
      className={[
        'relative flex min-w-0 flex-col border border-ink-3 bg-black/25',
        // In large mode the panel stretches to the hero's full height and
        // distributes its three bands, so the door doesn't read as empty.
        large
          ? 'h-full justify-between gap-3 p-3 sm:gap-4 sm:p-4'
          : 'gap-2.5 p-2.5 sm:p-3',
      ].join(' ')}
    >
      {/* ── Marquee ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 border-b border-ink-3 pb-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={[
                'h-1.5 w-1.5 shrink-0 rounded-full',
                cycle.paused ? 'bg-muted-2' : 'bg-crt blink',
              ].join(' ')}
            />
            <span className="tabular truncate text-sm font-bold text-bone">{entry.label}</span>
            <span
              className={[
                'label flex shrink-0 items-center gap-1 border px-1 py-px',
                preemptive
                  ? 'border-signal/50 text-signal'
                  : 'border-muted-2/50 text-muted-2',
              ].join(' ')}
            >
              {preemptive ? (
                <Zap aria-hidden="true" className="h-2 w-2" />
              ) : (
                <Lock aria-hidden="true" className="h-2 w-2" />
              )}
              {preemptive ? 'PRE' : 'NON-PRE'}
            </span>
          </p>
          <p className="mt-1 truncate font-mono text-[10px] text-muted-2">{entry.meta.rule}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="tabular text-[11px] font-bold text-machine">
            t={String(clock).padStart(2, '0')}
            <span className="font-normal text-muted-2">/{entry.result.endTime}</span>
          </p>
          {/* Tour position: eight ticks, one per algorithm */}
          <div aria-hidden="true" className="mt-1.5 flex justify-end gap-0.5">
            {entries.map((e, i) => (
              <span
                key={e.meta.id}
                className={[
                  'h-1 w-2.5 transition-colors',
                  i === index ? 'bg-crt' : i < index ? 'bg-muted-2/60' : 'bg-ink-3',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Die + lanes ─────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className={[
          'grid grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)_minmax(0,0.7fr)] items-center gap-1.5 sm:gap-2',
          large ? 'flex-1 content-center' : '',
        ].join(' ')}
      >
        {/* Inbound lanes */}
        <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
          <Lane title="New" count={unarrived.length}>
            {unarrived.map((id) => (
              <Chip key={id} id={id} color={colors[id]} faded />
            ))}
          </Lane>
          <Lane title="Ready" count={readyOrdered.length} accent>
            {readyOrdered.map((id) => (
              <Chip
                key={id}
                id={id}
                color={colors[id]}
                marked={id === upNext}
              />
            ))}
          </Lane>
        </div>

        {/* The die */}
        <div className="relative min-w-0">
          {/* Inbound bus */}
          <Bus side="left" active={!wiping && !!running} />
          {/* Outbound bus */}
          <Bus side="right" active={!wiping && completed.length > 0} />

          <div
            className={[
              'relative border-2 bg-ink-2/70 px-2 py-1.5 transition-colors duration-200',
              preempting ? 'anim-preempt border-signal' : running ? 'border-crt/70' : 'border-muted-2/40',
            ].join(' ')}
          >
            {/* Pin row — top */}
            <PinRow />

            {/* Etched traces */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
              <span className="absolute top-1/2 left-0 h-px w-3 bg-crt/50" />
              <span className="absolute top-1/2 right-0 h-px w-3 bg-crt/50" />
              <span className="absolute top-1/3 left-2 h-px w-4 bg-muted-2/40" />
              <span className="absolute bottom-1/3 right-2 h-px w-4 bg-muted-2/40" />
            </div>

            {/* Core */}
            <div className="my-1.5 flex justify-center">
              <div
                className={[
                  'relative flex w-full items-center justify-center border transition-all duration-200',
                  large
                    ? 'h-28 max-w-[16rem] sm:h-40 lg:h-48'
                    : 'h-20 max-w-[11rem] sm:h-24',
                  running
                    ? 'anim-dispatch border-transparent'
                    : 'border-dashed border-muted-2/40',
                ].join(' ')}
                style={running ? { backgroundColor: coreColor as string } : undefined}
              >
                {running ? (
                  <div className="text-center" style={{ color: textOn(coreColor as string) }}>
                    <p
                      className={[
                        'tabular leading-none font-bold',
                        large ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl',
                      ].join(' ')}
                    >
                      {running}
                    </p>
                    <p className="label mt-1 opacity-75">Executing</p>
                  </div>
                ) : (
                  <p className="label text-muted-2">
                    {wiping ? 'Loading…' : frame?.runningId === IDLE_ID ? 'Idle' : 'Halted'}
                  </p>
                )}

                {/* Corner brackets on the core, like a socket */}
                <Bracket className="top-0 left-0 border-t border-l" />
                <Bracket className="top-0 right-0 border-t border-r" />
                <Bracket className="bottom-0 left-0 border-b border-l" />
                <Bracket className="bottom-0 right-0 border-b border-r" />
              </div>
            </div>

            <p className="label text-center text-muted-2">CPU Core</p>

            {/* Pin row — bottom */}
            <PinRow bottom />
          </div>
        </div>

        {/* Completed */}
        <Lane title="Done" count={completed.length} vertical>
          <p className="tabular text-2xl leading-none font-bold text-crt">
            {String(completed.length).padStart(2, '0')}
          </p>
          <div className="mt-1 flex flex-wrap gap-0.5">
            {completed.map((id) => (
              <span
                key={id}
                className="h-1.5 w-3.5"
                style={{ backgroundColor: colors[id] ?? '#A7A49B' }}
              />
            ))}
          </div>
        </Lane>
      </div>

      {/* ── Live Gantt strip ────────────────────────────────── */}
      <div aria-hidden="true">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="label text-muted-2">Timeline</span>
          {cycle.paused && !reducedMotion && (
            <span className="label flex items-center gap-1 text-muted-2">
              <Pause className="h-2 w-2" />
              Paused
            </span>
          )}
        </div>
        <div
          className={[
            'relative flex border border-ink-3 bg-black/30',
            large ? 'h-9' : 'h-7',
          ].join(' ')}
        >
          {entry.result.gantt.map((block) => {
            const shownEnd = wiping
              ? block.startTime
              : Math.min(block.endTime, frame?.time ?? 0);
            if (shownEnd <= block.startTime) return null;
            const span = entry.result.endTime - entry.result.startTime || 1;
            const isIdle = block.processId === IDLE_ID;
            return (
              <span
                key={`${block.processId}-${block.startTime}`}
                className={[
                  'absolute top-0 h-full border-r border-ink',
                  isIdle ? 'hatch-idle' : '',
                ].join(' ')}
                style={{
                  left: `${((block.startTime - entry.result.startTime) / span) * 100}%`,
                  width: `${((shownEnd - block.startTime) / span) * 100}%`,
                  backgroundColor: isIdle ? undefined : (colors[block.processId] ?? '#A7A49B'),
                }}
              />
            );
          })}
          {/* Playhead */}
          {!wiping && frame && frame.time < entry.result.endTime && (
            <span
              className="absolute top-0 z-10 h-full w-0.5 bg-bone"
              style={{
                left: `${((frame.time - entry.result.startTime) /
                  (entry.result.endTime - entry.result.startTime || 1)) * 100}%`,
              }}
            />
          )}
        </div>

        {/* Axis endpoints */}
        <div className="mt-0.5 flex justify-between">
          <span className="tabular text-[9px] text-muted-2">0</span>
          <span className="tabular text-[9px] text-muted-2">{entry.result.endTime}</span>
        </div>

        {/* Live metrics for this algorithm */}
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          <Metric label="AVG WT" value={entry.result.averageWaitingTime} />
          <Metric label="AVG TAT" value={entry.result.averageTurnaroundTime} />
          <Metric label="BLOCKS" value={entry.result.gantt.length} />
          <Metric label="SWITCHES" value={Math.max(0, entry.result.gantt.length - 1)} />
        </div>
      </div>

      {/* Text alternative for assistive tech */}
      <p className="sr-only">
        Animated schematic cycling through all eight CPU scheduling algorithms on a fixed set of
        four processes. Currently showing {entry.meta.name}: {entry.meta.rule} Average waiting time{' '}
        {entry.result.averageWaitingTime} units across {entry.result.gantt.length} timeline blocks.
        Open the Visualizer for the full interactive simulation with complete metrics.
      </p>
    </div>
  );
}

function PinRow({ bottom }: { bottom?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={['flex justify-between gap-px px-1', bottom ? 'pt-1' : 'pb-1'].join(' ')}
    >
      {PINS.map((i) => (
        <span
          key={i}
          className={[
            'h-1 w-1 shrink-0 bg-muted-2/45',
            // Thin the pin row out on narrow screens.
            i % 2 === 1 ? 'hidden sm:block' : '',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

function Bracket({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={['absolute h-1.5 w-1.5 border-bone/50', className].join(' ')}
    />
  );
}

/** Animated bus trace running into or out of the die. */
function Bus({ side, active }: { side: 'left' | 'right'; active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'absolute top-1/2 hidden h-px w-2 -translate-y-1/2 sm:block',
        side === 'left' ? '-left-2' : '-right-2',
        active ? 'bg-crt' : 'bg-ink-3',
      ].join(' ')}
    />
  );
}

function Lane({
  title,
  count,
  children,
  accent,
  vertical,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  accent?: boolean;
  vertical?: boolean;
}) {
  return (
    <div
      className={[
        'min-w-0 border border-l-2 border-ink-3 bg-black/20 p-1.5',
        accent ? 'border-l-crt' : 'border-l-muted-2/40',
      ].join(' ')}
    >
      <div className="mb-1 flex items-baseline justify-between gap-1">
        <span className="label text-muted-2">{title}</span>
        {!vertical && (
          <span className="tabular text-[9px] text-muted-2">
            {String(count).padStart(2, '0')}
          </span>
        )}
      </div>
      <div className={vertical ? '' : 'flex min-h-[1.25rem] flex-wrap items-center gap-1'}>
        {/* An empty lane late in a run is meaningful, not broken — mark it so
            the box doesn't read as a rendering failure. */}
        {!vertical && count === 0 ? (
          <span className="tabular text-[10px] text-muted-2/50">— empty —</span>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function Chip({
  id,
  color,
  faded,
  marked,
}: {
  id: string;
  color?: string;
  faded?: boolean;
  marked?: boolean;
}) {
  const bg = color ?? '#A7A49B';
  return (
    <span
      className={[
        'anim-enter-queue tabular flex items-center gap-0.5 border px-1 py-px text-[10px] font-bold',
        marked ? 'border-bone ring-1 ring-bone/70' : 'border-ink/30',
        faded ? 'opacity-40' : '',
      ].join(' ')}
      style={{ backgroundColor: bg, color: textOn(bg) }}
    >
      {id}
      {marked && <span className="text-[7px] opacity-80">◀</span>}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="tabular text-[9px] text-muted-2">
      {label} <span className="font-bold text-bone/80">{value}</span>
    </span>
  );
}
