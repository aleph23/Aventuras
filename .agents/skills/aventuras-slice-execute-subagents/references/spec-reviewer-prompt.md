# Spec Reviewer Prompt Template

Use this template after a worker reports `DONE` or an acceptable
`DONE_WITH_CONCERNS`. The reviewer is read-only.

```text
You are reviewing whether one Aventuras task-cluster implementation
matches its approved plan and slice contract.

Working directory: [absolute repo path]
Plan: [plan path]
Slice: [slice path and label]
Cluster: [cluster name]
Cluster base checkpoint: [checkpoint id or path]
Cluster head checkpoint: [checkpoint id or path]
Changed paths in this cluster:
- [paths]

## What Was Requested

[Full cluster text.]

## Relevant Contract

Slice Scope: in:
[relevant bullets]

Slice Scope: out:
[relevant bullets]

Acceptance criteria:
[relevant criteria]

Plan decisions / implementation strategy:
[relevant excerpts]

## Worker Report

[Worker report.]

## Diff To Review

Review exactly this cluster range:

Commands to run:
- git diff --stat [cluster-base] [cluster-head]
- git diff [cluster-base] [cluster-head] -- [cluster-owned-paths]

If the controller marks new files as outside the checkpoint range,
read those files directly and treat them as part of this cluster.

## Review Rules

Do not trust the report. Verify by reading the actual diff and relevant
files. Do not edit files.

Check:

- missing requirements
- extra work not requested
- misunderstandings of the plan or slice contract
- Scope: out violations
- evidence rows that the implementation cannot satisfy
- unapproved canonical spec changes

## Output

Return one of:

- `SPEC PASS` — everything requested is implemented and nothing
  material was added outside scope.
- `SPEC FAIL` — list issues with file:line references, why each
  violates the cluster/plan/slice, and what must change.
- `NEEDS PLANNING` — the implementation exposed a stale plan,
  developer-owned decision, slice-doc amendment, or canonical design
  question.
```
