/**
 * Educational reference implementations of Round Robin (RR).
 * Rule: Processes run cyclically in a FIFO queue for at most a fixed time quantum.
 * Precedence Rule: Newly arrived processes at the instant of quantum expiration are
 * enqueued BEFORE the preempted process is re-queued.
 */
import type { SupportedLanguage } from '../types/scheduling';

export const roundRobinCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>
#include <stdbool.h>

/* Round Robin (RR) Scheduling
   Rule: Execute processes using a fixed time quantum in cyclic FIFO order. */

typedef struct {
    char id[10];
    int at, bt, remaining_bt;
    int ct, tat, wt, rt;
    int first_start;
} Process;

int main() {
    int n, quantum;
    printf("Enter number of processes: ");
    if (scanf("%d", &n) != 1 || n <= 0) return 0;

    Process p[50];
    for (int i = 0; i < n; i++) {
        printf("Process %d (ID Arrival Burst): ", i + 1);
        scanf("%s %d %d", p[i].id, &p[i].at, &p[i].bt);
        p[i].remaining_bt = p[i].bt;
        p[i].first_start = -1;
    }

    printf("Enter Time Quantum: ");
    scanf("%d", &quantum);

    /* Sort initially by arrival time */
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (p[j].at > p[j + 1].at) {
                Process temp = p[j];
                p[j] = p[j + 1];
                p[j + 1] = temp;
            }
        }
    }

    /* Queue to store process indices */
    int queue[500], front = 0, rear = 0;
    bool in_queue[50] = {false};

    int current_time = p[0].at;
    /* Enqueue initial process */
    queue[rear++] = 0;
    in_queue[0] = true;

    int completed = 0;
    float total_tat = 0, total_wt = 0;

    while (completed < n) {
        if (front == rear) {
            /* Queue is empty -> advance time to next unqueued arrival */
            for (int i = 0; i < n; i++) {
                if (p[i].remaining_bt > 0) {
                    current_time = p[i].at;
                    queue[rear++] = i;
                    in_queue[i] = true;
                    break;
                }
            }
        }

        int curr = queue[front++];
        if (p[curr].first_start == -1) {
            p[curr].first_start = current_time;
            p[curr].rt = current_time - p[curr].at;
        }

        int slice = (p[curr].remaining_bt < quantum) ? p[curr].remaining_bt : quantum;
        p[curr].remaining_bt -= slice;
        current_time += slice;

        /* Enqueue any new processes that arrived while this one was running */
        for (int i = 0; i < n; i++) {
            if (!in_queue[i] && p[i].at <= current_time && p[i].remaining_bt > 0) {
                queue[rear++] = i;
                in_queue[i] = true;
            }
        }

        /* If current process still has remaining work, put it back in queue */
        if (p[curr].remaining_bt > 0) {
            queue[rear++] = curr;
        } else {
            p[curr].ct = current_time;
            p[curr].tat = p[curr].ct - p[curr].at;
            p[curr].wt = p[curr].tat - p[curr].bt;

            completed++;
            total_tat += p[curr].tat;
            total_wt += p[curr].wt;
        }
    }

    /* Print Output Table */
    printf("\\nPID\\tAT\\tBT\\tCT\\tTAT\\tWT\\tRT\\n");
    for (int i = 0; i < n; i++) {
        printf("%s\\t%d\\t%d\\t%d\\t%d\\t%d\\t%d\\n",
               p[i].id, p[i].at, p[i].bt, p[i].ct, p[i].tat, p[i].wt, p[i].rt);
    }
    printf("\\nAverage Turnaround Time: %.2f", total_tat / n);
    printf("\\nAverage Waiting Time   : %.2f\\n", total_wt / n);
    return 0;
}`,

  python: `\"\"\"Round Robin (RR) Scheduling
Rule: Execute processes using a fixed time quantum in cyclic FIFO order.
\"\"\"
from collections import deque

# 1. Take interactive input from user
n = int(input("Enter number of processes: "))
processes = []

for i in range(n):
    line = input(f"Process {i + 1} (ID Arrival Burst): ").split()
    bt = int(line[2])
    processes.append({
        'id': line[0],
        'at': int(line[1]),
        'bt': bt,
        'remaining_bt': bt,
        'first_start': -1,
        'rt': 0, 'ct': 0, 'tat': 0, 'wt': 0
    })

quantum = int(input("Enter Time Quantum: "))

# Sort by arrival initially
processes.sort(key=lambda p: p['at'])

# 2. Simulation with FIFO queue
queue = deque()
in_queue = [False] * n

current_time = processes[0]['at']
queue.append(0)
in_queue[0] = True

completed = 0
total_tat = 0
total_wt = 0

