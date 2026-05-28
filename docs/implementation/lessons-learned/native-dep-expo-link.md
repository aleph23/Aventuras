# Native-module RN libs need a dev-client rebuild before import

Before adding any RN library to this project, check whether it
ships a native module (TurboModule / NativeModule). If it does,
**do not just `pnpm add` it** — the JS-side import will reach for
a native module that isn't compiled into the existing dev-client
binary, and Android crashes at module load
(`<NativeModuleName>.getConstants is not a function` or similar),
cascading through every screen that transitively touches the
importing file.

## The hard requirement is the dev-client rebuild

Steps that always apply:

1. `pnpm add <lib>` (or `npx expo install <lib>` for Expo-managed
   compat).
2. Rebuild the dev client: `npx expo prebuild --clean` then
   `pnpm android` (or
   `eas build --profile development --platform android`). The new
   TurboModule has to be linked into the binary.
3. Only then is the JS import safe.

## The plugin step is library-specific, not universal

Don't assume every native-module lib needs an `app.json` `plugins`
entry. Most well-built libs use autolinking and need nothing in
`app.json`. A plugin is only required when the lib needs to modify
`AndroidManifest.xml`, `Info.plist`, podspec, gradle, etc., at
prebuild time.

- **DO need a plugin:** `expo-build-properties` (sets Kotlin
  version, NDK, etc.), `expo-image-picker` (permissions),
  `react-native-firebase-*` (gradle config).
- **DO NOT need a plugin:** `react-native-keyboard-controller`,
  `react-native-reanimated` (set up by Expo itself),
  `react-native-gesture-handler` (autolinked).

The original framing of this lesson was overgeneralized ("needs
an Expo config plugin + dev-client rebuild"); confirmed by reading
the lib's installation docs and source that the crash was caused
by the missing rebuild alone.

## How to apply

When a spec names an RN library:

1. Check if it has a native module — grep the package's
   `package.json` for `"codegenConfig"`, look for `ios/` +
   `android/` source dirs, check README for "linking" or
   "config plugin" sections.
2. **JS-only** (`@tanstack/react-virtual`, `reanimated-color-picker`,
   plain hooks libs) — safe to `pnpm add`, no further steps.
3. **Native-module but autolinked** (most modern Expo-compatible
   libs) — `pnpm add` + dev-client rebuild. Surface the rebuild
   cost to the user before installing; they have to do the
   rebuild on their machine.
4. **Native-module AND has a config plugin** — additionally add
   the plugin entry to `app.json` `plugins` array, then rebuild.
   Verify whether the plugin is the lib itself or a separate
   config-shaping package (e.g. `expo-build-properties` is its
   own package).

Don't conflate steps 3 and 4. If the lib's README doesn't show an
`app.json` plugins snippet, don't invent one — autolinking is the
default for modern libs.
