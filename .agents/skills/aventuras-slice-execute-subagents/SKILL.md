---
name: aventuras-slice-execute-subagents
description: >-
  Execute an approved Aventuras slice implementation plan with
  subagents. Use for an approved `.impl-plans/` plan large enough that
  a fresh worker per task cluster and an independent two-stage review
  per cluster improve quality, or when the developer asks for subagent
  execution. The controller validates approval, readiness, execution
  gates, scope, and evidence; dispatches one fresh worker per cluster
  in dependency order; runs spec-compliance and code-quality review
  loops over explicit cluster checkpoint ranges; integrates changes;
  verifies with fresh evidence. Workers run one at a time, never in
  parallel. Does not create project commits; a closing skill offers
  that.
---

# Aventuras Slice Execute With Subagents

Execute one approved Aventuras slice plan with a controller/worker
model adapted from Superpowers `subagent-driven-development`.

The controller dispatches a fresh worker for each task cluster, one at
a time, and runs a two-stage review after each — spec compliance, then
code quality. A fresh worker per cluster keeps each worker focused on
exactly the context the controller curated, and keeps the controller's
own context lean for coordination.

`aventuras-slice-plan` recommends one of the two execution skills when
a plan is approved. This skill fits a larger or multi-cluster slice,
where fresh context per cluster and independent per-cluster review
keep quality high. For a small or tightly-coupled slice, use
`aventuras-slice-execute` instead. Honor a direct developer choice
over the plan's recommendation.

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
- Do not run more than one implementer worker at a time; workers
  never run in parallel.
- Do not tell workers to read the whole plan. Give each worker the
  exact curated cluster text and context it needs.
- Do not commit, and do not let a worker commit. The closing handoff
  to `aventuras-slice-finish` offers the commit, on explicit
  developer approval only. Temporary checkpoint objects used only to
  produce review diff ranges are allowed; they must not become branch
  history or the final commit record.
- Do not claim completion without fresh verification evidence produced
  after the last edit.

## Execution Posture

Workers run sequentially. Dispatch one implementer at a time and take
its cluster through the full cycle — implement, spec review, code
quality review, integration — before dispatching the next. Never run
implementers in parallel: keeping parallel write sets safely disjoint
costs more worker freedom than it returns, and a shared working tree
makes concurrent edits unsafe. If parallel execution is ever wanted,
it belongs in a separate skill.

Within that sequential order, execute continuously. Between clusters
that completed cleanly — implementation done, both reviews passed,
verification green — proceed straight to the next cluster. Do not
insert discretionary check-ins, "should I continue?" prompts, or
progress summaries; the developer asked for the slice to be executed.
This does not loosen the Hard Gates or the workflow's stop points: a
real blocker, an unmet gate, a plan or design problem, or a
`Scope: out` conflict still stops execution and is reported.

## Model Selection

Match each worker's model to its role; use the least capable model
that can do the job well, and reserve costly models for work that
needs them.

- Mechanical clusters — isolated functions, a complete spec, one or
  two files: a fast, cheap model. Most clusters are mechanical when
  the plan is well-specified.
- Integration and judgment clusters — multi-file coordination,
  pattern matching, debugging: a standard model.
- Review and design work — the spec and code-quality reviewers, the
  final whole-slice reviewer, and any cluster needing design judgment
  or broad codebase understanding: the most capable model available.

When a worker returns `BLOCKED` on a reasoning issue, re-dispatch with
a more capable model rather than retrying the same one.

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
- the plan's `Skill Plan` is understood, including trigger points and
  "may skip if" clauses
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

Before the first cluster, record a whole-slice base checkpoint for
final review. The checkpoint must represent the current working tree
well enough that the final reviewer can distinguish this slice's
changes from unrelated pre-existing changes.

### 3. Extract Work Units

Use Task Clusters as the dispatch unit because they already encode
risk, verification boundaries, and dependencies.

For each cluster, extract:

- full cluster text
- dependencies
- owned files/modules
- relevant decisions and implementation strategy
- relevant evidence-matrix rows
- relevant Skill Plan trigger points and domain-skill instructions
- relevant stop conditions
- non-ownership boundaries

Split a cluster only when the split is mechanical and does not change
the implementation route. If the split requires new planning, stop and
return to `aventuras-slice-plan`.

The plan's `Skill Plan` is executable context, not a note. Invoke
recommended execution skills at their trigger point unless the
recorded "may skip if" condition clearly applies. If a recommended
skill is skipped, record the reason for the completion report.

### 4. Maintain Cluster Checkpoints

Before each cluster dispatch, record a base checkpoint for the current
working tree. After the worker and any fix loops finish, record a head
checkpoint for the new working tree. Pass both checkpoint identifiers
and the changed path list to the spec reviewer, code-quality reviewer,
and any fix worker.

The preferred boundary is a git-readable base/head range so reviewers
can run:

```sh
git diff --stat <cluster-base> <cluster-head>
git diff <cluster-base> <cluster-head> -- <cluster-owned-paths>
```

