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

- **Bring `lib/toast` + `<Toaster>` to spec with
  [`toast.md`](./ui/patterns/toast.md).** Shipped today: `success` /
  `error` / `info` severities, swipe + × dismiss, the cap-3 queue,
  top-center safe-area placement, and the a11y / animation contract.
  Two spec features are still unimplemented:
  - **`warning` severity**
    ([`toast.md → Severity`](./ui/patterns/toast.md#severity)) — its
    `--warning` color slots, `AlertTriangle` glyph, 5000ms duration,
    and the `toast.warning(...)` method.
  - **Action-button slot**
    ([`toast.md → Action button`](./ui/patterns/toast.md#action-button))
    — the `ToastAction` (`{ label, onPress }`) shape, the optional
    `{ action }` second argument on the API, the inline button before
    the × close, tap-fires-then-dismisses behavior, the action-then-×
    tab order, and the `with-action` Storybook stories.

  v1 call-sites need both — the
  [`display-translation` misses toast](./architecture.md#display-translation-post-narrative)
  fires `warning` severity with a Retry action. Minor conformance
  deltas to close in the same pass: the swipe threshold is 50px only
  (spec: 50% of toast height or 50px, whichever first), a full queue
  drops the oldest toast immediately (spec: accelerate it to ~200ms
  remaining, then slot in), and exit animates with `FadeOut` (spec:
  `SlideOutUp`). Lands with the toast / UI build-out, not the spine
  milestone.

- **Smoke trigger + synthetic-story scaffolding is debug-only.**
  [Slice 1.7c](./implementation/milestones/01-spine/slices/07c-smoke.md)
  shipped a `__DEV__`-gated "Run smoke" button in the reader-composer,
  the `components/reader/smoke/` module (the `'smoke'` pipeline, its
  phase, and `runSmoke`'s synthetic story/branch bootstrap), and the
  `registerStubProvider()` dev seam in `lib/ai`. All of it is
  scaffolding flagged `TODO(spine)`; remove the module, the reader-route
  trigger, and the `lib/ai` seam when real story-creation and
  provider-settings UI land.
