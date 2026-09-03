You are a senior frontend engineer, algorithms engineer, UI/UX designer, and educational visualization specialist.

Build a complete, polished, highly interactive web application called:

                    SCHEDOS
        Interactive CPU Scheduling Laboratory

TAGLINE:
"Visualize. Simulate. Understand."

============================================================
1. PROJECT PURPOSE
============================================================

SchedOS is an educational web application for visualizing,
simulating, and comparing CPU scheduling algorithms.

The application must satisfy the academic project requirements
for:

1. CPU scheduling algorithm visualization
2. User input for processes
3. Algorithm selection
4. Gantt chart generation
5. Per-process scheduling metrics
6. Overall performance metrics
7. CPU utilization analysis
8. Comparative analysis of multiple algorithms
9. Educational algorithm explanations
10. Source-code viewing in multiple programming languages

The application must feel like a real interactive operating-system
laboratory rather than a generic dashboard or simple calculator.

Do NOT create a generic SaaS dashboard.

Do NOT use the common "dark background + blue/purple neon"
design trend.

Do NOT use purple.

Do NOT use blue as the primary theme.

The visual identity must be unique and clearly inspired by:
- operating systems
- CPU execution
- process queues
- computer terminals
- engineering laboratories
- technical schematics
- vintage/retro computing
- modern information design

============================================================
2. REQUIRED SCHEDULING ALGORITHMS
============================================================

Implement EXACTLY these eight algorithms.

NON-PREEMPTIVE:
1. FCFS - First Come First Serve
2. SJF - Shortest Job First
3. LJF - Longest Job First
4. Priority - Non-Preemptive Priority Scheduling

PREEMPTIVE:
5. SRTF - Shortest Remaining Time First
6. LRTF - Longest Remaining Time First
7. Round Robin
8. Priority - Preemptive Priority Scheduling

Do not silently replace these algorithms with other algorithms.

Priority must appear separately as:

- Priority (Non-Preemptive)
- Priority (Preemptive)

The algorithm selector should visually group algorithms
under NON-PREEMPTIVE and PREEMPTIVE.

============================================================
3. REQUIRED PROJECT FUNCTIONALITY
============================================================

The application must include a clear interface where users
can:

- choose an algorithm
- enter number of processes
- enter Process ID
- enter Arrival Time
- enter Burst Time
- enter Priority when applicable
- enter Time Quantum for Round Robin
- add processes dynamically
- remove processes
- edit processes
- reset input
- load example datasets
- run simulation

The project brief specifically requires user input, algorithm
selection, arrival time, burst time, priority where applicable,
Gantt chart visualization, per-process completion/turnaround/
waiting time, averages, and CPU idle time.

============================================================
4. TECHNOLOGY STACK
============================================================

Use:

Frontend:
- React
- TypeScript
- Vite

Styling:
- Tailwind CSS

Charts:
- Recharts or a similarly reliable charting library

Icons:
- Lucide React

Code highlighting:
- Shiki or Prism

Use TypeScript for the actual scheduling engine.

Do not use a backend unless genuinely necessary.

The application should work entirely client-side.

============================================================
5. ARCHITECTURE
============================================================

Separate the scheduling engine from the UI.

Recommended structure:

src/
│
├── algorithms/
│   ├── fcfs.ts
│   ├── sjf.ts
│   ├── ljf.ts
│   ├── priorityNonPreemptive.ts
│   ├── srtf.ts
│   ├── lrtf.ts
│   ├── roundRobin.ts
│   └── priorityPreemptive.ts
│
├── engine/
│   ├── scheduler.ts
│   ├── metrics.ts
│   ├── timeline.ts
│   ├── validation.ts
│   └── comparison.ts
│
├── codeExamples/
│   ├── fcfs/
│   ├── sjf/
│   ├── ljf/
│   ├── priorityNonPreemptive/
│   ├── srtf/
│   ├── lrtf/
│   ├── roundRobin/
│   └── priorityPreemptive/
│
├── components/
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── ProcessTable.tsx
│   ├── AlgorithmSelector.tsx
│   ├── GanttChart.tsx
│   ├── CPUVisualizer.tsx
│   ├── ReadyQueue.tsx
│   ├── MetricsTable.tsx
│   ├── PerformanceCards.tsx
│   ├── ComparisonChart.tsx
│   ├── CodeViewer.tsx
│   ├── SimulationControls.tsx
│   ├── SystemLog.tsx
│   └── EmptyState.tsx
│
├── pages/
│   ├── Home.tsx
│   ├── Visualizer.tsx
│   ├── Compare.tsx
│   ├── Algorithms.tsx
│   ├── Learn.tsx
│   └── About.tsx
│
├── types/
│   └── scheduling.ts
│
└── data/
    └── examples.ts

