# GRID-FORGE

A mobile-first roguelite where **your build is a spatial puzzle**. Between combat
waves you place, rotate and wire components on a grid — **adjacency creates
synergy**, and power must be routed from your Reactor Core to every weapon. Then
you pilot the machine you built through a wave of salvage.

> Fiction: an awakened Reactor Core rebuilds a war-machine from the scrap of a
> dead industrial world consumed by *The Reclaim*.

This repo is being developed collaboratively as a game-design + engineering
project. See [`docs/`](docs/) for the full design process:

- [`docs/01-marktanalyse.md`](docs/01-marktanalyse.md) — market analysis (Phase 1)
- [`docs/02-dna-extraktion.md`](docs/02-dna-extraktion.md) — roguelite DNA (Phase 2)
- [`docs/03-gdd.md`](docs/03-gdd.md) — the living Game Design Document

## Install as a phone app (PWA)

Grid-Forge is a **Progressive Web App**: it installs to your phone's home screen
with its own icon, runs fullscreen (no browser bars) and works **offline** — on
both iOS and Android, no app store needed.

1. **Enable GitHub Pages once:** repo → **Settings → Pages → Build and deployment
   → Source: “GitHub Actions”.** The workflow in `.github/workflows/pages.yml`
   then builds and publishes on every push.
2. On your phone, open the published URL:
   **`https://sharkyt207.github.io/-roguelite/`**
3. Install it:
   - **iPhone (Safari):** Share → **Add to Home Screen**.
   - **Android (Chrome):** ⋮ menu → **Install app** / **Add to Home Screen**.
4. Launch it from the new icon — fullscreen, offline-ready.

## Native app (Android APK / app stores) — optional

The same build can be wrapped into a real native app with
[Capacitor](https://capacitorjs.com) (see `capacitor.config.ts`):

```bash
npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
npm run build
npx cap add android
npx cap sync
npx cap open android      # build/sign the APK in Android Studio
```

(iOS additionally needs macOS + Xcode + an Apple Developer account.)

## Play the prototype

**Online:** the GitHub Pages URL above is playable in any phone browser too.

**Local:**

```bash
npm install
npm run dev      # dev server with hot reload
npm run build    # type-check + single-file production build → dist/index.html
```

Open `dist/index.html` on any device — the build is fully self-contained.

## Controls

- **Build phase:** drag components from the tray onto the grid. Drag a placed part
  to move it, or drop it back on the tray to unequip. Powered cells glow teal;
  synergy links are colour-coded by element.
- **Combat:** touch anywhere to steer (floating joystick). Weapons auto-fire.
  Tap the **OC** button when full to unleash Overcharge.

## Tech

TypeScript + Canvas 2D (no runtime dependencies), bundled with Vite. Modular
architecture under `src/` — see the GDD's technical-architecture section.
