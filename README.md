# Daily Planner

A personal planner: dump every task, write the steps inside a task, and pick at
most three daily priorities for today. It runs on this Mac only.

## Run it

First time only:

```bash
npm install
```

Then build and start it:

```bash
npm run serve
```

Open http://localhost:3000. Stop it with Ctrl+C.

The server listens on `127.0.0.1` only, so other machines on the network or the
internet cannot reach it. There is no login.

## Where the data lives

Everything is saved in `data/planner.db`, a SQLite file created on first run. The
`data/` folder is gitignored because this repository is public. Back that file up
if you want to keep your tasks.

## Develop

`npm run dev` starts the development server on http://localhost:3000.
