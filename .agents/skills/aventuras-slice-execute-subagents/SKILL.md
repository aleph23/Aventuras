---
name: aventuras-slice-execute-subagents
description: >-
  Execute an approved Aventuras slice implementation plan with
  subagents. Use for an approved `.impl-plans/` plan that decomposes
  into several dependency-free task clusters with disjoint write
  ownership, where parallel workers and review loops pay off, or when
  the developer asks for subagent execution. The controller validates
  approval, readiness, execution gates, scope, and evidence;
  dispatches fresh workers for independent task clusters with disjoint
  write ownership; runs spec-compliance and code-quality review loops;
  integrates changes; verifies with fresh evidence. Does not commit; a
  closing skill offers that.
---

# Aventuras Slice Execute With Subagents

Execute one approved Aventuras slice plan with a controller/worker
model adapted from Superpowers `subagent-driven-development`.

`aventuras-slice-plan` recommends one of the two execution skills
when a plan is approved. This skill fits a plan that decomposes into
several dependency-free clusters with disjoint write ownership, where
parallel workers and per-cluster review pay off. For a small or
tightly-coupled slice, use `aventuras-slice-execute` instead. Honor a
direct developer choice over the plan's recommendation.

## Hard Gates

- Do not execute a plan whose `Status` is not `approved`.
- Do not edit code while the working branch is `main` or `master`
  without explicit developer consent.
- Do not execute while an `Execution gate` remains unmet.
- Do not execute when the plan has an unresolved readiness state such
  as `needs-design`, `needs-slice-amendment`, `blocked`, or unanswered
  `needs-developer-decision`.
- Do not silently decide developer-owned questions.
- Do not cross the slice's `Scope: out`.
- Do not edit canonical specs to make implementation easier.
- Do not put execution logs, task checklists, or full reasoning notes
  in `docs/`.
- Do not invoke `aventuras-design` autonomously. If canonical product
  or architecture uncertainty appears, stop and recommend a
  developer-run design session.
- Do not dispatch workers with overlapping write ownership.
- Do not tell workers to read the whole plan. Give each worker the
  exact curated cluster text and context it needs.
- Do not commit, and do not let a worker commit. The closing handoff
  to `aventuras-slice-finish` offers the commit, on explicit
  developer approval only.
- Do not claim completion without fresh verification evidence produced
  after the last edit.

## Workflow

### 1. Controller Preflight

Read in parallel where possible:

- `AGENTS.md`
- `docs/implementation/conventions.md`
- the approved plan file
- the linked milestone doc
- the linked slice doc
- `.claude/rules/code.md` if source files may change
- `.claude/rules/docs.md` if docs may change
- `docs/followups.md`
- `git status --short --branch`

If the user gives a slice identifier instead of a plan path, find the
matching `.impl-plans/<milestone>-<slice-file-stem>.md`. Continue only
when exactly one matching plan exists.

Validate before dispatching:

- `Status: approved`
- readiness state is executable
- approval fields are filled or the plan otherwise clearly records
  developer approval
- execution gate is `none` or currently satisfied
- linked milestone and slice docs resolve
- slice `Scope: out` does not conflict with planned work
- task clusters have usable dependencies and clear file/module
  ownership
- evidence matrix has concrete commands/checks
- stop conditions are understood
- worktree changes do not conflict with the files this plan owns
- the working branch is not `main`/`master`, or the developer has
  consented to editing it

Stop with a blocker report if any gate fails.

Then read the plan critically, as a reviewer rather than a
checklist: look for correctness risks, missing edge cases, weak or
unfalsifiable evidence, and route assumptions that look wrong. The
plan was approved, but dispatch is the last chance to catch a flaw
the planner and developer missed. If a concern would change the
implementation route, raise it with the developer before dispatching
workers.

### 2. Reconcile With Current Checkout

Do a narrow drift check before dispatching:

- Confirm planned existing files still exist.
- Confirm planned new files do not already exist with unrelated
  content.
- Confirm relevant scripts in `package.json` or repo tooling exist.
- Confirm important imports, exports, configs, schemas, and tests still
  match the plan's assumptions.
- For dependency slices, confirm the dependency is merged or the plan
  pins a sufficient contract.

If drift changes the route, stop and return to planning. Name the plan
section that needs revision and the evidence you observed.

Then run a baseline check before dispatching. Execute the full test
suite once (`pnpm test:run`) with its output redirected to a
temporary log file, and capture the exit code. Read the exit code and
the log tail; read more only when the tail does not explain the
result. A green baseline lets any later failure be attributed to this
slice. A red baseline means the branch did not start clean — report
the pre-existing failures and ask whether to proceed before
dispatching. If the suite is too noisy or slow to capture and
classify cleanly, say so; that is a test-infrastructure problem in
its own right.

