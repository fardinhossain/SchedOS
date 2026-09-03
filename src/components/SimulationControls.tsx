/**
 * Transport controls (spec §10).
 * Play / Pause / Step / Reset plus four speeds, styled as machine buttons.
 * Every control is a real <button> with an accessible label and a keyboard
 * shortcut, and disabled states are explicit rather than silently inert.
 */
import { Pause, Play, RotateCcw, SkipForward, StepForward } from 'lucide-react';

export type Speed = 0.5 | 1 | 2 | 4;
export const SPEEDS: Speed[] = [0.5, 1, 2, 4];

interface SimulationControlsProps {
  isRunning: boolean;
  canPlay: boolean;
  finished: boolean;
  speed: Speed;
  currentTime: number;
  startTime: number;
  endTime: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSkipToEnd: () => void;
  onSpeed: (speed: Speed) => void;
  onSeek: (time: number) => void;
}

export function SimulationControls({
  isRunning,
  canPlay,
  finished,
  speed,
  currentTime,
  startTime,
  endTime,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSkipToEnd,
  onSpeed,
  onSeek,
}: SimulationControlsProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {isRunning ? (
          <MachineButton onClick={onPause} label="Pause" icon={<Pause className="h-3.5 w-3.5" />} primary />
        ) : (
          <MachineButton
            onClick={onPlay}
            label={finished ? 'Replay' : 'Play'}
            icon={<Play className="h-3.5 w-3.5" />}
            disabled={!canPlay}
            primary
          />
        )}
        <MachineButton
          onClick={onStep}
          label="Step"
          icon={<StepForward className="h-3.5 w-3.5" />}
          disabled={!canPlay || finished}
        />
        <MachineButton
          onClick={onSkipToEnd}
          label="End"
          icon={<SkipForward className="h-3.5 w-3.5" />}
          disabled={!canPlay || finished}
        />
        <MachineButton
          onClick={onReset}
          label="Reset"
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          disabled={!canPlay}
        />
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-2">
        <span className="label shrink-0 text-muted-2">Speed</span>
        <div
          className="flex border border-rule"
          role="radiogroup"
          aria-label="Simulation speed"
        >
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={speed === s}
              onClick={() => onSpeed(s)}
              className={[
                'tabular border-r border-rule px-2 py-1 text-[11px] font-medium transition-colors last:border-r-0',
                speed === s
                  ? 'bg-ink text-bone'
                  : 'bg-bone-2 text-text/70 hover:bg-bone-3',
              ].join(' ')}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Scrub bar — lets a demonstrator jump to any instant */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="label text-muted-2">Timeline</span>
          <span className="tabular text-[11px] font-bold">
            t = {String(currentTime).padStart(2, '0')}
            <span className="font-normal text-muted-2"> / {endTime}</span>
          </span>
        </div>
        <input
          type="range"
          min={startTime}
          max={endTime}
          value={currentTime}
          step={1}
          disabled={!canPlay}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Scrub simulation clock"
          className="h-1.5 w-full cursor-pointer appearance-none bg-bone-3 accent-signal disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>

      <p className="tabular text-[10px] leading-relaxed text-muted-2">
        Shortcuts: <kbd className="border border-rule px-1">Space</kbd> play/pause ·{' '}
        <kbd className="border border-rule px-1">→</kbd> step ·{' '}
        <kbd className="border border-rule px-1">R</kbd> reset
      </p>
    </div>
  );
}

function MachineButton({
  onClick,
  label,
  icon,
  disabled,
  primary,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex items-center gap-1.5 border px-2.5 py-1.5 text-xs font-semibold transition-all active:translate-y-px',
        primary
          ? 'border-ink bg-crt text-ink hover:bg-crt-dim'
          : 'border-rule bg-bone-2 text-text hover:border-ink hover:bg-bone-3',
        disabled ? 'cursor-not-allowed opacity-40 hover:translate-y-0' : '',
      ].join(' ')}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}
