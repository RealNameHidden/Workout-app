"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Exercise = { id: string; name: string; targets: [string,string,string,string]; icon: string; color: string; metric?: "duration" };
type Session = { id: string; name: string; subtitle: string; icon: string; color: string; warmup?: string; exercises: Exercise[] };
type LogEntry = { id?: number; date: string; session: string; exerciseId: string; weight: number | null; reps: number | null };
type Draft = Record<string, { weight: string; reps: string }>;

const plans: Session[] = [
  { id:"upper", name:"Monday · Upper", subtitle:"Balanced upper body", icon:"🎯", color:"coral", warmup:"10 min incline treadmill walk", exercises:[
    { id:"machine-chest-press", name:"Machine chest press", targets:["3 × 10","3 × 12","4 × 10","4 × 12"], icon:"💊", color:"coral" },
    { id:"chest-supported-row", name:"Chest supported row", targets:["3 × 10","3 × 12","3 × 12","4 × 10"], icon:"🚣", color:"blue" },
    { id:"wide-grip-lat-pulldown", name:"Wide grip lat pulldown", targets:["3 × 10","3 × 12","3 × 15","4 × 12"], icon:"🪂", color:"mint" },
    { id:"db-incline-press", name:"DB incline press", targets:["3 × 10","3 × 12","3 × 12","4 × 10"], icon:"🎯", color:"yellow" },
    { id:"overhead-shoulder-press", name:"Overhead shoulder press", targets:["3 × 10","3 × 12","3 × 12","4 × 10"], icon:"⚡", color:"coral" },
    { id:"tricep-pushdown", name:"Tricep pushdown", targets:["3 × 10","3 × 12","3 × 12","3 × 15"], icon:"🦾", color:"blue" },
    { id:"alternating-bicep-curls", name:"Alternating bicep curls", targets:["3 × 10","3 × 12","3 × 12","3 × 15"], icon:"💪", color:"mint" },
  ]},
  { id:"lower", name:"Tuesday · Lower", subtitle:"Lower body & core", icon:"🦵", color:"yellow", warmup:"Bodyweight squats", exercises:[
    { id:"barbell-squats", name:"Barbell squats", targets:["3 × 12","3 × 15","3 × 12","3 × 12"], icon:"🏆", color:"yellow" },
    { id:"single-leg-deadlift", name:"Single leg deadlift", targets:["3 × 10","3 × 12","3 × 10","4 × 10"], icon:"🌲", color:"mint" },
    { id:"leg-extension", name:"Leg extension", targets:["3 × 10","3 × 12","3 × 15","4 × 10"], icon:"⬆️", color:"blue" },
    { id:"step-ups", name:"Step ups", targets:["2 × 10 L–R","2 × 20","2 × 20","2 × 20"], icon:"🪜", color:"coral" },
    { id:"standing-calf-raise", name:"Standing calf raise", targets:["3 × 15","2 × 20","3 × 15","4 × 12"], icon:"🦶", color:"yellow" },
    { id:"lying-leg-raises", name:"Lying leg raises", targets:["3 × 10","3 × 10","3 × 10","3 × 10"], icon:"🔥", color:"coral" },
    { id:"cable-crunches", name:"Cable crunches", targets:["3 × 10","3 × 10","3 × 10","3 × 10"], icon:"🎯", color:"blue" },
  ]},
  { id:"cardio", name:"Wednesday · Cardio", subtitle:"Cardio or favourite sport", icon:"🏃", color:"blue", exercises:[
    { id:"cardio-session", name:"Cardio / favourite sport", targets:["30 minutes","30 minutes","30 minutes","30 minutes"], icon:"❤️", color:"blue", metric:"duration" },
  ]},
  { id:"push", name:"Thursday · Push", subtitle:"Chest, triceps & shoulders", icon:"🎯", color:"coral", warmup:"Push-ups · 2 × 10", exercises:[
    { id:"bench-press", name:"Bench press", targets:["3 × 10","3 × 12","3 × 10","3 × 12"], icon:"💊", color:"coral" },
    { id:"pec-deck-fly", name:"Pec deck fly", targets:["3 × 12","3 × 15","3 × 15","4 × 10"], icon:"🦾", color:"mint" },
    { id:"overhead-shoulder-press", name:"Overhead shoulder press", targets:["3 × 12","3 × 15","4 × 10","4 × 10"], icon:"⚡", color:"yellow" },
    { id:"lateral-raises", name:"Lateral raises", targets:["3 × 12","3 × 12","4 × 10","3 × 10"], icon:"💫", color:"blue" },
    { id:"tricep-overhead-extensions", name:"Tricep overhead extensions", targets:["3 × 10","3 × 12","3 × 15","4 × 10"], icon:"🚀", color:"coral" },
    { id:"rope-pushdown", name:"Rope pushdown", targets:["4 × 12","4 × 15","4 × 10","4 × 12"], icon:"🪢", color:"mint" },
    { id:"tricep-kickbacks", name:"Tricep kickbacks", targets:["3 × 8","3 × 10","3 × 12","3 × 10"], icon:"⚡", color:"yellow" },
  ]},
  { id:"pull", name:"Friday · Pull", subtitle:"Back & biceps", icon:"⚡", color:"blue", warmup:"10 min incline treadmill walk", exercises:[
    { id:"seated-cable-row", name:"Seated cable row", targets:["3 × 12","3 × 15","3 × 10","4 × 10"], icon:"🚣", color:"blue" },
    { id:"wide-grip-lat-pulldown", name:"Wide grip lat pulldown", targets:["3 × 12","3 × 15","3 × 10","4 × 10"], icon:"🪂", color:"mint" },
    { id:"machine-row", name:"Machine row", targets:["3 × 10","4 × 10","3 × 10","3 × 12"], icon:"⚙️", color:"yellow" },
    { id:"rear-delt-fly", name:"Rear delt fly", targets:["3 × 15","3 × 15","4 × 12","4 × 15"], icon:"🦾", color:"coral" },
    { id:"barbell-shrugs", name:"Barbell shrugs", targets:["3 × 10","4 × 10","3 × 10","3 × 12"], icon:"🏔️", color:"blue" },
    { id:"bicep-curls", name:"Bicep curls", targets:["3 × 15","3 × 15","3 × 12","4 × 10"], icon:"💪", color:"coral" },
    { id:"hammer-curls", name:"Hammer curls", targets:["3 × 15","3 × 15","3 × 12","4 × 10"], icon:"🔨", color:"yellow" },
  ]},
  { id:"legs", name:"Saturday · Legs", subtitle:"Legs & core", icon:"🦵", color:"yellow", warmup:"Bodyweight squats · 3 × 10", exercises:[
    { id:"goblet-squats", name:"Goblet squats", targets:["3 × 10","3 × 15","4 × 10","4 × 12"], icon:"🏆", color:"yellow" },
    { id:"leg-press", name:"Leg press", targets:["3 × 10","3 × 10","3 × 10","3 × 10"], icon:"🚀", color:"blue" },
    { id:"reverse-lunges", name:"Reverse lunges", targets:["3 × 10 L–R","3 × 15","3 × 12","4 × 12"], icon:"🪜", color:"coral" },
    { id:"hamstring-curls", name:"Hamstring curls", targets:["3 × 12","4 × 10","3 × 12","4 × 12"], icon:"🌲", color:"mint" },
    { id:"standing-calf-raise", name:"Standing calf raises", targets:["3 × 15","3 × 15","3 × 12","3 × 10"], icon:"🦶", color:"yellow" },
    { id:"woodchoppers", name:"Woodchoppers", targets:["3 × 10 L–R","3 × 10 L–R","3 × 10 L–R","3 × 10 L–R"], icon:"🪓", color:"coral" },
    { id:"decline-reverse-crunch", name:"Decline reverse crunch", targets:["3 × 10","3 × 10","3 × 10","3 × 10"], icon:"🔥", color:"blue" },
  ]},
  { id:"rest", name:"Sunday · Rest", subtitle:"Play a sport or recover", icon:"🌟", color:"mint", exercises:[
    { id:"active-recovery", name:"Favourite sport / active recovery", targets:["Optional","Optional","Optional","Optional"], icon:"🏀", color:"mint", metric:"duration" },
  ]},
];

