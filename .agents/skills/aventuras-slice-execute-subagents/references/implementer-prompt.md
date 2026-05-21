# Implementer Prompt Template

Use this template when dispatching a worker for one Aventuras task
cluster. Fill every bracketed field. Do not send the worker the whole
plan; provide the curated cluster text and context.

```text
You are implementing one task cluster for an Aventuras slice.

Working directory: [absolute repo path]
Plan: [plan path]
Slice: [slice path and label]
Cluster: [cluster name]

You are not alone in the codebase. Other agents or the user may have
changes in progress. Do not revert edits you did not make. Keep your
work within the ownership boundaries below and adjust to concurrent
changes instead of overwriting them.

## Cluster Text

[Full cluster text from the approved plan.]

## Relevant Plan Context

[Relevant Decisions, Implementation Strategy, Evidence Matrix rows, and
Stop Conditions. Include only what affects this cluster.]

## Ownership

Owned files/modules:
- [paths/modules this worker may edit]

Do not edit:
- [paths/modules owned by other workers or out of scope]

## Required Reading

Read these before editing:
- AGENTS.md
- [relevant .claude/rules/code.md or docs.md section]
- [relevant source/test/doc files]

## Your Job

1. Confirm the cluster is clear.
2. If requirements, ownership, or scope are unclear, stop and report
   `NEEDS_CONTEXT`.
3. Implement only this cluster.
4. Add or update tests only where the plan/evidence calls for them or
   where behavior-bearing code needs public-interface coverage. If
   you add a regression test after a bug fix, prove it catches the
   bug: revert the fix and see the test fail, then restore the fix
   and see it pass.
5. Run the cluster verification listed below when feasible.
6. Self-review for completeness, scope, tests, and accidental churn.
7. Report back. Do not commit unless explicitly instructed.

## Verification

[Exact cluster verification commands/checks.]

## Stop And Escalate

Return `BLOCKED` instead of guessing if:
- the plan is wrong or stale
- a canonical spec decision is needed
- a Scope: out item becomes required
- verification cannot be made to run
- the cluster is larger or more coupled than the plan says
- you need to edit outside ownership boundaries

## Report Format

- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- What changed:
- Files changed:
- Verification run and results:
- Self-review findings:
- Concerns or blockers:
```
