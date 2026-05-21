# AI-driven development workflow proposal

> **Superseded (2026-05-22)** by
> [Superpowers skill port](./2026-05-22-superpowers-skill-port.md).
> That exploration reached the same goal by a different route —
> porting the Superpowers skill set rather than hand-rolling
> project-specific slice skills — and is the implemented design. The
> framework research below (AGENTS.md, Agent Skills, Spec Kit, BMad,
> Task Master, subagents) remains valid background.

Status: draft exploration. This is not canonical project policy until
the project owner approves the workflow and its integration plan.

## Reader and action

Reader: the project owner and returning AI collaborators who already
understand Aventuras' milestone / slice structure.

After reading, the reader should be able to decide whether to create
project-local skills for milestone execution, and which artifacts
those skills should write or avoid writing.

## Existing project shape

Aventuras already has most of the substrate that external
AI-development frameworks try to install:

- `AGENTS.md` / `CLAUDE.md` carries the agent-facing project
  constitution: repo shape, authoritative docs, workflow rules,
  commit rules, and MCP usage.
- Canonical specs under `docs/` define what the product does:
  data model, architecture, generation pipeline, memory pipeline,
  UI principles, patterns, and per-screen docs.
- `docs/implementation/conventions.md` defines the implementation
  hierarchy: milestone, slice, and task. Milestone goals are stable;
  slice lists can change; one slice maps to one PR; tasks live in the
  PR description or tracker, not long-lived docs.
- `docs/implementation/milestones/01-spine/` shows the target shape:
  a stable milestone narrative, an explicit dependency graph, and
  slice briefs with required reading, in/out scope, acceptance
  criteria, tests, and open questions.
- `docs/followups.md` and `docs/parked.md` split active v1 blockers
  from deferred work.
- Project-local skills already cover design-session work and doc
  health: `aventuras-design`, `aventuras-drift-check`, and
  `aventuras-doc-audit`.

The gap is not specification. The gap is the repeatable execution
layer between an approved slice doc and a finished PR: readiness
check, task breakdown, agent delegation rules, verification evidence,
review, and closeout.

## External patterns researched

### AGENTS.md

