# Game Design Document (GDD) — Arbeitstitel: „GRID-FORGE"

> **Status:** v0.1 — lebendes Dokument. Jede beschlossene Entscheidung wird hier eingearbeitet.
> **Genre:** Mobile Roguelite · Survivor-like mit Inventar-als-Puzzle-Build-Layer.
> **Plattform:** Mobile First (iOS/Android), Einhand-fähig.

---

## 1. Vision (One-Liner)

> *„Baue in der Werkstatt eine übermächtige Kampfmaschine – Feld für Feld –, überlebe
> damit die nächste Welle, und entdecke, welche Kombination den Bildschirm zerlegt."*

Der **Build ist ein räumliches Puzzle**: Zwischen den Wellen platzierst, drehst und
verkettest du Komponenten per **tap & drag** auf einem Raster. **Nachbarschaft erzeugt
Synergie.** Das ist unser Alleinstellungsmerkmal – klar unterscheidbar vom Vampire-Survivors-Meer.

## 2. Design-Säulen (verbindlich)

1. **Der Grid ist der Build.** Tiefe entsteht aus Platzierung & Adjazenz, nicht aus Textwänden.
2. **Mobile-nativ.** tap&drag in der Bauphase, ein Daumen in der Kampfphase. 5–15-Min-Sessions.
3. **Kontrolle bis zum Schluss.** Kein passives Endgame – Positionierung + eine aktive Fähigkeit bleiben relevant.
4. **Lesbarkeit vor Komplexität.** Jede Synergie ist am Grid *sichtbar* (Linien, Glühen, Icons).
5. **Meta stiftet Sinn & bleibt horizontal.** Neue Optionen statt reiner Zahlen-Powercreep.
6. **Faire Monetarisierung** als Markenwert.

## 3. Zielgruppe

- Kern: Roguelite-/Survivor-Fans, die Build-Tiefe lieben (Brotato-, Balatro-, Backpack-Publikum).
- Sekundär: Puzzle-/Optimierer-Spieler (Tetris/Autobattler-Overlap).
- Casual-Onramp: Survivor-Zugänglichkeit; Hardcore-Ceiling: Layout-Meisterschaft + Ascension.

---

## 4. Core Loop

```
        ┌─────────────────────────────────────────────────┐
        │                    EIN RUN (~8–15 Min)          │
        │                                                 │
        │   [BAUPHASE]  →  [KAMPFWELLE]  →  [BEUTE/SHOP]   │
        │   Grid legen     überleben        wählen/reroll  │
        │        ↑_______________________________|          │
        │              (Welle 1 … Welle N + Boss)          │
        └─────────────────────────────────────────────────┘
                              │  Tod / Sieg
                              ▼
                     [META] Werkstatt-Fortschritt,
                     Freischaltungen, nächste Runde
```

- **Bauphase (pausiert):** ruhig, taktisch, tap&drag. Kein Zeitdruck (Mobile-freundlich) —
  optional später „Blitz-Modus" mit Timer für Hardcore.
- **Kampfwelle (aktiv):** getaktet wie Brotato (kurze Wellen, klarer Fortschrittsbalken).
  Ein Daumen bewegt den Chassis; Waffen feuern automatisch; **eine aufladbare Overcharge-Fähigkeit** (Tap).
- **Beute/Shop:** 3-aus-N-Draft neuer Komponenten + Reroll/Banish (Mikroökonomie).

### Run-Struktur (v0.1)
- 1 Run = **3 Sektoren** à **3–4 Wellen**, jeder Sektor endet mit einem **Boss/Elite**.
- Wellenlänge ~30–60 s. Gesamtrun ~8–15 Min. Ein-Klick-Neustart nach Ende.

---

## 5. Der Grid ("The Forge") — Kernmechanik

- **Raster:** Start **5×5**, per Meta erweiterbar (bis z.B. 7×7). Manche Zellen sind
  anfangs gesperrt (schaltbar) → sichtbarer räumlicher Fortschritt.
- **Komponenten-Typen:**
  - **Waffen (W):** feuern in der Kampfphase automatisch. Kern des Schadens.
  - **Support (S):** modifizieren Nachbarn (Element, Rate, Reichweite, Crit …).
  - **Kern/Reaktor (C):** liefert „Energie"; Waffen brauchen Energie-Reichweite (s.u.).
  - **Conduits (L):** leiten Effekte/Energie über Distanz (Puzzle-Verbindungsstücke).
