# Android build guide

## Prerequisites

- Android Studio with SDK and NDK installed
- Java 17+
- Rust target: `aarch64-linux-android`
- Node.js + `pnpm`

## One-time setup

Run from repo root:

```bash
pnpm android:init
```

## Development run

```bash
pnpm android:dev
```

## Release APK/AAB build

```bash
pnpm android:build
```

## Windows note (important)

If build fails with:

`Creation symbolic link is not allowed for this system`

enable **Developer Mode** in Windows:

`Settings -> Privacy & security -> For developers -> Developer Mode`

Then reopen terminal and run `pnpm android:build` again.