Keep all scheduling calculations independent from React
components.

============================================================
6. COMMON DATA MODEL
============================================================

Define shared TypeScript interfaces.

Example:

interface ProcessInput {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority?: number;
}

interface GanttBlock {
  processId: string;
  startTime: number;
  endTime: number;
}

interface ProcessResult extends ProcessInput {
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  firstStartTime: number;
}

interface SchedulingResult {
  gantt: GanttBlock[];
  processes: ProcessResult[];

  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;

  cpuBusyTime: number;
  cpuIdleTime: number;
  cpuUtilization: number;

  totalTime: number;
}

Every scheduling algorithm must return the same result format.

============================================================
7. CORRECT METRICS
============================================================

Implement and verify:

Completion Time:
CT = time when process finishes

Turnaround Time:
TAT = CT - Arrival Time

Waiting Time:
WT = TAT - Burst Time

Response Time:
RT = First CPU Start Time - Arrival Time

Average Waiting Time:
Average WT = sum(WT) / number of processes

Average Turnaround Time:
Average TAT = sum(TAT) / number of processes

Average Response Time:
Average RT = sum(RT) / number of processes

CPU Busy Time:
sum of actual execution time

CPU Idle Time:
Total elapsed time - CPU Busy Time

CPU Utilization:
(CPU Busy Time / Total elapsed time) * 100

Make sure floating point values are formatted cleanly.

For example:
3.333333 should display as 3.33.

============================================================
8. GANTT CHART
============================================================

The Gantt chart is the primary visual feature.

Do not create a boring static table.

Create a true timeline.

Requirements:

- horizontal time axis
- process blocks
- start time markers
- end time markers
- CPU idle blocks
- hover information
- selected process highlighting
- animated execution
- responsive horizontal scrolling for large timelines

Example:

0        2        5        8        12
│   P1   │   P2   │  P3    │   P1   │

Each block must have:
- process ID
- start time
- end time
- duration

Hover tooltip:

Process: P2
Start: 2
End: 5
Duration: 3

Clicking a Gantt block should highlight the corresponding
process in the metrics table.

For preemptive algorithms, the same process may appear
multiple times on the Gantt chart.

For Round Robin, every time quantum segment must be represented.

For CPU idle periods, use a distinct visual pattern,
such as:
- dashed lines
- hatching
- industrial gray

rather than treating IDLE as a normal process.

============================================================
9. PROCESS INPUT UI
============================================================

Create an editable process table.

Columns:

PID
Arrival Time
Burst Time
Priority
Remove

Example:

P1 | 0 | 8 | 2 | X
P2 | 1 | 4 | 1 | X
P3 | 2 | 2 | 3 | X

Buttons:

+ Add Process
Load Example
Clear All
Run Simulation

For Round Robin:

Time Quantum [ 2 ]

Only show Priority when a Priority algorithm is selected.

Disable irrelevant inputs instead of confusing users.

Validate:
- PID must be unique
- Arrival Time >= 0
- Burst Time > 0
- Priority must be valid when required
- Time Quantum > 0

Show inline validation messages.

============================================================
10. INTERACTIVE SIMULATION
============================================================

Do not show only final results.

Implement a simulation mode.

Controls:

[ Play ]
[ Pause ]
[ Step ]
[ Reset ]

Speed:

0.5x
1x
2x
4x

During simulation show:

CURRENT TIME: 07

CPU:
┌──────────────┐
│      P2      │
│    RUNNING   │
└──────────────┘

READY QUEUE:
[P1] [P3] [P4]

When a process arrives:
- animate it entering the ready queue

