/**
 * System log (spec §11) — a technical execution trace in monospace.
 * Only events up to the current clock are shown, so during playback the log
 * fills in step by step and auto-scrolls to the newest line.
 */
import { useEffect, useRef } from 'react';
import type { LogEvent, LogEventType } from '../types/scheduling';

const TYPE_STYLE: Record<LogEventType, { tag: string; className: string }> = {
  ARRIVE: { tag: 'ARRV', className: 'text-electric' },
  DISPATCH: { tag: 'DISP', className: 'text-crt' },
  PREEMPT: { tag: 'PRMT', className: 'text-signal' },
  COMPLETE: { tag: 'DONE', className: 'text-machine' },
  IDLE_START: { tag: 'IDLE', className: 'text-muted' },
  QUANTUM_EXPIRE: { tag: 'QEXP', className: 'text-signal' },
};

function stamp(time: number): string {
  const mm = Math.floor(time / 60);
  const ss = time % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

interface SystemLogProps {
  log: LogEvent[];
  /** Only show events at or before this clock value; null shows everything. */
  upTo?: number | null;
  maxHeight?: number;
}

export function SystemLog({ log, upTo = null, maxHeight = 260 }: SystemLogProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const visible = upTo === null ? log : log.filter((e) => e.time <= upTo);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [visible.length]);

  return (
    <div
      className="scanlines thin-scroll overflow-y-auto border border-ink bg-ink p-2.5"
      style={{ maxHeight }}
      role="log"
      aria-live="polite"
      aria-label="System execution log"
    >
      {!visible.length ? (
        <p className="tabular text-[11px] text-muted-2">
          <span className="text-crt">$</span> awaiting execution…
          <span className="blink ml-0.5 text-crt">▌</span>
        </p>
      ) : (
        <ol className="space-y-0.5">
          {visible.map((event, i) => {
            const style = TYPE_STYLE[event.type];
            return (
              <li
                key={`${event.time}-${event.type}-${event.processId}-${i}`}
                className="anim-log tabular flex gap-2 text-[11px] leading-relaxed"
              >
                <span className="shrink-0 text-muted-2">{stamp(event.time)}</span>
                <span className={['shrink-0 font-bold', style.className].join(' ')}>
                  {style.tag}
                </span>
                <span className="min-w-0 text-bone/80">{event.message}</span>
              </li>
            );
          })}
        </ol>
      )}
      <div ref={endRef} />
    </div>
  );
}
