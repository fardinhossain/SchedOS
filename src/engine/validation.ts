/**
 * SchedOS — input validation.
 * Runs before any scheduler is invoked so the engine only ever sees sane data.
 * Returns every issue at once (not just the first) so the table can annotate
 * all offending cells simultaneously.
 */
import type { AlgorithmMeta, ProcessInput, ValidationIssue } from '../types/scheduling';
import { IDLE_ID } from '../types/scheduling';

export interface ValidationInput {
  processes: ProcessInput[];
  algorithm: AlgorithmMeta;
  timeQuantum: number;
}

export function validate({
  processes,
  algorithm,
  timeQuantum,
}: ValidationInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!processes.length) {
    issues.push({
      row: null,
      field: 'form',
      message: 'Process table is empty — add at least one process before running.',
    });
    return issues;
  }

  const seen = new Map<string, number>();

  processes.forEach((p, row) => {
    const id = p.id.trim();

    if (!id) {
      issues.push({ row, field: 'id', message: 'PID cannot be blank.' });
    } else if (id.toUpperCase() === IDLE_ID) {
      issues.push({
        row,
        field: 'id',
        message: '"IDLE" is reserved for CPU idle periods — choose another PID.',
      });
    } else if (seen.has(id.toUpperCase())) {
      issues.push({
        row,
        field: 'id',
        message: `Duplicate PID "${id}" — already used on row ${(seen.get(id.toUpperCase()) ?? 0) + 1}.`,
      });
    } else {
      seen.set(id.toUpperCase(), row);
    }

    if (!Number.isFinite(p.arrivalTime)) {
      issues.push({ row, field: 'arrivalTime', message: 'Arrival time must be a number.' });
    } else if (p.arrivalTime < 0) {
      issues.push({ row, field: 'arrivalTime', message: 'Arrival time must be ≥ 0.' });
    } else if (!Number.isInteger(p.arrivalTime)) {
      issues.push({ row, field: 'arrivalTime', message: 'Arrival time must be a whole number.' });
    }

    if (!Number.isFinite(p.burstTime)) {
      issues.push({ row, field: 'burstTime', message: 'Burst time must be a number.' });
    } else if (p.burstTime <= 0) {
      issues.push({ row, field: 'burstTime', message: 'Burst time must be > 0.' });
    } else if (!Number.isInteger(p.burstTime)) {
      issues.push({ row, field: 'burstTime', message: 'Burst time must be a whole number.' });
    }

    if (algorithm.usesPriority) {
      if (p.priority === undefined || !Number.isFinite(p.priority)) {
        issues.push({
          row,
          field: 'priority',
          message: `${algorithm.shortName} requires a priority value.`,
        });
      } else if (p.priority < 0) {
        issues.push({ row, field: 'priority', message: 'Priority must be ≥ 0.' });
      } else if (!Number.isInteger(p.priority)) {
        issues.push({ row, field: 'priority', message: 'Priority must be a whole number.' });
      }
    }
  });

  if (algorithm.usesTimeQuantum) {
    if (!Number.isFinite(timeQuantum) || timeQuantum <= 0) {
      issues.push({ row: null, field: 'timeQuantum', message: 'Time quantum must be > 0.' });
    } else if (!Number.isInteger(timeQuantum)) {
      issues.push({ row: null, field: 'timeQuantum', message: 'Time quantum must be a whole number.' });
    }
  }

  return issues;
}

/** Convenience: issues affecting one specific cell. */
export function issuesFor(
  issues: ValidationIssue[],
  row: number,
  field: ValidationIssue['field'],
): ValidationIssue[] {
  return issues.filter((i) => i.row === row && i.field === field);
}