When selected:
- animate movement from ready queue to CPU

When preempted:
- animate CPU -> ready queue

When completed:
- move process to COMPLETED state

The user should be able to understand the scheduling decision
visually.

============================================================
11. SYSTEM LOG
============================================================

Add a technical execution log.

Example:

SYSTEM LOG
────────────────────────────────────
00:00  P1 entered READY QUEUE
00:00  CPU assigned -> P1
00:02  P2 entered READY QUEUE
00:04  P1 PREEMPTED
00:04  CPU assigned -> P2
00:08  P2 COMPLETED

Make the log update during simulation.

Use monospace typography.

============================================================
12. PERFORMANCE OUTPUT
============================================================

After simulation, show:

Average Waiting Time
Average Turnaround Time
Average Response Time
CPU Utilization
CPU Idle Time
CPU Busy Time
Total Execution Time

Display them as technical metric panels.

Example:

PERFORMANCE
────────────────────────────
AVG WAIT         3.25
AVG TURNAROUND   7.75
AVG RESPONSE     1.50
CPU UTILIZATION  86.67%
CPU IDLE         2
CPU BUSY         13
TOTAL TIME       15

Do not hide any required metric.

============================================================
13. PROCESS METRICS TABLE
============================================================

Show:

PID
Arrival Time
Burst Time
Priority
Completion Time
Turnaround Time
Waiting Time
Response Time

Example:

P1 | 0 | 8 | 2 | 14 | 14 | 6 | 0
P2 | 1 | 4 | 1 | 8  | 7  | 3 | 1

Allow sorting if practical.

Allow clicking a process row to highlight its Gantt blocks.

============================================================
14. COMPARATIVE ANALYSIS
============================================================

Create a dedicated Compare page.

The user must be able to select two or more algorithms.

Example:

NON-PREEMPTIVE
☑ FCFS
☑ SJF
☑ LJF
☐ Priority

PREEMPTIVE
☑ SRTF
☐ LRTF
☑ Round Robin
☐ Priority

For Round Robin, show Time Quantum.

The same process dataset should be used for selected algorithms
unless the UI explicitly provides separate inputs.

Run all selected algorithms.

Show a separate Gantt chart for each algorithm.

Example:

FCFS
0 ── P1 ─── P2 ── P3 ─── P4 ── 20

SJF
0 ── P1 ─ P3 ─ P2 ─── P4 ───── 20

SRTF
0 ─ P1 ─ P3 ─ P2 ─ P1 ─── P4 ─ 20

============================================================
15. COMPARISON TABLE
============================================================

Show:

Algorithm
Average Waiting Time
Average Turnaround Time
Average Response Time
CPU Utilization
CPU Idle Time

Example:

Algorithm | Avg WT | Avg TAT | Avg RT | CPU Util | CPU Idle

Automatically determine:
- lowest Avg WT
- lowest Avg TAT
- lowest Avg RT
- highest CPU Utilization
- lowest CPU Idle Time

Do not hard-code a winner.

============================================================
16. COMPARISON CHARTS
============================================================

Use visual charts for:

1. Average Waiting Time
2. Average Turnaround Time
3. Average Response Time
4. CPU Utilization
5. CPU Idle Time

Allow the user to switch metrics.

Make charts readable and not overly decorative.

============================================================
17. UNIQUE VISUAL THEME
============================================================

This is extremely important.

DO NOT USE:
- purple
- blue as primary color
- blue/purple gradients
- generic neon cyberpunk
- generic glassmorphism
- generic SaaS dashboard aesthetic

Use a unique "Retro-Future Operating System Laboratory"
visual identity.

Concept:

1980s terminal
+
engineering laboratory
+
technical blueprint
+
modern data visualization

Suggested palette:

Main background:
#F3F0E7  warm bone/off-white

Dark surface:
#171717

Main text:
#1A1A1A

CRT Green:
#58C472

Signal Orange:
#FF7043

Machine Yellow:
#E5B93F

Electric highlight:
#39A0A8

Muted gray:
#A7A49B

Do not introduce blue/purple accents.

Green and orange should be used as meaningful signals,
not as decoration.

============================================================
18. VISUAL LANGUAGE
============================================================

