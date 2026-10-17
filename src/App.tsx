import { useEffect, useState, type FormEvent } from 'react';
import {
  DAYS_IN_YEAR,
  addDays,
  countInYear,
  dayKey,
  dayOfYear,
  loadState,
  saveState,
  startOfToday,
  streak,
  type TrackerState,
} from './habits';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DEFAULT_TARGET = 300;
const DEFAULT_UNIT = 'days';

export function App() {
  const today = startOfToday();
  const [state, setState] = useState<TrackerState>(() => loadState(today));
  const [newName, setNewName] = useState('');

  useEffect(() => saveState(state), [state]);

  const { habits, done } = state;
  const todayKey = dayKey(today);
  const week = [-6, -5, -4, -3, -2, -1, 0].map((o) => addDays(today, o));

  const toggle = (id: number, key: string) =>
    setState((s) => {
      const m = { ...(s.done[id] ?? {}) };
      if (m[key]) delete m[key];
      else m[key] = 1;
      return { ...s, done: { ...s.done, [id]: m } };
    });

  const addHabit = (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setState((s) => ({
      ...s,
      habits: [...s.habits, { id: Date.now(), name, target: DEFAULT_TARGET, unit: DEFAULT_UNIT }],
    }));
    setNewName('');
  };

  const doy = dayOfYear(today);
  const doneToday = habits.filter((h) => done[h.id]?.[todayKey]).length;
  const bestStreak = Math.max(0, ...habits.map((h) => streak(done, h.id, today)));
  const weekDone = habits.reduce((a, h) => a + week.filter((d) => done[h.id]?.[dayKey(d)]).length, 0);
  const weekPct = habits.length ? Math.round((weekDone / (habits.length * 7)) * 100) : 0;
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div>
            <div className="eyebrow">{dateLabel}</div>
            <h1 className="title">Habits 2026</h1>
          </div>
          <div className="year">
            <div className="year-label">
              <span>Year progress</span>
              <span>
                Day {doy} of {DAYS_IN_YEAR}
              </span>
            </div>
            <div className="year-track">
              <div className="year-fill" style={{ width: `${((doy / DAYS_IN_YEAR) * 100).toFixed(1)}%` }} />
            </div>
          </div>
        </header>

        <section className="stats">
          <div className="stat stat-primary">
            <div className="stat-label">Done today</div>
            <div className="stat-value">
              {doneToday}
              <span className="stat-suffix"> / {habits.length}</span>
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Best current streak</div>
            <div className="stat-value">
              {bestStreak}
              <span className="stat-suffix"> days</span>
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Last 7 days</div>
            <div className="stat-value">
              {weekPct}
              <span className="stat-suffix">%</span>
            </div>
          </div>
        </section>

        <div className="panels">
          <section className="card week">
            <div className="week-head">
              <h2 className="card-title">This week</h2>
              <div className="cells">
                {week.map((d, i) => (
                  <div key={dayKey(d)} className={`day-head${i === 6 ? ' is-today' : ''}`}>
                    {DAY_LETTERS[d.getDay()]}
                    <div className="day-num">{d.getDate()}</div>
                  </div>
                ))}
              </div>
            </div>

            {habits.map((h) => (
              <div key={h.id} className="habit-row">
                <div className="habit-info">
                  <div className="habit-name">{h.name}</div>
                  <div className="habit-streak">{streak(done, h.id, today)}-day streak</div>
                </div>
                <div className="cells">
                  {week.map((d) => {
                    const k = dayKey(d);
                    const on = !!done[h.id]?.[k];
                    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                    return (
                      <button
                        key={k}
                        type="button"
                        className={`cell${on ? ' is-on' : ''}${k === todayKey ? ' is-today' : ''}`}
                        aria-pressed={on}
                        aria-label={`${h.name}, ${label}`}
                        onClick={() => toggle(h.id, k)}
                      >
                        {on ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <form className="add" onSubmit={addHabit}>
              <input
                className="add-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New habit"
                aria-label="New habit"
              />
              <button className="add-button" type="submit">
                Add
              </button>
            </form>
          </section>

          <section className="card goals">
            <h2 className="card-title">2026 goals</h2>
            {habits.map((h) => {
              const target = h.target ?? DEFAULT_TARGET;
              const count = countInYear(done, h.id);
              const pct = Math.min(100, (count / target) * 100).toFixed(1);
              return (
                <div key={h.id}>
                  <div className="goal-head">
                    <span className="goal-name">{h.goal ?? h.name}</span>
                    <span className="goal-count">
                      {count} / {target} {h.unit ?? DEFAULT_UNIT}
                    </span>
                  </div>
                  <div className="goal-track">
                    <div className="goal-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="note">Goal totals count every completed day this year.</div>
          </section>
        </div>
      </div>
    </div>
  );
}
