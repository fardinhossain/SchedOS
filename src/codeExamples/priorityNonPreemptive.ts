/**
 * Educational reference implementations of Priority Scheduling (Non-Preemptive).
 * Rule: Select the highest-priority available process and run it to completion.
 * Convention: A LOWER number indicates a HIGHER priority (1 is higher priority than 4).
 */
import type { SupportedLanguage } from '../types/scheduling';

export const priorityNonPreemptiveCode: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>
#include <stdbool.h>

/* Priority Scheduling — Non-Preemptive
   Rule: Pick available process with highest priority (lowest number), run to completion. */

typedef struct {
    char id[10];
    int at, bt, priority;
    int ct, tat, wt, rt;
    bool completed;
} Process;

int main() {
    int n;
    printf("Enter number of processes: ");
    if (scanf("%d", &n) != 1 || n <= 0) return 0;

    Process p[50];
    for (int i = 0; i < n; i++) {
        printf("Process %d (ID Arrival Burst Priority): ", i + 1);
        scanf("%s %d %d %d", p[i].id, &p[i].at, &p[i].bt, &p[i].priority);
        p[i].completed = false;
    }

    int current_time = 0, completed = 0;
    float total_tat = 0, total_wt = 0;

    while (completed < n) {
        int idx = -1;
        int highest_priority = 1e9; /* Lower number = higher priority */

        for (int i = 0; i < n; i++) {
            if (p[i].at <= current_time && !p[i].completed) {
                if (p[i].priority < highest_priority) {
                    highest_priority = p[i].priority;
                    idx = i;
                } else if (p[i].priority == highest_priority) {
                    if (p[i].at < p[idx].at) idx = i; /* Tie: earlier arrival */
                }
            }
        }

        if (idx == -1) {
            current_time++; /* No process arrived yet -> CPU idle */
            continue;
        }

        /* Run chosen process to completion */
        p[idx].rt = current_time - p[idx].at;
        p[idx].ct = current_time + p[idx].bt;
        p[idx].tat = p[idx].ct - p[idx].at;
        p[idx].wt = p[idx].tat - p[idx].bt;
        p[idx].completed = true;

        current_time = p[idx].ct;
        completed++;
        total_tat += p[idx].tat;
        total_wt += p[idx].wt;
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

  python: `\"\"\"Priority Scheduling — Non-Preemptive
Rule: Pick available process with highest priority (lowest number), run to completion.
Convention: Lower priority number = Higher priority (1 beats 4).
\"\"\"

# 1. Take interactive input from user
n = int(input("Enter number of processes: "))
processes = []

for i in range(n):
    line = input(f"Process {i + 1} (ID Arrival Burst Priority): ").split()
    processes.append({
        'id': line[0],
        'at': int(line[1]),
        'bt': int(line[2]),
        'priority': int(line[3]),
        'completed': False
    })

# 2. Simulation loop
current_time = 0
completed = 0
total_tat = 0
total_wt = 0

while completed < n:
    ready = [p for p in processes if p['at'] <= current_time and not p['completed']]

    if not ready:
        current_time += 1  # CPU idle
        continue

    # Pick lowest priority number (tie-breaker: earlier arrival)
    chosen = min(ready, key=lambda p: (p['priority'], p['at']))

    chosen['rt'] = current_time - chosen['at']
    chosen['ct'] = current_time + chosen['bt']
    chosen['tat'] = chosen['ct'] - chosen['at']
    chosen['wt'] = chosen['tat'] - chosen['bt']
    chosen['completed'] = True

    current_time = chosen['ct']
    completed += 1
    total_tat += chosen['tat']
    total_wt += chosen['wt']

# 3. Print Results
print("\\nPID\\tAT\\tBT\\tPRI\\tCT\\tTAT\\tWT\\tRT")
for p in processes:
    print(f"{p['id']}\\t{p['at']}\\t{p['bt']}\\t{p['priority']}\\t{p['ct']}\\t{p['tat']}\\t{p['wt']}\\t{p['rt']}")

print(f"\\nAverage Turnaround Time: {total_tat / n:.2f}")
print(f"Average Waiting Time   : {total_wt / n:.2f}")`,

  bash: `#!/usr/bin/env bash
# Priority Scheduling — Non-Preemptive
# Rule: Pick available process with highest priority (lowest number), run to completion.
# Convention: Lower priority number = Higher priority (1 beats 4).

read -p "Enter number of processes: " n
if [ "$n" -le 0 ]; then exit 0; fi

declare -a id at bt priority ct tat wt rt completed

for ((i = 0; i < n; i++)); do
    read -p "Process $((i + 1)) (ID Arrival Burst Priority): " p_id p_at p_bt p_pri
    id[i]="$p_id"
    at[i]="$p_at"
    bt[i]="$p_bt"
    priority[i]="$p_pri"
    completed[i]=0
done

current_time=0
completed_count=0
total_tat=0
total_wt=0

# Simulation loop
while [ "$completed_count" -lt "$n" ]; do
    idx=-1
    highest_priority=999999 # Lower number = higher priority

    for ((i = 0; i < n; i++)); do
        if [ "\${at[i]}" -le "$current_time" ] && [ "\${completed[i]}" -eq 0 ]; then
            if [ "\${priority[i]}" -lt "$highest_priority" ]; then
                highest_priority="\${priority[i]}"
                idx="$i"
            elif [ "\${priority[i]}" -eq "$highest_priority" ]; then
                if [ "\${at[i]}" -lt "\${at[idx]}" ]; then
                    idx="$i" # Tie-breaker: earlier arrival
                fi
            fi
        fi
    done

    if [ "$idx" -eq -1 ]; then
        current_time=$((current_time + 1)) # CPU sits idle
        continue
    fi

    # Run chosen process to completion
    rt[idx]=$((current_time - at[idx]))
    ct[idx]=$((current_time + bt[idx]))
    tat[idx]=$((ct[idx] - at[idx]))
    wt[idx]=$((tat[idx] - bt[idx]))
    completed[idx]=1

    current_time="\${ct[idx]}"
    completed_count=$((completed_count + 1))
    total_tat=$((total_tat + tat[idx]))
    total_wt=$((total_wt + wt[idx]))
done

# Output results table
echo -e "\\nPID\\tAT\\tBT\\tPRI\\tCT\\tTAT\\tWT\\tRT"
for ((i = 0; i < n; i++)); do
    echo -e "\${id[i]}\\t\${at[i]}\\t\${bt[i]}\\t\${priority[i]}\\t\${ct[i]}\\t\${tat[i]}\\t\${wt[i]}\\t\${rt[i]}"
done

avg_tat=$(awk "BEGIN {printf \\"%.2f\\", $total_tat / $n}")
avg_wt=$(awk "BEGIN {printf \\"%.2f\\", $total_wt / $n}")

echo -e "\\nAverage Turnaround Time: $avg_tat"
echo -e "Average Waiting Time   : $avg_wt"`,
};
