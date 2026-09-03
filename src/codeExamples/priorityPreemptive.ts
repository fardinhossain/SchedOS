/**
 * Educational reference implementations of Priority Scheduling (Preemptive).
 * Rule: At each tick, pick the available process with the highest priority (lowest number).
 * Preempts the running process when a higher-priority process arrives.
 */
import type { SupportedLanguage } from '../types/scheduling';

export const priorityPreemptiveCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>
#include <stdbool.h>

/* Priority Scheduling — Preemptive
   Rule: At each tick, execute the available process with highest priority (lowest number). */

typedef struct {
    char id[10];
    int at, bt, priority, remaining_bt;
    int ct, tat, wt, rt;
    int first_start;
} Process;

int main() {
    int n;
    printf("Enter number of processes: ");
    if (scanf("%d", &n) != 1 || n <= 0) return 0;

    Process p[50];
    for (int i = 0; i < n; i++) {
        printf("Process %d (ID Arrival Burst Priority): ", i + 1);
        scanf("%s %d %d %d", p[i].id, &p[i].at, &p[i].bt, &p[i].priority);
        p[i].remaining_bt = p[i].bt;
        p[i].first_start = -1;
    }

    int current_time = 0, completed = 0;
    float total_tat = 0, total_wt = 0;

    while (completed < n) {
        int idx = -1;
        int highest_priority = 1e9; /* Lower number = higher priority */

        /* Find arrived process with highest priority */
        for (int i = 0; i < n; i++) {
            if (p[i].at <= current_time && p[i].remaining_bt > 0) {
                if (p[i].priority < highest_priority) {
                    highest_priority = p[i].priority;
                    idx = i;
                } else if (p[i].priority == highest_priority) {
                    if (p[i].at < p[idx].at) idx = i; /* Tie: earlier arrival */
                }
            }
        }

        if (idx == -1) {
            current_time++; /* CPU idle */
            continue;
        }

        /* Record response time at first dispatch */
        if (p[idx].first_start == -1) {
            p[idx].first_start = current_time;
            p[idx].rt = current_time - p[idx].at;
        }

        /* Run for 1 unit */
        p[idx].remaining_bt--;
        current_time++;

        /* Check if process completed */
        if (p[idx].remaining_bt == 0) {
            p[idx].ct = current_time;
            p[idx].tat = p[idx].ct - p[idx].at;
            p[idx].wt = p[idx].tat - p[idx].bt;

            completed++;
            total_tat += p[idx].tat;
            total_wt += p[idx].wt;
        }
    }

    /* Print Output Table */
    printf("\\nPID\\tAT\\tBT\\tPRI\\tCT\\tTAT\\tWT\\tRT\\n");
    for (int i = 0; i < n; i++) {
        printf("%s\\t%d\\t%d\\t%d\\t%d\\t%d\\t%d\\t%d\\n",
               p[i].id, p[i].at, p[i].bt, p[i].priority, p[i].ct, p[i].tat, p[i].wt, p[i].rt);
    }
    printf("\\nAverage Turnaround Time: %.2f", total_tat / n);
    printf("\\nAverage Waiting Time   : %.2f\\n", total_wt / n);
    return 0;
}`,

  python: `\"\"\"Priority Scheduling — Preemptive
Rule: At each tick, execute the available process with highest priority (lowest number).
Convention: Lower priority number = Higher priority (1 beats 4).
\"\"\"

# 1. Take interactive input from user
n = int(input("Enter number of processes: "))
processes = []

for i in range(n):
    line = input(f"Process {i + 1} (ID Arrival Burst Priority): ").split()
    bt = int(line[2])
    processes.append({
        'id': line[0],
        'at': int(line[1]),
        'bt': bt,
        'remaining_bt': bt,
        'priority': int(line[3]),
        'first_start': -1,
        'rt': 0, 'ct': 0, 'tat': 0, 'wt': 0
    })

# 2. Preemptive simulation loop (tick-by-tick)
current_time = 0
completed = 0
total_tat = 0
total_wt = 0

while completed < n:
    ready = [p for p in processes if p['at'] <= current_time and p['remaining_bt'] > 0]

    if not ready:
        current_time += 1  # CPU idle
        continue

    # Pick highest priority (lowest number), tie-breaker: earlier arrival
    chosen = min(ready, key=lambda p: (p['priority'], p['at']))

    if chosen['first_start'] == -1:
        chosen['first_start'] = current_time
        chosen['rt'] = current_time - chosen['at']

    chosen['remaining_bt'] -= 1
    current_time += 1

    if chosen['remaining_bt'] == 0:
        chosen['ct'] = current_time
        chosen['tat'] = chosen['ct'] - chosen['at']
        chosen['wt'] = chosen['tat'] - chosen['bt']

        completed += 1
        total_tat += chosen['tat']
        total_wt += chosen['wt']

# 3. Print Results
print("\\nPID\\tAT\\tBT\\tPRI\\tCT\\tTAT\\tWT\\tRT")
for p in processes:
    print(f"{p['id']}\\t{p['at']}\\t{p['bt']}\\t{p['priority']}\\t{p['ct']}\\t{p['tat']}\\t{p['wt']}\\t{p['rt']}")

print(f"\\nAverage Turnaround Time: {total_tat / n:.2f}")
print(f"Average Waiting Time   : {total_wt / n:.2f}")`,

  typescript: `import * as readline from 'readline';

/**
 * Priority Scheduling — Preemptive
 * Rule: At each tick, execute the available process with highest priority (lowest number).
 * Convention: Lower priority number = Higher priority (1 beats 4).
 */

interface Process {
  id: string;
  at: number;
  bt: number;
  priority: number;
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
    const input = await ask(\`Process \${i + 1} (ID Arrival Burst Priority): \`);
    const [id, atStr, btStr, priStr] = input.trim().split(/\\s+/);
    const bt = parseInt(btStr, 10);
    processes.push({
      id,
      at: parseInt(atStr, 10),
      bt,
      remainingBt: bt,
      priority: parseInt(priStr, 10),
      firstStart: -1,
    });
  }
  rl.close();

  let currentTime = 0;
  let completed = 0;
  let totalTat = 0;
  let totalWt = 0;

  while (completed < n) {
    const ready = processes.filter((p) => p.at <= currentTime && p.remainingBt > 0);

    if (ready.length === 0) {
      currentTime++;
      continue;
    }

    // Pick highest priority (lowest number), tie-breaker: earlier arrival
    ready.sort((a, b) => a.priority - b.priority || a.at - b.at);
    const chosen = ready[0];

    if (chosen.firstStart === -1) {
      chosen.firstStart = currentTime;
      chosen.rt = currentTime - chosen.at;
    }

    chosen.remainingBt--;
    currentTime++;

    if (chosen.remainingBt === 0) {
      chosen.ct = currentTime;
      chosen.tat = chosen.ct - chosen.at;
      chosen.wt = chosen.tat - chosen.bt;

      completed++;
      totalTat += chosen.tat;
      totalWt += chosen.wt;
    }
  }

  console.log('\\nPID\\tAT\\tBT\\tPRI\\tCT\\tTAT\\tWT\\tRT');
  for (const p of processes) {
    console.log(\`\${p.id}\\t\${p.at}\\t\${p.bt}\\t\${p.priority}\\t\${p.ct}\\t\${p.tat}\\t\${p.wt}\\t\${p.rt}\`);
  }
  console.log(\`\\nAverage Turnaround Time: \${(totalTat / n).toFixed(2)}\`);
  console.log(\`Average Waiting Time   : \${(totalWt / n).toFixed(2)}\`);
}

main();`,
};
