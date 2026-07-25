# Phase 1 – Marktanalyse: Roguelites auf PC & Mobile

> Arbeitsdokument des Design-Prozesses. Grundlage für die DNA-Extraktion (Phase 2)
> und den Entwurf unseres eigenen Spiels (Phase 3).

## Methodik & Einordnung

Analysiert werden die kommerziell und/oder kritisch erfolgreichsten Roguelites bzw.
"Survivor-likes" auf PC und Mobile. Für jeden Titel betrachten wir Core Loop,
Progression, Steuerung, Build-System, Gegner/Bosse, Ökonomie, Präsentation,
Erfolgsfaktoren und die wiederkehrende Community-Kritik.

Wichtige Genre-Unterscheidung vorab, weil sie unser gesamtes Design prägt:

- **Bullet-Heaven / Survivor-like** (Vampire Survivors, Survivor.io, Brotato, 20MTD,
  Magic Survival): Auto-Angriff oder stark vereinfachte Steuerung, hunderte Gegner,
  Fokus auf Build-Wachstum in einer Runde. **Ideal für Mobile / Einhandsteuerung.**
- **Twin-Stick / Action-Roguelite** (Enter the Gungeon, Soul Knight, Archero, Isaac):
  Präzises Zielen und Ausweichen, mehr Skill-Anspruch. Auf Mobile schwieriger.
- **Action-Platformer / Melee-Roguelite** (Hades, Dead Cells, Rogue Legacy, RoR):
  Hoher Skill-Anspruch, komplexe Steuerung – auf Touch nur mit Kompromissen.

---

## 1. Vampire Survivors (PC/Mobile)

- **Core Loop:** 30-Minuten-Überlebensrunde, Auto-Angriff, Bewegung ist die einzige
  aktive Eingabe. Level-Up → Waffe/Passive wählen → Waffen entwickeln sich (Evolution).
- **Meta:** Permanente Gold-Upgrades (PowerUps), Charakter-Freischaltung, Achievements
  als versteckter Content-Baum ("Achievement = Entdeckung").
- **Steuerung:** Nur Bewegung. Perfekt einhandtauglich.
- **Build-System:** 6 Waffen + 6 Passives, Evolutionen durch Kombination. Enorme
  Synergie-Tiefe trotz minimaler Eingabe.
- **Erfolgsfaktoren:** Extrem niedrige Einstiegshürde, "Power-Fantasy"-Eskalation
  (vom Schwächling zum Bildschirm-füllenden Zerstörer), Entdeckungsfreude, sehr günstig.
- **Schwächen / Kritik:** Wenig aktive Skill-Expression; späte Runden werden zäh/"AFK";
  visuelles Chaos; Balancing eher "alles ist stark".
- **Was Spieler lieben:** Das Snowball-Gefühl, das Freischalt-Rabbit-Hole.
- **Was bemängelt wird:** Zu wenig Kontrolle im Endgame, Runden zu lang für Mobile-Snacking.

## 2. Brotato (PC/Mobile)

- **Core Loop:** 20 kurze Wellen (je ~20–90s), zwischen den Wellen **Shop-Phase**
  (kaufen, verkaufen, rerollen). Auto-Fire, Bewegung aktiv.
- **Meta:** Charaktere mit stark unterschiedlichen Regeln, freischaltbare Waffen/Items,
  Danger-Level (Schwierigkeitsstufen) pro Charakter.
- **Build-System:** 6 Waffenslots + Stat-Ökonomie (Stats sind hier die eigentlichen
  Bausteine). Wirtschaftliche Entscheidungen (Ökonomie-Stat "Harvesting") sind Teil des Builds.
- **Erfolgsfaktoren:** Kurze Wellen = klarer Rhythmus & Pausen (Mobile-ideal); tiefe
  Build-Diversität durch Charakter-Modifikatoren; Shop erzeugt "Nur-noch-ein-Reroll".
- **Schwächen / Kritik:** UI/Item-Text-Overload; Balancing zwischen Charakteren schwankt.
- **Was Spieler lieben:** Der Shop-Reroll-Gambling-Loop, extreme Build-Varianz.
- **Was bemängelt wird:** Manche Charaktere fühlen sich unspielbar/Trap an.

## 3. Survivor.io (Mobile, Free-to-Play)

- **Core Loop:** VS-Formel + F2P-Monetarisierung. 15-Min-Runden, Evolutionen aus
  Waffe + passendem Ausrüstungsteil.
- **Meta:** Sehr tiefe Ausrüstungs-/Gacha-/Upgrade-Systeme außerhalb der Runde (Gear-Score).
- **Monetarisierung (nur Analyse):** Energie-Gates, Gacha, Battle-Pass, Gear-Grind.
- **Erfolgsfaktoren:** Zeigt, dass die VS-Formel auf Mobile massiv monetarisierbar ist;
  polierte Präsentation, klarer Fortschritt.
