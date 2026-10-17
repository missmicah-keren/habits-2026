export const YEAR = 2026;
const DAYS_IN_YEAR = 365;
const STORAGE_KEY = 'habits-2026';

export interface Habit {
  id: number;
  name: string;
  goal?: string;
  unit?: string;
  target?: number;
}

/** habit id -> set of completed day keys ("YYYY-M-D") */
export type DoneMap = Record<number, Record<string, 1>>;

export interface TrackerState {
  habits: Habit[];
  done: DoneMap;
}

const SAMPLE_HABITS: (Habit & { demoRate: number })[] = [
  { id: 1, name: 'Read 20 pages', goal: 'Read 24 books', unit: 'days', target: 300, demoRate: 0.8 },
  { id: 2, name: 'Run 5 km', goal: 'Run 1,000 km', unit: 'runs', target: 150, demoRate: 0.45 },
  { id: 3, name: 'Meditate', goal: 'Meditate daily', unit: 'days', target: 330, demoRate: 0.85 },
  { id: 4, name: 'Write 500 words', goal: 'Finish a draft', unit: 'days', target: 200, demoRate: 0.55 },
  { id: 5, name: 'Lights out by 11', goal: 'Sleep 7+ hours', unit: 'days', target: 280, demoRate: 0.7 },
];

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(d: Date, offset: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + offset);
  return r;
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function streak(done: DoneMap, id: number, today: Date): number {
  const m = done[id] ?? {};
  let n = 0;
  // A streak that hasn't been extended today yet still counts from yesterday.
  let o = m[dayKey(today)] ? 0 : -1;
  while (m[dayKey(addDays(today, o))]) {
    n++;
    o--;
  }
  return n;
}

export function countInYear(done: DoneMap, id: number): number {
  const prefix = `${YEAR}-`;
  return Object.keys(done[id] ?? {}).filter((k) => k.startsWith(prefix)).length;
}

/** 1-based day of YEAR for `today`, clamped to the year. */
export function dayOfYear(today: Date): number {
  const doy = Math.round((today.getTime() - new Date(YEAR, 0, 0).getTime()) / 864e5);
  return Math.min(DAYS_IN_YEAR, Math.max(0, doy));
}

export { DAYS_IN_YEAR };

function sampleState(withHistory: boolean, today: Date): TrackerState {
  const done: DoneMap = {};
  for (const h of SAMPLE_HABITS) {
    done[h.id] = {};
    if (!withHistory) continue;
    // Deterministic pseudo-random history, same generator as the design prototype.
    for (let i = 1; i <= 290; i++) {
      const x = Math.sin(i * h.id * 12.9898) * 43758.5453;
      if (x - Math.floor(x) < h.demoRate) done[h.id][dayKey(addDays(today, -i))] = 1;
    }
  }
  const habits = SAMPLE_HABITS.map(({ demoRate: _, ...h }) => h);
  return { habits, done };
}

export function isDemo(): boolean {
  return new URLSearchParams(window.location.search).has('demo');
}

export function loadState(today: Date): TrackerState {
  if (isDemo()) return sampleState(true, today);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TrackerState;
      if (Array.isArray(parsed.habits) && parsed.done && typeof parsed.done === 'object') return parsed;
    }
  } catch {
    // Unreadable or blocked storage: fall through to a fresh start.
  }
  return sampleState(false, today);
}

export function saveState(state: TrackerState): void {
  if (isDemo()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked; the session keeps working in memory.
  }
}
