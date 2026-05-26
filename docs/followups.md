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

### Native overlay impl vs JS-based overlay

Both `Sheet` (`components/ui/sheet.tsx`) and `Dialog`
(`components/ui/dialog.tsx`) are built on `@rn-primitives/dialog`
— overlay-based, layered on `react-native-screens`
`FullWindowOverlay`. The
[`ui-native-modals.md` rule](../.agents/skills/vercel-react-native-skills/rules/ui-native-modals.md)
recommends migrating to native `<Modal
presentationStyle="formSheet">` on native instead, citing
built-in swipe-to-dismiss, native keyboard avoidance,
accessibility, and better performance than JS-based bottom
sheets.

Worth a focused review of whether to migrate the native paths of
`Sheet` and `Dialog` to native `Modal`. Affects every existing
overlay compound on native (`CollisionResolveDialog`,
`EmbedderDownloadDialog`, `ImportDialog`); ideally lands before
the v1 ship gate so the migration ripple is bounded.

Sheet-vs-Dialog/Modal consolidation as a general-use question
(retire one of them?) is **not** in scope here — that's a
"let real-app signal decide" call, deferred to actual usage
feedback.

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