### 3. Extract Work Units

Use Task Clusters as the default dispatch unit because they already
encode risk, verification boundaries, dependencies, and
parallel-safety.

For each cluster, extract:

- full cluster text
- dependencies
- owned files/modules
- relevant decisions and implementation strategy
- relevant evidence-matrix rows
- relevant stop conditions
- non-ownership boundaries

Split a cluster only when the split is mechanical and does not change
the implementation route. If the split requires new planning, stop and
return to `aventuras-slice-plan`.

### 4. Dispatch Implementers

Use `references/implementer-prompt.md` when dispatching each worker.

Dispatch rules:

- Use worker agents for code-edit clusters.
- Give every worker disjoint ownership.
- Tell workers they are not alone in the codebase, must not revert
  others' edits, and must adjust to concurrent changes.
- Tell workers to edit files directly in their workspace and report
  changed paths.
- Tell workers to leave commits alone unless the user explicitly asked
  for commits.
- Give workers the exact verification expected for their cluster.
- Do not dispatch dependent clusters until their dependencies pass
  review and verification.
- Parallelize only dependency-free clusters with non-overlapping write
  sets.

Accepted worker statuses:

- `DONE` — proceed to spec compliance review.
- `DONE_WITH_CONCERNS` — read concerns; resolve correctness, scope, or
  route concerns before review. Note lower-risk observations.
- `NEEDS_CONTEXT` — provide missing context and re-dispatch.
- `BLOCKED` — classify as context gap, reasoning issue, oversized
  cluster, plan problem, design problem, or environment problem.

If a worker reports that the plan is wrong, stop and return to
planning. If a canonical spec decision is needed, recommend a
developer-run `aventuras-design` session.

### 5. Review Each Cluster

Run reviews in this order after an implementer reports `DONE` or an
acceptable `DONE_WITH_CONCERNS`:

1. **Spec compliance review** — use
   `references/spec-reviewer-prompt.md`. The reviewer is read-only and
   checks actual code against the cluster, plan decisions, slice
   acceptance criteria, and `Scope: out`.
2. **Code quality review** — only after spec compliance passes, use
   `references/code-quality-reviewer-prompt.md`. The reviewer is
   read-only and checks bugs, maintainability, tests, type safety,
   integration risk, and accidental churn.

If either reviewer finds issues, send the findings back to the same
implementer when possible or dispatch a targeted fix worker with
disjoint ownership. Re-run the same review stage after fixes. Do not
advance to dependent clusters while review issues remain.

### 6. Controller Integration

The controller owns integration:

- review worker diffs before continuing
- resolve merge, formatting, and import conflicts without reverting
  unrelated user or worker changes
- run cluster-level verification when practical
- track dependency edges from the plan
- update your task list only after implementation, review, and
  verification pass
- keep the plan file unchanged unless the user asks for execution logs

### 7. Final Whole-Slice Verification

After all clusters pass local reviews:

- Run a final whole-slice review against the full plan and evidence
  matrix.
- Run every applicable evidence-matrix command/check after the last
  edit.
- Run any extra checks made necessary by implementation discoveries.
- Inspect `git diff --stat` and relevant hunks.
- Confirm no unrelated user changes were reverted.
- Confirm the diff stays within slice and plan scope.
- Add or recommend a brief slice-doc `Implementation notes` entry only
  if a durable rationale emerged; never write a task log there.

If verification fails, fix and re-run, or report the blocker. Do not
claim completion on partial evidence.

## Completion Report

When done, report concisely:

- plan path and slice
- clusters executed and worker statuses
- changed file groups
- review outcomes
- evidence commands/checks and pass/fail results
- unresolved risks or skipped checks, if any
- any implementation note added or recommended

Do not update the plan file with run logs unless the user asks. The
final response is the execution record until a PR body or tracker
exists.

## Handoff

Step 7 verifies the slice against its plan — the evidence matrix and
acceptance criteria. It does not format, lint, or commit. After the
completion report, hand off to the `aventuras-slice-finish` skill: it
runs the repo-wide commit-readiness gates (format, lint, typecheck,
full test suite) and offers a commit on explicit developer approval.
Skip the handoff only when the developer asks to stop before
finishing.

## References

- `references/implementer-prompt.md` — worker dispatch template
- `references/spec-reviewer-prompt.md` — spec compliance review
- `references/code-quality-reviewer-prompt.md` — quality review
