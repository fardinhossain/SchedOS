/**
 * Visualizer — the primary workspace (spec §35).
 *
 * Layout follows the required visual hierarchy (§34): the Gantt chart dominates,
 * then CPU/ready-queue state, then input, then metrics, then the code viewer.
 *
 * The simulation is computed only when the user presses Run, so editing the
 * table never silently invalidates what is on screen — a "stale" banner appears
 * instead, which is far less confusing during a demonstration.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { LabState } from '../App';
import type { AlgorithmOptions, SchedulingResult } from '../types/scheduling';
import { IDLE_ID } from '../types/scheduling';
import { ALGORITHM_MAP, SCHEDULERS } from '../algorithms';
import { validate } from '../engine/validation';
import { PageHeader } from '../components/Sidebar';
import type { PageId } from '../components/Sidebar';
import { Panel } from '../components/Panel';
import { AlgorithmSelector } from '../components/AlgorithmSelector';
import { ProcessTable } from '../components/ProcessTable';
import { GanttChart, GanttLegend } from '../components/GanttChart';
import { CPUVisualizer } from '../components/CPUVisualizer';
import { ReadyQueue } from '../components/ReadyQueue';
import { SystemLog } from '../components/SystemLog';
import { SimulationControls } from '../components/SimulationControls';
import { MetricsTable } from '../components/MetricsTable';
import { PerformanceCards, UtilizationGauge } from '../components/PerformanceCards';
import { EmptyState } from '../components/EmptyState';
import { useSimulation, useSimulationShortcuts } from '../components/useSimulation';

interface VisualizerProps {
  lab: LabState;
  onNavigate?: (page: PageId) => void;
}

export function Visualizer({ lab }: VisualizerProps) {
  const { processes, algorithm, timeQuantum, priorityOrder, colors } = lab;
  const meta = ALGORITHM_MAP[algorithm];

  const [result, setResult] = useState<SchedulingResult | null>(null);
  const [ranWith, setRanWith] = useState<string>('');
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const simulationRef = useRef<HTMLDivElement>(null);

  const issues = useMemo(
    () => validate({ processes, algorithm: meta, timeQuantum }),
    [processes, meta, timeQuantum],
  );
  const valid = issues.length === 0;

  /** Signature of the inputs a result was produced from, to detect staleness. */
  const signature = useMemo(
    () =>
      JSON.stringify({
        processes,
        algorithm,
        q: meta.usesTimeQuantum ? timeQuantum : null,
        pOrder: meta.usesPriority ? priorityOrder : null,
      }),
    [processes, algorithm, timeQuantum, priorityOrder, meta.usesTimeQuantum, meta.usesPriority],
  );

  const stale = result !== null && ranWith !== signature;

  const run = (): void => {
    if (!valid) return;
    const options: AlgorithmOptions = { timeQuantum, priorityOrder };
    try {
      setResult(SCHEDULERS[algorithm](processes, options));
      setRanWith(signature);
      setSelectedProcess(null);
      setTimeout(() => {
        simulationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        simulationRef.current?.focus({ preventScroll: true });
      }, 50);
    } catch (error) {
      // The engine is defensive, but never let a scheduling bug white-screen
      // the whole application during a demonstration (spec §29).
      // eslint-disable-next-line no-console
      console.error('Scheduling failed', error);
      setResult(null);
    }
  };

  const sim = useSimulation(result);
  useSimulationShortcuts(sim, result !== null);

  // Changing algorithm mid-view clears the old result rather than showing a
  // chart that no longer matches the selector.
  useEffect(() => {
    setResult(null);
    setRanWith('');
  }, [algorithm]);

  const processIds = processes.map((p) => p.id);
  const hasIdle = result?.gantt.some((b) => b.processId === IDLE_ID) ?? false;

  return (
    <div className="space-y-4">
      <PageHeader
        code="01"
        title="Visualizer"
        subtitle={`${meta.name} — ${meta.rule}`}
      />

      {/* ── Stale-result banner ──────────────────────────────── */}
      {stale && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 border-l-2 border-machine bg-machine/15 px-3 py-2"
        >
          <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-machine" />
          <p className="tabular min-w-0 flex-1 text-[11px]">
            Inputs changed since this run — the chart below reflects the previous process set.
          </p>
          <button
            type="button"
            onClick={run}
            disabled={!valid}
            className="flex items-center gap-1.5 border border-ink px-2 py-1 text-[11px] font-bold transition-colors hover:bg-ink hover:text-bone disabled:opacity-40"
          >
            <RefreshCw aria-hidden="true" className="h-3 w-3" />
            Re-run
          </button>
        </div>
      )}

      {/* ── Input + performance ──────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,15rem)]">
        <Panel
          title="Algorithm"
          code="SEL-01"
          note={
            meta.usesPriority
              ? `${meta.tieBreak} Mode: ${priorityOrder === 'higher-is-higher' ? 'Bigger value = Higher priority' : 'Smaller value = Higher priority'}.`
              : meta.tieBreak
          }
        >
          <AlgorithmSelector selected={algorithm} onSelect={lab.setAlgorithm} />
        </Panel>

        <Panel title="Process Input" code="INP-01">
          <ProcessTable
            processes={processes}
            algorithm={meta}
            timeQuantum={timeQuantum}
            priorityOrder={priorityOrder}
            selectedDataset={lab.selectedDataset}
            issues={issues}
            colors={colors}
            onChange={lab.setProcesses}
            onTimeQuantum={lab.setTimeQuantum}
            onPriorityOrder={lab.setPriorityOrder}
            onLoadExample={lab.loadExample}
            onRun={run}
            disabled={!valid}
          />
        </Panel>

        <Panel title="Performance" code="PRF-01">
          {result ? (
            <div className="space-y-3">
              <PerformanceCards result={result} />
              <UtilizationGauge result={result} />
            </div>
          ) : (
            <p className="tabular py-4 text-center text-xs text-muted-2">
              Metrics appear after a run.
            </p>
          )}
        </Panel>
      </div>

      {/* ── PRIMARY: Gantt chart & Simulation Display ───────── */}
      <div ref={simulationRef} tabIndex={-1} className="outline-none space-y-4">
        <Panel
          title="Gantt Chart — CPU Execution Timeline"
          code="VIS-01"
          note={
            result
              ? 'Hover or focus a block for its exact span. Click a block to highlight that process everywhere.'
              : undefined
          }
          actions={
            result ? (
              <span className="tabular text-[10px] text-muted-2">
                {result.gantt.length} blocks · t=0 → {result.endTime}
              </span>
            ) : undefined
          }
        >
          {result ? (
            <div className="space-y-3">
              <GanttChart
                result={result}
                colors={colors}
                revealUpTo={sim.finished ? null : sim.currentTime}
                selectedProcess={selectedProcess}
                onSelectProcess={setSelectedProcess}
              />
              <GanttLegend
                ids={processIds}
                colors={colors}
                selected={selectedProcess}
                onSelect={setSelectedProcess}
                hasIdle={hasIdle}
              />
            </div>
          ) : (
            <EmptyState
              title="No simulation loaded"
              body={
                valid
                  ? 'Your process set is valid. Press Run Simulation to generate the timeline.'
                  : 'Fix the highlighted input errors below, then run the simulation.'
              }
              action={
                valid ? { label: 'Run Simulation', onClick: run } : undefined
              }
            />
          )}
        </Panel>

        {/* ── CPU state + transport + log ──────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="space-y-4">
            <CPUVisualizer
              frame={sim.frame}
              colors={colors}
              totalTime={result?.totalTime ?? 0}
              startTime={result?.startTime ?? 0}
              finished={sim.finished && result !== null}
            />
            <Panel title="Transport" code="CTL-01">
              <SimulationControls
                isRunning={sim.isRunning}
                canPlay={sim.canPlay}
                finished={sim.finished}
                speed={sim.speed}
                currentTime={sim.currentTime}
                startTime={result?.startTime ?? 0}
                endTime={result?.endTime ?? 0}
                onPlay={sim.play}
                onPause={sim.pause}
                onStep={sim.step}
                onReset={sim.reset}
                onSkipToEnd={sim.skipToEnd}
                onSpeed={sim.setSpeed}
                onSeek={sim.seek}
              />
            </Panel>
          </div>

          <Panel
            title="Process States & Classroom Scratchpad"
            code="VIS-02"
            note="Live scratchpad table with burst cuts, followed by ready and completed queues."
          >
            {result ? (
              <ReadyQueue
                frame={sim.frame}
                processes={result.processes}
                gantt={result.gantt}
                colors={colors}
                showPriority={meta.usesPriority}
                selectedProcess={selectedProcess}
                onSelectProcess={setSelectedProcess}
              />
            ) : (
              <p className="tabular py-4 text-center text-xs text-muted-2">
                Run a simulation to populate the table and queues.
              </p>
            )}
          </Panel>

          <Panel title="System Log" code="LOG-01">
            <SystemLog
              log={result?.log ?? []}
              upTo={sim.finished ? null : sim.currentTime}
              maxHeight={320}
            />
          </Panel>
        </div>
      </div>

      {/* ── Per-process metrics ──────────────────────────────── */}
      <Panel
        title="Process Metrics"
        code="MET-01"
        note="Click any column header to sort. Click a row to highlight that process on the Gantt chart."
      >
        {result ? (
          <MetricsTable
            processes={result.processes}
            colors={colors}
            showPriority={meta.usesPriority}
            selectedProcess={selectedProcess}
            onSelectProcess={setSelectedProcess}
          />
        ) : (
          <p className="tabular py-4 text-center text-xs text-muted-2">
            Per-process completion, turnaround, waiting and response times appear after a run.
          </p>
        )}
      </Panel>
    </div>
  );
}
