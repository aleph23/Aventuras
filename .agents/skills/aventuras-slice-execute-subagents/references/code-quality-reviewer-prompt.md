# Code Quality Reviewer Prompt Template

Use this template only after spec compliance passes. The reviewer is
read-only. This is the Aventuras wrapper around the Superpowers
`requesting-code-review/code-reviewer.md` template; keep that broader
code-review standard, then apply the Aventuras-specific checks below.

```text
You are reviewing the quality of one completed Aventuras task-cluster
implementation after spec compliance has already passed.

Working directory: [absolute repo path]
Plan: [plan path]
Slice: [slice path and label]
Cluster: [cluster name]
Cluster base checkpoint: [checkpoint id or path]
Cluster head checkpoint: [checkpoint id or path]
Changed paths in this cluster:
- [paths]

## Requirements Summary

[Short summary of what the cluster implemented.]

## Diff To Review

Review exactly this cluster range:

Commands to run:
- git diff --stat [cluster-base] [cluster-head]
- git diff [cluster-base] [cluster-head] -- [cluster-owned-paths]

If the controller marks new files as outside the checkpoint range,
read those files directly and treat them as part of this cluster.

## What To Check

Focus on real issues:

- likely bugs or broken edge cases
- type-safety problems
- weak error handling
- security, privacy, data loss, or data-integrity risk
- missing public-interface tests for behavior-bearing code
- test assertions that mock internals instead of behavior
- performance or platform risk relevant to this slice
- maintainability problems introduced by this change
- architecture or integration choices that will not scale to the
  surrounding code
- migration, compatibility, or rollback gaps when data/schema/storage
  changed
- accidental unrelated churn
- docs/code mismatch introduced by this change

Plan and production-readiness checks:

- any significant deviation from the plan that the spec review did not
  catch or that creates quality risk
- incomplete documentation when the change creates a durable
  developer-facing contract
- test or verification claims that are not supported by actual output
- new plan problems exposed by the implementation

Structure introduced by this change:

- does each new or modified file have one clear responsibility with a
  well-defined interface
- are units decomposed so they can be understood and tested
  independently
- does the implementation follow the file structure the plan defined
- did this change create new files that are already large, or
  significantly grow existing ones — judge only what this change
  contributed, not pre-existing file size

Also check Aventuras-specific rules:

- local patterns are followed
- ownership boundaries were respected
- no task logs or execution plans were added to `docs/`
- no canonical spec changes were made unless the approved plan called
  for them
- no unrelated user changes were reverted

## Output

Return:

### Strengths

[Specific things that are sound.]

### Issues

Group by:

- Critical — must fix before continuing
- Important — should fix before continuing
- Minor — optional polish or follow-up

For each issue include file:line, what is wrong, why it matters, and
how to fix if not obvious.

### Assessment

`QUALITY PASS`, `QUALITY PASS WITH MINOR NOTES`, or `QUALITY FAIL`.
Include a short ready-to-continue verdict. Critical and Important
issues block the next cluster until fixed and re-reviewed.
```
