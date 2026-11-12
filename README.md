# solver-bench

Does giving an AI agent the ability to build deterministic solvers beat calling an LLM for every decision?

Each task pits a hand-built solver against the LLM baseline on five proofs: cost, verifiability, speed, self-improvement data, and composition.

## Quick start

```sh
bun run bench
```

Results in `results/latest.json`.

## Tutorial

Three tasks — **connect4**, **pathfinding**, **scheduling** — each run the same five proofs:

1. **Cost collapse** — solver is $0 vs ~$0.05/call
2. **Verifiability** — same input → same output, property-testable
3. **Speed** — milliseconds vs seconds
4. **Self-improvement** — solver generates training data for free
5. **Composition** — solver components compose

Connect4: minimax with alpha-beta at depth 9. Pathfinding: A\* on 20×20 grid. Scheduling: topological sort + greedy on 50 jobs.

```
connect4: 5/5
pathfinding: 5/5
scheduling: 5/5
Total: 15/15
```

## How to add a task

Create `src/tasks/<name>.ts`:

```ts
type Log = (name: string, pass: boolean, detail: string) => void;

export default {
  name: 'mytask',
  run: async (log: Log) => {
    log('Cost collapse', true, 'solver 1ms $0 vs LLM 2000ms $0.05');
    // ... four more proofs
  },
};
```

Register in `src/tasks/index.ts`. Run `bun run bench`.

## Reference

| File | What |
|---|---|
| `src/bench.ts` | Harness, writes `results/latest.json` |
| `src/tasks/index.ts` | Task registry |
| `src/tasks/connect4.ts` | Connect 4 minimax solver |
| `src/tasks/pathfinding.ts` | A\* grid pathfinding |
| `src/tasks/scheduling.ts` | Constraint job scheduler |

## FAQ

**Isn't this just... programming?**
Yes. That's the point. The benchmark measures whether an agent that *writes code* beats an agent that *asks an LLM to think*. The five proofs are the scorecard.

**Why Connect 4? It's a toy problem.**
It's solved, verifiable, and has ground truth — a winning move is a winning move. If the solver approach can't prove itself on a solved game, it has no business on harder problems. The point isn't the game, it's the pattern.

**Can this scale to chess?**
No. Chess has ~10^47 positions. Connect 4 has ~10^13. The solver approach works when the search space is tractable. The benchmark doesn't claim otherwise — it measures the pattern, not the ceiling.

**What if the solver is wrong?**
That's what property-based testing is for. Each task verifies determinism (same input → same output) and correctness (path validity, schedule constraints, win detection). An LLM call can't be verified this way. A solver can.

**Why not just use an LLM + tools?**
You can. But every LLM call costs money and time, and the output is a sample, not a function. The solver compiles the decision into code that runs for free, instantly, and provably. The question is whether that tradeoff wins — the benchmark answers with numbers.

**What's the handwired thing?**
A separate experiment in `games/c4/handwired/` — compiling the solver into a differentiable neural net. The proof: the handwired circuit matches the JS solver on random boards. It shows the evaluation function can be trained, not just hand-tuned. The benchmark doesn't depend on it.

**Who is this for?**
Anyone building agents. If your agent makes the same kind of decision more than a few times, it probably should compile a solver instead of asking the LLM each time. This benchmark gives you the receipts.

## Explanation

Agents default to asking an LLM to "think" about every decision. But many problems have rules — deterministic, verifiable, fast. An agent that builds a solver once and runs it millions of times collapses cost, gains verifiability, and explores freely.

The constraint is taste: the agent must recognize which problems are solvable deterministically. Games, pathfinding, scheduling, parsing — these have rules. The benchmark measures whether the solver approach delivers the five unlocks, task by task, with numbers.
