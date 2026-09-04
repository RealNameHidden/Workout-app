# Rep Quest

Rep Quest is a playful, mobile-first workout log for tracking your best set and seeing your strength improve over time.

## What it does

- Choose any date, including past dates.
- Select an Upper, Lower, Push, or Pull workout.
- See the exercises and target sets/reps for that session.
- Log a maximum weight and optional reps for any exercise.
- Start from the most recent weight you previously logged without recording skipped exercises.
- Review exercise-by-exercise progress and personal bests.
- Use the compact interface on phones and foldable cover screens.

Workout data is stored in Cloud Firestore and separated by an anonymous Firebase user ID. Dates with no saved workout are treated as rest days automatically.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local address printed in the terminal. By default, it is usually `http://localhost:3000`.

## Useful commands

```bash
npm run dev     # Start the development server
npm run build   # Create and validate a production build
npm run start   # Run the production build locally
npm run lint    # Check the source code
```

## Tech stack

- React 19
- TypeScript
- Vite
- Firebase Hosting, Google/anonymous Authentication, and Cloud Firestore

## Project structure

- `app/page.tsx` — workout logger and progress dashboard
- `app/globals.css` — responsive visual design
- `src/firebase.ts` — Firebase Authentication and Firestore persistence
- `public/icons/` — custom workout icons
- `firebase.json` — Firebase Hosting and Firestore configuration

## Privacy

Workout records are private to the current Firebase identity. Signing in with Google links any existing anonymous workout history to that account so it can be accessed on other devices. If Google sign-in is skipped, clearing browser data creates a new anonymous identity and its earlier records will no longer be visible.
