/**
 * Hero animation driver.
 *
 * One requestAnimationFrame loop with a fixed-tick accumulator advances the
 * clock through each algorithm's frames, holds briefly on completion, then
 * rotates to the next algorithm. A single loop (rather than a timer per
 * element) keeps the cost flat.
 *
 * It stops entirely when the tab is hidden, when the hero scrolls out of view,
 * or while the pointer is over it — §19 warns against an animation that becomes
 * annoying, and a hero that burns CPU off-screen is exactly that.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildShowcase } from '../data/heroShowcase';
import type { ShowcaseEntry } from '../data/heroShowcase';

/** Milliseconds per simulated time unit. */
const TICK_MS = 165;
/** Pause on the completed schedule before rotating on. */
const HOLD_MS = 850;
/** Blank-die transition between algorithms. */
const WIPE_MS = 260;

export type CyclePhase = 'running' | 'holding' | 'wiping';

export interface HeroCycleState {
  entries: ShowcaseEntry[];
  entry: ShowcaseEntry;
  /** Index into `entries` — which algorithm is on screen. */
  index: number;
  /** Frame index within the current algorithm. */
  frameIndex: number;
  phase: CyclePhase;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  /** Ref to attach to the animated container for visibility detection. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** True when the user asked for reduced motion — render a static diagram. */
  reducedMotion: boolean;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function useHeroCycle(): HeroCycleState {
  // Eight scheduler runs, done once for the lifetime of the component.
  const entries = useMemo(() => buildShowcase(), []);

  const [index, setIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [phase, setPhase] = useState<CyclePhase>('running');
  const [hoverPaused, setHoverPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const reducedMotion = useMemo(prefersReducedMotion, []);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mutable loop state, kept in refs so the rAF callback never restarts.
  const accRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const idxRef = useRef(0);
  const frameRef = useRef(0);
  const phaseRef = useRef<CyclePhase>('running');

  const paused = hoverPaused || !visible || !tabVisible;

  // Pause while off-screen.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Pause while the tab is in the background.
  useEffect(() => {
    const onChange = (): void => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  useEffect(() => {
    // Reduced motion: show each algorithm's finished schedule, no animation.
    if (reducedMotion) {
      setFrameIndex(entries[0].frames.length - 1);
      return;
    }
    if (paused) {
      lastRef.current = null;
      return;
    }

    let raf = 0;

    const step = (now: number): void => {
      if (lastRef.current === null) lastRef.current = now;
      const delta = now - lastRef.current;
      lastRef.current = now;
      accRef.current += delta;

      const current = entries[idxRef.current];
      const lastFrame = current.frames.length - 1;

      if (phaseRef.current === 'running') {
        while (accRef.current >= TICK_MS) {
          accRef.current -= TICK_MS;
          if (frameRef.current >= lastFrame) {
            phaseRef.current = 'holding';
            accRef.current = 0;
            setPhase('holding');
            break;
          }
          frameRef.current += 1;
          setFrameIndex(frameRef.current);
        }
      } else if (phaseRef.current === 'holding') {
        if (accRef.current >= HOLD_MS) {
          accRef.current = 0;
          phaseRef.current = 'wiping';
          setPhase('wiping');
        }
      } else if (accRef.current >= WIPE_MS) {
        // Rotate to the next algorithm and restart its clock.
        accRef.current = 0;
        idxRef.current = (idxRef.current + 1) % entries.length;
        frameRef.current = 0;
        phaseRef.current = 'running';
        setIndex(idxRef.current);
        setFrameIndex(0);
        setPhase('running');
      }

      raf = window.requestAnimationFrame(step);
    };

    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [paused, entries, reducedMotion]);

  const entry = entries[index] ?? entries[0];

  return {
    entries,
    entry,
    index,
    // Clamp defensively: a frame list can differ in length between algorithms.
    frameIndex: Math.min(frameIndex, entry.frames.length - 1),
    phase,
    paused,
    setPaused: setHoverPaused,
    containerRef,
    reducedMotion,
  };
}
