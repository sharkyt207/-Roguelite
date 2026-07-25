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

## Play the prototype

**Online:** enable GitHub Pages once (Settings → Pages → Source: *GitHub Actions*).
Every push then publishes a phone-playable link via the workflow in
`.github/workflows/pages.yml`.

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
