import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, linkWithPopup, onIdTokenChanged, signInAnonymously, signInWithCredential, signInWithPopup, signOut, type AuthError, type User } from "firebase/auth";
import { collection, doc, getFirestore, onSnapshot, writeBatch, type Unsubscribe } from "firebase/firestore";

export type WorkoutLog = {
  id?: string;
  date: string;
  session: string;
  exerciseId: string;
  weight: number | null;
  reps: number | null;
};

const firebaseConfig = {
  apiKey: "AIzaSyDF-k6YNKDU1RkzPw6m4zHBKfhQ-lJlynk",
  authDomain: "rep-quest-2095a.firebaseapp.com",
  projectId: "rep-quest-2095a",
  storageBucket: "rep-quest-2095a.firebasestorage.app",
  messagingSenderId: "201308389047",
  appId: "1:201308389047:web:fdb69d946ba63597855732",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const database = getFirestore(firebaseApp);
let userPromise: Promise<User> | undefined;

export type WorkoutAccount = {
  displayName: string | null;
  email: string | null;
  isAnonymous: boolean;
};

function getWorkoutUser() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  userPromise ??= signInAnonymously(auth).then(({ user }) => user);
  return userPromise;
}

export async function subscribeWorkoutLogs(
  onLogs: (logs: WorkoutLog[]) => void,
  onError: (error: Error) => void,
): Promise<Unsubscribe> {
  let stopSnapshot: Unsubscribe | undefined;
  const stopAuth = onIdTokenChanged(auth, (user) => {
    stopSnapshot?.();
    stopSnapshot = undefined;
    if (!user) { void getWorkoutUser().catch(onError); return; }
    stopSnapshot = onSnapshot(
      collection(database, "users", user.uid, "workoutLogs"),
      (snapshot) => {
        const logs = snapshot.docs.map((entry) => ({ id:entry.id, ...entry.data() } as WorkoutLog));
        logs.sort((a,b) => a.date.localeCompare(b.date));
        onLogs(logs);
      },
      (error) => onError(error),
    );
  });
  await getWorkoutUser();
  return () => { stopSnapshot?.(); stopAuth(); };
}

export function subscribeWorkoutAccount(onAccount: (account: WorkoutAccount | null) => void) {
  return onIdTokenChanged(auth, (user) => onAccount(user ? {
    displayName:user.displayName,
    email:user.email,
    isAnonymous:user.isAnonymous,
  } : null));
}

export async function signInWithGoogle() {
  const user = await getWorkoutUser();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt:"select_account" });
  try {
    if (user.isAnonymous) return (await linkWithPopup(user, provider)).user;
    return (await signInWithPopup(auth, provider)).user;
  } catch (error) {
    const authError = error as AuthError;
    const credential = GoogleAuthProvider.credentialFromError(authError);
    if (authError.code === "auth/credential-already-in-use" && credential) {
      return (await signInWithCredential(auth, credential)).user;
    }
    throw error;
  }
}

export async function signOutWorkoutAccount() {
  await signOut(auth);
  userPromise = undefined;
  await getWorkoutUser();
}

export async function saveWorkoutSession(
  date: string,
  session: string,
  entries: Array<{ exerciseId: string; weight: number | null; reps: number | null }>,
) {
  const user = await getWorkoutUser();
  const batch = writeBatch(database);
  for (const entry of entries) {
    const reference = doc(database, "users", user.uid, "workoutLogs", `${date}_${session}_${entry.exerciseId}`);
    if (entry.weight === null && entry.reps === null) batch.delete(reference);
    else batch.set(reference, { date, session, exerciseId:entry.exerciseId, weight:entry.weight, reps:entry.reps });
  }
  await batch.commit();
}
