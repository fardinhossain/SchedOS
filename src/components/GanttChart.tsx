/**
 * Gantt chart — the primary visual feature (spec §8, §34).
 *
 * A true proportional timeline, not a table: blocks are laid out on a shared
 * px-per-unit scale, idle spans are hatched rather than treated as processes,
 * and blocks are focusable so the chart is usable without a mouse.
 *
 * During simulation the chart reveals progressively up to the clock, with the
 * in-progress block clipped mid-span — so the bar visibly grows as the CPU runs.
 */
import { useMemo, useRef, useState } from 'react';
import type { GanttBlock, SchedulingResult } from '../types/scheduling';
import { IDLE_ID } from '../types/scheduling';
import { textOn } from './processColors';

interface GanttChartProps {
  result: SchedulingResult;
  colors: Record<string, string>;
  /** Reveal boundary for animated playback; null means show everything. */
  revealUpTo?: number | null;
  selectedProcess?: string | null;
  onSelectProcess?: (id: string | null) => void;
  /** Compact mode is used on the Compare page where several charts stack. */
  compact?: boolean;
  height?: number;
}

interface Tooltip {
  block: GanttBlock;
  x: number;
  y: number;
}

/** Picks a tick interval that yields readable, round axis labels. */
function tickStep(span: number, pxPerUnit: number): number {
  const minPx = 46;
  const candidates = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000];
  return candidates.find((c) => c * pxPerUnit >= minPx) ?? Math.ceil(span / 10);
}

