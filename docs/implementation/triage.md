# Implementation triage

Inbox for cross-cutting deferrals surfaced during implementation that
have **no single downstream slice to own them** — the items that would
otherwise be dropped straight into [`followups.md`](../followups.md) or
[`parked.md`](../parked.md) and lost.

Drop them here first. This file is a **queue, not a ledger**: an item
living here means "not yet triaged," not "deferred forever." Triage
happens as a separate pass — each item is read, then routed to its real
home (a specific slice's Open questions, the active
[`followups.md`](../followups.md) ledger, [`parked.md`](../parked.md), a
canonical spec change) or deleted if it dissolves on inspection. Keep
the queue short; a growing inbox is the signal to triage.

A deferral that a **specific downstream slice** will own does not belong
here — it goes straight into that slice's Open questions, where the
slice-planning gate forces its resolution before that slice is planned.

## Inbox

- **State-placement convention: infrastructure stores stay in-module.**
  `docs/code-conventions.md` → State placement routes domain-class and
  cross-component-ephemeral stores to `lib/stores`, but is silent on
  infrastructure-module stores. Slice 1.6 confirmed the rule is
  domain-vs-infrastructure (the `diagnostics` / `toast` stores correctly
  live in their own modules, per `observability.md`), not "all stores in
  `lib/stores`" — a developer hit this ambiguity during planning. Add a
  one-line clarification so it doesn't recur.
- **`architecture.md` "diagnostics toggles" wording vs the gate/mirror
  split.** `architecture.md` → Settings lists diagnostics toggles under
  `useAppSettingsStore`'s app-only settings, but the runtime gate lives
  in `lib/diagnostics` (the persisted value is in `app_settings`; the
  in-memory app-settings mirror does not hold it). Reconcile the wording
  so a future reader doesn't re-introduce a duplicate diagnostics mirror.
