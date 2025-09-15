# Coconut Sap Fermentation Center

Modern web app for managing coconut sap (lambanog) fermentation. It includes an opinionated UI, real-time monitoring wired to a Flask API, accessibility improvements, and purposeful micro‑interactions.

- Dashboard with KPIs, filters, table, and chart
- Save New Record with validation, completion meter, and timeline
- Record Summary with sticky header and quick navigation
- Fermentation Monitoring connected to live readings
- Slide‑out side menu navigation

Built with React (CRA) and Recharts on the frontend, and a lightweight Flask API + SQLite in `data/` on the backend.

## Project Structure

```
Coconut-Sap-Fermentation/
├─ coconut-fermentation/        # React app
│  ├─ public/
│  ├─ src/
│  │  ├─ App.js                 # Main app with pages and navigation
│  │  └─ ...
│  ├─ package.json              # Scripts (start/build/test)
│  └─ README.md
└─ README.md                    # You are here
```

## Features (Updated)

- Dashboard
  - Live clock/date; animated counters for KPIs
  - KPI cards: Total Batches, Ready, In‑Progress
  - Filters (chips): All / Ready / In‑Progress; live update indicator
  - Batch List with clear statuses; skeleton rows on initial load
  - Chart: Total Liters with Day/Month/Year aggregation

- Save New Record
  - Completion meter and inline helper hints (targets: Brix ≥ 15, Alcohol ≥ 20, Temp 28–35 °C)
  - Sanitized inputs with custom +/- steppers; keyboard shortcuts (Enter to Save; Ctrl/Cmd+K to focus first incomplete)
  - Autosave draft to `localStorage`; success toast; guarded Save with disabled state and spinner
  - Estimated completion (+4 days) shown in a two‑column timeline panel

- Record Summary
  - Sticky header with batch picker, Prev/Next buttons, status chip
  - Arrow Left/Right to switch batches (keyboard)
  - Completion meter and two‑column details with hints; skeletons on batch switch

- Fermentation Monitoring
  - Live chart wired to Flask endpoint `GET /readings/<batch_id>` (see `data/app.py`)
  - Series: Temperature (left Y), Gravity and pH Level (right Y)
  - Sticky header: batch input, live indicator, start time; skeleton on load

- General UX
  - Slide-out side menu
  - Subtle animations and responsive layout

## Prerequisites

- Node.js 18+ and npm
- Windows PowerShell or any terminal

Check versions:
```
node -v
npm -v
```

## Setup and Run

1) Navigate to the app folder:
```
cd coconut-fermentation
```

2) Install dependencies:
```
npm install
```

3) Start the development server:
```
npm start
```
This opens http://localhost:3000

4) Build for production:
```
npm run build
```

## Usage Notes (Updated)

- Navigation: click the hamburger icon (top-right) to open the side menu, then select a page.
- Single Active Batch (current rule): only the earliest batch by Start Date is marked Ready; others show N/A. You can switch to a time-based readiness rule later if desired.
- Save New Record:
  - “Batch Number” auto-increments based on the highest existing ID in localStorage.
  - Log Date is used as Start Date; End Date auto-calculates (+4 days by default to match 3–5 day target).
  - Save shows a green toast then navigates to the Dashboard after ~1.2s.
  - Reset opens a confirm modal; after confirming, a green toast appears.
- Charts:
  - Each chart’s Day/Month/Year selector works independently.
  - In Month/Year, values aggregate by month for multi-point lines.

## Flask API Integration (Updated)

- Base URL via `REACT_APP_API_BASE` (default `http://localhost:5000`).
- Dashboard prefers `GET /api/batches` (fallback: `localStorage`).
- Save New Record posts to `POST /api/batches` (best‑effort) and updates `localStorage` for instant UI.
- Monitoring polls `GET /readings/<batch_id>` every 5s to build series from `angle`, `temperature`, `gravity`, and `timestamp` fields in `ispindel.db`.

Example (Windows PowerShell):
```
$env:REACT_APP_API_BASE="http://localhost:5000"; npm start
```

## Troubleshooting

- Blank page after edits: hard refresh the browser (Ctrl+Shift+R). If issues persist, stop and re-run `npm start`.
- Dependency issues: delete `node_modules` and `package-lock.json`, then run `npm install` again.
- Port conflict: if port 3000 is busy, close the other app or set `PORT=3001` before `npm start`.

## License

This project is for academic/demo purposes. Adjust or add a license file as needed for your deployment.
