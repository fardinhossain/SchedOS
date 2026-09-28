import { describe, expect, it } from 'vitest';
import { parseDatasetText } from '../engine/datasetParser';

describe('datasetParser', () => {
  it('parses key-value syntax with and without priority', () => {
    const input = `
P1  AT=0  BT=5
P2  AT=1  BT=3  PRI=1
P3  AT=2  BT=8  PRI=3
    `;
    const res = parseDatasetText(input);
    expect(res.success).toBe(true);
    expect(res.processes).toHaveLength(3);
    expect(res.processes[0]).toEqual({ id: 'P1', arrivalTime: 0, burstTime: 5 });
    expect(res.processes[0].priority).toBeUndefined();
    expect(res.processes[1]).toEqual({ id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 });
    expect(res.processes[2]).toEqual({ id: 'P3', arrivalTime: 2, burstTime: 8, priority: 3 });
  });

  it('parses tabular space-separated lines with Priority', () => {
    const input = `
PID Arrival Burst Priority
P1  0       5     2
P2  1       3     1
P3  2       8     3
    `;
    const res = parseDatasetText(input);
    expect(res.success).toBe(true);
    expect(res.processes).toHaveLength(3);
    expect(res.processes[0]).toEqual({ id: 'P1', arrivalTime: 0, burstTime: 5, priority: 2 });
    expect(res.processes[1]).toEqual({ id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 });
  });

  it('parses tabular lines WITHOUT Priority and leaves priority undefined', () => {
    const input = `
Process Arrival Burst
P1 0 8
P2 1 4
P3 2 2
P4 3 6
    `;
    const res = parseDatasetText(input);
    expect(res.success).toBe(true);
    expect(res.processes).toHaveLength(4);
    expect(res.processes[0]).toEqual({ id: 'P1', arrivalTime: 0, burstTime: 8 });
    expect(res.processes[0].priority).toBeUndefined();
    expect(res.processes[1]).toEqual({ id: 'P2', arrivalTime: 1, burstTime: 4 });
    expect(res.processes[1].priority).toBeUndefined();
    expect(res.processes[2]).toEqual({ id: 'P3', arrivalTime: 2, burstTime: 2 });
    expect(res.processes[2].priority).toBeUndefined();
    expect(res.processes[3]).toEqual({ id: 'P4', arrivalTime: 3, burstTime: 6 });
    expect(res.processes[3].priority).toBeUndefined();
  });

  it('parses comma-separated values without priority', () => {
    const input = `
P1, 0, 5
P2, 2, 4
    `;
    const res = parseDatasetText(input);
    expect(res.success).toBe(true);
    expect(res.processes).toHaveLength(2);
    expect(res.processes[0]).toEqual({ id: 'P1', arrivalTime: 0, burstTime: 5 });
    expect(res.processes[0].priority).toBeUndefined();
    expect(res.processes[1]).toEqual({ id: 'P2', arrivalTime: 2, burstTime: 4 });
    expect(res.processes[1].priority).toBeUndefined();
  });

  it('parses markdown table', () => {
    const input = `
| Process | Arrival Time | Burst Time | Priority |
|---|---|---|---|
| P1 | 0 | 7 | 1 |
| P2 | 2 | 4 | 2 |
    `;
    const res = parseDatasetText(input);
    expect(res.success).toBe(true);
    expect(res.processes).toHaveLength(2);
    expect(res.processes[0]).toEqual({ id: 'P1', arrivalTime: 0, burstTime: 7, priority: 1 });
    expect(res.processes[1]).toEqual({ id: 'P2', arrivalTime: 2, burstTime: 4, priority: 2 });
  });

  it('parses headless numbers (AT BT) without priority', () => {
    const input = `
0 5
1 3
2 8
    `;
    const res = parseDatasetText(input);
    expect(res.success).toBe(true);
    expect(res.processes).toHaveLength(3);
    expect(res.processes[0].id).toBe('P1');
    expect(res.processes[0].arrivalTime).toBe(0);
    expect(res.processes[0].burstTime).toBe(5);
    expect(res.processes[0].priority).toBeUndefined();
  });

  it('corrects common OCR misreadings such as 1" -> 11, [3 -> 6, and Pa -> P4', () => {
    const noisyOcr = `
PID Arrival Time Burst Time Priority
P1 0 9 3
P2 1 5 1
P3 2 3 4
Pa 4 7 2
P5 [3 2 5
P6 8 [3 2
P7 1" 4 1
    `;
    const res = parseDatasetText(noisyOcr);
    expect(res.success).toBe(true);
    expect(res.processes).toHaveLength(7);
    expect(res.processes[3].id).toBe('P4');
    expect(res.processes[4]).toEqual({ id: 'P5', arrivalTime: 6, burstTime: 2, priority: 5 });
    expect(res.processes[5]).toEqual({ id: 'P6', arrivalTime: 8, burstTime: 6, priority: 2 });
    expect(res.processes[6]).toEqual({ id: 'P7', arrivalTime: 11, burstTime: 4, priority: 1 });
  });

  it('accurately parses the 15-process table from media_1790593203307 with OCR artifacts and leading zeros', () => {
    const rawOcr = `
This one is more difficult.

PID                                   Arrival Time                   Burst Time                     Priority (3
P1                                    10                             37                             18
P2                                    12                             16                             07
P3                                    15                             28                             13
P4                                    17                             09                             02
P5                                    20                             41                             21
P6                                    23                             14                             05
P7                                    26                             33                             11
P8                                    29                             07                             01
P9                                    32                             24                             16
P10                                   35                             18                             08
P11                                   38                             45                             04
P12                                   42                             12                             19
P13                                   46                             31                             06
P14                                   49                             20                             10
P15                                   53                             27                             03
    `;
    const res = parseDatasetText(rawOcr);
    expect(res.success).toBe(true);
    expect(res.processes).toHaveLength(15);
    expect(res.processes).toEqual([
      { id: 'P1', arrivalTime: 10, burstTime: 37, priority: 18 },
      { id: 'P2', arrivalTime: 12, burstTime: 16, priority: 7 },
      { id: 'P3', arrivalTime: 15, burstTime: 28, priority: 13 },
      { id: 'P4', arrivalTime: 17, burstTime: 9, priority: 2 },
      { id: 'P5', arrivalTime: 20, burstTime: 41, priority: 21 },
      { id: 'P6', arrivalTime: 23, burstTime: 14, priority: 5 },
      { id: 'P7', arrivalTime: 26, burstTime: 33, priority: 11 },
      { id: 'P8', arrivalTime: 29, burstTime: 7, priority: 1 },
      { id: 'P9', arrivalTime: 32, burstTime: 24, priority: 16 },
      { id: 'P10', arrivalTime: 35, burstTime: 18, priority: 8 },
      { id: 'P11', arrivalTime: 38, burstTime: 45, priority: 4 },
      { id: 'P12', arrivalTime: 42, burstTime: 12, priority: 19 },
      { id: 'P13', arrivalTime: 46, burstTime: 31, priority: 6 },
      { id: 'P14', arrivalTime: 49, burstTime: 20, priority: 10 },
      { id: 'P15', arrivalTime: 53, burstTime: 27, priority: 3 },
    ]);
  });

  it('reconciles bracketed PID artifacts and repairs corrupted tokens like a1 -> 41', () => {
    const rawOcrWithArtifacts = `
PID Arrival Time Burst Time Priority
P1 10 37 18
P2 12 16 07
P3 15 28 13
P4 17 09 02
P5 20 a1 21
P6 23 14 05
P7 26 33 1"
[22:] 29 07 01
P9 32 24 16
P10 35 18 08
    `;
    const res = parseDatasetText(rawOcrWithArtifacts);
    expect(res.success).toBe(true);
    expect(res.processes).toHaveLength(10);
    // P5 burst time a1 -> 41
    expect(res.processes[4]).toEqual({ id: 'P5', arrivalTime: 20, burstTime: 41, priority: 21 });
    // P7 priority 1" -> 11
    expect(res.processes[6]).toEqual({ id: 'P7', arrivalTime: 26, burstTime: 33, priority: 11 });
    // [22:] between P7 and P9 is reconciled to P8
    expect(res.processes[7]).toEqual({ id: 'P8', arrivalTime: 29, burstTime: 7, priority: 1 });
  });

  it('handles empty or invalid inputs gracefully', () => {
    const emptyRes = parseDatasetText('');
    expect(emptyRes.success).toBe(false);

    const invalidRes = parseDatasetText('Just some random text with no numbers');
    expect(invalidRes.success).toBe(false);
  });
});

