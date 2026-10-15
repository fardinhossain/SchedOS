# Contributing to SchedOS

Thank you for your interest in contributing to **SchedOS — Interactive CPU Scheduling Laboratory**!

We welcome contributions from students, educators, and developers worldwide. Here is how you can help.

---

## 🛠️ Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/SchedOS.git
   cd SchedOS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing Guidelines

SchedOS is built around mathematically verified scheduling engines. All changes must maintain existing algorithmic invariants.

Run the test suite before submitting a Pull Request:
```bash
npm run test
```

### Testing Principles:
- **Zero React dependencies in algorithm engine**: `src/engine/` and `src/algorithms/` must remain pure TypeScript.
- **The Gantt timeline is the single source of truth**: Metrics ($CT, TAT, WT, RT$) are derived strictly by `metrics.ts` from the timeline.
- Add unit tests for any new edge case, tie-breaking behavior, or formula adjustment.

---

## 📦 Building

To ensure that the single-file self-contained bundle builds without errors:
```bash
npm run build
```

---

## 🚀 Submitting a Pull Request

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit your changes: `git commit -m "feat: describe your change"`
3. Push to your branch: `git push origin feature/amazing-feature`
4. Open a Pull Request on GitHub against the `main` branch.

Please ensure:
- All 550+ tests pass (`npm run test`).
- TypeScript compiles cleanly with no errors (`npm run build`).
- Code follows the project's styling and structure.

---

## 📄 License

By contributing to SchedOS, you agree that your contributions will be licensed under its [MIT License](LICENSE).