Use:
- technical panels
- square or slightly rounded corners
- thin borders
- grid lines
- engineering labels
- terminal-style status indicators
- monospace technical data
- numbered experiment identifiers
- subtle blueprint/grid background

Avoid:
- huge rounded cards
- excessive shadows
- gradient blobs
- decorative illustrations that have nothing to do with OS

Panels should resemble technical instruments.

Example:

┌─ CPU STATUS ─────────────────────────┐
│                                      │
│ STATUS       RUNNING                 │
│ PROCESS      P02                     │
│ CLOCK        07                      │
│ UTILIZATION  86.67%                  │
│                                      │
└──────────────────────────────────────┘

============================================================
19. HOMEPAGE
============================================================

The homepage should be unique.

Make it resemble an operating-system boot/lab console.

Hero:

SCHEDOS

PROCESS LAB v1.0

CPU SCHEDULING VISUALIZER

System Ready

8 Algorithms Available
Interactive Simulation Enabled
Comparative Analysis Enabled

[ INITIALIZE SIMULATION ]

Use a subtle boot sequence animation:

INITIALIZING SCHEDULER...
LOADING PROCESS ENGINE...
LOADING ALGORITHMS...
LOADING VISUALIZER...
SYSTEM READY.

Do not make the animation annoying.
Provide an option to skip it.

============================================================
20. NAVIGATION
============================================================

Desktop:
Use a left navigation rail/sidebar.

Navigation:

Dashboard
Visualizer
Compare
Algorithms
Learn
About

Show current section with a strong green/orange indicator.

Navigation should feel like a laboratory control panel.

Mobile:
Convert sidebar into a compact top/bottom navigation.

============================================================
21. ALGORITHM PAGE
============================================================

Create an Algorithms page showing all 8 algorithms.

Each algorithm should have:

Name
Category
Short explanation
Scheduling rule
Preemptive/non-preemptive status
Advantages
Disadvantages
[Try Algorithm]

Examples:

FCFS
First Come First Serve

Rule:
Execute the process that arrives first.

SJF
Shortest Job First

Rule:
Select the available process with the shortest burst time.

LJF
Longest Job First

Rule:
Select the available process with the longest burst time.

SRTF
Shortest Remaining Time First

Rule:
Execute the available process with the shortest remaining time.

LRTF
Longest Remaining Time First

Rule:
Execute the available process with the longest remaining time.

Round Robin
Rule:
Execute processes using a fixed time quantum in cyclic order.

Priority
Rule:
Select process according to priority.

For Priority algorithms clearly distinguish
preemptive vs non-preemptive.

============================================================
22. MULTI-LANGUAGE CODE VIEWER
============================================================

This is a major feature of SchedOS.

Whenever the user selects an algorithm, show:

VIEW IMPLEMENTATION

Language:
[C ▼]

Options:
- C
- C++
- Python
- JavaScript
- TypeScript

Changing the language must immediately change
the displayed source code.

Every one of the 8 algorithms needs 5 code versions.

Total:
8 algorithms × 5 languages = 40 code examples.

The code viewer is educational only.

The actual simulator engine must always use TypeScript.

Do not execute arbitrary user-provided source code.

Add:
[Copy Code]

Show syntax highlighting.

Add line numbers if practical.

Add a small description:

"This is the educational implementation of the selected
algorithm in the selected language."

============================================================
23. CODE VIEWER DESIGN
============================================================

Design it like an actual code editor.

Example:

┌─ ALGORITHM CODE ──────────────────────────────────────────┐
│ FCFS                           Language: [ C ▼ ]            │
├───────────────────────────────────────────────────────────┤
│ 01  #include <stdio.h>                                    │
│ 02                                                          │
│ 03  int main() {                                            │
│ 04      ...                                                 │
│ 05  }                                                       │
├───────────────────────────────────────────────────────────┤
│ [ Copy Code ]                                               │
└───────────────────────────────────────────────────────────┘

Use a dark code surface even if the main application uses
a light technical theme.

Do not use purple/blue syntax highlighting as the overall
application theme.

============================================================
24. LEARNING MODE
============================================================

Add an optional Learn Mode.

Example:

