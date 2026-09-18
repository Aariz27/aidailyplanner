# Build Plan

List the features that make up your project, high level and in rough build order.
Keep each item to one line; the details come later in `/feature`.

Plain bullets are fine. When both planning docs are ready, run `/overview`.
It adds tracking numbers and checkboxes to your feature list before generating
the project overview.

Run `/feature` to spec the next unchecked item, or `/feature 2` to pick one.
Keep completed items checked and append new features as the project grows.
Do not renumber completed features; their archived specs refer to those IDs.

Scaffolding the app and prototyping its look are pre-build steps, not features.
Start with your first real slice of functionality.

## Your features

- [x] 1. **SQLite storage for tasks** - create one SQLite file in the project with tables for tasks, steps, daily priorities and important dates, so nothing is lost on reload
- [x] 2. **Task dump list** - the left sidebar of the overview tab where Aariz adds, edits and deletes tasks, each with an optional due date
- [x] 3. **Steps inside a task** - an "add progressions" button opens the task and shows a flow chart of `[] -> []`, starting with two boxes and one arrow, with a button to add another `-> []`
- [x] 4. **Three daily priorities for today** - the middle column of the overview tab, holding at most three daily priorities, where each daily priority is either a whole task or one single step from inside a task
- [x] 5. **Started but not completed list** - the right sidebar of the overview tab, listing every daily priority Aariz did not finish
- [ ] 6. **Important dates box** - a small box in the top right corner of the overview tab showing facts like the semester start date and the Claude Code token expiry date
- [ ] 7. **Strategy tab** - a second tab listing every task with its full progression
- [ ] 8. **Completed tab** - a third tab holding the finished tasks so they leave the overview
- [ ] 9. **Run it on Aariz's own server** - one documented command that builds the app and serves it locally, so it is never put on the public internet
