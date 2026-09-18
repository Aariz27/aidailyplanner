# Feature: Run it on Aariz's own server

**From build-plan:** feature 9
**Build attempt:** 1
**Status:** verified
**Branch:** feature/run-it-on-aariz-s-own-server

## Goal

One documented command that builds the app and serves it on Aariz's Mac only, so
it is never reachable from the home network or the public internet.

## In scope

- `npm run start` serves on `127.0.0.1` only (`next start -H 127.0.0.1`).
- New `npm run serve` builds then starts: `next build && next start -H 127.0.0.1`.
- `README.md` replaced with how to run the planner: `npm install` once, then
  `npm run serve`, open http://localhost:3000, where the data lives (`data/planner.db`,
  gitignored) and that the server only listens on this Mac.
- `AGENTS.md` Commands lists `npm run serve` and the `127.0.0.1` binding.

## Out of scope

- Starting the app at login, process managers, HTTPS, other ports.
- Vercel or any hosting.

## Build loop

Continuous Mode: build the step, run its check, no step commits.

## Build steps

- [x] **1. Local-only serve command and docs.**
  **Done when:** typecheck, lint and build pass; with `npm run start` running,
  `lsof -nP -iTCP:3000 -sTCP:LISTEN` shows it listening on `127.0.0.1:3000` only,
  and `curl http://127.0.0.1:3000/` returns HTTP 200; the server is then stopped.

## Files / areas

- `package.json` - `start`, `serve` scripts
- `README.md`, `AGENTS.md` - run instructions

## Testing

No test runner. Typecheck, lint, build, then the `lsof` and `curl` check above.

## Notes for the AI

- No em dashes in docs.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":1539,"specSha256":"a0fd5a19a6d06a09378f78a738ab6f14227323f0a0732ff6b59fa4b43fe6504e","branch":"refs/heads/feature/run-it-on-aariz-s-own-server","head":"0061a78532cbd265dc0b4180a2b15e70c7070531","baseRef":"refs/heads/main","baseCommit":"0061a78532cbd265dc0b4180a2b15e70c7070531","sourceTree":"08855ac4e70f49d01a2adadb3284795ee07db3a7","absentOptional":[]} -->
