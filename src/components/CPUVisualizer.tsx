/**
 * CPU status instrument (spec §10, §18).
 * Shows what the CPU is doing right now, styled as a physical readout with a
 * dark bezel. State is communicated by label + icon + border, not colour alone.
 */
import { Cpu, PauseCircle, CheckCircle2 } from 'lucide-react';
import type { SimulationFrame } from '../engine/timeline';
import { fmt } from '../engine/metrics';
import { textOn } from './processColors';

interface CPUVisualizerProps {
  frame: SimulationFrame | null;
  colors: Record<string, string>;
  totalTime: number;
  /** Absolute instant the schedule begins (the earliest arrival). */
  startTime: number;
  finished: boolean;
}

export function CPUVisualizer({
  frame,
  colors,
  totalTime,
  startTime,
  finished,
}: CPUVisualizerProps) {
  const running = frame?.runningId ?? null;
  const clock = frame?.time ?? startTime;
  const elapsed = Math.max(0, clock - startTime);
  const utilization = frame ? frame.utilizationSoFar : 0;

  const status = finished ? 'HALTED' : running ? 'RUNNING' : 'IDLE';
  const StatusIcon = finished ? CheckCircle2 : running ? Cpu : PauseCircle;

  const color = running ? (colors[running] ?? '#A7A49B') : null;

  return (
    <div className="scanlines relative border border-ink bg-ink p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="label text-muted">CPU Status</span>
        <span className="tabular flex items-center gap-1.5 text-[10px] text-muted">
          <span
            aria-hidden="true"
            className={[
              'h-1.5 w-1.5 rounded-full',
              finished ? 'bg-electric' : running ? 'bg-crt blink' : 'bg-machine',
            ].join(' ')}
          />
          {status}
        </span>
      </div>

      {/* The register itself */}
      <div
        className={[
          'relative flex h-24 items-center justify-center border-2 transition-colors',
          running ? 'anim-dispatch border-crt' : 'border-dashed border-muted-2/50',
        ].join(' ')}
        style={running ? { backgroundColor: color as string } : undefined}
      >
        {running ? (
          <div className="text-center" style={{ color: textOn(color as string) }}>
            <p className="tabular text-3xl leading-none font-bold">{running}</p>
            <p className="label mt-1.5 opacity-80">Executing</p>
          </div>
        ) : (
          <div className="text-center text-muted-2">
            <StatusIcon aria-hidden="true" className="mx-auto mb-1 h-6 w-6" strokeWidth={1.5} />
            <p className="label">{finished ? 'All processes complete' : 'No process assigned'}</p>
          </div>
        )}
        {/* Bezel notches */}
        <span aria-hidden="true" className="absolute top-1/2 -left-px h-4 w-0.5 -translate-y-1/2 bg-ink" />
        <span aria-hidden="true" className="absolute top-1/2 -right-px h-4 w-0.5 -translate-y-1/2 bg-ink" />
      </div>

      {/* Readout rows */}
      <dl className="mt-3 space-y-1.5">
        <Row label="Clock" value={String(clock).padStart(2, '0')} accent />
        <Row label="Process" value={running ?? '——'} />
        <Row label="Utilization" value={`${fmt(utilization)}%`} />
        <Row label="Elapsed" value={`${elapsed} / ${totalTime}`} />
      </dl>

      {/* Progress bar for the run */}
      <div className="mt-3 h-1 w-full overflow-hidden bg-ink-3">
        <div
          className="h-full bg-crt transition-[width] duration-200"
          style={{ width: `${totalTime > 0 ? Math.min(100, (elapsed / totalTime) * 100) : 0}%` }}
        />
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-ink-3 pb-1">
      <dt className="label text-muted-2">{label}</dt>
      <dd className={['tabular text-xs', accent ? 'text-crt' : 'text-bone/90'].join(' ')}>
        {value}
      </dd>
    </div>
  );
}