- **Platz:** die meisten Teile 1 Zelle; seltene Teile 1×2 / L-Form (Puzzle-Spannung),
  bewusst sparsam für Lesbarkeit.
- **Adjazenz-Regeln (orthogonal, 4 Richtungen):**
  - **Element-Injektion:** Support gibt benachbarten Waffen sein Element/Effekt (Ember→Feuer-DoT, Frost→Slow, Volt→Kette).
  - **Verstärker:** Support × Support = multiplikativer Effekt.
  - **Reihen/Spalten-Boni:** volle Reihe gleicher Klasse = Set-Bonus.
  - **Energie-Reichweite:** Waffen ohne Kern-Verbindung feuern schwächer/gar nicht →
    Layout-Planung ist Pflicht (das ist der Puzzle-Kern).
- **Lesbarkeit:** aktive Verbindungen werden als **leuchtende Linien** gezeichnet; beim
  Aufheben/Verschieben zeigt ein Live-Preview die resultierenden Boni.

### Warum das auf Mobile funktioniert
tap&drag ist die *nativste* Touch-Interaktion überhaupt; die Bauphase ist pausiert
(kein Präzisions-Stress); die Kampfphase reduziert auf einen Daumen + einen Tap.

---

## 6. Kampfsystem

- **Chassis:** dein Grid *ist* die Maschine. Bewegung per virtuellem Daumen-Drag
  (linke Bildschirmhälfte) oder „Follow-Finger". Auto-Aim auf nächsten/stärksten Gegner
  (per Waffen-Tag konfigurierbar → Build-Entscheidung).
