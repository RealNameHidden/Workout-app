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

Workout data is stored through the app's Cloudflare D1 binding. Dates with no saved workout are treated as rest days automatically.

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
- vinext and Vite
- Cloudflare Workers and D1
- OpenAI Sites hosting configuration

## Project structure

- `app/page.tsx` — workout logger and progress dashboard
- `app/globals.css` — responsive visual design
- `app/api/workouts/route.ts` — workout history API and D1 persistence
- `public/icons/` — custom workout icons
- `.openai/hosting.json` — Sites hosting and database binding

## Privacy

When hosted through Sites, workout records are separated using the authenticated visitor ID supplied to the app. Local development uses a local fallback owner ID.
