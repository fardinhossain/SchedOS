/**
 * Educational reference implementations of LRTF (Longest Remaining Time First - Preemptive LJF).
 * Rule: At each time tick, pick the available process with the longest remaining burst time.
 */
import type { SupportedLanguage } from '../types/scheduling';

export const lrtfCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>
#include <stdbool.h>

/* Longest Remaining Time First (LRTF) — Preemptive LJF
   Rule: At each time tick, pick the available process with the largest remaining time. */

typedef struct {
    char id[10];
    int at, bt, remaining_bt;
    int ct, tat, wt, rt;
    int first_start;
} Process;

int main() {
    int n;
    printf("Enter number of processes: ");
    if (scanf("%d", &n) != 1 || n <= 0) return 0;

    Process p[50];
    for (int i = 0; i < n; i++) {
        printf("Process %d (ID Arrival Burst): ", i + 1);
        scanf("%s %d %d", p[i].id, &p[i].at, &p[i].bt);
        p[i].remaining_bt = p[i].bt;
        p[i].first_start = -1;
    }

    int current_time = 0, completed = 0;
    float total_tat = 0, total_wt = 0;

    while (completed < n) {
        int idx = -1;
        int max_rem = -1;

        /* Find process with maximum remaining burst time among arrived */
        for (int i = 0; i < n; i++) {
            if (p[i].at <= current_time && p[i].remaining_bt > 0) {
                if (p[i].remaining_bt > max_rem) {
                    max_rem = p[i].remaining_bt;
                    idx = i;
                } else if (p[i].remaining_bt == max_rem) {
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

        /* Run for 1 unit of time */
        p[idx].remaining_bt--;
        current_time++;

        /* Check if process finished */
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
    printf("\\nPID\\tAT\\tBT\\tCT\\tTAT\\tWT\\tRT\\n");
    for (int i = 0; i < n; i++) {
        printf("%s\\t%d\\t%d\\t%d\\t%d\\t%d\\t%d\\n",
               p[i].id, p[i].at, p[i].bt, p[i].ct, p[i].tat, p[i].wt, p[i].rt);
    }
    printf("\\nAverage Turnaround Time: %.2f", total_tat / n);
    printf("\\nAverage Waiting Time   : %.2f\\n", total_wt / n);
    return 0;
}`,

  python: `\"\"\"Longest Remaining Time First (LRTF) — Preemptive LJF
Rule: At each time tick, pick the available process with the longest remaining time.
\"\"\"

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

    # Pick process with largest remaining burst (tie-breaker: earlier arrival)
    chosen = min(ready, key=lambda p: (-p['remaining_bt'], p['at']))

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
print("\\nPID\\tAT\\tBT\\tCT\\tTAT\\tWT\\tRT")
for p in processes:
    print(f"{p['id']}\\t{p['at']}\\t{p['bt']}\\t{p['ct']}\\t{p['tat']}\\t{p['wt']}\\t{p['rt']}")

print(f"\\nAverage Turnaround Time: {total_tat / n:.2f}")
print(f"Average Waiting Time   : {total_wt / n:.2f}")`,

  bash: `#!/usr/bin/env bash
# Longest Remaining Time First (LRTF) — Preemptive LJF
# Rule: At each time tick, pick the available process with the longest remaining time.

read -p "Enter number of processes: " n
if [ "$n" -le 0 ]; then exit 0; fi

declare -a id at bt remaining_bt ct tat wt rt first_start

for ((i = 0; i < n; i++)); do
    read -p "Process $((i + 1)) (ID Arrival Burst): " p_id p_at p_bt
    id[i]="$p_id"
    at[i]="$p_at"
    bt[i]="$p_bt"
    remaining_bt[i]="$p_bt"
    first_start[i]=-1
done

current_time=0
completed=0
total_tat=0
total_wt=0

# Preemptive simulation loop (tick-by-tick)
while [ "$completed" -lt "$n" ]; do
    idx=-1
    max_rem=-1

    # Find process with maximum remaining burst time among arrived
    for ((i = 0; i < n; i++)); do
        if [ "\${at[i]}" -le "$current_time" ] && [ "\${remaining_bt[i]}" -gt 0 ]; then
            if [ "\${remaining_bt[i]}" -gt "$max_rem" ]; then
                max_rem="\${remaining_bt[i]}"
                idx="$i"
            elif [ "\${remaining_bt[i]}" -eq "$max_rem" ]; then
                if [ "\${at[i]}" -lt "\${at[idx]}" ]; then
                    idx="$i" # Tie-breaker: earlier arrival
                fi
            fi
        fi
    done

    if [ "$idx" -eq -1 ]; then
        current_time=$((current_time + 1)) # CPU idle
        continue
    fi

    # Record response time at first CPU allocation
    if [ "\${first_start[idx]}" -eq -1 ]; then
        first_start[idx]="$current_time"
        rt[idx]=$((current_time - at[idx]))
    fi

    # Run for 1 unit of time
    remaining_bt[idx]=$((remaining_bt[idx] - 1))
    current_time=$((current_time + 1))

    # Check if process completed
    if [ "\${remaining_bt[idx]}" -eq 0 ]; then
        ct[idx]="$current_time"
        tat[idx]=$((ct[idx] - at[idx]))
        wt[idx]=$((tat[idx] - bt[idx]))

        completed=$((completed + 1))
        total_tat=$((total_tat + tat[idx]))
        total_wt=$((total_wt + wt[idx]))
    fi
done

# Output results table
echo -e "\\nPID\\tAT\\tBT\\tCT\\tTAT\\tWT\\tRT"
for ((i = 0; i < n; i++)); do
    echo -e "\${id[i]}\\t\${at[i]}\\t\${bt[i]}\\t\${ct[i]}\\t\${tat[i]}\\t\${wt[i]}\\t\${rt[i]}"
done

avg_tat=$(awk "BEGIN {printf \\"%.2f\\", $total_tat / $n}")
avg_wt=$(awk "BEGIN {printf \\"%.2f\\", $total_wt / $n}")

echo -e "\\nAverage Turnaround Time: $avg_tat"
echo -e "Average Waiting Time   : $avg_wt"`,
};
