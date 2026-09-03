"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Exercise = { id: string; name: string; target: string; icon: string; color: string };
type Session = { id: string; name: string; subtitle: string; icon: string; color: string; exercises: Exercise[] };
type LogEntry = { id?: number; date: string; session: string; exerciseId: string; weight: number | null; reps: number | null };
type Draft = Record<string, { weight: string; reps: string }>;

const plans: Session[] = [
  { id:"push", name:"Push Day", subtitle:"Chest, shoulders & triceps", icon:"🎯", color:"coral", exercises:[
    { id:"bench-press", name:"Bench press", target:"3 sets · 6–8 reps", icon:"💊", color:"coral" },
    { id:"overhead-press", name:"Overhead press", target:"3 sets · 8–10 reps", icon:"⚡", color:"yellow" },
    { id:"incline-db-press", name:"Incline dumbbell press", target:"3 sets · 10–12 reps", icon:"🎯", color:"blue" },
    { id:"cable-fly", name:"Cable fly", target:"3 sets · 12–15 reps", icon:"🦾", color:"mint" },
  ]},
  { id:"pull", name:"Pull Day", subtitle:"Back & biceps", icon:"⚡", color:"blue", exercises:[
    { id:"deadlift", name:"Deadlift", target:"3 sets · 5 reps", icon:"🏔️", color:"blue" },
    { id:"lat-pulldown", name:"Lat pulldown", target:"3 sets · 8–10 reps", icon:"🪂", color:"mint" },
    { id:"barbell-row", name:"Barbell row", target:"3 sets · 8–10 reps", icon:"🚣", color:"yellow" },
    { id:"bicep-curl", name:"Bicep curl", target:"3 sets · 10–12 reps", icon:"💪", color:"coral" },
  ]},
  { id:"legs", name:"Leg Day", subtitle:"Quads, glutes & calves", icon:"🦵", color:"yellow", exercises:[
    { id:"back-squat", name:"Back squat", target:"4 sets · 6–8 reps", icon:"🏆", color:"yellow" },
    { id:"romanian-deadlift", name:"Romanian deadlift", target:"3 sets · 8–10 reps", icon:"🌲", color:"mint" },
    { id:"leg-press", name:"Leg press", target:"3 sets · 10–12 reps", icon:"🚀", color:"blue" },
    { id:"calf-raise", name:"Calf raise", target:"4 sets · 12–15 reps", icon:"⬆️", color:"coral" },
  ]},
  { id:"full", name:"Full Body", subtitle:"Everything, everywhere", icon:"🌀", color:"mint", exercises:[
    { id:"goblet-squat", name:"Goblet squat", target:"3 sets · 10 reps", icon:"🏆", color:"yellow" },
    { id:"push-up", name:"Push-up", target:"3 sets · max reps", icon:"🪶", color:"coral" },
    { id:"one-arm-row", name:"One-arm row", target:"3 sets · 10 reps", icon:"🚣", color:"blue" },
    { id:"farmer-carry", name:"Farmer carry", target:"3 sets · 40 sec", icon:"🧳", color:"mint" },
  ]},
];

const allExercises = plans.flatMap((plan) => plan.exercises.map((exercise) => ({ ...exercise, session: plan.name })));
const starterHistory: LogEntry[] = [
  { date:"2026-05-08",session:"push",exerciseId:"bench-press",weight:155,reps:8 }, { date:"2026-05-22",session:"push",exerciseId:"bench-press",weight:165,reps:7 },
  { date:"2026-06-05",session:"push",exerciseId:"bench-press",weight:175,reps:6 }, { date:"2026-06-19",session:"push",exerciseId:"bench-press",weight:185,reps:6 },
  { date:"2026-05-08",session:"push",exerciseId:"overhead-press",weight:75,reps:8 }, { date:"2026-06-19",session:"push",exerciseId:"overhead-press",weight:95,reps:6 },
  { date:"2026-05-10",session:"legs",exerciseId:"back-squat",weight:185,reps:8 }, { date:"2026-06-21",session:"legs",exerciseId:"back-squat",weight:225,reps:6 },
  { date:"2026-05-12",session:"pull",exerciseId:"deadlift",weight:225,reps:5 }, { date:"2026-06-23",session:"pull",exerciseId:"deadlift",weight:275,reps:5 },
];

