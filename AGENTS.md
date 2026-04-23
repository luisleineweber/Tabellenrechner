# Agent Instructions (Repo)

Standalone web app that imports amateur football competitions from `fussball.de` and provides a Kicker-like Tabellenrechner with editable match results and a recalculated live table. Stack: Next.js, TypeScript, server-side HTML parsing, and a client-side React UI. Constraints: prefer robust import logic over brittle DOM shortcuts, keep parser/decoder/search/table calculation isolated, and avoid persistence or accounts in v1.

## Placeholder Policy

- Placeholders marked `--- Enter ... ---` are editable by the agent without asking first.
- On project start, replace placeholders with concrete project details.
- Remove placeholder lines once real content is added.

## Session Start Checklist

1. **Self-Check:** Read this file and summarize the project goal + current stack to the user.
2. **Context Audit:** Review `tasks/todo.md`. If missing, create it with the first 3 steps.
3. **Skill Discovery:** If the task involves a specific tech (e.g., Stripe, Docker, Tailwind), run `$find-skills [tech-name]` and propose adding it to "Active Skills."
4. **Environment Check:** Run a basic build/test command (e.g., `npm run dev` or `ls src/`) to confirm the filesystem is as expected.
5. **Onboarding Complete:** Confirm with Luis that the environment is ready for the first task.

## Change Packaging (Commits)

- Make changes in small, reviewable packages (one concept per package).
- Write commit messages that a reviewer can understand at a glance (imperative mood, scoped).
- **Do not create commits unless the user explicitly asks.**

## Branch Workflow

- When working with branches, use a Rebase-Merge workflow.
- Keep feature branches rebased onto the target branch before merging.

## Operating Rules

- Work in small, shippable slices.
- Prefer correctness + guardrails over "more features".
- **Ralph Wiggum Loop:** If a task takes more than 3 failed attempts (tests failing, build errors, or linter issues), STOP and ask Luis for a different approach. Do not attempt a 4th time.

## Session Start Checklist

1. Read this file once before significant work.
2. Review `tasks/lessons.md` (create it if missing).
3. Create/update `tasks/todo.md` with a short, testable plan.
4. Confirm stack-specific tools/skills needed for this project.

## Planning Default (Non-Trivial Work)

Any non-trivial task (3+ steps, refactors, architectural changes) starts with planning.

- Default: enter "plan mode" and write a concrete plan before coding.
- If new info invalidates the plan: stop and re-plan immediately (do not push through).
- Write detailed specs and acceptance criteria in `tasks/todo.md` before writing code.

In this repo, "plan mode" means:

- Create/update a short step list in `tasks/todo.md`.
- Track progress by checking items `[ ]` -> `[x]`.
- Keep scope tight and verifiable.

## Subagent Strategy

Use subagents liberally for research, parallel analysis, or exploration.

- One specific task per subagent.
- Subagents produce a short written result (findings + recommended next step), not code, unless explicitly asked.

## Self-Improvement Loop

- **Mandatory Trigger:** Every time a bug is fixed or a manual correction is received from Luis, the agent MUST append the learning to `tasks/lessons.md` BEFORE marking the task `[x]` in `tasks/todo.md`.
- Record:
  - What went wrong (pattern)
  - The fix
  - A prevention rule (actionable, enforceable)
- At the start of every session, review `tasks/lessons.md` before doing significant work (or create it if absent).

## Verification & Elegance

- Proof of work: do not mark a task done without verification (build, tests, logs, or manual check).
- Elegance check: for complex changes, pause and ask "is there a simpler or more elegant approach?"
- Bug fixing: fix bugs autonomously. Point at logs/errors, then resolve without hand-holding.


## Skills Strategy (Lean Core + On-Demand Breadth)

Use a small core set for speed, then expand per task using `$find-skills`.

### Core Skills (default for most projects)

- `find-skills`: discover/install missing capabilities quickly.
- `karpathy-guidelines`: default coding guardrails for implementation, refactors, and reviews.
- `impeccable`: primary skill for web UI implementation and high-quality frontend delivery.
- `audit`: standards/accessibility/performance checks for web UI.
- `critique`: usability, hierarchy, and flow review before or after design work.

### Stack-Specific Skills (install only when relevant)

- `convex`: use when the project includes Convex backend/realtime/agents.
- `notion-api`: add when Notion integration is part of the scope.

Install command for Notion:
- `npx skills add intellectronica/agent-skills@notion-api -g -y`

### Active Skills For This Project (keep short: max 6)

- `karpathy-guidelines`
- `impeccable`
- `adapt`
- `audit`
- `critique`

### Skill Selection Rules
- **Search-First:** Before starting any task outside the "Core Skills", the agent MUST run `$find-skills [relevant keywords]` to see if a specialized skill exists.
- **Just-in-Time Installation:** Install skills only when they are directly required for the current `tasks/todo.md` item.
- **Clean-up:** At the end of a milestone, remove "Active Skills" that are no longer being used to keep the context window lean.

### Skill Hints

- Default coding/refactor/review: `karpathy-guidelines`
- New or major UI work: `impeccable`
- Responsive fixes: `adapt`
- Accessibility/performance/quality checks: `audit`
- UX review before redesign: `critique`
- OpenAI/API/model questions: `openai-docs`
- For anything more specific, run `$find-skills [keywords]`

## Skills Usage

- Web UI: `impeccable`, plus `adapt` if responsive, then `audit`
- UX review: `critique`
- Skill discovery: `$find-skills`
- OpenAI work: `openai-docs`
- Notion: `notion-api` when needed
- Convex: `$convex`

### Project-Specific Notes

- Treat `fussball.de` markup, Ajax endpoints, and obfuscation fonts as unstable external dependencies and keep adapters easy to replace.
- If the importer fails structurally, preserve the rest of the UI and show a clear error instead of silently falling back.
- For parser changes, verify against a real `fussball.de` competition URL when possible.


## Definition Of Done (per slice)

- Code compiles and runs on a small fixture export.
- Has at least one test if adding core logic (parsers, dedup, analyzer, state, transforms).

## Task Management Protocol

1. Initialize: write the plan to `tasks/todo.md`.
2. Execute: mark items `[x]` as you complete them.
3. Summarize: when finished, provide a high-level summary of changes.
4. Lesson capture: if a bug/mistake happened, document the fix + prevention rule in `tasks/lessons.md`.

