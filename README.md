# Coconut Sap Fermentation Dashboard

A web application for monitoring and analyzing coconut sap fermentation (Lambanog) with a focus on visual analytics and simple operations. It includes:

- Dashboard with batches, statuses, and charts
- Save New Record with analysis, forecast, and timeline
- Record Summary view
- Real-time Fermentation Monitoring graph
- Slide-out side menu navigation

This app is built with React (Create React App) and Recharts. It is designed to match the provided UI mockups and implements a “single active batch” monitoring rule.

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

## Features

- Dashboard
  - Live clock and date
  - Batch list with “End Date” and N/A for queued batches
  - Charts: Total Liters and Predicted Sales
  - Day/Month/Year selectors per chart (independent)
- Save New Record
  - Auto-increment batch numbers (starts at 001)
  - Saves to localStorage and updates Dashboard
  - Reset button clears batches and resets Dashboard
- Record Summary
  - Styled production summary grid
- Fermentation Monitoring
  - Real-time styled line chart (demo data)
- Responsive layout and subtle animations

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

## Usage Notes

- Navigation: click the hamburger icon (top-right) to open the side menu, then select a page.
- Single Active Batch: only the earliest batch by Start Date is marked as Ready; others show N/A.
- Save New Record:
  - “Batch Number” auto-increments based on the highest existing ID in localStorage.
  - Log Date is used as Start Date; End Date auto-calculates (+2 days by default).
  - “Reset” clears saved batches and returns you to the Dashboard.
- Charts:
  - Each chart’s Day/Month/Year selector works independently.
  - In Month/Year, values aggregate by month for multi-point lines.

## Troubleshooting

- Blank page after edits: hard refresh the browser (Ctrl+Shift+R). If issues persist, stop and re-run `npm start`.
- Dependency issues: delete `node_modules` and `package-lock.json`, then run `npm install` again.
- Port conflict: if port 3000 is busy, close the other app or set `PORT=3001` before `npm start`.

## License

This project is for academic/demo purposes. Adjust or add a license file as needed for your deployment.
