import { env } from "cloudflare:workers";

type IncomingEntry = { exerciseId?: unknown; weight?: unknown; reps?: unknown };

const allowedSessions = new Set(["upper", "lower", "cardio", "push", "pull", "legs", "rest"]);
const allowedExercises = new Set([
  "machine-chest-press", "chest-supported-row", "wide-grip-lat-pulldown", "db-incline-press",
  "overhead-shoulder-press", "tricep-pushdown", "alternating-bicep-curls",
  "barbell-squats", "single-leg-deadlift", "leg-extension", "step-ups", "standing-calf-raise",
  "lying-leg-raises", "cable-crunches", "cardio-session", "bench-press", "pec-deck-fly",
  "lateral-raises", "tricep-overhead-extensions", "rope-pushdown", "tricep-kickbacks",
  "seated-cable-row", "machine-row", "rear-delt-fly", "barbell-shrugs", "bicep-curls",
  "hammer-curls", "goblet-squats", "leg-press", "reverse-lunges", "hamstring-curls",
  "woodchoppers", "decline-reverse-crunch", "active-recovery",
]);

function ownerId(request: Request) {
  return request.headers.get("oai-authenticated-user-id") ?? "personal-workout-log";
}

async function ensureSchema() {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id TEXT NOT NULL,
      workout_date TEXT NOT NULL,
      session TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      weight REAL,
      reps INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_logs_owner_date_session_exercise ON workout_logs(owner_id, workout_date, session, exercise_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_workout_logs_owner_date ON workout_logs(owner_id, workout_date)"),
  ]);
}

async function listLogs(owner: string) {
  const result = await env.DB.prepare(`SELECT id, workout_date AS date, session, exercise_id AS exerciseId, weight, reps
    FROM workout_logs WHERE owner_id = ? ORDER BY workout_date ASC, id ASC LIMIT 1200`).bind(owner).all();
  return result.results;
}

export async function GET(request: Request) {
  try {
    await ensureSchema();
    return Response.json({ logs: await listLogs(ownerId(request)) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load workout history" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { date?: unknown; session?: unknown; entries?: unknown };
    if (typeof payload.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) return Response.json({ error:"A valid workout date is required" }, { status:400 });
    if (typeof payload.session !== "string" || !allowedSessions.has(payload.session)) return Response.json({ error:"A valid workout session is required" }, { status:400 });
    if (!Array.isArray(payload.entries)) return Response.json({ error:"Workout entries are required" }, { status:400 });

    const entries = (payload.entries as IncomingEntry[]).map((entry) => ({
      exerciseId: typeof entry.exerciseId === "string" ? entry.exerciseId : "",
      weight: typeof entry.weight === "number" && Number.isFinite(entry.weight) && entry.weight >= 0 ? entry.weight : null,
      reps: typeof entry.reps === "number" && Number.isInteger(entry.reps) && entry.reps >= 0 ? entry.reps : null,
    })).filter((entry) => allowedExercises.has(entry.exerciseId) && (entry.weight !== null || entry.reps !== null));

    await ensureSchema();
    const owner = ownerId(request);
    const statements = [env.DB.prepare("DELETE FROM workout_logs WHERE owner_id = ? AND workout_date = ? AND session = ?").bind(owner, payload.date, payload.session)];
    for (const entry of entries) statements.push(env.DB.prepare(`INSERT INTO workout_logs (owner_id, workout_date, session, exercise_id, weight, reps)
      VALUES (?, ?, ?, ?, ?, ?)` ).bind(owner, payload.date, payload.session, entry.exerciseId, entry.weight, entry.reps));
    await env.DB.batch(statements);
    return Response.json({ logs: await listLogs(owner) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not save workout" }, { status: 500 });
  }
}
