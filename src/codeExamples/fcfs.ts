/**
 * Educational reference implementations of FCFS (First Come First Serve).
 * Rule: Execute processes in the order of their arrival time.
 *
 * Easy to remember 3-step pattern:
 *   1. Input & Sort by Arrival Time
 *   2. Run through processes: CT = max(current_time, AT) + BT
 *   3. Calculate TAT = CT - AT, WT = TAT - BT, RT = first_start - AT
 */
import type { SupportedLanguage } from '../types/scheduling';

export const fcfsCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>

/* First Come First Serve (FCFS) Scheduling
   Rule: Execute processes in order of arrival time. */

typedef struct {
    char id[10];
    int at, bt;
    int ct, tat, wt, rt;
} Process;

int main() {
    int n;
    printf("Enter number of processes: ");
    if (scanf("%d", &n) != 1 || n <= 0) return 0;

    Process p[50];
    for (int i = 0; i < n; i++) {
        printf("Process %d (ID Arrival Burst): ", i + 1);
        scanf("%s %d %d", p[i].id, &p[i].at, &p[i].bt);
    }

    /* 1. Sort processes by arrival time */
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (p[j].at > p[j + 1].at) {
                Process temp = p[j];
                p[j] = p[j + 1];
                p[j + 1] = temp;
            }
        }
    }

    /* 2. Schedule each process */
    int current_time = 0;
    float total_tat = 0, total_wt = 0;

    for (int i = 0; i < n; i++) {
        if (current_time < p[i].at) {
            current_time = p[i].at; /* CPU was idle */
        }
        p[i].rt = current_time - p[i].at;
        p[i].ct = current_time + p[i].bt;
        p[i].tat = p[i].ct - p[i].at;
        p[i].wt = p[i].tat - p[i].bt;

        current_time = p[i].ct;
        total_tat += p[i].tat;
        total_wt += p[i].wt;
    }

    /* 3. Output results table */
    printf("\\nPID\\tAT\\tBT\\tCT\\tTAT\\tWT\\tRT\\n");
    for (int i = 0; i < n; i++) {
        printf("%s\\t%d\\t%d\\t%d\\t%d\\t%d\\t%d\\n",
               p[i].id, p[i].at, p[i].bt, p[i].ct, p[i].tat, p[i].wt, p[i].rt);
    }
    printf("\\nAverage Turnaround Time: %.2f", total_tat / n);
    printf("\\nAverage Waiting Time   : %.2f\\n", total_wt / n);
    return 0;
}`,

  python: `\"\"\"First Come First Serve (FCFS) Scheduling
Rule: Execute processes in order of arrival time.
\"\"\"

# 1. Take interactive input from user
n = int(input("Enter number of processes: "))
processes = []

for i in range(n):
    line = input(f"Process {i + 1} (ID Arrival Burst): ").split()
    processes.append({
        'id': line[0],
        'at': int(line[1]),
        'bt': int(line[2])
    })

# 2. Sort by arrival time
processes.sort(key=lambda p: p['at'])

# 3. Schedule each process
current_time = 0
total_tat = 0
total_wt = 0

for p in processes:
    if current_time < p['at']:
        current_time = p['at']  # CPU idle

    p['rt'] = current_time - p['at']
    p['ct'] = current_time + p['bt']
    p['tat'] = p['ct'] - p['at']
    p['wt'] = p['tat'] - p['bt']

    current_time = p['ct']
    total_tat += p['tat']
    total_wt += p['wt']

# 4. Display results
print("\\nPID\\tAT\\tBT\\tCT\\tTAT\\tWT\\tRT")
for p in processes:
    print(f"{p['id']}\\t{p['at']}\\t{p['bt']}\\t{p['ct']}\\t{p['tat']}\\t{p['wt']}\\t{p['rt']}")

print(f"\\nAverage Turnaround Time: {total_tat / n:.2f}")
print(f"Average Waiting Time   : {total_wt / n:.2f}")`,

  typescript: `import * as readline from 'readline';

/**
 * First Come First Serve (FCFS) Scheduling
 * Rule: Execute processes in order of arrival time.
 */

interface Process {
  id: string;
  at: number;
  bt: number;
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
    const [id, at, bt] = input.trim().split(/\\s+/);
    processes.push({ id, at: parseInt(at, 10), bt: parseInt(bt, 10) });
  }
  rl.close();

  // 1. Sort by Arrival Time
  processes.sort((a, b) => a.at - b.at);

  // 2. Schedule each process
  let currentTime = 0;
  let totalTat = 0;
  let totalWt = 0;

  for (const p of processes) {
    if (currentTime < p.at) {
      currentTime = p.at; // CPU idle
    }
    p.rt = currentTime - p.at;
    p.ct = currentTime + p.bt;
    p.tat = p.ct - p.at;
    p.wt = p.tat - p.bt;

    currentTime = p.ct;
    totalTat += p.tat;
    totalWt += p.wt;
  }

  // 3. Print Results Table
  console.log('\\nPID\\tAT\\tBT\\tCT\\tTAT\\tWT\\tRT');
  for (const p of processes) {
    console.log(\`\${p.id}\\t\${p.at}\\t\${p.bt}\\t\${p.ct}\\t\${p.tat}\\t\${p.wt}\\t\${p.rt}\`);
  }
  console.log(\`\\nAverage Turnaround Time: \${(totalTat / n).toFixed(2)}\`);
  console.log(\`Average Waiting Time   : \${(totalWt / n).toFixed(2)}\`);
}

main();`,
};
