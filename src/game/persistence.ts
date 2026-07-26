/**
 * In-progress run persistence (Block 3). Lets a player close the tab mid-run
 * and resume from the title screen. Saved at each build phase, cleared on run end.
 */

import type { RunState } from "./run";

const RUN_KEY = "gridforge.run.v1";

export interface RunSnapshot {
  chassisId: string;
  hp: number;
  maxHp: number;
  salvage: number;
  waveIndex: number;
  inventory: string[];
  cells: Array<{ x: number; y: number; comp: string }>;
  daily: boolean;
  endless: boolean;
  modifierId?: string;
}

export function saveRun(run: RunState): void {
  const snap: RunSnapshot = {
    chassisId: run.chassisId,
    hp: run.hp,
    maxHp: run.maxHp,
    salvage: run.salvage,
    waveIndex: run.waveIndex,
    inventory: [...run.inventory],
    cells: run.grid.snapshot(),
    daily: run.daily,
    endless: run.endless,
    modifierId: run.modifier?.id,
  };
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(snap));
  } catch {
    /* storage unavailable */
  }
}

export function loadRun(): RunSnapshot | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    return raw ? (JSON.parse(raw) as RunSnapshot) : null;
  } catch {
    return null;
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    /* ignore */
  }
}
