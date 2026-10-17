import { useEffect, useState, type FormEvent } from 'react';
import { APP_NAME, DEFAULT_TARGET, DEFAULT_UNIT } from './config';
import {
  addDays,
  countInYear,
  dayKey,
  dayOfYear,
  daysInYear,
  loadState,
  saveState,
  startOfToday,
  streak,
  type Habit,
  type TrackerState,
} from './habits';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function App() {
  const today = startOfToday();
  const year = today.getFullYear();
  const [state, setState] = useState<TrackerState>(() => loadState(today));
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    document.title = `${APP_NAME} ${year}`;
  }, [year]);

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

  const saveHabit = (updated: Habit) => {
    setState((s) => ({ ...s, habits: s.habits.map((h) => (h.id === updated.id ? updated : h)) }));
    setEditingId(null);
  };

  const deleteHabit = (id: number) => {
    setState((s) => {
      const { [id]: _, ...rest } = s.done;
      return { habits: s.habits.filter((h) => h.id !== id), done: rest };
    });
    setEditingId(null);
  };

  const yearDays = daysInYear(year);
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
            <h1 className="title">
              {APP_NAME} {year}
            </h1>
          </div>
          <div className="year">
            <div className="year-label">
              <span>Year progress</span>
              <span>
                Day {doy} of {yearDays}
              </span>
            </div>
            <div className="year-track">
              <div className="year-fill" style={{ width: `${((doy / yearDays) * 100).toFixed(1)}%` }} />
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
              <span className="stat-suffix"> {bestStreak === 1 ? 'day' : 'days'}</span>
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

            {habits.length === 0 && (
              <div className="empty">No habits yet. Add your first one below, then tap a day to tick it off.</div>
            )}

            {habits.map((h) =>
              editingId === h.id ? (
                <HabitEditor
                  key={h.id}
                  habit={h}
                  onSave={saveHabit}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => deleteHabit(h.id)}
                />
              ) : (
                <div key={h.id} className="habit-row">
                  <div className="habit-info">
                    <div className="habit-name">{h.name}</div>
                    <div className="habit-streak">
                      {streak(done, h.id, today)}-day streak
                      <span aria-hidden="true"> · </span>
                      <button type="button" className="link-button" onClick={() => setEditingId(h.id)}>
                        Edit
                      </button>
                    </div>
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
              ),
            )}

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
            <h2 className="card-title">{year} goals</h2>
            {habits.length === 0 && <div className="empty">Each habit gets a yearly goal here. Tap Edit on a habit to set it.</div>}
            {habits.map((h) => {
              const target = h.target ?? DEFAULT_TARGET;
              const count = countInYear(done, h.id, year);
              const pct = Math.min(100, (count / target) * 100).toFixed(1);
              return (
                <div key={h.id}>
                  <div className="goal-head">
                    <span className="goal-name">{h.goal || h.name}</span>
                    <span className="goal-count">
                      {count} / {target} {h.unit || DEFAULT_UNIT}
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

interface HabitEditorProps {
  habit: Habit;
  onSave: (habit: Habit) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function HabitEditor({ habit, onSave, onCancel, onDelete }: HabitEditorProps) {
  const [name, setName] = useState(habit.name);
  const [goal, setGoal] = useState(habit.goal ?? '');
  const [target, setTarget] = useState(String(habit.target ?? DEFAULT_TARGET));
  const [unit, setUnit] = useState(habit.unit ?? DEFAULT_UNIT);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const t = Math.max(1, Math.round(Number(target)) || DEFAULT_TARGET);
    onSave({ ...habit, name: n, goal: goal.trim() || undefined, target: t, unit: unit.trim() || DEFAULT_UNIT });
  };

  const remove = () => {
    if (window.confirm(`Delete "${habit.name}" and all its ticked days?`)) onDelete();
  };

  return (
    <form className="editor" onSubmit={submit}>
      <label className="field">
        <span className="field-label">Habit</span>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span className="field-label">Yearly goal</span>
        <input
          className="field-input"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={`e.g. ${name || 'Read 24 books'}`}
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span className="field-label">Target</span>
          <input
            className="field-input"
            type="number"
            min={1}
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Unit</span>
          <input className="field-input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="days" />
        </label>
      </div>
      <div className="editor-actions">
        <button type="button" className="delete-button" onClick={remove}>
          Delete
        </button>
        <span className="spacer" />
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="add-button">
          Save
        </button>
      </div>
    </form>
  );
}
