/**
 * Simulation player.
 *
 * The engine has already produced the complete result; this hook only *replays*
 * it against a clock. Because playback reads from the finished timeline, the
 * animation can never disagree with the reported metrics, and seeking is O(1).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SchedulingResult } from '../types/scheduling';
import { buildFrames } from '../engine/timeline';
import type { SimulationFrame } from '../engine/timeline';
import type { Speed } from './SimulationControls';

const BASE_TICK_MS = 620;

export interface SimulationApi {
  frames: SimulationFrame[];
  frame: SimulationFrame | null;
  index: number;
  currentTime: number;
  isRunning: boolean;
  finished: boolean;
  canPlay: boolean;
  speed: Speed;
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  skipToEnd: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: Speed) => void;
}

export function useSimulation(result: SchedulingResult | null): SimulationApi {
  const frames = useMemo(() => (result ? buildFrames(result) : []), [result]);
  const [index, setIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const timer = useRef<number | null>(null);

  const lastIndex = Math.max(0, frames.length - 1);
  const canPlay = frames.length > 1;
  const finished = index >= lastIndex && frames.length > 0;

  // A new result invalidates playback position entirely.
  useEffect(() => {
    setIndex(0);
    setIsRunning(false);
  }, [frames]);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    clear();
    if (!isRunning || !canPlay) return;
    timer.current = window.setInterval(() => {
      setIndex((prev) => {
        if (prev >= lastIndex) {
          setIsRunning(false);
          return lastIndex;
        }
        return prev + 1;
      });
    }, BASE_TICK_MS / speed);
    return clear;
  }, [isRunning, speed, canPlay, lastIndex, clear]);

  useEffect(() => clear, [clear]);

  const play = useCallback(() => {
    if (!canPlay) return;
    // Playing from the end restarts, which is what "Replay" should do.
    setIndex((prev) => (prev >= lastIndex ? 0 : prev));
    setIsRunning(true);
  }, [canPlay, lastIndex]);

  const pause = useCallback(() => setIsRunning(false), []);

  const step = useCallback(() => {
    setIsRunning(false);
    setIndex((prev) => Math.min(prev + 1, lastIndex));
  }, [lastIndex]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIndex(0);
  }, []);

  const skipToEnd = useCallback(() => {
    setIsRunning(false);
    setIndex(lastIndex);
  }, [lastIndex]);

  const seek = useCallback(
    (time: number) => {
      setIsRunning(false);
      const target = frames.findIndex((f) => f.time === time);
      setIndex(target >= 0 ? target : Math.min(Math.max(0, time), lastIndex));
    },
    [frames, lastIndex],
  );

  const frame = frames[index] ?? null;

  return {
    frames,
    frame,
    index,
    currentTime: frame?.time ?? result?.startTime ?? 0,
    isRunning,
    finished,
    canPlay,
    speed,
    play,
    pause,
    step,
    reset,
    skipToEnd,
    seek,
    setSpeed,
  };
}

/** Keyboard transport: Space = play/pause, ArrowRight = step, R = reset. */
export function useSimulationShortcuts(sim: SimulationApi, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      // Never hijack typing in the process table.
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (sim.isRunning) sim.pause();
        else sim.play();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        sim.step();
      } else if (e.key === 'r' || e.key === 'R') {
        sim.reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sim, enabled]);
}
