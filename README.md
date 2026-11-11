# solver-bench

Does giving an AI agent the ability to build deterministic solvers inside its loop help?

Each task defines a domain where an agent could either:
- **A)** Call an LLM for every decision (expensive, slow, unverifiable)
- **B)** Build a solver, verify it, then run it freely (fast, free, provable)

The benchmark scores option B on five proofs:
1. **Cost collapse** — solver is $0 vs ~$0.05/call
2. **Verifiability** — deterministic, property-testable
3. **Speed** — microseconds vs seconds
4. **Self-improvement** — solver generates training data for free
5. **Composition** — solver components compose (verdicts → ranking)

## Tasks

- **connect4** — Connect 4 minimax solver (alpha-beta, depth 9). 5/5 proofs.

## Run

```sh
bun run bench
```

Results in `results/latest.json`.