function localISO(date = new Date()) { const d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function fromISO(value: string) { return new Date(`${value}T12:00:00`); }
function shiftDate(value: string, amount: number) { const date = fromISO(value); date.setDate(date.getDate() + amount); return localISO(date); }
function prettyDate(value: string, full = true) { return new Intl.DateTimeFormat("en-US", full ? { weekday:"long", month:"long", day:"numeric" } : { month:"short", day:"numeric" }).format(fromISO(value)); }
function blankDraft(plan: Session): Draft { return Object.fromEntries(plan.exercises.map((exercise) => [exercise.id, { weight:"", reps:"" }])); }

export default function Home() {
  const [view, setView] = useState<"log"|"progress">("log");
  const [selectedDate, setSelectedDate] = useState(localISO);
  const [sessionId, setSessionId] = useState("push");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [draft, setDraft] = useState<Draft>(() => blankDraft(plans[0]));
  const [status, setStatus] = useState<"idle"|"loading"|"saving"|"saved"|"error">("loading");
  const [progressExercise, setProgressExercise] = useState("bench-press");
  const dateInput = useRef<HTMLInputElement>(null);
  const selectedPlan = plans.find((plan) => plan.id === sessionId) ?? plans[0];

  useEffect(() => {
    fetch("/api/workouts").then(async (response) => {
      if (!response.ok) throw new Error("Could not load workouts");
      return response.json() as Promise<{ logs: LogEntry[] }>;
    }).then((data) => { setLogs(data.logs); setStatus("idle"); }).catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    const existing = logs.filter((entry) => entry.date === selectedDate && entry.session === sessionId);
    const next = blankDraft(selectedPlan);
    existing.forEach((entry) => { if (next[entry.exerciseId]) next[entry.exerciseId] = { weight: entry.weight?.toString() ?? "", reps: entry.reps?.toString() ?? "" }; });
    setDraft(next);
  }, [selectedDate, sessionId, logs, selectedPlan]);

  const week = useMemo(() => {
    const anchor = fromISO(selectedDate); const mondayOffset = (anchor.getDay() + 6) % 7; anchor.setDate(anchor.getDate() - mondayOffset);
    return Array.from({length:7}, (_, index) => { const date = new Date(anchor); date.setDate(anchor.getDate()+index); return { iso:localISO(date), weekday:date.toLocaleDateString("en-US",{weekday:"short"}).toUpperCase(), day:date.getDate() }; });
  }, [selectedDate]);

  const effectiveLogs = logs.length ? logs : starterHistory;
  const exerciseHistory = effectiveLogs.filter((entry) => entry.exerciseId === progressExercise && entry.weight != null).sort((a,b) => a.date.localeCompare(b.date));
  const exerciseInfo = allExercises.find((exercise) => exercise.id === progressExercise) ?? allExercises[0];
  const firstWeight = exerciseHistory[0]?.weight ?? 0; const bestWeight = Math.max(0, ...exerciseHistory.map((entry) => entry.weight ?? 0));
  const gain = firstWeight ? bestWeight - firstWeight : 0; const maxChart = bestWeight || 1;
  const completedCount = Object.values(draft).filter((entry) => entry.weight || entry.reps).length;

  function selectSession(id: string) { setSessionId(id); setStatus("idle"); }
  function updateDraft(id: string, field: "weight"|"reps", value: string) { if (/^\d{0,4}(\.\d{0,2})?$/.test(value)) setDraft((current) => ({...current,[id]:{...current[id],[field]:value}})); }
  async function saveWorkout() {
    setStatus("saving");
    const entries = selectedPlan.exercises.map((exercise) => ({ exerciseId:exercise.id, weight:draft[exercise.id]?.weight ? Number(draft[exercise.id].weight) : null, reps:draft[exercise.id]?.reps ? Number(draft[exercise.id].reps) : null }));
    try {
      const response = await fetch("/api/workouts", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({date:selectedDate,session:sessionId,entries}) });
      const data = await response.json() as { logs?: LogEntry[] };
      if (!response.ok || !data.logs) throw new Error("Save failed");
      setLogs(data.logs); setStatus("saved"); window.setTimeout(() => setStatus("idle"), 2200);
    } catch { setStatus("error"); }
  }

  return <main className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setView("log")}><span className="brand-mark">💪</span><span>Rep Quest</span></button>
      <nav aria-label="Main navigation"><button className={`nav-link ${view === "log" ? "active" : ""}`} onClick={() => setView("log")}>Log workout</button><button className={`nav-link ${view === "progress" ? "active" : ""}`} onClick={() => setView("progress")}>Progress</button></nav>
      <button className="avatar" aria-label="Profile">RQ</button>
    </header>

    {view === "log" ? <section className="content">
      <div className="hero-row"><div><p className="eyebrow">{prettyDate(selectedDate).toUpperCase()}</p><h1>Ready to get stronger? <span>🔥</span></h1><p className="subtitle">Pick your session and log your best set. Every rep counts.</p></div><div className="streak-card"><span className="streak-flame">🔥</span><div><strong>{logs.length ? `${new Set(logs.map((log) => log.date)).size} workouts logged!` : "Start your streak!"}</strong><small>Your quest is waiting</small></div></div></div>

      <div className="date-card"><button className="circle-button" onClick={() => setSelectedDate(shiftDate(selectedDate,-7))} aria-label="Previous week">‹</button><div className="day-strip">{week.map((day) => <button key={day.iso} className={`day ${day.iso === selectedDate ? "active" : ""}`} onClick={() => setSelectedDate(day.iso)}><span>{day.weekday}</span><strong>{day.day}</strong>{logs.some((log) => log.date === day.iso) && <i />}</button>)}</div><button className="circle-button" onClick={() => setSelectedDate(shiftDate(selectedDate,7))} aria-label="Next week">›</button><button className="calendar-button" aria-label="Choose any date" onClick={() => dateInput.current?.showPicker()}>📅<input ref={dateInput} type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></button></div>

      <div className="section-heading"><div><p className="step">STEP 1</p><h2>Choose your mission</h2></div><span className="plan-pill">YOUR 4-DAY PLAN</span></div>
      <div className="missions">{plans.map((plan) => <button key={plan.id} onClick={() => selectSession(plan.id)} className={`mission ${sessionId === plan.id ? "selected" : ""}`}><span className={`mission-icon ${plan.color}`}>{plan.icon}</span><span><b>{plan.name}</b><small>{plan.subtitle}</small></span>{sessionId === plan.id && <i>✓</i>}</button>)}</div>

      <div className="section-heading workout-heading"><div><p className="step">STEP 2</p><h2>{selectedDate === localISO() ? "Today&apos;s quest" : `${prettyDate(selectedDate,false)} quest`}</h2></div><p className="helper">Log your best set · every field is optional</p></div>
      <div className="exercise-list">{selectedPlan.exercises.map((exercise,index) => { const filled = !!(draft[exercise.id]?.weight || draft[exercise.id]?.reps); return <article className="exercise" key={exercise.id}><span className="number">{index+1}</span><span className={`exercise-icon ${exercise.color}`}>{exercise.icon}</span><div className="exercise-name"><h3>{exercise.name}</h3><p>{exercise.target}</p></div><label><span>MAX WEIGHT</span><div className="input-shell"><input inputMode="decimal" aria-label={`${exercise.name} max weight`} value={draft[exercise.id]?.weight ?? ""} onChange={(event) => updateDraft(exercise.id,"weight",event.target.value)} placeholder="—"/><b>lb</b></div></label><label><span>REPS <em>OPTIONAL</em></span><div className="input-shell"><input inputMode="numeric" aria-label={`${exercise.name} reps`} value={draft[exercise.id]?.reps ?? ""} onChange={(event) => updateDraft(exercise.id,"reps",event.target.value)} placeholder="—"/><b>reps</b></div></label><span className={`check ${filled ? "done" : ""}`}>{filled ? "✓" : ""}</span></article>; })}</div>
      <div className="save-row"><p><span>{status === "saved" ? "✅" : "🌟"}</span>{status === "saved" ? "Workout saved — mighty work!" : status === "error" ? "We couldn’t reach your log. Try saving again." : `Save now — ${completedCount} of ${selectedPlan.exercises.length} exercises have an entry.`}</p><button className="save-button" onClick={saveWorkout} disabled={status === "saving"}>{status === "saving" ? "Saving…" : status === "saved" ? "Saved!" : "Save workout"}<span>→</span></button></div>
    </section> : <section className="content progress-view">
      <div className="progress-hero"><div><p className="eyebrow">YOUR ADVENTURE LOG</p><h1>Stronger than yesterday.</h1><p className="subtitle">See every little win stack up over time.</p></div><div className="trophy-bubble">🏆</div></div>
      {!logs.length && <div className="demo-banner"><span>✨</span><div><b>A preview of what your progress can look like</b><p>Log your first workout and these sample stats will make way for your own.</p></div><button onClick={() => setView("log")}>Log now →</button></div>}
      <div className="stat-grid"><article className="stat-card purple-card"><span>TOTAL QUESTS</span><strong>{logs.length ? new Set(logs.map((log) => `${log.date}-${log.session}`)).size : 12}</strong><small>workouts logged</small></article><article className="stat-card yellow-card"><span>BIGGEST GAIN</span><strong>+{gain} <em>lb</em></strong><small>on {exerciseInfo.name}</small></article><article className="stat-card mint-card"><span>CURRENT BEST</span><strong>{bestWeight} <em>lb</em></strong><small>{exerciseHistory.at(-1)?.reps ? `for ${exerciseHistory.at(-1)?.reps} reps` : "top logged weight"}</small></article></div>
      <div className="progress-layout"><aside className="exercise-picker"><p className="step">PICK AN EXERCISE</p>{allExercises.map((exercise) => <button key={exercise.id} className={progressExercise === exercise.id ? "active" : ""} onClick={() => setProgressExercise(exercise.id)}><span className={`tiny-icon ${exercise.color}`}>{exercise.icon}</span><span><b>{exercise.name}</b><small>{exercise.session}</small></span><i>›</i></button>)}</aside><div className="chart-card"><div className="chart-title"><div><span className={`exercise-icon ${exerciseInfo.color}`}>{exerciseInfo.icon}</span><div><p className="step">MAX WEIGHT OVER TIME</p><h2>{exerciseInfo.name}</h2></div></div><span className="gain-pill">{gain ? `↑ ${gain} lb` : "Keep going!"}</span></div><div className="bar-chart" aria-label={`${exerciseInfo.name} progress chart`}>{exerciseHistory.map((entry,index) => <div className="bar-column" key={`${entry.date}-${index}`}><div className="bar-value">{entry.weight}</div><div className={`bar ${index === exerciseHistory.length-1 ? "latest" : ""}`} style={{height:`${Math.max(18,((entry.weight ?? 0)/maxChart)*180)}px`}}></div><span>{prettyDate(entry.date,false)}</span></div>)}</div><div className="chart-footer"><span>💡</span><p><b>{gain > 0 ? `You’ve added ${gain} lb since your first log.` : "Your next personal best starts here."}</b><br/>Small steps. Big strength.</p></div></div></div>
    </section>}
  </main>;
}
