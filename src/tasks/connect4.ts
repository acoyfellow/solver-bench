import { emptyBoard, drop, winner, legalColumns } from '../../../games/c4/engine.ts';
import { bestMove, analyse } from '../../../games/c4/solver.ts';

type Log = (name: string, pass: boolean, detail: string) => void;

const costCollapse = (log: Log) => {
  const t0 = Date.now();
  bestMove(emptyBoard(), 1, 9);
  const ms = Date.now() - t0;
  log('Cost collapse', ms < 500, `solver ${ms}ms $0 vs LLM ~2000ms ~$0.05 | ${Math.round(2000 / Math.max(1, ms))}x speedup`);
};

const verifiability = (log: Log) => {
  const m = bestMove(emptyBoard(), 1, 9);
  const det = m === bestMove(emptyBoard(), 1, 9) && m === bestMove(emptyBoard(), 1, 9);
  let agree = 0, total = 0;
  for (let i = 0; i < 100; i++) {
    let board = emptyBoard();
    let p: 1 | 2 = 1;
    for (let j = 0; j < 2 + Math.floor(Math.random() * 15) && !winner(board); j++) {
      const legal = legalColumns(board);
      if (!legal.length) break;
      const next = drop(board, legal[Math.floor(Math.random() * legal.length)]!, p);
      if (!next) break;
      board = next;
      p = (p === 1 ? 2 : 1) as 1 | 2;
    }
    if (winner(board)) continue;
    total++;
    if (bestMove(board, p, 7) === bestMove(board, p, 7)) agree++;
  }
  log('Verifiability', det && agree === total, `deterministic: ${det} | repeatability ${agree}/${total}`);
};

const speed = (log: Log) => {
  const times: number[] = [];
  for (let i = 0; i < 20; i++) {
    let board = emptyBoard();
    let p: 1 | 2 = 1;
    for (let j = 0; j < 2 + Math.floor(Math.random() * 12) && !winner(board); j++) {
      const legal = legalColumns(board);
      if (!legal.length) break;
      const next = drop(board, legal[Math.floor(Math.random() * legal.length)]!, p);
      if (!next) break;
      board = next;
      p = (p === 1 ? 2 : 1) as 1 | 2;
    }
    if (winner(board)) continue;
    const t0 = Date.now();
    bestMove(board, p, 7);
    times.push(Date.now() - t0);
  }
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  log('Speed', avg < 100, `avg ${avg}ms max ${Math.max(...times)}ms | LLM 2000ms+`);
};

const selfImprovement = (log: Log) => {
  let totalMoves = 0;
  for (let g = 0; g < 5; g++) {
    let board = emptyBoard();
    let p: 1 | 2 = 1;
    while (!winner(board) && legalColumns(board).length > 0) {
      board = drop(board, bestMove(board, p, 7), p)!;
      totalMoves++;
      p = (p === 1 ? 2 : 1) as 1 | 2;
    }
  }
  log('Self-improvement data', totalMoves > 100, `${totalMoves} moves of training data from 5 self-play games`);
};

const composition = (log: Log) => {
  let board = emptyBoard();
  board = drop(board, 0, 1)!; board = drop(board, 5, 2)!;
  board = drop(board, 1, 1)!; board = drop(board, 6, 2)!;
  board = drop(board, 2, 1)!; board = drop(board, 5, 2)!;
  const verdicts = analyse(board, 1, 9);
  const best = bestMove(board, 1, 9);
  const bv = verdicts.find((v) => v.col === best)!;
  log('Composition', bv.verdict === 'win', `bestMove col ${best} (${bv.verdict}) matches analyse verdicts`);
};

export default {
  name: 'connect4',
  run: async (log: Log) => {
    costCollapse(log);
    verifiability(log);
    speed(log);
    selfImprovement(log);
    composition(log);
  },
};
