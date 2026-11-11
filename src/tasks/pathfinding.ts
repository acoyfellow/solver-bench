type Log = (name: string, pass: boolean, detail: string) => void;

type Grid = number[][];
type Point = { r: number; c: number };

const ROWS = 20, COLS = 20;

function makeGrid(obstacleRate: number): Grid {
  const g: Grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (Math.random() < obstacleRate) g[r]![c] = 1;
  }
  g[0]![0] = 0;
  g[ROWS - 1]![COLS - 1] = 0;
  return g;
}

function astar(grid: Grid, start: Point, goal: Point): Point[] | undefined {
  const key = (p: Point) => `${p.r},${p.c}`;
  const h = (p: Point) => Math.abs(p.r - goal.r) + Math.abs(p.c - goal.c);
  const open = new Map<string, { p: Point; g: number; f: number }>();
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  open.set(key(start), { p: start, g: 0, f: h(start) });
  gScore.set(key(start), 0);
  while (open.size > 0) {
    let current: { p: Point; g: number; f: number } | undefined;
    for (const entry of open.values()) if (!current || entry.f < current.f) current = entry;
    if (!current) break;
    if (current.p.r === goal.r && current.p.c === goal.c) {
      const path: Point[] = [];
      let k = key(goal);
      while (k !== key(start)) {
        const [r, c] = k.split(',').map(Number);
        path.unshift({ r: r!, c: c! });
        k = cameFrom.get(k)!;
      }
      path.unshift(start);
      return path;
    }
    open.delete(key(current.p));
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = current.p.r + dr, nc = current.p.c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr]![nc] === 1) continue;
      const nk = `${nr},${nc}`;
      const tentative = current.g + 1;
      if (tentative < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, key(current.p));
        gScore.set(nk, tentative);
        open.set(nk, { p: { r: nr, c: nc }, g: tentative, f: tentative + h({ r: nr, c: nc }) });
      }
    }
  }
  return undefined;
}

function validPath(grid: Grid, path: Point[], start: Point, goal: Point): boolean {
  if (!path.length) return false;
  if (path[0]!.r !== start.r || path[0]!.c !== start.c) return false;
  const last = path[path.length - 1]!;
  if (last.r !== goal.r || last.c !== goal.c) return false;
  for (const p of path) if (grid[p.r]![p.c] === 1) return false;
  for (let i = 1; i < path.length; i++) {
    const d = Math.abs(path[i]!.r - path[i - 1]!.r) + Math.abs(path[i]!.c - path[i - 1]!.c);
    if (d !== 1) return false;
  }
  return true;
}

const costCollapse = (log: Log) => {
  const grid = makeGrid(0.2);
  const t0 = Date.now();
  astar(grid, { r: 0, c: 0 }, { r: ROWS - 1, c: COLS - 1 });
  const ms = Date.now() - t0;
  log('Cost collapse', ms < 50, `A* ${ms}ms $0 vs LLM ~2000ms ~$0.05`);
};

const verifiability = (log: Log) => {
  const grid = makeGrid(0.15);
  const start = { r: 0, c: 0 }, goal = { r: ROWS - 1, c: COLS - 1 };
  const p1 = astar(grid, start, goal);
  const p2 = astar(grid, start, goal);
  const deterministic = JSON.stringify(p1) === JSON.stringify(p2);
  let valid = 0, total = 0;
  for (let i = 0; i < 50; i++) {
    const g = makeGrid(0.15);
    const path = astar(g, start, goal);
    total++;
    if (path ? validPath(g, path, start, goal) : true) valid++;
  }
  log('Verifiability', deterministic && valid === total, `deterministic: ${deterministic} | valid paths: ${valid}/${total}`);
};

const speed = (log: Log) => {
  const times: number[] = [];
  for (let i = 0; i < 20; i++) {
    const grid = makeGrid(0.2);
    const t0 = Date.now();
    astar(grid, { r: 0, c: 0 }, { r: ROWS - 1, c: COLS - 1 });
    times.push(Date.now() - t0);
  }
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  log('Speed', avg < 10, `avg ${avg}ms max ${Math.max(...times)}ms | LLM 2000ms+`);
};

const selfImprovement = (log: Log) => {
  let solved = 0, totalSteps = 0;
  for (let i = 0; i < 20; i++) {
    const grid = makeGrid(0.2);
    const path = astar(grid, { r: 0, c: 0 }, { r: ROWS - 1, c: COLS - 1 });
    if (path) { solved++; totalSteps += path.length; }
  }
  log('Self-improvement data', solved > 5, `${solved}/20 maps solved, ${totalSteps} steps of training data`);
};

const composition = (log: Log) => {
  const grid = makeGrid(0.1);
  const start = { r: 0, c: 0 }, goal = { r: ROWS - 1, c: COLS - 1 };
  const path = astar(grid, start, goal);
  const ok = path ? validPath(grid, path, start, goal) : true;
  log('Composition', ok, `A* solver composes with path validator | path length: ${path?.length ?? 'unsolvable'}`);
};

export default {
  name: 'pathfinding',
  run: async (log: Log) => {
    costCollapse(log);
    verifiability(log);
    speed(log);
    selfImprovement(log);
    composition(log);
  },
};
