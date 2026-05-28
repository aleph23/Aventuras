# Prettier wrap-mangling traps in markdown prose

The repo's prettier config (run via lefthook pre-commit) reflows
long markdown lines aggressively. Two prose patterns inside list
items mangle in distinctive ways.

## Trap 1 — `+` as a word separator

Do not use `+` to join words — neither standalone (`A + B`) nor in
parenthetical phrases (`(A + B + C)`). When `+` lands at the start
of a wrapped continuation line at the list-item indent, prettier
parses it as a sub-bullet — turning prose like
`(NativeWind 4 + Tailwind 3)` into a stray nested bullet.

Use a comma, slash (`/`), the word "and" / "or", or an em-dash
instead. Examples:

- Comma list: `(NativeWind 4, Tailwind 3)` or `(A, B, and C)`
- Slash: `(NativeWind 4 / Tailwind 3)` for tight pairs
- Connectives: `(NativeWind 4 and Tailwind 3)`,
  `(swipe-down or tap-outside)`
- Em-dash for emphasis: `(... and reader-only chips — per the ...)`

## Trap 2 — long inline-backtick prose at end of a list-item paragraph

When an inline-backtick span runs long enough that prettier's wrap
point lands inside it, the closing portion of the backtick gets
pushed to a new line at column 0 (no indentation). Lazy-continuation
makes the text technically still belong to the bullet, but the file
reads as if a fragment escaped the list.

Example failure:

```md
- [Story list pin star](...)
  (☆/★ pin toggle inline before each story-card title — applies
  the visibility rule via the existing `~25% opacity, reveals on
hover` styling) ← this line at col 0
```

Keep inline-backtick prose short; if a longer styling-spec phrase
needs quoting, paraphrase in plain prose ("muted-opacity,
brighten-on-hover styling") or break the longer content into its
own sentence outside the bullet.

## How to apply

- Don't hope prettier won't wrap a particular line; the drift pass
  cannot reliably predict which lines prettier will reflow at
  commit time.
- Headings and code blocks are safe (`## Base unit + spacing scale`
  survives because it's not subject to wrap mangling).
- Quick pre-commit checks:
  - `grep -n " + " <file>` catches trap 1 preemptively.
  - For trap 2, scan visually for any list-item paragraph where the
    last continuation line lands at col 0 — that's the symptom.

Trap 1 has triggered post-commit fixups multiple times; trap 2 hit
once (icon-actions.md). Both are specific to this repo's prettier
config — other projects may not see the same behaviour.