- **Schwächen / Kritik:** Aggressive Monetarisierung, Paywall/Grindwall im Endgame,
  "in-Runde-Gameplay wird von Meta-Powercreep überschattet".
- **Lehre für uns:** Zeigt die *Falle*: wenn Meta-Power das Runden-Gameplay ersetzt,
  stirbt der eigentliche Reiz. Wir wollen das bewusst vermeiden.

## 4. Archero (Mobile, F2P)

- **Core Loop:** Stop-to-shoot: Charakter feuert nur im Stillstand, bewegt sich sonst.
  Raum-für-Raum, alle paar Räume Skill-Wahl (3 Karten).
- **Steuerung:** Ein Joystick (linke Hand). Sehr einhandtauglich.
- **Meta:** Ausrüstung, Talente, Gacha – tiefer F2P-Grind.
- **Erfolgsfaktoren:** "Stop-to-shoot" ist eine geniale Mobile-Mechanik (positionierung
  = Risiko/Ertrag); klare Session-Struktur.
- **Schwächen / Kritik:** Brutaler F2P-Grind, RNG-Ausrüstung, Energie-System.
- **Was Spieler lieben:** Die Bewegungs-/Feuer-Spannung, das Skill-Draften.
- **Was bemängelt wird:** Pay-to-Progress, repetitive Räume.

## 5. Soul Knight (Mobile)

- **Core Loop:** Twin-Stick-Dungeon-Crawler, Räume säubern, Waffen aufsammeln.
- **Steuerung:** Zwei virtuelle Sticks + Auto-Aim (wichtig!). Auto-Aim macht Twin-Stick
  auf Touch erträglich.
- **Erfolgsfaktoren:** Riesige Waffenvielfalt, Koop, freundlicher F2P.
- **Schwächen:** Twin-Stick auf Touch bleibt fummelig; Auto-Aim nimmt Skill-Expression.

## 6. Hades (PC/Konsole, primär)

- **Core Loop:** Room-based Action-Roguelite; nach jedem Raum Boon-Wahl (Götter).
- **Meta:** **Goldstandard der Meta-Progression:** Mirror of Night (permanente Upgrades),
  Narrative-Progression (Story schreitet mit jedem Tod voran → "Tod ist Fortschritt"),
  Beziehungen/NPCs, Waffen-Aspekte.
- **Erfolgsfaktoren:** Erzählung verwebt sich mit dem Roguelite-Loop; jeder Run fühlt sich
  narrativ bedeutsam an; herausragende Boon-Synergien & "Duo-Boons".
- **Schwächen / Kritik:** Wenig – hoher Produktionsaufwand ist für Indie/Mobile unrealistisch.
- **Lehre:** *Tod als Fortschritt* + *Meta erzählt eine Geschichte* ist der stärkste
  bekannte Langzeitmotivator. Aufwand aber hoch (Voice, Art, Writing).

## 7. Dead Cells (PC/Konsole/Mobile-Port)

- **Core Loop:** Metroidvania-Action-Platformer-Roguelite. Präzises Melee/Ranged, Rollen.
- **Meta:** Permanente Freischaltungen (Blueprints), Boss-Zellen (aufsteigende Schwierigkeit).
- **Steuerung:** Auf Mobile portiert mit Auto-Hit-Modus – funktioniert, aber Kompromiss.
- **Erfolgsfaktoren:** Butterweiches Gamefeel, hoher Skill-Ceiling.
- **Schwächen (Mobile):** Touch-Steuerung nie so gut wie Controller.

## 8. Enter the Gungeon (PC/Konsole)

- **Core Loop:** Bullet-Hell-Twin-Stick-Roguelite, präzises Dodge-Rolling.
- **Erfolgsfaktoren:** Waffen-Kreativität, Bullet-Hell-Meisterschaft.
- **Schwächen:** Sehr hoher Skill-Anspruch; **für Touch praktisch ungeeignet.**

## 9. The Binding of Isaac (PC/Konsole/Mobile)

- **Core Loop:** Twin-Stick-Dungeon, item-getriebene Transformationen.
- **Build-System:** Über 700 Items mit oft chaotischen Synergien – die "Item-Lotterie".
- **Erfolgsfaktoren:** Enorme Item-Tiefe, "was macht dieses Item?"-Entdeckung, Replayability.
- **Schwächen / Kritik:** Unlesbare Synergien für Neulinge, teils frustrierende RNG-Runs.
- **Lehre:** Item-Entdeckung + transformative Items = extreme Langzeitmotivation.

## 10. Risk of Rain (1/2)

- **Core Loop:** Zeit = Schwierigkeit. Je länger man spielt, desto härter → Druck,
  effizient zu sein. Item-Stacking (Items stapeln linear/exponentiell).
- **Erfolgsfaktoren:** **Item-Stacking** ist ein herausragender, unterkopierter Mechanismus;
  der Zeitdruck erzeugt Spannung.
