/**
 * Code example registry.
 *
 * 8 algorithms × 3 languages = 24 educational reference implementations.
 * These are for READING ONLY — the simulator engine always uses the TypeScript
 * modules in `src/algorithms`, and no user-supplied code is ever executed
 * (spec §22).
 */
import type { AlgorithmId, SupportedLanguage } from '../types/scheduling';
import { fcfsCode } from './fcfs';
import { sjfCode } from './sjf';
import { ljfCode } from './ljf';
import { priorityNonPreemptiveCode } from './priorityNonPreemptive';
import { srtfCode } from './srtf';
import { lrtfCode } from './lrtf';
import { roundRobinCode } from './roundRobin';
import { priorityPreemptiveCode } from './priorityPreemptive';

export const CODE_EXAMPLES: Record<AlgorithmId, Record<SupportedLanguage, string>> = {
  fcfs: fcfsCode,
  sjf: sjfCode,
  ljf: ljfCode,
  'priority-np': priorityNonPreemptiveCode,
  srtf: srtfCode,
  lrtf: lrtfCode,
  rr: roundRobinCode,
  'priority-p': priorityPreemptiveCode,
};

export interface LanguageMeta {
  id: SupportedLanguage;
  label: string;
  /** Prism grammar name. */
  grammar: string;
  extension: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { id: 'c', label: 'C', grammar: 'c', extension: 'c' },
  { id: 'python', label: 'Python', grammar: 'python', extension: 'py' },
  { id: 'typescript', label: 'TypeScript', grammar: 'typescript', extension: 'ts' },
];

export function getCode(algorithm: AlgorithmId, language: SupportedLanguage): string {
  return CODE_EXAMPLES[algorithm]?.[language] ?? '// Implementation unavailable.';
}