The [AGENTS.md format](https://agents.md/) frames the file as a
README for agents: build commands, tests, code style, security notes,
and other project-specific guidance that would clutter a human
README. It also supports nested files where the nearest file wins.

Fit for Aventuras: already adopted by symlinking `AGENTS.md` to
`CLAUDE.md`. Keep this as the broad constitution, not the place for
every slice workflow.

### Agent Skills

[Agent Skills](https://agentskills.io/home) package workflows as a
folder with `SKILL.md` plus optional scripts, references, and assets.
They rely on progressive disclosure: agents see names and
descriptions first, then load the full instructions only when the
task matches. The current
[Codex Agent Skills docs](https://developers.openai.com/codex/skills)
describe skills the same way: skills are reusable workflows, and
repository skills are loaded from `.agents/skills`.

Fit for Aventuras: strong. This repo already stores project skills in
`.agents/skills`. The milestone execution workflow should be encoded
as a small set of project-local skills rather than embedded into
`AGENTS.md`.

### Spec Kit

[GitHub Spec Kit](https://github.github.io/spec-kit/index.html) is a
spec-driven development toolkit with a core flow:
Spec -> Plan -> Tasks -> Implement. Its quick-start recommends
additional gates for ambiguous work: clarify, checklist, analyze, then
implement.

Fit for Aventuras: useful inspiration, poor direct fit. Aventuras
already has canonical specs, milestone docs, and slice docs. Installing
Spec Kit wholesale would introduce a parallel artifact hierarchy.
Borrow the gates, not the directory structure.

### BMad Method

[BMad](https://docs.bmad-method.org/reference/workflow-map/) builds
context progressively through analysis, planning, solutioning, and
implementation. Its `project-context.md` idea is a compact constitution
for agents.

Fit for Aventuras: partially redundant. `AGENTS.md`, docs conventions,
and topic-scoped rules already play the constitution role. The useful
piece is explicit phase separation and "context built progressively"
as an operating principle.

### Task Master

[Task Master](https://docs.task-master.dev/getting-started/quick-start/prd-quick)
starts from a focused PRD, parses it into tasks, dependencies,
priorities, and test strategies.

Fit for Aventuras: useful for thinking about task generation, but risky
as a second source of truth. Slice docs already define the PR-sized
unit. Task breakdown should live in the PR body or local execution
state, not in a durable task database unless the project explicitly
adopts one.

### Subagents and cloud delegation

Current [Codex workflow docs](https://developers.openai.com/codex/workflows)
recommend treating the agent like a teammate with explicit context and
a clear definition of done. The
[Codex subagents docs](https://developers.openai.com/codex/subagents)
frame subagents as explicit, higher-cost parallelism for codebase
exploration, multi-step plans, and focused review.
[Claude Code workflow docs](https://code.claude.com/docs/en/common-workflows)
similarly emphasize plan-before-edit workflows and custom subagents.

Fit for Aventuras: strong but bounded. Use subagents for independent
exploration and review. Use editing workers only when write ownership
is disjoint and merge conflicts are unlikely.

## Recommended workflow

### 1. Milestone authoring stays owner-led

Keep the current convention: milestone and slice docs are
solo-authored before implementation. AI can help draft, audit, or
stress-test them, but the project owner owns the goal and slice
decomposition.

When a milestone is being created or revised, the agent should:

- Read `docs/implementation/conventions.md`.
- Read current canonical specs relevant to the milestone.
- Propose a dependency graph and slice inventory.
- Produce slice docs, not implementation tasks.
- Run an adversarial "slice size and dependency" pass.

This can become an `aventuras-milestone-plan` or
`aventuras-slice-author` skill later, but it is lower priority than
slice execution because Milestone 1 is already authored.

### 2. Slice work starts with collaborative planning

Slice docs are intentionally not exhaustive. They define the PR-sized
contract, but they can leave open questions, implementation choices,
and underspecified seams that should not be resolved silently by an
autonomous coding pass.

Before editing runtime code for a slice, the agent and developer run a
planning session. The agent must prove the slice is executable and
surface every decision it needs from the developer:

- Parent milestone and slice doc read.
- Required reading opened at the named anchors, not just file-level.
- Dependency slices checked against git history or branch state.
- Existing dirty worktree inspected; unrelated user changes preserved.
- Acceptance criteria converted into an evidence matrix.
- Open questions classified as developer-decision, implementer-choice,
  monitor-during-work, or blocker.
- Slice size checked. If the slice is too large for one PR, stop and
  propose a slice split before coding.
- Implementation approach drafted at module / file-boundary level.
- Verification plan drafted before code exists.
- Subagent use decided explicitly: none, read-only mapper, reviewer, or
  disjoint editing worker with ownership boundaries.

The output is a written, developer-approved slice execution plan. That
plan is the handoff artifact for implementation. It captures decisions,
task clusters, ownership boundaries, verification steps, and anything
the execution agent must not reinterpret.

Artifact placement is split by purpose:

- The full execution plan lives outside `docs/`, by default under the
  root-level ignored `.impl-plans/` directory. Suggested filename:
  `.impl-plans/M01-02-drizzle-schema.md`, matching the milestone and
  slice identifiers. It is run-specific working state, not project
  documentation.
- The PR body may carry the same checklist once a PR exists, but the
  local planning file is the low-friction default before that point.
- Brief implementation reasoning that should persist can live close to
  the slice doc, preferably as a short optional section titled
  `Implementation notes` at the end of the slice doc. This section
  records why a notable implementation route was chosen, not the
  step-by-step plan.
- `docs/explorations/` remains for design work and canonical-design
  reasoning, not routine implementation planning.
- Do not put task checklists into `docs/implementation`; slice docs stay
  contracts plus brief rationale, not work logs.

### 3. Execution consumes the approved plan

The execution agent starts from the approved plan, not only from the
slice doc. Its first job is to verify that the plan is still current:
same branch, expected dependencies merged, no conflicting user changes,
and no new canonical spec changes invalidating the plan.

If the plan is missing, stale, or still contains blocker questions, the
agent returns to planning instead of coding. During implementation, the
agent may make local tactical choices, but any change to the plan's
architecture, scope, ownership boundaries, or verification strategy
goes back through the developer planning checkpoint.

### 4. Tasks are ephemeral and PR-owned

Respect the project convention: tasks do not live in `docs/`. For
agent work, the task list should live in one of three places:

- The current conversation plan when working locally.
- The PR description once a PR exists.
- A local-only ignored scratch file if a long-running session needs
  cross-session recovery.

The slice doc remains the durable contract. The task list is the
implementation route chosen for this run.

### 5. Implementation loop is acceptance-driven

The implementing agent should work in small loops:

1. Pick the next acceptance criterion or tightly related cluster.
2. Locate existing patterns with `rg`, targeted file reads, and the
   required docs.
3. Add or update the smallest useful tests first when the behavior is
   testable.
4. Implement using existing module boundaries and UI taxonomy.
5. Run the smallest relevant verification command.
6. Update the evidence matrix before moving to the next cluster.

For UI slices, the loop includes Storybook stories and visual checks.
For platform slices, it includes the relevant Electron / Android smoke
steps from the slice doc.

### 6. Subagents are used deliberately

Use subagents for:

- Read-only codebase mapping when a slice touches multiple modules.
- API / library research against official docs.
- Independent review passes: correctness, missing tests, UI behavior,
  doc drift, or security where relevant.
- Mechanical broad sweeps, such as import-boundary checks or
  pattern-adoption checks.

Avoid subagents for:

- The immediate critical-path task the main agent is about to edit.
- Multiple workers editing overlapping files.
- Canonical doc changes before the design gate.
- Vague "go explore everything" prompts.

If an editing worker is used, the parent prompt must assign explicit
ownership: files or modules owned, files off limits, verification
expected, and changed paths to report.

### 7. Canonical docs are gated separately from code

Implementation can reveal a spec bug. That does not give the agent
permission to quietly reshape canonical docs.

Use this rule:

- If the code can satisfy the slice as written, implement and record
  any minor clarification in the PR body.
- If the slice doc is wrong but the canonical spec is still right,
  amend the slice doc in the implementation PR.
- If the canonical spec needs a real decision change, pause runtime
  implementation and invoke the design workflow. The design must land
  through the existing `aventuras-design` gate: exploration, user
  review, integration plan, canonical edit, drift pass, commit.

### 8. Slice closeout produces evidence, not narrative

Before a slice is considered complete, the agent reports:

- Acceptance criteria matrix: pass / not applicable / not done, with
  command or manual evidence.
- Approved plan followed, amended through developer checkpoint, or
  partially superseded with explanation.
- Verification commands run and exact outcomes.
- Files changed by responsibility area.
- Followups resolved or introduced, with placement in `followups.md`
  or `parked.md` if any.
- Residual risks or unverified manual checks.
- Suggested focused commits if the working tree contains logically
  separable changes.

This closeout can become the seed for the PR description. It should
not become a mini-changelog in the commit body; the existing commit
rules already reject that style.

## Skill set proposal

### Keep existing skills

- `aventuras-design`: canonical design and docs integration gate.
- `aventuras-drift-check`: lighter periodic drift sweep.
- `aventuras-doc-audit`: full read-only docs and wireframe audit.

### Add first

#### `aventuras-slice-plan`

Trigger: "plan Slice 1.2", "prepare this slice for implementation",
"turn M01/02-drizzle-schema into an execution plan", or similar.

Responsibilities:

- Read milestone, slice, required docs, followups, `AGENTS.md`, and
  topic-scoped code rules.
- Run the readiness gate.
- Lead a collaborative planning session with the developer.
- Classify open questions and force developer decisions where the slice
  cannot safely choose.
- Draft the implementation approach at module / file-boundary level.
- Build the acceptance-criteria evidence matrix.
- Define verification commands and manual smoke checks.
- Decide whether any subagents are useful and, if so, their ownership.
- Write the approved slice execution plan.

Boundaries:

- Does not author new milestone goals.
- Does not silently change canonical specs.
- Does not edit runtime code.
- Does not create durable task docs under `docs/implementation`.
- Writes the full execution plan to `.impl-plans/` by default.
- May add a brief `## Implementation notes` section to the slice doc
  only when persistent reasoning is useful; never as a task checklist.

#### `aventuras-slice-execute`

Trigger: "execute this approved slice plan", "implement plan
`<path>`", "continue implementation from the approved plan", or
similar.

Responsibilities:

- Read the approved execution plan, parent slice doc, and any docs the
  plan names.
- Confirm the plan is still current against branch state, dependencies,
  and dirty worktree.
- Implement within the plan and slice scope.
- Maintain the evidence matrix.
- Run required checks.
- Produce closeout suitable for a PR.

Boundaries:

- Does not start without an approved plan.
- Does not reinterpret developer-decided questions.
- Does not silently change canonical specs.
- Does not change architecture, scope, ownership boundaries, or
  verification strategy without returning to planning.

#### `aventuras-slice-review`

Trigger: "review this slice implementation", "check this PR against
the slice", or before a slice PR is finalized.

Responsibilities:

- Read the slice doc and diff.
- Check every acceptance criterion against the implementation.
- Review tests and verification evidence.
- Check scope creep against Scope: out.
- Check doc / followup hygiene caused by the diff.
- Lead with blocking findings.

This can be built on top of the existing review skill, but it needs
the slice-doc contract as its center of gravity.

### Add later

#### `aventuras-slice-author`

Trigger: "draft slices for this milestone" or "split this milestone
into PR-sized slices."

Responsibilities:

- Convert canonical docs and milestone narrative into slice docs.
- Enforce the repo's required slice sections.
- Produce dependency graph and slice contracts.
- Run a split/merge pass for oversized or under-specified slices.

#### `aventuras-handoff`

Trigger: "pause this slice", "prepare handoff", "resume this slice."

Responsibilities:

- Capture current slice, branch, dirty files, last verification, next
  task, blocked questions, and links to relevant docs.
- Prefer PR description or ignored local scratch over durable docs.
- Never claim completion without current verification evidence.

## Optional custom agents

Project-scoped custom agents are optional. If added, keep them
read-only at first:

- `slice_mapper`: maps code paths and existing patterns for a slice.
- `slice_reviewer`: reviews a diff against acceptance criteria.
- `docs_researcher`: verifies external APIs or framework behavior
  against official docs.

Editing agents should wait until the repo has a few successful
single-agent slice executions. Milestone 1's early slices are module
boundary setting work; overlapping edit workers would add more merge
risk than speed.

## What not to adopt now

- Do not install Spec Kit as a parallel feature hierarchy. Its gates
  are useful, but its artifacts overlap with existing canonical docs
  and slice docs.
- Do not adopt Task Master as a durable task source yet. It would
  compete with the slice doc / PR-body split.
- Do not put long task checklists into `docs/implementation`. That
  contradicts the local convention that tasks live in PR descriptions
  or the team's tracker.
- Do not expand `AGENTS.md` with every workflow detail. Keep it as the
  constitution and let skills carry procedure.

## Integration options

### Option A: skill-first, minimal

Create `aventuras-slice-plan`, `aventuras-slice-execute`, and
`aventuras-slice-review` under `.agents/skills`. Leave milestone
conventions untouched. Dry-run planning against the first unimplemented
Milestone 1 slice, use the approved plan as execution input, then
adjust both skills.

Pros: small, aligned with current repo shape, no new toolchain.

Cons: depends on agent discipline; adds one explicit planning gate
before coding.

### Option B: Spec Kit-inspired commands

Create project commands or scripts that mimic the phases:
`slice-readiness`, `slice-plan`, `slice-implement`,
`slice-verify`, `slice-close`.

Pros: clearer phase boundaries, easier to automate later.

Cons: premature ceremony unless repeated slice runs show the same
manual steps are being missed.

### Option C: external task manager

Adopt Task Master or a similar task database generated from slice
docs.

Pros: persistent task state and dependency tracking.

Cons: likely duplicates slice docs and PR descriptions; higher drift
risk.

Recommendation: Option A now, with planning split from execution.
Reconsider Option B after two or three slice executions produce stable
repeated steps worth encoding as scripts or commands. Avoid Option C
unless PR-body task tracking proves insufficient.

## Open questions

- Should `docs/implementation/conventions.md` add an optional, brief
  `Implementation notes` section at the end of slice docs, or should
  the convention stay informal until a pilot proves it useful?
- Should `aventuras-slice-review` be a separate skill, or a project
  wrapper around the existing generic review skill?
- Should project-scoped `.codex/agents/*.toml` files be added, or is
  explicit subagent prompting enough for now?
- Which slice should be the pilot? Slice 1.1 is process-heavy and
  low-code; Slice 1.2 is the first real stress test of code,
  migrations, cross-platform smoke, and public-API enforcement.

## Recommended next step

Write `aventuras-slice-plan` first. It should be instruction-only at
the start, with an embedded readiness checklist, question
classification, plan template, and approval gate. Pilot it on Slice 1.1
or Slice 1.2. Then write `aventuras-slice-execute` as the narrower
consumer of an approved plan, followed by the review skill if the pilot
shows that generic review is not enough.