- **Schwächen:** Schwer verständliches UI/Item-Feedback (RoR1).
- **Lehre:** "Zeit als Gegner" + stapelbare Items = eigenständiges Spannungsdesign.

## 11. Rogue Legacy (1/2)

- **Core Loop:** Action-Platformer; **Erben-System:** Bei Tod wählt man einen von
  mehreren Nachkommen mit vererbten Traits (teils positive, teils komische Handicaps
  wie Farbenblindheit, Gigantismus).
- **Meta:** Permanentes Schloss-Upgrade (Gold beim Tod ausgeben).
- **Erfolgsfaktoren:** Charakter-Traits erzeugen Persönlichkeit & Varianz pro Run.
- **Lehre:** Vererbte, teils absurde Traits sind ein starker, wenig kopierter Identitäts-Hook.

## 12. 20 Minutes Till Dawn (PC/Mobile)

- **Core Loop:** VS-artig, aber **manuelles Zielen** (Aim) + Nachladen → mehr Skill als VS.
- **Build-System:** Rune-Draft mit starken Synergien.
- **Erfolgsfaktoren:** Mittelweg zwischen VS (kein Aim) und Twin-Stick (voller Aim);
  atmosphärischer Stil.
- **Lehre:** "Halb-Aim" (Auto-Fire in Blickrichtung, aber Ausrichtung aktiv) ist ein
  guter Mobile-Kompromiss zwischen Zugänglichkeit und Skill.

## 13. Magic Survival (Mobile)

- **Core Loop:** Früher VS-Vorläufer auf Mobile, Auto-Angriff, sehr schlank.
- **Erfolgsfaktoren:** Beweist, dass minimalistische Survivor-Loops auf Mobile zünden.

## 14. Tiny Rogues (PC)

- **Core Loop:** Room-based Bullet-Hell-Roguelite mit **Diablo-artigen Item-Affixen &
  Seltenheitsstufen** + Klassen/Traits.
- **Erfolgsfaktoren:** Verbindet Survivor-Draft mit ARPG-Loot-Tiefe (Affix-System).
- **Lehre:** Affix-basiertes Loot (statt fixer Items) gibt endlose Build-Kombinatorik
  bei überschaubarem Content-Aufwand.

---

## Weitere relevante Titel (Kurzscan)

- **Halls of Torment:** VS-Formel + Diablo-Loot & präziseres Kampf-Feedback.
- **Death Must Die:** VS + Hades-artige Götter-Boons + Loot; sehr gut angenommen.
- **Nomad Survival / Deep Rock Survivor / Death Road:** Zeigen die Reife/Sättigung der VS-Nische.
- **Slay the Spire:** Deckbuilding-Roguelite – Referenz für "jede Entscheidung zählt",
  perfekte Mobile-Portierung durch rundenbasiertes, tap-freundliches Design.
- **Balatro:** Roguelite-Deckbuilder-Phänomen 2024 – beweist, dass **eine frische Mechanik
  + extreme "nur-noch-eine-Runde"-Ökonomie** ein ganzes Genre neu beleben kann.
- **Backpack Hero / Backpack Battles:** **Inventar-als-Puzzle** (räumliches Grid-Building)
  – eine unterkopierte, extrem "Mobile-taugliche" Kernidee (tap & drag).

---

## Muster-Erkennung (Was zieht sich durch alle Erfolge?)

1. **Sofort spielbar, tief meisterbar** – niedrige Einstiegshürde, hoher Skill-/Wissens-Ceiling.
2. **Draft-Momente** – regelmäßige, sinnvolle Wahlpunkte (3-aus-N) sind das Herz des Suchtfaktors.
3. **Snowball / Power-Fantasy** – von schwach zu übermächtig innerhalb einer Runde.
4. **Synergien & Entdeckung** – "Was, wenn ich X mit Y kombiniere?" ist der stärkste Antrieb.
5. **Meta, die Sinn stiftet** – Fortschritt zwischen Runs (am besten narrativ verankert wie Hades).
6. **Kurze, klar getaktete Sessions** (Brotato-Wellen, Archero-Räume) passen zu Mobile.
7. **Reroll-/Gambling-Mikroökonomie** (Brotato-Shop, Balatro) verlängert Sessions enorm.

## Kritik-Muster (Was Spieler wiederholt bemängeln)

1. **Passivität im Endgame** (VS): zu wenig Kontrolle, "AFK-Gefühl".
2. **Runden zu lang** für echtes Mobile-Snacking (VS 30 Min).
3. **Aggressive F2P-Monetarisierung** (Survivor.io, Archero): Meta-Power ersetzt Gameplay.
4. **Twin-Stick auf Touch** ist fummelig; Auto-Aim killt Skill-Expression.
5. **Item-/UI-Overload** (Isaac, Brotato): unlesbare Synergien schrecken Neue ab.
6. **RNG-Frust**: Runs, die durch schlechte Draws unspielbar werden.
7. **Sättigung der VS-Nische**: Der Markt ist voll von austauschbaren VS-Klonen.
