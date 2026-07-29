---
name: kickoff
description: Check this repo's current directives (CLAUDE.md Session Start, HANDOFF.md, HQ's stated goal) and either start the obvious next piece of work or report status if there isn't one. Also supports `refresh` (re-pull HQ-level context, read-only) and `regroup <reason>` (escalate a decision back to HQ instead of guessing). Use at the start of a session, or whenever Omar says "kickoff", "what's next", "refresh", or "regroup".
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(git status *)
  - Bash(git log *)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(curl *)
---

# /kickoff

Three distinct behaviors depending on `$ARGUMENTS` — default (empty),
`refresh`, or `regroup <reason>`. Added 2026-07-29 across all HQ-registered
repos so each one can be picked up consistently without re-deriving "what
do I do first" every time.

## Default (no argument): check directives, start or report

1. Read this repo's own `CLAUDE.md` Session Start section (or top-level
   content if there's no explicit heading) — it names the read order.
2. Follow that order: `HANDOFF.md` if it exists, then `README.md`.
3. Check `C:\dev\hq\ceo\GOALS.md` for this repo's own stated goal/target
   date (match by repo name against the headings there).
4. Decide:
   - If `HANDOFF.md` (or equivalent) states a clear next step, and
     nothing about it conflicts with the stated goal — just start that
     work. Say what you're doing and why in one line, then proceed.
   - If there's no clear next step, multiple plausible directions, or
     the last HANDOFF conflicts with what `GOALS.md` says the goal is —
     stop and report: current status, the options as you see them, and
     ask which one Omar wants. Don't guess at a priority call.
5. Stay inside this repo's own working directory. Don't edit other
   repos, and don't edit HQ's own files (see `refresh` below for the
   read-only exception).

## `refresh`

Re-read, without necessarily starting new work:

- `C:\dev\hq\ceo\GOALS.md` — this repo's stated goal may have changed
- `C:\dev\hq\registry\projects.yaml` — this repo's own entry (status,
  related_projects, notes)
- This repo's own `CLAUDE.md` — HQ may have updated its directives since
  this session started

Report what, if anything, changed since the session started or since the
last refresh. Read-only — never edit HQ's files from here. HQ's
infrastructure-pattern exception runs one direction (HQ can write into
this repo's `CLAUDE.md`); it doesn't run in reverse.

## `regroup <reason>`

For decisions that genuinely need HQ-level judgment — span multiple
projects, conflict with a stated goal, or are a priority call Omar hasn't
made yet. Not a way to dodge an ordinary in-repo decision this session
could make on its own.

1. If `HANDOFF.md` doesn't exist, create it (minimal: status + this
   escalation). If it exists, add/update a `## Needs HQ decision` section
   near the top.
2. Write one concise entry: what's blocking, why it's not this repo's
   call alone, what decision is needed. One entry per distinct issue —
   don't let this section become a dumping ground of vague concerns.
3. Commit locally (this repo's own commit — not a push, unless told to).
4. Tell Omar plainly: this needs an HQ-level call, flagged in
   `HANDOFF.md`, bring it up next time in the HQ session. Don't try to
   resolve it yourself after flagging it.

## What NOT to do

- Don't fabricate a next step that doesn't exist in `HANDOFF.md` — report
  "no stated next step" honestly instead of inventing one.
- Don't use `regroup` to avoid routine decisions this repo can make on
  its own.
- Don't read or write files in other project repos, or in HQ beyond the
  specific read-only paths named under `refresh`.