CURRENT TIME: 05

Ready Queue:
P2 BT=4
P3 BT=2
P4 BT=7

QUESTION:
Which process should SJF select?

○ P2
○ P3
○ P4

[Submit]

Then explain:

Correct.
SJF selects P3 because it has the smallest burst time
among the available processes.

This should be optional and should not interfere with
the main simulator.

============================================================
25. EXAMPLE DATASETS
============================================================

Add prebuilt examples.

Examples:

1. Basic Example
2. CPU Idle Example
3. Preemption Example
4. Round Robin Example
5. Same Arrival Time Example
6. Priority Example
7. Long Process Example

Button:
[Load Example]

This is especially useful for demonstrations and viva.

============================================================
26. RESPONSIVE DESIGN
============================================================

Desktop-first but fully responsive.

Desktop:
- sidebar
- two-column workspaces
- large Gantt chart

Tablet:
- collapsible sidebar
- stacked panels

Mobile:
- vertical layout
- horizontally scrollable Gantt chart
- compact process table
- collapsible code viewer
- sticky simulation controls

Do not allow the Gantt chart to become unreadable.

============================================================
27. ACCESSIBILITY
============================================================

Include:
- keyboard accessible controls
- visible focus states
- semantic buttons
- sufficient color contrast
- do not rely only on color to communicate process states
- readable labels
- accessible tooltips where needed

The difference between states should also be communicated
through icons, labels, borders, or patterns.

============================================================
28. ANIMATION GUIDELINES
============================================================

Animations should reinforce scheduling behavior.

Examples:

Process arrival:
READY QUEUE ← P3

Process dispatch:
READY QUEUE → CPU

Preemption:
CPU → READY QUEUE

Completion:
CPU → COMPLETED

Avoid excessive page animations.

Use smooth short transitions.

============================================================
29. ERROR HANDLING
============================================================

Handle:
- empty process list
- invalid numeric input
- negative arrival time
- zero/negative burst time
- duplicate PIDs
- invalid priority
- invalid time quantum
- comparison with fewer than two algorithms
- impossible/empty simulation state

Never allow the app to crash.

Show useful technical error messages.

============================================================
30. STATE MANAGEMENT
============================================================

Keep state understandable.

Suggested state:

processes
selectedAlgorithm
timeQuantum
simulationState
currentTime
isRunning
simulationSpeed
schedulingResult
selectedProcess
selectedLanguage
comparisonAlgorithms
comparisonResults

Avoid unnecessary global state libraries unless required.

============================================================
31. PERFORMANCE
============================================================

The application should remain responsive with:
- 10 processes
- 20 processes
- 50 processes
- reasonably large burst times

Avoid unnecessary re-renders.

Memoize expensive calculations where appropriate.

The scheduling engine should be deterministic.

============================================================
32. TESTING
============================================================

Test every algorithm thoroughly.

Test:
- one process
- multiple processes
- same arrival time
- idle CPU
- staggered arrivals
- equal burst times
- equal priorities
- large burst times
- preemption
- Round Robin quantum 1
- Round Robin larger quantum
- process arriving during execution

Verify:
- Gantt chart
- CT
- TAT
- WT
- RT
- average WT
- average TAT
- average RT
- CPU busy time
- CPU idle time
- CPU utilization

Make sure no metric contradicts the Gantt timeline.

============================================================
33. CODE QUALITY
============================================================

Use:
- clear function names
- TypeScript types
- modular functions
- comments for tricky scheduling decisions
- no duplicated calculation logic
- no hard-coded output
- no UI-specific logic inside algorithms

Avoid giant components.

Prefer reusable components.

============================================================
34. VISUAL HIERARCHY
============================================================

The most important element on the Visualizer page is:

1. Gantt Chart
2. CPU / Ready Queue state
3. Process input
4. Metrics
5. Code viewer
6. Supporting information

The Gantt chart should visually dominate.

============================================================
35. FINAL PAGE STRUCTURE
============================================================

HOME

- boot-style hero
- project description
- algorithm categories
- initialize simulation

VISUALIZER

- algorithm selector
- process input
- simulation controls
- CPU status
- ready queue
- Gantt chart
- system log
- metrics table
- performance summary
- code viewer

