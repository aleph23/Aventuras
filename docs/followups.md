# Follow-ups

Top-level ledger of **active** outstanding items — design questions
or work the current milestone (v1) needs answered, or that block
other v1 work. Resolved items are **removed** (not crossed out); the
commit that resolves an item carries the resolution narrative.

Items confirmed for a future milestone or parked indefinitely
pending signal live in [`parked.md`](./parked.md). Movement between
the two files is normal as scope clarifies; see
[`conventions.md → Followups vs parked`](./conventions.md#followups-vs-parked)
for the placement rule.

## UX

### Importer compound — design pass

[`component-inventory.md → Compounds — needs design`](./ui/component-inventory.md#compounds--needs-design)
lists the Importer compound as deferred until more import
groundwork lands. v1 has three concrete consumers ([roadmap
M4 entity import](./implementation/roadmap.md#m4--world--plot-read-surfaces),
[M8.3 vault calendars import](./implementation/roadmap.md#m8--translation--vault-parent-shell),
[M9.4 story `.avts` import](./implementation/roadmap.md#m9--storybook--per-surface-visual-polish--ship-gate))
so the wrapper shape needs designing before the first consumer
slice can scaffold against it. Action surfaces per host differ
enough that the design pass is non-trivial — the picker wraps
`ImporterMenu` + file dialog (web `<input>` / native
`expo-document-picker`) + paste flow + zod-validated parse +
error display. Lands before M4 starts.

### Diagnostics hub — per-tab body design passes

[`diagnostics.md`](./ui/screens/diagnostics/diagnostics.md) is
at "surface inventory only" — the hub shell (top-bar, tab strip,
story selector, cross-tab nav, empty states, mobile expression)
is designed, plus tab 1 (memory probe) which is the existing
spec. Tabs 2–5 (per-turn inspector / call log / logs / delta
log) each have body content described but at the "what's in
this tab" level, not pixel-level interaction. Each needs its
own per-tab detail design pass before
[M7.3](./implementation/roadmap.md#m7--app-settings--diagnostics--onboarding)
can scaffold it. The passes can sequence (one per tab) or batch;
likely owned by the implementer of M7.3 with design support
per tab.
