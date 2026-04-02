# AgendaFlow

Municipal agenda management for BC local government. Built with React + TypeScript + Vite frontend and Node.js/Express + SQLite backend.

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start both server and client
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Design

Uses the **Arctic Frost Glass** theme — frosted glass panels on a soft blue-grey gradient, with a slate (#475569) primary color system. Designed for readability during long council sessions.

## Features

- **Meeting Management** — Create, edit, publish meetings (Regular, Special, Closed, Committee of the Whole)
- **Agenda Builder** — Drag-and-drop agenda item reordering, section templates, auto-numbering
- **Bylaw Tracker** — Reading number tracking (1st → 2nd → 3rd → Adoption)
- **Resolution Management** — Auto-generated resolution numbers, vote recording
- **Delegation Management** — Register delegates, set time allocations
- **Minutes Module** — Side-by-side agenda outline and minutes editor
- **Search** — Full-text search across all meetings and items
- **Pending Items** — Track tabled/deferred items across all meetings

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, React Router v6, Zustand, React Query, @dnd-kit
- **Backend:** Node.js, Express, better-sqlite3, multer
- **Database:** SQLite (WAL mode)
