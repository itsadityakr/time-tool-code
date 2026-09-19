# WorkLog Pro

Upload a worklog spreadsheet and turn it into a dashboard — table, analytics, calendar, and per-project views, with export back out. A Vite + React frontend backed by an Express API.

## Stack

- **Frontend** — React + Vite (`frontend/`)
- **Backend** — Express with `multer` upload + Excel/CSV parsing (`backend/`)
- `concurrently` runs both from the repo root

## Features

- **Upload** an Excel/CSV of worklogs — flexible column matching (`JIRA ID`, `Description`, `Date`, `Time`, `Status`, `Project`, `Remarks`)
- **Dashboard** — sortable, filterable table with configurable columns
- **Analytics** — charts and stats over your logged time
- **Calendar** — worklogs grouped by date
- **Projects** — per-project breakdown
- **Export** and CRUD on individual entries (add / edit / delete, plus clear-all)

## API (backend, `:5000`)

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/worklogs` | List all worklogs |
| `POST` | `/api/worklogs` | Add a worklog |
| `PUT` | `/api/worklogs/:id` | Edit a worklog |
| `DELETE` | `/api/worklogs/:id` | Delete one worklog |
| `DELETE` | `/api/worklogs` | Clear all worklogs |
| `GET` | `/api/worklogs/filter/date/:date` · `/filter/project/:name` · `/filter/range` | Filtered views |
| `POST` | `/api/upload` | Upload + parse a spreadsheet |
| `GET` | `/api/stats` · `/api/worklogs/grouped/dates` | Summary stats |

## Layout

```
backend/
  server.js          # Express API + upload/parse
  uploads/           # uploaded files land here
frontend/
  src/
    views/           # Dashboard, Analytics, Calendar, Projects
    components/       # Header, Sidebar, modals, toast, UI kit
    hooks/           # useWorklogData
    utils/           # apiService, exportUtils, helpers
    constants/       # API URL, theme, column defs, view modes
```

## Scripts

```bash
npm install                     # root (concurrently)
npm install --prefix backend
npm install --prefix frontend
npm run dev                     # backend + frontend together
```

## License

MIT © 2026 Aditya Kumar
