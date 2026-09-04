"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveWorkoutSession, signInWithGoogle, signOutWorkoutAccount, subscribeWorkoutAccount, subscribeWorkoutLogs, type WorkoutAccount } from "../src/firebase";

type Exercise = { id: string; name: string; targets: [string,string,string,string]; icon: string; color: string; metric?: "duration" };
type Session = { id: string; name: string; subtitle: string; icon: string; color: string; warmup?: string; exercises: Exercise[] };
type LogEntry = { id?: string; date: string; session: string; exerciseId: string; weight: number | null; reps: number | null };
type Draft = Record<string, { weight: string; reps: string; touched: boolean; carried: boolean }>;

const plans: Session[] = [
  { id:"upper", name:"Upper", subtitle:"Balanced upper body", icon:"/icons/workout-upper.png", color:"coral", warmup:"10 min incline treadmill walk", exercises:[
    { id:"machine-chest-press", name:"Machine chest press", targets:["3 × 10","3 × 12","4 × 10","4 × 12"], icon:"💊", color:"coral" },
    { id:"chest-supported-row", name:"Chest supported row", targets:["3 × 10","3 × 12","3 × 12","4 × 10"], icon:"🚣", color:"blue" },
    { id:"wide-grip-lat-pulldown", name:"Wide grip lat pulldown", targets:["3 × 10","3 × 12","3 × 15","4 × 12"], icon:"🪂", color:"mint" },
    { id:"db-incline-press", name:"DB incline press", targets:["3 × 10","3 × 12","3 × 12","4 × 10"], icon:"🎯", color:"yellow" },
    { id:"overhead-shoulder-press", name:"Overhead shoulder press", targets:["3 × 10","3 × 12","3 × 12","4 × 10"], icon:"⚡", color:"coral" },
    { id:"tricep-pushdown", name:"Tricep pushdown", targets:["3 × 10","3 × 12","3 × 12","3 × 15"], icon:"🦾", color:"blue" },
    { id:"alternating-bicep-curls", name:"Alternating bicep curls", targets:["3 × 10","3 × 12","3 × 12","3 × 15"], icon:"💪", color:"mint" },
  ]},
  { id:"lower", name:"Lower", subtitle:"Lower body & core", icon:"/icons/workout-lower.png", color:"yellow", warmup:"Bodyweight squats", exercises:[
    { id:"barbell-squats", name:"Barbell squats", targets:["3 × 12","3 × 15","3 × 12","3 × 12"], icon:"🏆", color:"yellow" },
    { id:"single-leg-deadlift", name:"Single leg deadlift", targets:["3 × 10","3 × 12","3 × 10","4 × 10"], icon:"🌲", color:"mint" },
    { id:"leg-extension", name:"Leg extension", targets:["3 × 10","3 × 12","3 × 15","4 × 10"], icon:"⬆️", color:"blue" },
    { id:"step-ups", name:"Step ups", targets:["2 × 10 L–R","2 × 20","2 × 20","2 × 20"], icon:"🪜", color:"coral" },
    { id:"standing-calf-raise", name:"Standing calf raise", targets:["3 × 15","2 × 20","3 × 15","4 × 12"], icon:"🦶", color:"yellow" },
    { id:"lying-leg-raises", name:"Lying leg raises", targets:["3 × 10","3 × 10","3 × 10","3 × 10"], icon:"🔥", color:"coral" },
    { id:"cable-crunches", name:"Cable crunches", targets:["3 × 10","3 × 10","3 × 10","3 × 10"], icon:"🎯", color:"blue" },
  ]},
  { id:"push", name:"Push", subtitle:"Chest, triceps & shoulders", icon:"/icons/workout-push.png", color:"coral", warmup:"Push-ups · 2 × 10", exercises:[
    { id:"bench-press", name:"Bench press", targets:["3 × 10","3 × 12","3 × 10","3 × 12"], icon:"💊", color:"coral" },
    { id:"pec-deck-fly", name:"Pec deck fly", targets:["3 × 12","3 × 15","3 × 15","4 × 10"], icon:"🦾", color:"mint" },
    { id:"overhead-shoulder-press", name:"Overhead shoulder press", targets:["3 × 12","3 × 15","4 × 10","4 × 10"], icon:"⚡", color:"yellow" },
    { id:"lateral-raises", name:"Lateral raises", targets:["3 × 12","3 × 12","4 × 10","3 × 10"], icon:"💫", color:"blue" },
    { id:"tricep-overhead-extensions", name:"Tricep overhead extensions", targets:["3 × 10","3 × 12","3 × 15","4 × 10"], icon:"🚀", color:"coral" },
    { id:"rope-pushdown", name:"Rope pushdown", targets:["4 × 12","4 × 15","4 × 10","4 × 12"], icon:"🪢", color:"mint" },
    { id:"tricep-kickbacks", name:"Tricep kickbacks", targets:["3 × 8","3 × 10","3 × 12","3 × 10"], icon:"⚡", color:"yellow" },
  ]},
  { id:"pull", name:"Pull", subtitle:"Back & biceps", icon:"/icons/workout-pull.png", color:"blue", warmup:"10 min incline treadmill walk", exercises:[
    { id:"seated-cable-row", name:"Seated cable row", targets:["3 × 12","3 × 15","3 × 10","4 × 10"], icon:"🚣", color:"blue" },
    { id:"wide-grip-lat-pulldown", name:"Wide grip lat pulldown", targets:["3 × 12","3 × 15","3 × 10","4 × 10"], icon:"🪂", color:"mint" },
    { id:"machine-row", name:"Machine row", targets:["3 × 10","4 × 10","3 × 10","3 × 12"], icon:"⚙️", color:"yellow" },
    { id:"rear-delt-fly", name:"Rear delt fly", targets:["3 × 15","3 × 15","4 × 12","4 × 15"], icon:"🦾", color:"coral" },
    { id:"barbell-shrugs", name:"Barbell shrugs", targets:["3 × 10","4 × 10","3 × 10","3 × 12"], icon:"🏔️", color:"blue" },
    { id:"bicep-curls", name:"Bicep curls", targets:["3 × 15","3 × 15","3 × 12","4 × 10"], icon:"💪", color:"coral" },
    { id:"hammer-curls", name:"Hammer curls", targets:["3 × 15","3 × 15","3 × 12","4 × 10"], icon:"🔨", color:"yellow" },
  ]},
];

