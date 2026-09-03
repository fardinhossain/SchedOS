/**
 * SchedOS application shell.
 *
 * Holds the state that must survive navigation — the process set, the selected
 * algorithm and the time quantum — so "Try this algorithm" from the catalogue
 * lands in the Visualizer with the user's own data intact. Plain React state is
 * sufficient here; no global store is warranted (spec §30).
 */
import { useCallback, useMemo, useState } from 'react';
import { MobileNav, Sidebar } from './components/Sidebar';
import type { PageId } from './components/Sidebar';
import { Home } from './pages/Home';
import { Visualizer } from './pages/Visualizer';
import { Compare } from './pages/Compare';
import { Algorithms } from './pages/Algorithms';
import { Learn } from './pages/Learn';
import { About } from './pages/About';
import type { AlgorithmId, ProcessInput } from './types/scheduling';
import { DEFAULT_PROCESSES, getExample } from './data/examples';
import { buildColorMap } from './components/processColors';

export interface LabState {
  processes: ProcessInput[];
  algorithm: AlgorithmId;
  timeQuantum: number;
  setProcesses: (processes: ProcessInput[]) => void;
  setAlgorithm: (id: AlgorithmId) => void;
  setTimeQuantum: (value: number) => void;
  loadExample: (exampleId: string) => void;
  /** Stable pid -> colour map for the current process set. */
  colors: Record<string, string>;
}

export default function App() {
  const [page, setPage] = useState<PageId>('home');
  const [processes, setProcesses] = useState<ProcessInput[]>(DEFAULT_PROCESSES);
  const [algorithm, setAlgorithm] = useState<AlgorithmId>('srtf');
  const [timeQuantum, setTimeQuantum] = useState(2);

  const loadExample = useCallback((exampleId: string) => {
    const example = getExample(exampleId);
    if (!example) return;
    setProcesses(example.processes);
    if (example.timeQuantum) setTimeQuantum(example.timeQuantum);
  }, []);

  // Colour identity is positional, so it stays stable while the user edits.
  const colors = useMemo(() => buildColorMap(processes.map((p) => p.id)), [processes]);

  const lab: LabState = {
    processes,
    algorithm,
    timeQuantum,
    setProcesses,
    setAlgorithm,
    setTimeQuantum,
    loadExample,
    colors,
  };

  const navigate = useCallback((next: PageId) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  /** Jump into the Visualizer with a chosen algorithm preselected. */
  const tryAlgorithm = useCallback(
    (id: AlgorithmId) => {
      setAlgorithm(id);
      navigate('visualizer');
    },
    [navigate],
  );

  return (
    <div className="flex min-h-full">
      <Sidebar page={page} onNavigate={navigate} />

      <div className="blueprint flex min-w-0 flex-1 flex-col">
        <MobileNav page={page} onNavigate={navigate} />

        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6">
          {page === 'home' && <Home onNavigate={navigate} />}
          {page === 'visualizer' && <Visualizer lab={lab} />}
          {page === 'compare' && <Compare lab={lab} />}
          {page === 'algorithms' && <Algorithms onTry={tryAlgorithm} selected={algorithm} />}
          {page === 'learn' && <Learn lab={lab} />}
          {page === 'about' && <About onNavigate={navigate} />}
        </main>

        <footer className="border-t border-rule px-4 py-3">
          <p className="tabular text-[10px] leading-relaxed text-muted-2">
            SCHEDOS · PROCESS LAB v1.0 — an educational CPU scheduling laboratory. All timelines
            and metrics are computed live in your browser from the process set you enter.
          </p>
        </footer>
      </div>
    </div>
  );
}
