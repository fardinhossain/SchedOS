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

  it('handles empty or invalid inputs gracefully', () => {
    const emptyRes = parseDatasetText('');
    expect(emptyRes.success).toBe(false);

    const invalidRes = parseDatasetText('Just some random text with no numbers');
    expect(invalidRes.success).toBe(false);
  });
});