const allExercises = Array.from(new Map(plans.flatMap((plan) => plan.exercises.map((exercise) => [exercise.id, { ...exercise, session: plan.name }] as const))).values());
const starterHistory: LogEntry[] = [
  { date:"2026-08-03",session:"upper",exerciseId:"machine-chest-press",weight:70,reps:10 }, { date:"2026-08-24",session:"upper",exerciseId:"machine-chest-press",weight:90,reps:12 },
  { date:"2026-08-06",session:"push",exerciseId:"bench-press",weight:115,reps:10 }, { date:"2026-08-27",session:"push",exerciseId:"bench-press",weight:135,reps:12 },
  { date:"2026-08-08",session:"legs",exerciseId:"goblet-squats",weight:40,reps:10 }, { date:"2026-08-29",session:"legs",exerciseId:"goblet-squats",weight:55,reps:12 },
];

function localISO(date = new Date()) { const d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function fromISO(value: string) { return new Date(`${value}T12:00:00`); }
function shiftDate(value: string, amount: number) { const date = fromISO(value); date.setDate(date.getDate() + amount); return localISO(date); }
function prettyDate(value: string, full = true) { return new Intl.DateTimeFormat("en-US", full ? { weekday:"long", month:"long", day:"numeric" } : { month:"short", day:"numeric" }).format(fromISO(value)); }
function blankDraft(plan: Session): Draft { return Object.fromEntries(plan.exercises.map((exercise) => [exercise.id, { weight:"", reps:"" }])); }
function trainingWeek(value: string) { const elapsed = Math.floor((fromISO(value).getTime() - fromISO("2026-08-01").getTime()) / 604800000); return Math.min(3, Math.max(0, elapsed)); }
function scheduledSession(value: string) { return ["rest","upper","lower","cardio","push","pull","legs"][fromISO(value).getDay()]; }

export default function Home() {
  const [view, setView] = useState<"log"|"progress">("log");
  const [selectedDate, setSelectedDate] = useState(localISO);
  const [sessionId, setSessionId] = useState(() => scheduledSession(localISO()));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [draft, setDraft] = useState<Draft>(() => blankDraft(plans.find((plan) => plan.id === scheduledSession(localISO())) ?? plans[0]));
  const [status, setStatus] = useState<"idle"|"loading"|"saving"|"saved"|"error">("loading");
  const [progressExercise, setProgressExercise] = useState("machine-chest-press");
  const dateInput = useRef<HTMLInputElement>(null);
  const selectedPlan = plans.find((plan) => plan.id === sessionId) ?? plans[0];
  const programWeek = trainingWeek(selectedDate);

  useEffect(() => {
    fetch("/api/workouts").then(async (response) => {
      if (!response.ok) throw new Error("Could not load workouts");
      return response.json() as Promise<{ logs: LogEntry[] }>;
    }).then((data) => { setLogs(data.logs); setStatus("idle"); }).catch(() => setStatus("error"));
  }, []);

  useEffect(() => { setSessionId(scheduledSession(selectedDate)); }, [selectedDate]);

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
  const progressUnit = exerciseInfo.metric === "duration" ? "min" : "lb";
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
      <button className="avatar" aria-label="Profile">DA</button>
    </header>

    {view === "log" ? <section className="content">
      <div className="hero-row"><div><p className="eyebrow">{prettyDate(selectedDate).toUpperCase()}</p><h1>Ready to get stronger? <span>🔥</span></h1><p className="subtitle">Pick your session and log your best set. Every rep counts.</p></div><div className="streak-card"><span className="streak-flame">🔥</span><div><strong>{logs.length ? `${new Set(logs.map((log) => log.date)).size} workouts logged!` : "Start your streak!"}</strong><small>Your quest is waiting</small></div></div></div>

      <div className="date-card"><button className="circle-button" onClick={() => setSelectedDate(shiftDate(selectedDate,-7))} aria-label="Previous week">‹</button><div className="day-strip">{week.map((day) => <button key={day.iso} className={`day ${day.iso === selectedDate ? "active" : ""}`} onClick={() => setSelectedDate(day.iso)}><span>{day.weekday}</span><strong>{day.day}</strong>{logs.some((log) => log.date === day.iso) && <i />}</button>)}</div><button className="circle-button" onClick={() => setSelectedDate(shiftDate(selectedDate,7))} aria-label="Next week">›</button><button className="calendar-button" aria-label="Choose any date" onClick={() => dateInput.current?.showPicker()}>📅<input ref={dateInput} type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></button></div>

      <div className="section-heading"><div><p className="step">STEP 1</p><h2>Choose your mission</h2></div><span className="plan-pill">WEEK {programWeek + 1} · 7-DAY PLAN</span></div>
      <div className="missions">{plans.map((plan) => <button key={plan.id} onClick={() => selectSession(plan.id)} className={`mission ${sessionId === plan.id ? "selected" : ""}`}><span className={`mission-icon ${plan.color}`}>{plan.icon}</span><span><b>{plan.name}</b><small>{plan.subtitle}</small></span>{sessionId === plan.id && <i>✓</i>}</button>)}</div>

      <div className="section-heading workout-heading"><div><p className="step">STEP 2 · PROGRAM WEEK {programWeek + 1}</p><h2>{selectedDate === localISO() ? "Today’s quest" : `${prettyDate(selectedDate,false)} quest`}</h2></div><p className="helper">Log your best set · every field is optional</p></div>
      {selectedPlan.warmup && <p className="session-note"><span>🔥</span><b>Warm-up:</b> {selectedPlan.warmup}<em>Finish with 10 min cardio and stretches.</em></p>}
      <div className="exercise-list">{selectedPlan.exercises.map((exercise,index) => { const filled = !!(draft[exercise.id]?.weight || draft[exercise.id]?.reps); return <article className="exercise" key={exercise.id}><span className="number">{index+1}</span><span className={`exercise-icon ${exercise.color}`}>{exercise.icon}</span><div className="exercise-name"><h3>{exercise.name}</h3><p>{exercise.targets[programWeek]}</p></div><label><span>{exercise.metric === "duration" ? "DURATION" : "MAX WEIGHT"}</span><div className="input-shell"><input inputMode="decimal" aria-label={`${exercise.name} ${exercise.metric === "duration" ? "minutes" : "max weight"}`} value={draft[exercise.id]?.weight ?? ""} onChange={(event) => updateDraft(exercise.id,"weight",event.target.value)} placeholder="—"/><b>{exercise.metric === "duration" ? "min" : "lb"}</b></div></label>{exercise.metric !== "duration" && <label><span>REPS <em>OPTIONAL</em></span><div className="input-shell"><input inputMode="numeric" aria-label={`${exercise.name} reps`} value={draft[exercise.id]?.reps ?? ""} onChange={(event) => updateDraft(exercise.id,"reps",event.target.value)} placeholder="—"/><b>reps</b></div></label>}<span className={`check ${filled ? "done" : ""}`}>{filled ? "✓" : ""}</span></article>; })}</div>
      <div className="save-row"><p><span>{status === "saved" ? "✅" : "🌟"}</span>{status === "saved" ? "Workout saved — mighty work!" : status === "error" ? "We couldn’t reach your log. Try saving again." : `Save now — ${completedCount} of ${selectedPlan.exercises.length} exercises have an entry.`}</p><button className="save-button" onClick={saveWorkout} disabled={status === "saving"}>{status === "saving" ? "Saving…" : status === "saved" ? "Saved!" : "Save workout"}<span>→</span></button></div>
    </section> : <section className="content progress-view">
      <div className="progress-hero"><div><p className="eyebrow">YOUR ADVENTURE LOG</p><h1>Stronger than yesterday.</h1><p className="subtitle">See every little win stack up over time.</p></div><div className="trophy-bubble">🏆</div></div>
      {!logs.length && <div className="demo-banner"><span>✨</span><div><b>A preview of what your progress can look like</b><p>Log your first workout and these sample stats will make way for your own.</p></div><button onClick={() => setView("log")}>Log now →</button></div>}
      <div className="stat-grid"><article className="stat-card purple-card"><span>TOTAL QUESTS</span><strong>{logs.length ? new Set(logs.map((log) => `${log.date}-${log.session}`)).size : 12}</strong><small>workouts logged</small></article><article className="stat-card yellow-card"><span>BIGGEST GAIN</span><strong>+{gain} <em>{progressUnit}</em></strong><small>on {exerciseInfo.name}</small></article><article className="stat-card mint-card"><span>CURRENT BEST</span><strong>{bestWeight} <em>{progressUnit}</em></strong><small>{exerciseHistory.at(-1)?.reps ? `for ${exerciseHistory.at(-1)?.reps} reps` : exerciseInfo.metric === "duration" ? "longest session" : "top logged weight"}</small></article></div>
      <div className="progress-layout"><aside className="exercise-picker"><p className="step">PICK AN EXERCISE</p>{allExercises.map((exercise) => <button key={exercise.id} className={progressExercise === exercise.id ? "active" : ""} onClick={() => setProgressExercise(exercise.id)}><span className={`tiny-icon ${exercise.color}`}>{exercise.icon}</span><span><b>{exercise.name}</b><small>{exercise.session}</small></span><i>›</i></button>)}</aside><div className="chart-card"><div className="chart-title"><div><span className={`exercise-icon ${exerciseInfo.color}`}>{exerciseInfo.icon}</span><div><p className="step">{exerciseInfo.metric === "duration" ? "DURATION OVER TIME" : "MAX WEIGHT OVER TIME"}</p><h2>{exerciseInfo.name}</h2></div></div><span className="gain-pill">{gain ? `↑ ${gain} ${progressUnit}` : "Keep going!"}</span></div><div className="bar-chart" aria-label={`${exerciseInfo.name} progress chart`}>{exerciseHistory.map((entry,index) => <div className="bar-column" key={`${entry.date}-${index}`}><div className="bar-value">{entry.weight}</div><div className={`bar ${index === exerciseHistory.length-1 ? "latest" : ""}`} style={{height:`${Math.max(18,((entry.weight ?? 0)/maxChart)*180)}px`}}></div><span>{prettyDate(entry.date,false)}</span></div>)}</div><div className="chart-footer"><span>💡</span><p><b>{gain > 0 ? `You’ve added ${gain} ${progressUnit} since your first log.` : "Your next personal best starts here."}</b><br/>Small steps. Big strength.</p></div></div></div>
    </section>}
  </main>;
}
