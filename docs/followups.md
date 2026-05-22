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

---

## UX

### Extract the searchable-overlay-list substrate into a component

Three patterns now compose the "Autocomplete substrate" — per-tier
Popover/Sheet dispatch, type-to-filter, virtualization — as a
doc-level concept rather than a named component:
[`Autocomplete-with-create`](./ui/patterns/forms.md#autocomplete-with-create-primitive),
[`provider-model-picker`](./ui/patterns/provider-model-picker.md),
and the [`Actions menu`](./ui/patterns/actions-menu.md). A design
pass should extract the shared component — trigger, open surface,
search, virtualized list — and reconcile the three as consumers.
Active rather than parked: all three are v1 build-ready, so the
extraction-design belongs before consumer #2 or #3 is built;
doing it post-v1 means refactoring three shipped components. The
seam needs thought — `Autocomplete-with-create`'s trigger is its
own input, unlike the other two.
