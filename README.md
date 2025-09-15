# Coconut Sap Fermentation Center

A web application for monitoring and analyzing coconut sap fermentation (lambanog), now integrated with sensor-ready workflows and a streamlined, informative dashboard.

- Dashboard with batches, statuses, and charts
- Save New Record with analysis, forecast, and timeline
- Record Summary view
- Real-time Fermentation Monitoring graph
- Slide-out side menu navigation

This app is built with React (Create React App) and Recharts. It implements a clear, at‑a‑glance dashboard and supports local storage plus optional Flask API integration.

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
  - Live clock and date
  - KPI cards: Total Batches, Batches Ready, Batches In Progress (+ concise subtext)
  - Quick Insights row: Most Recent Record, Next Estimated Completion, Current Time
  - Batch List with clear columns and highlighted status
  - Chart: Total Liters of Lambanog Made (full-width) with Day/Month/Year aggregation

- Save New Record
  - Auto-incrementing Batch Number
  - Real-time Analysis: updates readiness as you type (thresholds: Brix ≥ 15, Alcohol ≥ 20, Temp 28–35°C; configurable)
  - New Produced Liters field (manual): updates the liters chart without showing in the batch table
  - Estimated completion now uses a 3–5 day window (default +4 days)
  - Green-themed toast on save and a confirm modal on reset (no native browser alerts)

- Record Summary
  - Clean per-batch details and production summary grid

- Fermentation Monitoring
  - Real-time styled line chart (demo data), ready to connect to sensor feed

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

## Flask API Integration (Optional)

- Base URL is configurable via `REACT_APP_API_BASE` (defaults to `http://localhost:5000`).
- Dashboard prefers `GET /api/batches`; falls back to `localStorage('batches')` if API is offline.
- Save New Record posts to `POST /api/batches` (best-effort) and always updates localStorage for instant UI feedback.

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
