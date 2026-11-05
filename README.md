# Spend Analyzer

Personal expense tracker — React + TypeScript (Vite), Firebase Auth + Firestore, hosted on Netlify. Requirements: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

## Features
- Email/password accounts; each user's data is private (enforced by [firestore.rules](firestore.rules))
- Expenses: add, edit, delete, search, filter by month / category / payment method
- Default + custom categories (rename, delete)
- Monthly budgets per category and overall, with 80% warnings and over-budget alerts
- Recurring payments (weekly / monthly / yearly) with one-click "add as expense", skip, pause
- Analytics: spending over time, by category, with table views and date-range presets
- CSV import with preview and row-level validation (template downloadable in the app)
- PDF reports for any date range
- Light/dark theme, works on mobile

## Firebase setup (one time)
1. Create a project at https://console.firebase.google.com (Spark/free plan).
2. **Authentication → Sign-in method** → enable **Email/Password**.
3. **Firestore Database** → create database (production mode).
4. **Firestore → Rules** → paste the contents of [firestore.rules](firestore.rules) and publish.
5. **Project settings → Your apps** → add a Web app and copy its config.
6. `cp .env.example .env` and fill in the values.

## Run locally
```
npm install
npm run dev
```

## Try it without a Firebase project (optional)
Uses Firebase's local emulators (needs Java). Data is thrown away when you stop them.
```
npx firebase-tools emulators:start --only auth,firestore --project demo-spend
```
In a second terminal:
```
VITE_USE_EMULATORS=true VITE_FIREBASE_API_KEY=demo VITE_FIREBASE_PROJECT_ID=demo-spend npm run dev
```

## Deploy to Netlify
1. Push this folder to a GitHub repo and import it in Netlify (build settings come from [netlify.toml](netlify.toml)).
2. In Netlify **Site configuration → Environment variables**, add every `VITE_FIREBASE_*` value from `.env`.
3. In Firebase **Authentication → Settings → Authorized domains**, add your `*.netlify.app` domain.