while completed < n:
    if not queue:
        # Advance time to earliest remaining unqueued process
        for i, p in enumerate(processes):
            if p['remaining_bt'] > 0:
                current_time = p['at']
                queue.append(i)
                in_queue[i] = True
                break

    idx = queue.popleft()
    p = processes[idx]

    if p['first_start'] == -1:
        p['first_start'] = current_time
        p['rt'] = current_time - p['at']

    slice_time = min(quantum, p['remaining_bt'])
    p['remaining_bt'] -= slice_time
    current_time += slice_time

    # Critical: Enqueue new arrivals BEFORE requeuing preempted process
    for i, other in enumerate(processes):
        if not in_queue[i] and other['at'] <= current_time and other['remaining_bt'] > 0:
            queue.append(i)
            in_queue[i] = True

    if p['remaining_bt'] > 0:
        queue.append(idx)
    else:
        p['ct'] = current_time
        p['tat'] = p['ct'] - p['at']
        p['wt'] = p['tat'] - p['bt']

        completed += 1
        total_tat += p['tat']
        total_wt += p['wt']

# 3. Print Results
print("\\nPID\\tAT\\tBT\\tCT\\tTAT\\tWT\\tRT")
for p in processes:
    print(f"{p['id']}\\t{p['at']}\\t{p['bt']}\\t{p['ct']}\\t{p['tat']}\\t{p['wt']}\\t{p['rt']}")

print(f"\\nAverage Turnaround Time: {total_tat / n:.2f}")
print(f"Average Waiting Time   : {total_wt / n:.2f}")`,

  typescript: `import * as readline from 'readline';

/**
 * Round Robin (RR) Scheduling
 * Rule: Execute processes using a fixed time quantum in cyclic FIFO order.
 */

interface Process {
  id: string;
  at: number;
  bt: number;
  remainingBt: number;
  firstStart: number;
  ct?: number;
  tat?: number;
  wt?: number;
  rt?: number;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q: string): Promise<string> =>
  new Promise((resolve) => rl.question(q, resolve));

async function main() {
  const nStr = await ask('Enter number of processes: ');
  const n = parseInt(nStr.trim(), 10);
  const processes: Process[] = [];

  for (let i = 0; i < n; i++) {
    const input = await ask(\`Process \${i + 1} (ID Arrival Burst): \`);
    const [id, atStr, btStr] = input.trim().split(/\\s+/);
    const bt = parseInt(btStr, 10);
    processes.push({
      id,
      at: parseInt(atStr, 10),
      bt,
      remainingBt: bt,
      firstStart: -1,
    });
  }

  const qStr = await ask('Enter Time Quantum: ');
  const quantum = parseInt(qStr.trim(), 10);
  rl.close();

  // Sort initially by arrival time
  processes.sort((a, b) => a.at - b.at);

  const queue: number[] = [];
  const inQueue: boolean[] = new Array(n).fill(false);

  let currentTime = processes[0].at;
  queue.push(0);
  inQueue[0] = true;

  let completed = 0;
  let totalTat = 0;
  let totalWt = 0;

  while (completed < n) {
    if (queue.length === 0) {
      for (let i = 0; i < n; i++) {
        if (processes[i].remainingBt > 0) {
          currentTime = processes[i].at;
          queue.push(i);
          inQueue[i] = true;
          break;
        }
      }
    }

    const idx = queue.shift()!;
    const p = processes[idx];

    if (p.firstStart === -1) {
      p.firstStart = currentTime;
      p.rt = currentTime - p.at;
    }

    const slice = Math.min(quantum, p.remainingBt);
    p.remainingBt -= slice;
    currentTime += slice;

    // Enqueue newly arrived processes first
    for (let i = 0; i < n; i++) {
      if (!inQueue[i] && processes[i].at <= currentTime && processes[i].remainingBt > 0) {
        queue.push(i);
        inQueue[i] = true;
      }
    }

    // Then requeue the preempted process if still unfinished
    if (p.remainingBt > 0) {
      queue.push(idx);
    } else {
      p.ct = currentTime;
      p.tat = p.ct - p.at;
      p.wt = p.tat - p.bt;

      completed++;
      totalTat += p.tat;
      totalWt += p.wt;
    }
  }

  console.log('\\nPID\\tAT\\tBT\\tCT\\tTAT\\tWT\\tRT');
  for (const p of processes) {
    console.log(\`\${p.id}\\t\${p.at}\\t\${p.bt}\\t\${p.ct}\\t\${p.tat}\\t\${p.wt}\\t\${p.rt}\`);
  }
  console.log(\`\\nAverage Turnaround Time: \${(totalTat / n).toFixed(2)}\`);
  console.log(\`Average Waiting Time   : \${(totalWt / n).toFixed(2)}\`);
}

main();`,
};