- **Overcharge (aktiv):** eine aufladbare Fähigkeit (Tap rechts). Lädt durch Kills/Zeit.
  Effekt hängt vom Grid ab (z.B. „alle Ember-Waffen: Flächenbrand") → **aktive Skill-Expression**.
- **Positionierung zählt:** Gegner-Formationen, Umwelt-Hazards, Kiting. Kein AFK-Endgame.
- **Schaden/Feedback:** Zahlen-Popups optional, Screenshake, klare Trefferklänge.

## 7. Gegner & Bosse (Prinzipien; Inhalte nach Fiktions-Entscheidung)

- **Gegner-Archetypen:** Rusher (schnell/schwach), Tank (langsam/zäh), Ranged (zwingt Bewegung),
  Splitter (teilt sich), Disruptor (stört Grid-Energie temporär), Swarm (Masse).
- **Elite/Boss pro Sektor:** je ein Mechanik-Test (z.B. Boss, der eine Grid-Reihe „überhitzt"
  und zum Umbauen zwingt). Bosse lehren/prüfen jeweils eine Systemfacette.
- **Skalierung:** über Sektoren + Ascension-Stufen (nicht nur HP-Bloat, sondern neue Verhaltensweisen).

## 8. Progression

### In-Run (vertikal, pro Runde)
- Draft neuer Komponenten, Reroll/Banish, Grid-Optimierung, Overcharge-Aufladung.
- Seltenheitsstufen: **Common · Uncommon · Rare · Epic · Legendary** (Farbcode) —
  höhere Stufen = stärkere Adjazenz-Effekte / einzigartige Verbindungsregeln.

### Meta (horizontal, dauerhaft)
- **Werkstatt-Ausbau:** neue Grid-Zellen freischalten, Komponenten-Pool erweitern,
  neue Chassis (= Charaktere mit eigenen Grid-Formen/Regeln).
- **Blueprints:** neue Komponenten dauerhaft in den Draft-Pool aufnehmen (Entdeckung).
- **Meisterschaft/Ascension:** aufsteigende Schwierigkeit für Wiederspielwert.
- **Ziel:** Meta öffnet *Optionen*, ersetzt nie das In-Run-Können (Anti-F2P-Falle).

## 9. Steuerung (Mobile)

| Phase | Eingabe |
|---|---|
| Bauphase | tap&drag (platzieren/drehen), Doppel-Tap (Info), Wisch (verkaufen) |
| Kampf | 1 Daumen = Bewegung · 1 Tap = Overcharge |
| Menüs | Ein-Klick-Neustart, große Touch-Ziele, Daumen-Zonen unten |

## 10. UI/UX

- Bauphase: Grid mittig, Komponenten-Tray unten (Daumen-Reichweite), Live-Synergie-Preview.
- Kampf: minimalistisches HUD (HP, Overcharge-Ring, Wellen-Fortschritt, Timer).
- Farbcode für Seltenheit & Element; Synergie-Linien statt Text; Icons > Wörter.

## 10a. Fiktion & Welt — „Salvage-Mech" (beschlossen)

Du bist ein **erwachter Reaktor-Kern** in einer toten Industriewelt, die von einem
Phänomen namens **„der Rückbau" (The Reclaim)** verschlungen wurde – Maschinen und
Landschaft werden zu wanderndem Schrott. Du überlebst, indem du aus Salvage eine
**Kampfmaschine auf einem Chassis-Gitter** zusammensetzt. **Der Grid ist dein Körper.**

- **Warum das trägt:** begründet den Grid diegetisch (Chassis), Loot = Salvage (1:1),
  Elemente = geborgene Waffentech, klare lesbare Silhouetten für kleine Displays.
- **Gegner:** „Reclaimed" – Scraplings (Rusher), Husks (Grunt), Haulers (Tank);
  Sektor-Boss **„Reclaimer"** (bergender Groß-Automat).
- **Ton:** industriell, karg, melancholisch-hoffnungsvoll (Kern erwacht in Ruinen).

## 11. Art & Audio (Richtung: Salvage-Mech)

- **Art:** dunkler Industrie-Look, gebürstetes Metall-Grau, Warnlicht-Amber als Akzent,
  Teal für Reaktor-Energie. Elementfarben hochkontrastig & distinkt (Ember/Frost/Volt/Kinetic).
  Programmatische Vektor-/Primitiv-Grafik im Prototyp (keine Assets nötig, DPR-scharf).
- **Audio (später):** metallische Impacts, tiefes Reaktor-Brummen, körniges Ambiente.

## 12. Monetarisierung (Analyse-basiert, fair)

- **Modell (Vorschlag):** Premium-freundlich / kosmetisch. Optionaler **fairer Battle-Pass**
  & Chassis-Skins. **Kein** Energie-Gate, **kein** Pay-to-Power (bewusstes Gegen-Statement
  zu Survivor.io/Archero → Vertrauen als Marke). Details später.

## 13. Live-Ops / Events / Roadmap (Skizze)

- Daily Run (fester Seed + Modifier), wöchentliche Mutatoren, Saison-Ascension.
- Roadmap-Phasen: Prototyp → Vertical Slice → Content-Ausbau → Soft-Launch.

## 14. Technische Architektur (Stack: Web/TypeScript — beschlossen)

- **Stack:** TypeScript + reines **Canvas 2D** (keine Runtime-Dependencies), Bundling via
  **Vite**, Single-File-Build (`vite-plugin-singlefile`) → per Link auf dem Handy spielbar.
- **Struktur (modular):**
  - `core/` — Viewport/DPR, Input (Multitouch), seedbarer RNG, Theme/Palette.
  - `game/` — `Game` (State-Machine + Loop), `components` (Katalog), `grid` (Modell +
    Power-Flood-Fill + Synergie-Auflösung), `enemies`, `run` (Run-/Wellen-State), `scenes/`.
  - `ui/` — Zeichen-Helfer + programmatische Komponenten-Icons.
- **Determinismus:** mulberry32-RNG mit Seed → Grundlage für spätere Daily Runs & Balancing-Tests.
- **Performance-Budget:** feste dt-Klammerung, Objekt-Filter statt Alloc-Spikes, DPR ≤ 3.
- **Deployment:** GitHub-Actions-Workflow baut & published nach GitHub Pages.
- **Portierung:** bei Bedarf später Godot/Unity; Datenmodell (Komponenten/Adjazenz) ist
  engine-unabhängig gehalten.

## Prototyp-Status (v0.1 — lauffähig)

Spielbarer Vertical Slice: Title → Build (tap&drag, Power/Synergie live) → Combat
(Floating-Joystick, Auto-Feuer, 4 Elemente, Overcharge) → Reward-Draft (3-aus-N + Reroll)
→ 5 Wellen inkl. Boss → Sieg/Niederlage. 5 Waffen, 5 Support/Kern/Conduit-Teile.

---

## Offene Entscheidungen (nächster Halt)
1. **Fiktion & Identität** (bestimmt Welt, Gegner, Art, Audio, Namen).
2. **Tech-Stack / Prototyp-Plattform** (bestimmt, wie wir bauen & testen).