COMPARE

- algorithm multi-select
- shared process input
- individual Gantt charts
- comparison table
- graphs
- automatically generated observations

ALGORITHMS

- all 8 algorithms
- descriptions
- rules
- categories
- Try button

LEARN

- algorithm concepts
- optional interactive quiz/step mode

ABOUT

- project description
- technologies
- purpose

============================================================
36. DEMONSTRATION EXPERIENCE
============================================================

Optimize the application for a university project
demonstration and viva.

A typical demonstration should be:

1. Open SchedOS
2. Click Initialize Simulation
3. Select SRTF
4. Load Example
5. Show process table
6. Run simulation
7. Watch CPU execute processes
8. Show Gantt chart
9. Show metrics
10. Show average WT/TAT/RT
11. Show CPU utilization
12. Show CPU idle time
13. Open code viewer
14. Switch C -> Python -> JavaScript -> TypeScript
15. Open Compare
16. Select FCFS, SJF, SRTF, Round Robin
17. Run comparison
18. Show Gantt charts
19. Show performance table
20. Show comparison graphs

The complete experience should feel coherent and polished.

============================================================
37. IMPORTANT ALGORITHM IMPLEMENTATION RULE
============================================================

Do not prioritize visual design over correctness.

The scheduling calculations must be correct first.

For each algorithm:
- determine scheduling order correctly
- handle arrival times correctly
- handle idle CPU correctly
- handle preemption correctly
- generate the correct timeline
- calculate first response time correctly
- calculate CT/TAT/WT/RT from the final execution data

The Gantt timeline should be the source of truth for
performance calculations whenever practical.

============================================================
38. FINAL QUALITY STANDARD
============================================================

The finished SchedOS application should NOT feel like:
- a basic student CRUD application
- a calculator
- a static Gantt chart generator
- a generic admin dashboard
- a generic AI-generated website

It should feel like:

"An interactive operating-system laboratory for
understanding CPU scheduling."

The visual identity should be:
- technical
- memorable
- academic
- modern
- experimental
- distinctive
- highly interactive

Primary design inspiration:
RETRO COMPUTER TERMINAL + ENGINEERING LAB + TECHNICAL BLUEPRINT

Avoid purple and blue themes completely.

============================================================
39. FINAL ACCEPTANCE CHECKLIST
============================================================

Before considering the project complete, verify:

[ ] FCFS works
[ ] SJF works
[ ] LJF works
[ ] Priority non-preemptive works
[ ] SRTF works
[ ] LRTF works
[ ] Round Robin works
[ ] Priority preemptive works

[ ] Process input works
[ ] Priority appears when required
[ ] Time Quantum appears for Round Robin
[ ] Gantt chart works
[ ] CPU idle periods work
[ ] CT displayed
[ ] TAT displayed
[ ] WT displayed
[ ] RT displayed
[ ] Average WT displayed
[ ] Average TAT displayed
[ ] Average RT displayed
[ ] CPU utilization displayed
[ ] CPU idle time displayed
[ ] CPU busy time displayed

[ ] Play works
[ ] Pause works
[ ] Step works
[ ] Reset works
[ ] Speed control works
[ ] Ready queue visualization works
[ ] Execution log works

[ ] Comparison supports 2+ algorithms
[ ] Each comparison algorithm has Gantt chart
[ ] Comparison metrics work
[ ] Comparison graphs work
[ ] Comparative summary works

[ ] Code viewer works
[ ] C version exists
[ ] C++ version exists
[ ] Python version exists
[ ] JavaScript version exists
[ ] TypeScript version exists
[ ] All 8 algorithms have all 5 languages

[ ] Responsive design works
[ ] Accessibility is acceptable
[ ] Validation works
[ ] No console errors
[ ] No broken UI states
[ ] Theme contains no purple
[ ] Theme does not rely on blue
[ ] UI does not resemble a generic SaaS dashboard

Build the application completely, not as a mockup.

Use real scheduling calculations and real interactive state.

Do not replace functionality with static screenshots,
fake charts, hard-coded metrics, or placeholder algorithms.

When a feature is visually represented, it must be backed
by real application state and real scheduling logic.