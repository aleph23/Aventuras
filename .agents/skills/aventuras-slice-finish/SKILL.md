---
name: aventuras-slice-finish
description: >-
  Run an Aventuras slice's commit-readiness gates and offer a commit.
  Use after a slice's implementation is done — when the user asks to
  finish, wrap up, close out, or get a slice ready to commit — or as
  the handoff target from `aventuras-slice-execute` and
  `aventuras-slice-execute-subagents`. Formats, lints, typechecks,
  runs the full test suite, and on green offers a commit that follows
  project commit conventions. Never pushes and never opens or updates
  a pull request; those stay a human gate.
---

# Aventuras Slice Finish

Take a slice whose implementation is complete and bring the working
tree to a committable state. This is the closing skill in the slice
lifecycle: `aventuras-slice-plan` plans, `aventuras-slice-execute` or
`aventuras-slice-execute-subagents` implements, this skill closes.

It runs standalone, and it is the handoff target both execution
skills invoke after their final verification step. Acceptance-criteria
verification — the plan's evidence matrix — belongs to the execution
skill's final step. This skill owns the generic, repo-wide
commit-readiness gates and the commit itself.

## Hard Gates

- Do not push.
- Do not open or update a pull request. Push and PR are the
  developer's final review gate.
- Do not commit until the developer explicitly approves the commit
  message and contents.
- Do not bypass hooks with `--no-verify`. A failing hook is a real
  signal — fix the cause.
- Do not amend an existing commit. Create a new commit instead.
- Do not silently fix unrelated pre-existing failures. Report them
  and let the developer decide.
- Do not claim a gate passed without fresh output from this run.

## Workflow

### 1. Scope The Change

- Run `git status --short` and `git diff --stat`.
- Confirm there is uncommitted work to finish. If the tree is clean,
  stop and say so.
- Note whether the change touches source, docs, or both — that
  selects which gates apply.

### 2. Format

Run Prettier in write mode over the files this change touches,
mirroring the pre-commit hook rather than reformatting the whole
repo. Re-stage any file the formatter rewrites.

### 3. Static Checks

Scope linting to the changed files, the way the pre-commit hook
does; run the typecheck whole-project, since type errors are not
scoped to a file set:

- ESLint over the changed source files.
- `pnpm typecheck` (`tsc --noEmit`) — ESLint does not check types.
- remark over the changed Markdown files, only when docs changed.

On any failure, stop and report. Do not auto-fix beyond formatting;
a lint or type error may signal a real defect, not just noise.

### 4. Full Test Suite

Run the whole suite, not a targeted subset:

- Run `pnpm test:run` with its output redirected to a temporary log
  file, and capture the exit code.
- Read the exit code and the tail of the log. Read more only when
  the tail does not explain the result.
- On failure, stop and report the failing tests. If the suite is too
  noisy or slow to capture and classify cleanly, say so — that is a
  test-infrastructure problem worth surfacing on its own.

### 5. Offer A Commit

Only when every gate above passed:

- Stage the intended files and propose the commit, or several
  focused commits when the work is logically separable, following
  the project commit conventions in `AGENTS.md` — subject within the
  length cap, short body answering why, no diff restatement or
  process noise.
- Show the proposed message and the files each commit would include.
- Ask for explicit approval before running `git commit`.
- Let the pre-commit hooks run; never pass `--no-verify`. If a hook
  fails, fix the cause and re-run.
- Stop after committing. Do not push and do not open a PR — state
  plainly that this is left to the developer.

### 6. Report

- Gates run and their pass/fail results, with evidence.
- Commit(s) made, or the proposed message(s) if approval is pending.
- Anything skipped, and any pre-existing failure surfaced.
- An explicit reminder that push and PR remain the developer's step.