Use temporary checkpoint objects or another local mechanism that does
not create branch-history commits. For tracked-only changes,
`git stash create "aventuras cluster <n> <base|head>"` is acceptable:
it returns a git-readable checkpoint without modifying the worktree;
when it returns nothing because there are no changes, use `HEAD` for
that side of the range. It does not reliably cover untracked files, so
include new files in the boundary only if the chosen mechanism captures
them; otherwise call them out explicitly as new files for this cluster
and require reviewers to read them directly. Do not fall back to an
ambiguous whole-working-tree diff when a cluster touches files that
earlier clusters or the user already changed.

The checkpoint range is also the safety boundary for red/green
regression probes. If proving a regression test would require
reverting outside the cluster-owned range, the worker should report
that instead of making the revert.

### 5. Dispatch Implementers

Use `references/implementer-prompt.md` when dispatching each worker.

Dispatch rules:

- Dispatch one implementer worker at a time. Take a cluster through
  its full cycle — implement, both reviews, integration — before
  dispatching the next.
- Order clusters so every `Depends on` edge is satisfied;
  dependency-free clusters may be taken in any safe order.
- Match the worker's model to the cluster — see Model Selection.
- Dispatch workers with fresh context, not inherited controller
  history. When using `spawn_agent`, leave `fork_context` unset/false
  and include all needed context in the filled prompt.
- Each worker edits only its cluster's owned files. Tell workers that
  earlier clusters and the user may already have changed files, and
  they must not revert edits they did not make.
- Tell workers to edit files directly in the workspace and report
  changed paths.
- Tell workers to leave commits alone; the commit is offered later by
  `aventuras-slice-finish`.
- Give workers the cluster base checkpoint and explain that any
  regression-proof revert must stay within the cluster's owned diff
  range.
- Give workers the exact verification expected for their cluster.
- Answer a worker's questions fully before it proceeds; never rush a
  worker into implementation.

Accepted worker statuses:

- `DONE` — proceed to spec compliance review.
- `DONE_WITH_CONCERNS` — read concerns; resolve correctness, scope, or
  route concerns before review. Note lower-risk observations.
- `NEEDS_CONTEXT` — the worker has questions or is missing context.
  Answer fully, supply the missing context, and re-dispatch.
- `BLOCKED` — classify and respond: a context gap re-dispatches with
  the missing context; a reasoning issue re-dispatches with a more
  capable model; an oversized cluster is split if the split is
  mechanical, else returned to planning; a plan problem returns to
  `aventuras-slice-plan`; a design problem is handed to a
  developer-run `aventuras-design` session; an environment problem
  stops execution and is reported.

Never re-dispatch a cluster to the same model without changing
something — more context, a more capable model, or a smaller cluster.

### 6. Review Each Cluster

Run reviews in this order after an implementer reports `DONE` or an
acceptable `DONE_WITH_CONCERNS`:

1. **Spec compliance review** — use
   `references/spec-reviewer-prompt.md`. The reviewer is read-only and
   checks actual code against the cluster, plan decisions, slice
   acceptance criteria, and `Scope: out`, using the cluster
   checkpoint range.
2. **Code quality review** — only after spec compliance passes, use
   `references/code-quality-reviewer-prompt.md`. The reviewer is
   read-only and checks bugs, maintainability, tests, type safety,
   integration risk, and accidental churn, using the cluster
   checkpoint range.

If either reviewer finds issues, send the findings back to the same
implementer when possible, or dispatch a targeted fix worker scoped to
the same files. Re-run the same review stage after fixes. Do not
advance to the next cluster while review issues remain.

### 7. Controller Integration

The controller owns integration:

- review the worker's diff before continuing
- resolve only mechanical formatting, import, or merge drift without
  reverting unrelated user or earlier-cluster changes
- do not implement substantive reviewer findings locally; send them to
  the same implementer when possible, or to a targeted fix worker, and
  re-run the relevant review stage
- run cluster-level verification when practical
- track dependency edges from the plan
- update your task list only after implementation, review, and
  verification pass
- keep the plan file unchanged unless the user asks for execution logs

### 8. Final Whole-Slice Verification

After every cluster has passed its per-cluster reviews:

- Dispatch a fresh read-only reviewer over the whole integrated
  slice, using `references/final-reviewer-prompt.md`. It checks the
  full diff against the plan, the slice acceptance criteria, the
  evidence matrix, and `Scope: out`, using the whole-slice base/head
  checkpoint range — fresh eyes the controller cannot provide, since
  the controller integrated the work.
- Run every applicable evidence-matrix command/check after the last
  edit.
- Run any extra checks made necessary by implementation discoveries.
- Inspect `git diff --stat` and relevant hunks.
- Confirm no unrelated user changes were reverted.
- Confirm the diff stays within slice and plan scope.
- Add or recommend a brief slice-doc `Implementation notes` entry only
  if a durable rationale emerged; never write a task log there.

If the final review or any verification fails, fix and re-run, or
report the blocker. Do not claim completion on partial evidence.

## Completion Report

When done, report concisely:

- plan path and slice
- clusters executed and worker statuses
- changed file groups
- review outcomes, including the final whole-slice review
- evidence commands/checks and pass/fail results
- unresolved risks or skipped checks, if any
- any implementation note added or recommended

Do not update the plan file with run logs unless the user asks. The
final response is the execution record until a PR body or tracker
exists.

## Handoff

Step 8 verifies the slice against its plan — the evidence matrix and
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
- `references/final-reviewer-prompt.md` — whole-slice final review
