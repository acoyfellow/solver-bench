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

**Is this just programming?**
Yes. The question is whether an agent that writes a solver beats an agent that calls an LLM for each decision. The benchmark runs both and scores the difference.

**Why Connect 4?**
Connect 4 is solved. A winning move is verifiable. If the solver approach fails on a game with ground truth, it will fail on harder problems. The game is the test, not the point.

**Can this scale to chess?**
No. Chess has roughly 10^47 positions. Connect 4 has roughly 10^13. The solver approach works when the search space fits in the available time. The benchmark runs at depth 9 and finishes in under 250ms. It makes no claim about deeper games.

**What if the solver is wrong?**
Each task runs property tests. Connect4 checks the solver picks the same move on 99 random boards. Pathfinding checks every path avoids walls and reaches the goal. Scheduling checks every job respects dependencies. An LLM call does not pass these tests because it has no contract.

**Why not use an LLM with tools?**
You can. Each call costs about $0.05 and takes about 2 seconds. The solver costs $0 and takes 1-250ms depending on the task. The benchmark measures both on the same problems so you can decide.

**What is the handwired experiment?**
A separate folder (`games/c4/handwired/`) compiles the Connect 4 solver into a differentiable circuit. The circuit matches the JS solver on 81 random boards. It shows the evaluation function can be trained. This benchmark does not depend on it.

**Who should use this?**
Anyone building an agent that repeats a decision. If the agent makes the same kind of choice more than a few times, a solver is cheaper and faster. The benchmark gives you the measurement.

## Explanation

Agents default to asking an LLM to "think" about every decision. But many problems have rules — deterministic, verifiable, fast. An agent that builds a solver once and runs it millions of times collapses cost, gains verifiability, and explores freely.

The constraint is taste: the agent must recognize which problems are solvable deterministically. Games, pathfinding, scheduling, parsing — these have rules. The benchmark measures whether the solver approach delivers the five unlocks, task by task, with numbers.
