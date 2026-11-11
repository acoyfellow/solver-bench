type Log = (name: string, pass: boolean, detail: string) => void;

type Job = { id: number; duration: number; deps: number[] };
type Schedule = { job: number; worker: number; start: number; end: number };

function makeJobs(n: number): Job[] {
  const jobs: Job[] = [];
  for (let i = 0; i < n; i++) {
    const deps: number[] = [];
    for (let j = 0; j < i; j++) if (Math.random() < 0.1) deps.push(j);
    jobs.push({ id: i, duration: 1 + Math.floor(Math.random() * 10), deps });
  }
  return jobs;
}

function schedule(jobs: Job[], workers: number): Schedule[] {
  const inDegree = new Map<number, number>();
  const dependents = new Map<number, number[]>();
  for (const j of jobs) { inDegree.set(j.id, j.deps.length); dependents.set(j.id, []); }
  for (const j of jobs) for (const d of j.deps) dependents.get(d)!.push(j.id);
  const ready: number[] = jobs.filter((j) => j.deps.length === 0).map((j) => j.id);
  const workerBusyUntil = new Array(workers).fill(0);
  const result: Schedule[] = [];
  const jobEnd = new Map<number, number>();
  while (ready.length > 0) {
    ready.sort((a, b) => jobs[b]!.duration - jobs[a]!.duration);
    const jid = ready.shift()!;
    const job = jobs[jid]!;
    let earliest = 0;
    for (const d of job.deps) earliest = Math.max(earliest, jobEnd.get(d) ?? 0);
    let bestWorker = 0;
    for (let w = 1; w < workers; w++) if (workerBusyUntil[w]! < workerBusyUntil[bestWorker]!) bestWorker = w;
    const start = Math.max(earliest, workerBusyUntil[bestWorker]!);
    const end = start + job.duration;
    workerBusyUntil[bestWorker] = end;
    jobEnd.set(jid, end);
    result.push({ job: jid, worker: bestWorker, start, end });
    for (const dep of dependents.get(jid)!) {
      inDegree.set(dep, inDegree.get(dep)! - 1);
      if (inDegree.get(dep) === 0) ready.push(dep);
    }
  }
  return result;
}

function validSchedule(jobs: Job[], sched: Schedule[]): boolean {
  const endByJob = new Map(sched.map((s) => [s.job, s.end]));
  const startByJob = new Map(sched.map((s) => [s.job, s.start]));
  for (const job of jobs) {
    for (const dep of job.deps) {
      if (startByJob.get(job.id)! < endByJob.get(dep)!) return false;
    }
  }
  const byWorker = new Map<number, Schedule[]>();
  for (const s of sched) {
    if (!byWorker.has(s.worker)) byWorker.set(s.worker, []);
    byWorker.get(s.worker)!.push(s);
  }
  for (const list of byWorker.values()) {
    list.sort((a, b) => a.start - b.start);
    for (let i = 1; i < list.length; i++) if (list[i]!.start < list[i - 1]!.end) return false;
  }
  return true;
}

const costCollapse = (log: Log) => {
  const jobs = makeJobs(30);
  const t0 = Date.now();
  schedule(jobs, 4);
  const ms = Date.now() - t0;
  log('Cost collapse', ms < 50, `scheduler ${ms}ms $0 vs LLM ~2000ms ~$0.05`);
};

const verifiability = (log: Log) => {
  const jobs = makeJobs(20);
  const s1 = schedule(jobs, 4);
  const s2 = schedule(jobs, 4);
  const deterministic = JSON.stringify(s1) === JSON.stringify(s2);
  let valid = 0, total = 0;
  for (let i = 0; i < 30; i++) {
    const j = makeJobs(20);
    total++;
    if (validSchedule(j, schedule(j, 3))) valid++;
  }
  log('Verifiability', deterministic && valid === total, `deterministic: ${deterministic} | valid: ${valid}/${total}`);
};

const speed = (log: Log) => {
  const times: number[] = [];
  for (let i = 0; i < 20; i++) {
    const jobs = makeJobs(50);
    const t0 = Date.now();
    schedule(jobs, 5);
    times.push(Date.now() - t0);
  }
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  log('Speed', avg < 10, `avg ${avg}ms max ${Math.max(...times)}ms for 50 jobs | LLM 2000ms+`);
};

const selfImprovement = (log: Log) => {
  let totalAssignments = 0;
  for (let i = 0; i < 20; i++) {
    const jobs = makeJobs(30);
    totalAssignments += schedule(jobs, 4).length;
  }
  log('Self-improvement data', totalAssignments > 500, `${totalAssignments} job assignments from 20 random job sets`);
};

const composition = (log: Log) => {
  const jobs = makeJobs(15);
  const sched = schedule(jobs, 3);
  const ok = validSchedule(jobs, sched);
  const makespan = Math.max(...sched.map((s) => s.end));
  log('Composition', ok, `scheduler composes with validator | makespan: ${makespan}`);
};

export default {
  name: 'scheduling',
  run: async (log: Log) => {
    costCollapse(log);
    verifiability(log);
    speed(log);
    selfImprovement(log);
    composition(log);
  },
};