const workoutPlans = plans;
const allExercises = Array.from(new Map(workoutPlans.flatMap((plan) => plan.exercises.map((exercise) => [exercise.id, { ...exercise, session: plan.name }] as const))).values());
const starterHistory: LogEntry[] = [
  { date:"2026-08-03",session:"upper",exerciseId:"machine-chest-press",weight:70,reps:10 }, { date:"2026-08-24",session:"upper",exerciseId:"machine-chest-press",weight:90,reps:12 },
  { date:"2026-08-06",session:"push",exerciseId:"bench-press",weight:115,reps:10 }, { date:"2026-08-27",session:"push",exerciseId:"bench-press",weight:135,reps:12 },
];

function localISO(date = new Date()) { const d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function fromISO(value: string) { return new Date(`${value}T12:00:00`); }
function shiftDate(value: string, amount: number) { const date = fromISO(value); date.setDate(date.getDate() + amount); return localISO(date); }
function prettyDate(value: string, full = true) { return new Intl.DateTimeFormat("en-US", full ? { weekday:"long", month:"long", day:"numeric" } : { month:"short", day:"numeric" }).format(fromISO(value)); }
function dayShortcut(value: string) { return fromISO(value).toLocaleDateString("en-US", { weekday:"short" }); }
function blankDraft(plan: Session): Draft { return Object.fromEntries(plan.exercises.map((exercise) => [exercise.id, { weight:"", reps:"", touched:false, carried:false }])); }
function trainingWeek(value: string) { const elapsed = Math.floor((fromISO(value).getTime() - fromISO("2026-08-01").getTime()) / 604800000); return Math.min(3, Math.max(0, elapsed)); }

export default function Home() {
  const [view, setView] = useState<"log"|"progress">("log");
  const [selectedDate, setSelectedDate] = useState(localISO);
  const [sessionId, setSessionId] = useState("upper");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [draft, setDraft] = useState<Draft>(() => blankDraft(workoutPlans[0]));
  const [status, setStatus] = useState<"idle"|"loading"|"saving"|"saved"|"error">("loading");
  const [account, setAccount] = useState<WorkoutAccount | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [progressExercise, setProgressExercise] = useState("machine-chest-press");
  const dateInput = useRef<HTMLInputElement>(null);
  const selectedPlan = workoutPlans.find((plan) => plan.id === sessionId) ?? workoutPlans[0];
  const programWeek = trainingWeek(selectedDate);

  useEffect(() => {
    let disposed = false;
    let stopListening: (() => void) | undefined;
    subscribeWorkoutLogs(
      (nextLogs) => { if (!disposed) { setLogs(nextLogs); setStatus("idle"); } },
      () => { if (!disposed) setStatus("error"); },
    ).then((unsubscribe) => {
      if (disposed) unsubscribe(); else stopListening = unsubscribe;
    }).catch(() => { if (!disposed) setStatus("error"); });
    return () => { disposed = true; stopListening?.(); };
  }, []);

  useEffect(() => subscribeWorkoutAccount(setAccount), []);

  useEffect(() => {
    const existing = logs.filter((entry) => entry.date === selectedDate && entry.session === sessionId);
    const next = blankDraft(selectedPlan);
    selectedPlan.exercises.forEach((exercise) => {
      const previous = logs
        .filter((entry) => entry.exerciseId === exercise.id && entry.date < selectedDate && entry.weight != null)
        .sort((a,b) => b.date.localeCompare(a.date))[0];
      if (previous?.weight != null) next[exercise.id] = { weight:previous.weight.toString(), reps:"", touched:false, carried:true };
    });
    existing.forEach((entry) => { if (next[entry.exerciseId]) next[entry.exerciseId] = { weight: entry.weight?.toString() ?? "", reps: entry.reps?.toString() ?? "", touched:true, carried:false }; });
    // Reset the editable form whenever its selected date, workout, or saved history changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const completedCount = Object.values(draft).filter((entry) => entry.touched && (entry.weight || entry.reps)).length;

  function selectSession(id: string) { setSessionId(id); setStatus("idle"); }
  function updateDraft(id: string, field: "weight"|"reps", value: string) { if (/^\d{0,4}(\.\d{0,2})?$/.test(value)) setDraft((current) => ({...current,[id]:{...current[id],[field]:value,touched:true,carried:false}})); }
  function markDraftTouched(id: string) { setDraft((current) => current[id]?.touched ? current : ({...current,[id]:{...current[id],touched:true,carried:false}})); }
  async function handleAccount() {
    if (accountBusy) return;
    if (account && !account.isAnonymous) {
      setAccountMenuOpen((open) => !open);
      return;
    }
    setAccountBusy(true);
    try {
      await signInWithGoogle();
    } catch { setStatus("error"); }
    finally { setAccountBusy(false); }
  }
  async function handleSignOut() {
    if (accountBusy) return;
    setAccountBusy(true);
    try {
      await signOutWorkoutAccount();
      setAccountMenuOpen(false);
    } catch { setStatus("error"); }
    finally { setAccountBusy(false); }
  }
  async function saveWorkout() {
    setStatus("saving");
    const entries = selectedPlan.exercises.map((exercise) => ({ exerciseId:exercise.id, weight:draft[exercise.id]?.touched && draft[exercise.id]?.weight ? Number(draft[exercise.id].weight) : null, reps:draft[exercise.id]?.touched && draft[exercise.id]?.reps ? Number(draft[exercise.id].reps) : null }));
    try {
      await saveWorkoutSession(selectedDate, sessionId, entries);
      setStatus("saved"); window.setTimeout(() => setStatus("idle"), 2200);
    } catch { setStatus("error"); }
  }

  const signedIn = !!account && !account.isAnonymous;
  const accountName = account?.displayName ?? account?.email ?? "Google user";

  return <main className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setView("log")}><span>Rep Quest</span></button>
      <nav aria-label="Main navigation"><button className={`nav-link ${view === "log" ? "active" : ""}`} onClick={() => setView("log")}>Log workout</button><button className={`nav-link ${view === "progress" ? "active" : ""}`} onClick={() => setView("progress")}>Progress</button></nav>
      <div className="account-area">
        <button className={`account-button ${signedIn ? "signed-in" : ""}`} onClick={handleAccount} disabled={accountBusy} aria-expanded={signedIn ? accountMenuOpen : undefined} aria-haspopup={signedIn ? "menu" : undefined} aria-label={signedIn ? `Account menu for ${accountName}` : "Sign in with Google"}><span className="account-mark">{accountBusy ? "…" : signedIn ? accountName.slice(0,2).toUpperCase() : "G"}</span><span>{signedIn ? accountName : "Sign in with Google"}</span></button>
        {signedIn && accountMenuOpen && <div className="account-menu" role="menu"><small>SIGNED IN AS</small><strong>{accountName}</strong>{account?.email && account.email !== accountName && <span>{account.email}</span>}<button role="menuitem" onClick={handleSignOut} disabled={accountBusy}>{accountBusy ? "Signing out…" : "Sign out"}</button></div>}
      </div>
    </header>

    {view === "log" ? <section className="content">
      <div className="hero-row"><div><h1 className="day-title"><span className="day-code">{dayShortcut(selectedDate)}</span></h1><p className="subtitle">Pick your session and log your best set. Every rep counts.</p></div><div className="streak-card"><div><strong>{logs.length ? `${new Set(logs.map((log) => log.date)).size} workouts logged!` : "Start your streak!"}</strong><small>Your quest is waiting</small></div></div></div>

      <div className="date-card"><button className="circle-button" onClick={() => setSelectedDate(shiftDate(selectedDate,-7))} aria-label="Previous week">‹</button><div className="day-strip">{week.map((day) => <button key={day.iso} className={`day ${day.iso === selectedDate ? "active" : ""}`} onClick={() => setSelectedDate(day.iso)}><span>{day.weekday}</span><strong>{day.day}</strong>{logs.some((log) => log.date === day.iso) && <i />}</button>)}</div><button className="circle-button" onClick={() => setSelectedDate(shiftDate(selectedDate,7))} aria-label="Next week">›</button><button className="calendar-button" aria-label="Choose any date" onClick={() => dateInput.current?.showPicker()}>📅<input ref={dateInput} type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></button></div>

      <div className="section-heading"><div><p className="step">STEP 1</p><h2>Select workout</h2></div><span className="plan-pill">WEEK {programWeek + 1} · 4 WORKOUTS</span></div>
      <div className="missions">{workoutPlans.map((plan) => <button key={plan.id} onClick={() => selectSession(plan.id)} className={`mission ${sessionId === plan.id ? "selected" : ""}`}><span className="mission-icon"><img src={plan.icon} alt="" /></span><span><b>{plan.name}</b><small>{plan.subtitle}</small></span>{sessionId === plan.id && <i>✓</i>}</button>)}</div>

      <div className="section-heading workout-heading"><div><p className="step">STEP 2 · PROGRAM WEEK {programWeek + 1}</p><h2>{selectedDate === localISO() ? "Today’s quest" : `${prettyDate(selectedDate,false)} quest`}</h2></div><p className="helper">Log your best set · every field is optional</p></div>
      <div className="exercise-list">{selectedPlan.exercises.map((exercise,index) => {
        const entry = draft[exercise.id];
        const filled = !!(entry?.touched && (entry.weight || entry.reps));
        return <article className="exercise" key={exercise.id}>
          <span className="number">{index+1}</span>
          <span className={`exercise-icon ${exercise.color}`}>{exercise.icon}</span>
          <div className="exercise-name"><h3>{exercise.name}</h3><p>{exercise.targets[programWeek]}</p></div>
          <label><span>{exercise.metric === "duration" ? "DURATION" : "MAX WEIGHT"}{entry?.carried && <em> LAST</em>}</span><div className={`input-shell ${entry?.carried ? "carried" : ""}`}><input inputMode="decimal" aria-label={`${exercise.name} ${exercise.metric === "duration" ? "minutes" : "max weight"}`} value={entry?.weight ?? ""} onFocus={() => markDraftTouched(exercise.id)} onChange={(event) => updateDraft(exercise.id,"weight",event.target.value)} placeholder="—"/><b>{exercise.metric === "duration" ? "min" : "lb"}</b></div></label>
          {exercise.metric !== "duration" && <label><span>REPS <em>OPTIONAL</em></span><div className="input-shell"><input inputMode="numeric" aria-label={`${exercise.name} reps`} value={entry?.reps ?? ""} onFocus={() => markDraftTouched(exercise.id)} onChange={(event) => updateDraft(exercise.id,"reps",event.target.value)} placeholder="—"/><b>reps</b></div></label>}
          <span className={`check ${filled ? "done" : ""}`}>{filled ? "✓" : ""}</span>
        </article>;
      })}</div>
      <div className="save-row"><p><span>{status === "saved" ? "✅" : "🌟"}</span>{status === "saved" ? "Workout saved — mighty work!" : status === "error" ? "We couldn’t reach your log. Try saving again." : `Save now — ${completedCount} of ${selectedPlan.exercises.length} exercises have an entry.`}</p><button className="save-button" onClick={saveWorkout} disabled={status === "saving"}>{status === "saving" ? "Saving…" : status === "saved" ? "Saved!" : "Save workout"}<span>→</span></button></div>
    </section> : <section className="content progress-view">
      <div className="progress-hero"><div><p className="eyebrow">YOUR ADVENTURE LOG</p><h1>Stronger than yesterday.</h1><p className="subtitle">See every little win stack up over time.</p></div><div className="trophy-bubble">🏆</div></div>
      {!logs.length && <div className="demo-banner"><span>✨</span><div><b>A preview of what your progress can look like</b><p>Log your first workout and these sample stats will make way for your own.</p></div><button onClick={() => setView("log")}>Log now →</button></div>}
      <div className="stat-grid"><article className="stat-card purple-card"><span>TOTAL QUESTS</span><strong>{logs.length ? new Set(logs.map((log) => `${log.date}-${log.session}`)).size : 12}</strong><small>workouts logged</small></article><article className="stat-card yellow-card"><span>BIGGEST GAIN</span><strong>+{gain} <em>{progressUnit}</em></strong><small>on {exerciseInfo.name}</small></article><article className="stat-card mint-card"><span>CURRENT BEST</span><strong>{bestWeight} <em>{progressUnit}</em></strong><small>{exerciseHistory.at(-1)?.reps ? `for ${exerciseHistory.at(-1)?.reps} reps` : exerciseInfo.metric === "duration" ? "longest session" : "top logged weight"}</small></article></div>
      <div className="progress-layout"><aside className="exercise-picker"><p className="step">PICK AN EXERCISE</p>{allExercises.map((exercise) => <button key={exercise.id} className={progressExercise === exercise.id ? "active" : ""} onClick={() => setProgressExercise(exercise.id)}><span className={`tiny-icon ${exercise.color}`}>{exercise.icon}</span><span><b>{exercise.name}</b><small>{exercise.session}</small></span><i>›</i></button>)}</aside><div className="chart-card"><div className="chart-title"><div><span className={`exercise-icon ${exerciseInfo.color}`}>{exerciseInfo.icon}</span><div><p className="step">{exerciseInfo.metric === "duration" ? "DURATION OVER TIME" : "MAX WEIGHT OVER TIME"}</p><h2>{exerciseInfo.name}</h2></div></div><span className="gain-pill">{gain ? `↑ ${gain} ${progressUnit}` : "Keep going!"}</span></div><div className="bar-chart" aria-label={`${exerciseInfo.name} progress chart`}>{exerciseHistory.map((entry,index) => <div className="bar-column" key={`${entry.date}-${index}`}><div className="bar-value">{entry.weight}</div><div className={`bar ${index === exerciseHistory.length-1 ? "latest" : ""}`} style={{height:`${Math.max(18,((entry.weight ?? 0)/maxChart)*180)}px`}}></div><span>{prettyDate(entry.date,false)}</span></div>)}</div><div className="chart-footer"><span>💡</span><p><b>{gain > 0 ? `You’ve added ${gain} ${progressUnit} since your first log.` : "Your next personal best starts here."}</b><br/>Small steps. Big strength.</p></div></div></div>
    </section>}
  </main>;
}