export function GanttChart({
  result,
  colors,
  revealUpTo = null,
  selectedProcess = null,
  onSelectProcess,
  compact = false,
  height,
}: GanttChartProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { gantt, startTime, endTime } = result;
  const span = Math.max(1, endTime - startTime);
  const barHeight = height ?? (compact ? 44 : 76);

  // Scale: wide enough to read, but capped so long timelines stay navigable
  // by horizontal scroll rather than shrinking into illegibility (spec §26).
  const pxPerUnit = useMemo(() => {
    const ideal = compact ? 26 : 42;
    const maxTotal = compact ? 2400 : 4200;
    return Math.max(compact ? 7 : 11, Math.min(ideal, maxTotal / span));
  }, [span, compact]);

  // Blocks are positioned as a PERCENTAGE of the span rather than in absolute
  // pixels. The track therefore fills its container exactly at any width — no
  // dead strip after the final block — while long timelines still scroll.
  const totalWidth = span * pxPerUnit;
  const pct = (units: number): string => `${(units / span) * 100}%`;
  const step = tickStep(span, pxPerUnit);

  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let t = startTime; t <= endTime; t += step) out.push(t);
    if (out[out.length - 1] !== endTime) out.push(endTime);
    return out;
  }, [startTime, endTime, step]);

  if (!gantt.length) return null;

  const visibleEnd = revealUpTo === null ? endTime : Math.min(revealUpTo, endTime);

  return (
    <div className="relative min-w-0">
      <div ref={scrollRef} className="thin-scroll overflow-x-auto overflow-y-hidden pb-1">
        <div style={{ width: totalWidth, minWidth: '100%' }}>
          {/* Start-time markers along the top edge */}
          <div className="relative h-4" aria-hidden="true">
            {gantt.map((block) => (
              <span
                key={`m-${block.processId}-${block.startTime}`}
                className="absolute bottom-0 w-px bg-muted"
                style={{ left: pct(block.startTime - startTime), height: 6 }}
              />
            ))}
          </div>

          {/* Execution track */}
          <div
            className="relative border border-ink bg-bone-3/50"
            style={{ height: barHeight }}
            role="list"
            aria-label="CPU execution timeline"
          >
            {gantt.map((block) => {
              const isIdle = block.processId === IDLE_ID;
              const left = pct(block.startTime - startTime);
              // Rendered pixel width, used only to decide what labels fit.
              const fullWidth = (block.endTime - block.startTime) * pxPerUnit;

              // Clip the running block so playback shows it growing.
              const shownEnd = Math.min(block.endTime, visibleEnd);
              if (shownEnd <= block.startTime) return null;
              const width = pct(shownEnd - block.startTime);

              const color = isIdle ? undefined : (colors[block.processId] ?? '#A7A49B');
              const dimmed =
                selectedProcess !== null && !isIdle && block.processId !== selectedProcess;
              const highlighted = !isIdle && block.processId === selectedProcess;
              const duration = block.endTime - block.startTime;

              const show = (e: React.MouseEvent | React.FocusEvent): void => {
                const host = scrollRef.current?.getBoundingClientRect();
                const target = (e.currentTarget as HTMLElement).getBoundingClientRect();
                if (!host) return;
                setTooltip({
                  block,
                  x: target.left - host.left + target.width / 2,
                  y: target.top - host.top,
                });
              };

              return (
                <button
                  type="button"
                  role="listitem"
                  key={`${block.processId}-${block.startTime}`}
                  onMouseEnter={show}
                  onFocus={show}
                  onMouseLeave={() => setTooltip(null)}
                  onBlur={() => setTooltip(null)}
                  onClick={() =>
                    !isIdle &&
                    onSelectProcess?.(block.processId === selectedProcess ? null : block.processId)
                  }
                  disabled={isIdle}
                  aria-label={
                    isIdle
                      ? `CPU idle from ${block.startTime} to ${block.endTime}, ${duration} units`
                      : `Process ${block.processId}, from ${block.startTime} to ${block.endTime}, duration ${duration} units`
                  }
                  className={[
                    'anim-grow absolute top-0 flex h-full items-center justify-center overflow-hidden border-r border-ink/80 transition-opacity',
                    isIdle ? 'hatch-idle cursor-default' : 'cursor-pointer',
                    dimmed ? 'opacity-25' : 'opacity-100',
                    highlighted ? 'z-10 ring-2 ring-inset ring-ink' : '',
                  ].join(' ')}
                  style={{ left, width, backgroundColor: color }}
                >
                  {isIdle ? (
                    fullWidth > 40 && (
                      <span className="label rotate-0 text-ink/55">
                        {fullWidth > 74 ? 'IDLE' : '···'}
                      </span>
                    )
                  ) : (
                    <span
                      className="tabular flex flex-col items-center leading-none"
                      style={{ color: textOn(color as string) }}
                    >
                      <span
                        className={compact ? 'text-[10px] font-bold' : 'text-[13px] font-bold'}
                      >
                        {fullWidth > 22 ? block.processId : ''}
                      </span>
                      {!compact && fullWidth > 52 && (
                        <span className="mt-0.5 text-[9px] opacity-75">{duration}u</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Live playhead */}
            {revealUpTo !== null && visibleEnd < endTime && (
              <div
                className="pointer-events-none absolute top-0 z-20 h-full w-0.5 bg-signal"
                style={{ left: pct(visibleEnd - startTime) }}
              >
                <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-signal" />
              </div>
            )}
          </div>

          {/* Time axis */}
          <div className="relative mt-0 h-7 border-t border-transparent" aria-hidden="true">
            {ticks.map((t) => {
              const left = pct(t - startTime);
              const isLast = t === endTime;
              return (
                <div
                  key={t}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left, transform: 'translateX(-50%)' }}
                >
                  <span className="h-1.5 w-px bg-ink/60" />
                  <span
                    className={[
                      'tabular mt-0.5 text-[10px]',
                      isLast ? 'font-bold text-signal' : 'text-muted-2',
                    ].join(' ')}
                  >
                    {t}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hover / focus tooltip */}
      {tooltip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full border border-crt bg-ink px-2.5 py-1.5 shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 6 }}
        >
          <p className="tabular text-[11px] leading-snug text-bone">
            <span className="text-crt">
              {tooltip.block.processId === IDLE_ID ? 'CPU IDLE' : `Process: ${tooltip.block.processId}`}
            </span>
            <br />
            Start: {tooltip.block.startTime}
            <br />
            End: {tooltip.block.endTime}
            <br />
            Duration: {tooltip.block.endTime - tooltip.block.startTime}
          </p>
        </div>
      )}
    </div>
  );
}

/** Colour key. Doubles as a filter: clicking a swatch isolates that process. */
export function GanttLegend({
  ids,
  colors,
  selected,
  onSelect,
  hasIdle,
}: {
  ids: string[];
  colors: Record<string, string>;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  hasIdle?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect?.(selected === id ? null : id)}
          aria-pressed={selected === id}
          className={[
            'flex items-center gap-1.5 border px-1.5 py-0.5 transition-colors',
            selected === id ? 'border-ink bg-bone-3' : 'border-transparent hover:border-rule',
          ].join(' ')}
        >
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 border border-ink/30"
            style={{ backgroundColor: colors[id] }}
          />
          <span className="tabular text-[11px] font-medium">{id}</span>
        </button>
      ))}
      {hasIdle && (
        <span className="flex items-center gap-1.5 px-1.5 py-0.5">
          <span aria-hidden="true" className="hatch-idle h-2.5 w-2.5 border border-ink/30" />
          <span className="label text-muted-2">Idle</span>
        </span>
      )}
    </div>
  );
}
