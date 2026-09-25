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

  bash: `#!/usr/bin/env bash
# First Come First Serve (FCFS) Scheduling
# Rule: Execute processes in order of arrival time.

read -p "Enter number of processes: " n
if [ "$n" -le 0 ]; then exit 0; fi

declare -a id at bt ct tat wt rt

for ((i = 0; i < n; i++)); do
    read -p "Process $((i + 1)) (ID Arrival Burst): " p_id p_at p_bt
    id[i]="$p_id"
    at[i]="$p_at"
    bt[i]="$p_bt"
done

# 1. Sort processes by arrival time (Bubble Sort)
for ((i = 0; i < n - 1; i++)); do
    for ((j = 0; j < n - i - 1; j++)); do
        if [ "\${at[j]}" -gt "\${at[j + 1]}" ]; then
            # Swap arrival time
            temp="\${at[j]}"; at[j]="\${at[j + 1]}"; at[j + 1]="$temp"
            # Swap burst time
            temp="\${bt[j]}"; bt[j]="\${bt[j + 1]}"; bt[j + 1]="$temp"
            # Swap process ID
            temp="\${id[j]}"; id[j]="\${id[j + 1]}"; id[j + 1]="$temp"
        fi
    done
done

# 2. Schedule each process
current_time=0
total_tat=0
total_wt=0

for ((i = 0; i < n; i++)); do
    if [ "$current_time" -lt "\${at[i]}" ]; then
        current_time="\${at[i]}" # CPU was idle
    fi
    rt[i]=$((current_time - at[i]))
    ct[i]=$((current_time + bt[i]))
    tat[i]=$((ct[i] - at[i]))
    wt[i]=$((tat[i] - bt[i]))

    current_time="\${ct[i]}"
    total_tat=$((total_tat + tat[i]))
    total_wt=$((total_wt + wt[i]))
done

# 3. Output results table
echo -e "\\nPID\\tAT\\tBT\\tCT\\tTAT\\tWT\\tRT"
for ((i = 0; i < n; i++)); do
    echo -e "\${id[i]}\\t\${at[i]}\\t\${bt[i]}\\t\${ct[i]}\\t\${tat[i]}\\t\${wt[i]}\\t\${rt[i]}"
done

avg_tat=$(awk "BEGIN {printf \\"%.2f\\", $total_tat / $n}")
avg_wt=$(awk "BEGIN {printf \\"%.2f\\", $total_wt / $n}")

echo -e "\\nAverage Turnaround Time: $avg_tat"
echo -e "Average Waiting Time   : $avg_wt"`,
};
