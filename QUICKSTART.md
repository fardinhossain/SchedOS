# SchedOS — Quick Start

Two ways to run this. Pick whichever suits the moment.

---

## 1. No install needed — just open it

```
dist/index.html
```

Double-click that file (or drag it into any browser). It is a **single self-contained
841 KB HTML file** with everything inlined — React, the scheduling engine, all 24 code
samples, the charts. No server, no `npm`, no internet connection required.

This is the version to put on a USB stick for a demonstration. It cannot fail because
someone's Wi-Fi dropped.

> The only thing it fetches from the network is the two Google Fonts (JetBrains Mono and
> Space Grotesk). Offline it falls back to your system monospace and sans — everything still
> works, it just looks slightly less sharp.

---

## 2. Full development setup

Requires **Node.js 18 or newer** (built and tested on Node 24).

```bash
npm install         # ~110 packages, takes about 20 seconds
npm run dev         # http://localhost:5173
```

Other commands:

```bash
npm run test        # 537 engine tests — run this first if you want proof it's correct
npm run build       # type-check, then rebuild dist/index.html
npm run preview     # serve the production build locally
```

`package-lock.json` is included, so `npm ci` gives you a byte-identical dependency tree to
the one this was developed against.

---

## Where to look first

| You want to… | Go to |
|---|---|
| See the algorithms run | **Visualizer** — pick an algorithm, Load Example, Run Simulation, Play |
| Compare performance | **Compare** — tick 2+ algorithms, Run Comparison |
| Read the scheduling code | **Algorithms** — expand any card, switch C / Python / TypeScript |
| Understand the maths | **About** — every formula and convention, stated explicitly |
| Check the engine | `npm run test`, or read `src/test/algorithms.test.ts` |

The scheduling engine lives in `src/engine/` and `src/algorithms/`. It is plain TypeScript
with no React dependency, which is why it can be tested in isolation.

See `README.md` for the architecture, the engine conventions (tie-breaking, priority
direction, how CPU idle time is defined) and the testing strategy.
