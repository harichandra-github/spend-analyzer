# Spend Analyzer — Requirements

## 1. Overview
A free, public web app for tracking **personal** expenses, setting budgets, and understanding spending through dashboards and PDF reports. Responsive web only (no native apps). Hosted entirely on free tiers.

## 2. Decisions
| Area | Decision |
|---|---|
| Audience | Public users, each with a private account |
| Pricing | Completely free |
| Data input | Manual entry + CSV upload (no bank APIs) |
| Categories | Predefined defaults + user-created custom categories |
| Reports | PDF export only |
| Platform | Responsive web app |
| Currency | INR (single currency, configurable in code) |
| Timeline | Flexible; built in 3 phases |

## 3. Tech stack
| Layer | Choice |
|---|---|
| Frontend | React + TypeScript, built with Vite |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore |
| Data isolation | Firestore security rules (`users/{uid}/...` readable/writable only by that user) |
| Hosting | Netlify (static site) |
| Server code | Netlify Functions only if a later feature needs it (e.g. scheduled jobs); not needed for Phases 1–3 |
| Charts | Recharts (Phase 2) |
| PDF | jsPDF, generated in the browser (Phase 3) |

## 4. Functional requirements

### 4.1 Accounts
- Sign up, log in, log out with email and password.
- Session persists across reloads.
- A user can only ever see and change their own data.

### 4.2 Expenses
- Fields: amount (required, > 0), date (required), category (required), description (required), payment method (optional), notes (optional).
- Create, view, edit, delete (with confirmation).
- List filtered by month, newest first.

### 4.3 Categories
- Defaults: Food, Transport, Shopping, Bills, Entertainment, Healthcare, Education, Other.
- Users can add, rename, and delete custom categories (Phase 2).

### 4.4 Budgets (Phase 2)
- Monthly budget per category and/or overall.
- Show spent vs. budget; warn at 80%, alert above 100%.

### 4.5 Recurring expenses (Phase 3)
- Weekly / monthly / yearly items (e.g. subscriptions).
- Show upcoming due items and monthly recurring total; pause/resume/delete.

### 4.6 Dashboard & analytics
- Phase 1: this month's total, number of expenses, top category, category breakdown, recent expenses.
- Phase 2: category pie/bar chart, budget vs. actual.
- Phase 3: trends over time, custom date ranges.

### 4.7 CSV import (Phase 2)
- Columns: Date, Amount, Description, Category.
- Preview with row-level validation errors before saving.

### 4.8 PDF reports (Phase 3)
- Date range filter; includes summary, category breakdown, budget comparison, expense table.

## 5. Non-functional requirements
- Responsive down to 360px width; light and dark themes.
- Accessible forms (labels, keyboard navigation, visible focus).
- Passwords handled entirely by Firebase Auth (never stored by the app).
- HTTPS (default on Netlify and Firebase).
- Stay within Firebase Spark (free) and Netlify free limits.

## 6. Data model (Firestore)
```
users/{uid}/expenses/{expenseId}
  amount: number
  date: string            // YYYY-MM-DD
  categoryId: string
  description: string
  paymentMethod?: string
  notes?: string
  createdAt: timestamp

users/{uid}/categories/{categoryId}   // Phase 2 (custom only)
users/{uid}/budgets/{budgetId}        // Phase 2
users/{uid}/recurring/{recurringId}   // Phase 3
```

## 7. Phases
1. **Core** — auth, expense CRUD, default categories, dashboard summary, Netlify deploy. ✅ Built
2. **Enhanced** — custom categories, budgets + alerts, charts, CSV import. ✅ Built
3. **Advanced** — recurring expenses, trends, PDF reports, search and filters. ✅ Built

Implementation notes:
- Budgets are monthly. PDF reports scale them by the number of months in the selected period.
- Recurring payments are not added automatically. When one is due, the user chooses **Add as expense** or **Skip**, so nothing is charged to their history without them seeing it.
- Category charts use a single colour (ranked bars) rather than a colour per category, so custom categories never run out of distinguishable colours.
- Tags were dropped in favour of free-text search over description and notes.

## 8. Acceptance criteria (Phase 1)
- A new user can sign up, log out, and log back in.
- A user can add, edit, and delete an expense, and changes persist after reload.
- User A cannot read or write user B's expenses (enforced by security rules).
- Dashboard numbers match the expenses list for the current month.
- The app builds and deploys to Netlify.
