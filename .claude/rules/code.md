---
paths:
  - 'app/**/*.{ts,tsx,js,jsx}'
  - 'components/**/*.{ts,tsx,js,jsx}'
  - 'hooks/**/*.{ts,tsx,js,jsx}'
  - 'lib/**/*.{ts,tsx,js,jsx}'
  - 'types/**/*.{ts,tsx,js,jsx}'
  - 'electron/**/*.{ts,tsx,js,jsx}'
  - 'scripts/**/*.{ts,tsx,js,jsx}'
  - '.claude/rules/**'
---

# Code rules

Project-scoped rules for source edits. Auto-loads when Claude reads
or writes TypeScript / JavaScript under `app/`, `components/`,
`hooks/`, `lib/`, `types/`, `electron/`, or `scripts/`.

## Commenting discipline

Code should be self-documenting. Default to **no comments**. Only
write a comment when the **why** is non-obvious from the code —
a hidden constraint, a subtle invariant, a workaround for a
specific platform bug, or behavior a reader would otherwise find
surprising.

**Never write:**

- Comments that narrate **what** the code does. The identifiers
  already say that.
- Comments that reference the current task, PR, or recent fix
  ("added for X flow", "fixes #123", "used by Y screen"). Those
  belong in the commit message and rot as the codebase evolves.
- Comments that compare to a prior approach ("the previous approach
  X didn't work, we're doing Y now", "we used to do Z but…").
  Git history is the source of truth for what changed and why.
- Multi-paragraph explanations or essay-style docblocks. If something
  genuinely needs that much prose, it belongs in `docs/`, linked from
  a one-line code comment.

**When a comment is justified**, keep it short (one line where
possible) and lead with the **why**, not the what:

```ts
// Container query: 1024px is the desktop-vs-narrow layout switch.
const NARROW_THRESHOLD_PX = 1024

// rn-primitives doesn't gate disabled clicks on web; needs inline style.
style={disabled ? { pointerEvents: 'none' } : undefined}
```

JSDoc / TSDoc on exported props or public APIs is fine when it
documents **contract** (allowed values, units, edge cases) rather
than implementation — that's prop-doc, not commentary.

## Import wildcards

Prefer named imports. Wildcard / namespace imports (`import * as X
from 'y'`) are banned **except** where the package is designed to be
consumed as a namespace.

**Required form for React:**

```ts
import { useState, useEffect, type ReactNode } from 'react'
```

**Not:**

```ts
import * as React from 'react' // banned
```

Same applies to other large libraries (`react-native`, `lodash`,
date utilities, etc.) — list the symbols actually used.

**Permitted namespace imports** (these packages export compound
primitives whose members are meant to be accessed through a
namespace alias):

- `@rn-primitives/*` — e.g. `import * as DialogPrimitive from
'@rn-primitives/dialog'`. Each module exports `Root`, `Trigger`,
  `Content`, `Portal`, `Close`, `Title`, `Description`, `Overlay`,
  etc. as a compound API; namespace import is the intended
  consumption pattern.
- Any other library that documents namespace import as its primary
  API shape.

If unsure whether a namespace import is permitted, check the
library's published examples. When in doubt, prefer named imports —
the rule is "specific by default."

When converting an existing wildcard import to named imports, grep
the file for `<Namespace>.member` references and pull each one into
the named-import list. Don't leave dangling `React.foo` references
after the import line changes.
