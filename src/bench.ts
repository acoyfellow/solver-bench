import { writeFileSync, mkdirSync } from 'node:fs';
import { tasks } from './tasks/index.ts';

export type TaskResult = {
  task: string;
  proofs: { name: string; pass: boolean; detail: string }[];
  score: number;
  durationMs: number;
};

export type BenchReport = {
  timestamp: string;
  totalScore: number;
  maxScore: number;
  results: TaskResult[];
};

const main = async () => {
  const report: BenchReport = { timestamp: new Date().toISOString(), totalScore: 0, maxScore: 0, results: [] };
  for (const task of tasks) {
    const t0 = Date.now();
    const proofs: TaskResult['proofs'] = [];
    const log = (name: string, pass: boolean, detail: string) => proofs.push({ name, pass, detail });
    await task.run(log);
    const score = proofs.filter((p) => p.pass).length;
    report.totalScore += score;
    report.maxScore += proofs.length;
    report.results.push({ task: task.name, proofs, score, durationMs: Date.now() - t0 });
    console.log(`\n${task.name}: ${score}/${proofs.length}`);
    for (const p of proofs) console.log(`  ${p.pass ? 'PASS' : 'FAIL'}  ${p.name}\n        ${p.detail}`);
  }
  console.log(`\nTotal: ${report.totalScore}/${report.maxScore}`);
  mkdirSync(new URL('../results', import.meta.url).pathname, { recursive: true });
  writeFileSync(new URL('../results/latest.json', import.meta.url).pathname, JSON.stringify(report, null, 2));
  if (report.totalScore < report.maxScore) process.exit(1);
};

await main();
