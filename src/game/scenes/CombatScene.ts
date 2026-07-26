/**
 * Combat phase — the active wave.
 *
 * Movement: floating joystick (touch anywhere to steer, one thumb).
 * Weapons resolved from the grid auto-fire at the nearest enemy in range.
 * Overcharge: a tappable button that unleashes an AoE nova + fire-rate surge.
 *
 * Enemies: chase / ranged spitters / splitters, plus three bosses with real
 * mechanics (summon adds, telegraphed radial bullet bursts, enrage).
 * Reactions: chilled enemies take +35% damage; a Volt hit on a burning enemy
 * detonates it. Juice: crits, damage numbers, hit flash, screen shake, SFX.
 */

import type { Game, Scene } from "../Game";
import { COLOR, ELEMENT, type ElementId } from "../../core/theme";
import { ENEMIES, type EnemyAI, type EnemyDef } from "../enemies";
import type { ResolvedWeapon } from "../grid";
import { roundRect, text } from "../../ui/draw";
import { RewardScene } from "./RewardScene";
import { EndScene } from "./EndScene";

const CHILL_AMP = 1.35;
const CRIT_MULT = 2;

interface Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  r: number;
  speed: number;
  color: string;
  contact: number;
  salvage: number;
  boss: boolean;
  ai: EnemyAI;
  shootRate: number;
  shootDmg: number;
  shootRange: number;
  splitInto?: string;
  splitCount: number;
  slowT: number;
  slowF: number;
  burnDps: number;
  burnT: number;
  hitCd: number;
  flash: number;
  shootCd: number;
  abilityCd: number;
  telegraph: number;
  enraged: boolean;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  crit: boolean;
  element: ElementId;
  r: number;
  color: string;
  life: number;
  pierce: number;
  aoe: number;
  chain: number;
  homing: boolean;
  lifesteal: number;
  burn: number;
  slow: number;
  hit: Set<Enemy>;
}

interface EnemyShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  life: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}

interface Floater {
  x: number;
  y: number;
  vy: number;
  life: number;
  text: string;
  color: string;
  size: number;
}

interface WeaponRT {
  w: ResolvedWeapon;
  cd: number;
}

export class CombatScene implements Scene {
  private cx: number;
  private cy: number;
  private radius = 22;
  private speed = 190;

  private weapons: WeaponRT[];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private enemyShots: EnemyShot[] = [];
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private chains: Array<{ x1: number; y1: number; x2: number; y2: number; life: number; color: string }> = [];

  private timeLeft: number;
  private elapsed = 0;
  private spawnAcc: number[];
  private bossSpawned = false;
  private boss: Enemy | null = null;

  private overcharge = 0;
  private overMax = 100;
  private overBoostT = 0;

  private joyId: number | null = null;
  private joyOx = 0;
  private joyOy = 0;
  private joyX = 0;
  private joyY = 0;

  private overBtn = { x: 0, y: 0, r: 44 };

  constructor(private game: Game) {
    const { width, height } = game.vp;
    this.cx = width / 2;
    this.cy = height / 2;
    const wave = game.run.currentWave;
    this.timeLeft = wave.duration;
    this.spawnAcc = wave.spawns.map(() => 0);
    this.weapons = game.run.grid.resolveWeapons().map((w) => ({ w, cd: game.rng.range(0, 0.3) }));
    game.audio.resume();
    game.audio.play("deploy");
    // The player has now deployed at least once — never show the build tutorial again.
    if (!game.meta.seenTutorial) {
      game.meta.seenTutorial = true;
      game.saveMeta();
    }
  }

  // -------------------------------------------------------------- update
  update(dt: number): void {
    const { width, height } = this.game.vp;
    this.overBtn = { x: width - 64, y: height - 84, r: 44 };

    this.elapsed += dt;
    this.handleInput();
    this.moveChassis(dt);
    this.spawn(dt);
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateEnemyShots(dt);
    this.updateParticles(dt);
    this.updateFloaters(dt);
    for (const c of this.chains) c.life -= dt;
    this.chains = this.chains.filter((c) => c.life > 0);

    if (this.overBoostT > 0) this.overBoostT -= dt;

    const wave = this.game.run.currentWave;
    if (!wave.boss) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) this.completeWave();
    } else if (this.bossSpawned && !this.boss) {
      this.completeWave();
    }

    if (this.game.run.hp <= 0) this.game.setScene(new EndScene(this.game, false));
    void height;
  }

  private handleInput(): void {
    const input = this.game.input;
    for (const p of input.active) {
      if (!p.justPressed) continue;
      const dx = p.x - this.overBtn.x;
      const dy = p.y - this.overBtn.y;
      if (dx * dx + dy * dy <= (this.overBtn.r + 8) ** 2) {
        this.tryOvercharge();
      } else if (this.joyId === null) {
        this.joyId = p.id;
        this.joyOx = p.x;
        this.joyOy = p.y;
        this.joyX = p.x;
        this.joyY = p.y;
      }
    }
    const joy = input.active.find((a) => a.id === this.joyId);
    if (joy) {
      this.joyX = joy.x;
      this.joyY = joy.y;
    }
    if (input.releasedThisFrame.some((r) => r.id === this.joyId)) this.joyId = null;
  }

  private moveChassis(dt: number): void {
    if (this.joyId !== null) {
      let dx = this.joyX - this.joyOx;
      let dy = this.joyY - this.joyOy;
      const mag = Math.hypot(dx, dy);
      if (mag > 8) {
        const clamp = Math.min(mag, 60) / 60;
        this.cx += (dx / mag) * this.speed * clamp * dt;
        this.cy += (dy / mag) * this.speed * clamp * dt;
      }
    }
    const { width, height } = this.game.vp;
    this.cx = Math.max(this.radius, Math.min(width - this.radius, this.cx));
    this.cy = Math.max(this.radius + 80, Math.min(height - this.radius - 40, this.cy));
  }

  private spawn(dt: number): void {
    const wave = this.game.run.currentWave;
    const { width, height } = this.game.vp;
    const rng = this.game.rng;

    if (wave.boss && !this.bossSpawned && this.elapsed >= 1.5) {
      this.boss = this.makeEnemy(ENEMIES[wave.boss], width / 2, -60);
      this.enemies.push(this.boss);
      this.bossSpawned = true;
      this.game.audio.play("boss");
      this.game.addShake(10);
    }

    if (!wave.boss && this.timeLeft <= 0) return;

    wave.spawns.forEach(([id, rate], i) => {
      this.spawnAcc[i] += rate * dt;
      while (this.spawnAcc[i] >= 1) {
        this.spawnAcc[i] -= 1;
        let x = 0;
        let y = 0;
        const edge = rng.int(0, 3);
        if (edge === 0) [x, y] = [rng.range(0, width), -30];
        else if (edge === 1) [x, y] = [width + 30, rng.range(0, height)];
        else if (edge === 2) [x, y] = [rng.range(0, width), height + 30];
        else [x, y] = [-30, rng.range(0, height)];
        this.enemies.push(this.makeEnemy(ENEMIES[id], x, y));
      }
    });
  }

  private makeEnemy(def: EnemyDef, x: number, y: number): Enemy {
    const scale = 1 + this.game.run.waveIndex * 0.1;
    return {
      x,
      y,
      hp: def.hp * scale,
      maxHp: def.hp * scale,
      r: def.radius,
      speed: def.speed,
      color: def.color,
      contact: def.contactDamage,
      salvage: def.salvage,
      boss: !!def.boss,
      ai: def.ai ?? "chase",
      shootRate: def.shootRate ?? 0,
      shootDmg: def.shootDmg ?? 0,
      shootRange: def.shootRange ?? 0,
      splitInto: def.splitInto,
      splitCount: def.splitCount ?? 0,
      slowT: 0,
      slowF: 1,
      burnDps: 0,
      burnT: 0,
      hitCd: 0,
      flash: 0,
      shootCd: 1,
      abilityCd: 4,
      telegraph: 0,
      enraged: false,
    };
  }

  private updateWeapons(dt: number): void {
    const boost = this.overBoostT > 0 ? 2 : 1;
    for (const rt of this.weapons) {
      rt.cd -= dt * boost;
      if (rt.cd > 0) continue;
      const target = this.nearestEnemy(this.cx, this.cy, rt.w.range);
      if (!target) {
        rt.cd = 0.05;
        continue;
      }
      rt.cd += 1 / rt.w.fireRate;
      this.fire(rt.w, target);
    }
  }

  private fire(w: ResolvedWeapon, target: Enemy): void {
    const baseAng = Math.atan2(target.y - this.cy, target.x - this.cx);
    const el = ELEMENT[w.element];
    const radial = w.spread >= Math.PI * 2 - 0.01;
    for (let i = 0; i < w.projectiles; i++) {
      let ang: number;
      if (radial) ang = baseAng + (i / w.projectiles) * Math.PI * 2;
      else {
        const t = w.projectiles > 1 ? i / (w.projectiles - 1) - 0.5 : 0;
        ang = baseAng + t * w.spread;
      }
      const crit = this.game.rng.next() < w.crit;
      this.projectiles.push({
        x: this.cx,
        y: this.cy,
        vx: Math.cos(ang) * w.projectileSpeed,
        vy: Math.sin(ang) * w.projectileSpeed,
        dmg: w.damage * (crit ? CRIT_MULT : 1),
        crit,
        element: w.element,
        r: 4 + Math.min(6, w.damage * 0.1),
        color: el.color,
        life: 1.5,
        pierce: w.pierce,
        aoe: w.aoe,
        chain: w.chain,
        homing: w.homing,
        lifesteal: w.lifesteal,
        burn: w.burn,
        slow: w.slow,
        hit: new Set(),
      });
    }
  }

  private updateProjectiles(dt: number): void {
    const { width, height } = this.game.vp;
    for (const p of this.projectiles) {
      if (p.homing) {
        const t = this.nearestEnemy(p.x, p.y, 400);
        if (t) {
          const desired = Math.atan2(t.y - p.y, t.x - p.x);
          const cur = Math.atan2(p.vy, p.vx);
          const speed = Math.hypot(p.vx, p.vy);
          let diff = desired - cur;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const na = cur + Math.max(-6 * dt, Math.min(6 * dt, diff));
          p.vx = Math.cos(na) * speed;
          p.vy = Math.sin(na) * speed;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      for (const e of this.enemies) {
        if (p.hit.has(e) || e.hp <= 0) continue;
        if ((p.x - e.x) ** 2 + (p.y - e.y) ** 2 <= (p.r + e.r) ** 2) {
          this.hitEnemy(e, p.dmg, p.crit, p.color, p.element, p.burn, p.slow, p.lifesteal);
          p.hit.add(e);
          if (p.aoe > 0) this.explode(p, e);
          if (p.chain > 0) this.chainTo(p, e);
          if (p.pierce > 0) p.pierce -= 1;
          else {
            p.life = 0;
            break;
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter(
      (p) => p.life > 0 && p.x > -60 && p.x < width + 60 && p.y > -60 && p.y < height + 60,
    );
  }

  private hitEnemy(
    e: Enemy,
    baseDmg: number,
    crit: boolean,
    color: string,
    element: ElementId,
    burn: number,
    slow: number,
    lifesteal: number,
  ): void {
    const chilled = e.slowT > 0;
    let dmg = baseDmg * (chilled ? CHILL_AMP : 1);

    let detonated = false;
    if (element === "volt" && e.burnT > 0) {
      detonated = true;
      const burst = e.burnDps * 3 + 24;
      dmg += burst;
      e.burnT = 0;
      for (const o of this.enemies) {
        if (o === e || o.hp <= 0) continue;
        if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= 90 * 90) {
          o.hp -= burst * 0.6;
          o.flash = 0.1;
          if (o.hp <= 0) this.killEnemy(o, lifesteal);
        }
      }
      this.spawnParticles(e.x, e.y, ELEMENT.volt.color, 16);
      this.game.addShake(4);
    }

    e.hp -= dmg;
    e.flash = 0.09;
    if (burn > 0) {
      e.burnDps = Math.max(e.burnDps, burn);
      e.burnT = 3;
    }
    if (slow > 0) {
      e.slowF = 1 - slow;
      e.slowT = 1.2;
    }

    this.spawnDamage(e.x, e.y, dmg, crit || detonated, detonated ? ELEMENT.volt.color : crit ? "#ffffff" : color);
    this.spawnParticles(e.x, e.y, color, 3);
    this.game.audio.play("hit");
    if (e.hp <= 0) this.killEnemy(e, lifesteal);
  }

  private explode(p: Projectile, at: Enemy): void {
    for (const e of this.enemies) {
      if (e === at || e.hp <= 0) continue;
      if ((e.x - at.x) ** 2 + (e.y - at.y) ** 2 <= p.aoe * p.aoe) {
        this.hitEnemy(e, p.dmg * 0.7, false, p.color, p.element, p.burn, 0, p.lifesteal);
      }
    }
    this.spawnParticles(at.x, at.y, p.color, 10);
    this.game.addShake(2);
  }

  private chainTo(p: Projectile, from: Enemy): void {
    let src = from;
    for (let j = 0; j < p.chain; j++) {
      let best: Enemy | null = null;
      let bestD = 200 * 200;
      for (const e of this.enemies) {
        if (e.hp <= 0 || p.hit.has(e) || e === src) continue;
        const d = (e.x - src.x) ** 2 + (e.y - src.y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      if (!best) break;
      this.chains.push({ x1: src.x, y1: src.y, x2: best.x, y2: best.y, life: 0.12, color: p.color });
      this.hitEnemy(best, p.dmg * 0.7, p.crit, p.color, p.element, 0, 0, p.lifesteal);
      p.hit.add(best);
      src = best;
    }
  }

  private killEnemy(e: Enemy, lifesteal = 0): void {
    if (e.hp > 0) return;
    const run = this.game.run;
    run.salvage += e.salvage;
    if (lifesteal > 0) run.hp = Math.min(run.maxHp, run.hp + lifesteal);
    this.overcharge = Math.min(this.overMax, this.overcharge + (e.boss ? 30 : 3));
    this.spawnParticles(e.x, e.y, e.color, e.boss ? 40 : 8);
    this.game.audio.play("kill");
    if (e.boss) this.game.addShake(12);

    if (e.splitInto && e.splitCount > 0) {
      for (let i = 0; i < e.splitCount; i++) {
        const a = (i / e.splitCount) * Math.PI * 2;
        const c = this.makeEnemy(ENEMIES[e.splitInto], e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20);
        this.enemies.push(c);
      }
    }
    if (e === this.boss) this.boss = null;
  }

  private updateEnemies(dt: number): void {
    const run = this.game.run;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (e.flash > 0) e.flash -= dt;
      if (e.slowT > 0) e.slowT -= dt;
      else e.slowF = 1;
      if (e.burnT > 0) {
        e.burnT -= dt;
        e.hp -= e.burnDps * dt;
        if (e.hp <= 0) {
          this.killEnemy(e);
          continue;
        }
      }

      const dx = this.cx - e.x;
      const dy = this.cy - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      if (e.boss) this.updateBoss(e, dt, nx, ny);
      else if (e.ai === "spitter") this.updateSpitter(e, dt, nx, ny, dist);
      else {
        e.x += nx * e.speed * e.slowF * dt;
        e.y += ny * e.speed * e.slowF * dt;
      }

      // Contact damage.
      e.hitCd -= dt;
      if (dist <= e.r + this.radius && e.hitCd <= 0) {
        run.hp -= e.contact;
        e.hitCd = 0.6;
        this.spawnParticles(this.cx, this.cy, COLOR.danger, 6);
        this.game.audio.play("hurt");
        this.game.addShake(5);
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  }

  private updateSpitter(e: Enemy, dt: number, nx: number, ny: number, dist: number): void {
    const keep = 260;
    let dir = 0;
    if (dist > keep + 40) dir = 1;
    else if (dist < keep - 40) dir = -1;
    e.x += nx * e.speed * e.slowF * dt * dir;
    e.y += ny * e.speed * e.slowF * dt * dir;
    e.shootCd -= dt;
    if (dist <= e.shootRange && e.shootCd <= 0) {
      e.shootCd = 1 / e.shootRate;
      this.enemyShot(e.x, e.y, nx, ny, e.shootDmg, 190);
    }
  }

  private updateBoss(e: Enemy, dt: number, nx: number, ny: number): void {
    // Enrage (overmind).
    if (e.ai === "overmind" && !e.enraged && e.hp / e.maxHp < 0.4) {
      e.enraged = true;
      e.speed *= 1.4;
      this.game.addShake(10);
      this.game.audio.play("boss");
    }
    e.x += nx * e.speed * e.slowF * dt;
    e.y += ny * e.speed * e.slowF * dt;

    e.abilityCd -= dt;
    if (e.telegraph > 0) {
      e.telegraph -= dt;
      if (e.telegraph <= 0) this.radialBurst(e);
      return;
    }
    if (e.abilityCd > 0) return;

    const fast = e.enraged ? 0.6 : 1;
    switch (e.ai) {
      case "reclaimer":
        this.summonAdds(e, 3);
        e.abilityCd = 5 * fast;
        break;
      case "harvester":
        e.telegraph = 0.7;
        e.abilityCd = 3.6 * fast;
        break;
      case "overmind":
        if (this.game.rng.next() < 0.5) {
          this.summonAdds(e, 3);
          e.abilityCd = 4 * fast;
        } else {
          e.telegraph = 0.6;
          e.abilityCd = 3.2 * fast;
        }
        break;
    }
  }

  private summonAdds(e: Enemy, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this.game.rng.next();
      const add = this.makeEnemy(ENEMIES.rusher, e.x + Math.cos(a) * (e.r + 20), e.y + Math.sin(a) * (e.r + 20));
      this.enemies.push(add);
    }
    this.spawnParticles(e.x, e.y, e.color, 14);
  }

  private radialBurst(e: Enemy): void {
    const count = e.enraged ? 18 : 12;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      this.enemyShot(e.x, e.y, Math.cos(a), Math.sin(a), e.shootDmg, 210);
    }
    this.game.addShake(6);
    this.spawnParticles(e.x, e.y, e.color, 20);
  }

  private enemyShot(x: number, y: number, nx: number, ny: number, dmg: number, speed: number): void {
    this.enemyShots.push({ x, y, vx: nx * speed, vy: ny * speed, dmg, life: 4 });
  }

  private updateEnemyShots(dt: number): void {
    const { width, height } = this.game.vp;
    const run = this.game.run;
    for (const s of this.enemyShots) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if ((s.x - this.cx) ** 2 + (s.y - this.cy) ** 2 <= (this.radius + 6) ** 2) {
        run.hp -= s.dmg;
        s.life = 0;
        this.spawnParticles(this.cx, this.cy, COLOR.danger, 6);
        this.game.audio.play("hurt");
        this.game.addShake(4);
      }
    }
    this.enemyShots = this.enemyShots.filter(
      (s) => s.life > 0 && s.x > -20 && s.x < width + 20 && s.y > -20 && s.y < height + 20,
    );
  }

  private nearestEnemy(x: number, y: number, range: number): Enemy | null {
    let best: Enemy | null = null;
    let bestD = range * range;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  private tryOvercharge(): void {
    if (this.overcharge < this.overMax) return;
    this.overcharge = 0;
    this.overBoostT = 3;
    this.game.audio.play("overcharge");
    this.game.addShake(12);
    const dmg = 40 + this.game.run.waveIndex * 12;
    for (const e of this.enemies) {
      if ((e.x - this.cx) ** 2 + (e.y - this.cy) ** 2 <= 240 * 240) {
        this.hitEnemy(e, dmg, true, COLOR.amber, "kinetic", 0, 0, 0);
      }
    }
    // Clear nearby enemy bullets.
    this.enemyShots = this.enemyShots.filter(
      (s) => (s.x - this.cx) ** 2 + (s.y - this.cy) ** 2 > 240 * 240,
    );
    this.spawnParticles(this.cx, this.cy, COLOR.amber, 50);
  }

  private spawnParticles(x: number, y: number, color: string, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = this.game.rng.range(0, Math.PI * 2);
      const s = this.game.rng.range(30, 160);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4, max: 0.4, color });
    }
  }

  private spawnDamage(x: number, y: number, amount: number, big: boolean, color: string): void {
    this.floaters.push({
      x: x + this.game.rng.range(-6, 6),
      y: y - 8,
      vy: -46,
      life: big ? 0.8 : 0.6,
      text: `${Math.round(amount)}`,
      color,
      size: big ? 20 : 13,
    });
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private updateFloaters(dt: number): void {
    for (const f of this.floaters) {
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy += 40 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);
  }

  private completeWave(): void {
    const run = this.game.run;
    this.game.meta.stats.bestWave = Math.max(this.game.meta.stats.bestWave, run.waveIndex + 1);
    if (run.isLastWave) {
      this.game.setScene(new EndScene(this.game, true));
      return;
    }
    run.hp = Math.min(run.maxHp, run.hp + run.maxHp * 0.15);
    run.waveIndex += 1;
    this.game.setScene(new RewardScene(this.game));
  }

  // -------------------------------------------------------------- render
  render(): void {
    const { ctx, width, height } = this.game.vp;

    ctx.fillStyle = "#070b10";
    ctx.fillRect(-20, -20, width + 40, height + 40);
    ctx.strokeStyle = "#0f1620";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (const c of this.chains) {
      ctx.strokeStyle = c.color;
      ctx.globalAlpha = Math.max(0, c.life / 0.12);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x1, c.y1);
      ctx.lineTo(c.x2, c.y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const e of this.enemies) {
      // Telegraph ring before a boss burst.
      if (e.telegraph > 0) {
        ctx.strokeStyle = COLOR.danger;
        ctx.globalAlpha = 0.4 + 0.4 * Math.sin(this.elapsed * 30);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r + 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = e.flash > 0 ? "#ffffff" : e.burnT > 0 ? "#ff8a3d" : e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      if (e.slowT > 0) {
        ctx.strokeStyle = ELEMENT.frost.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (e.boss) {
        const bw = e.r * 2;
        roundRect(ctx, e.x - e.r, e.y - e.r - 12, bw, 6, 3);
        ctx.fillStyle = "#000";
        ctx.fill();
        roundRect(ctx, e.x - e.r, e.y - e.r - 12, bw * Math.max(0, e.hp / e.maxHp), 6, 3);
        ctx.fillStyle = e.enraged ? "#ff2d3e" : COLOR.danger;
        ctx.fill();
      }
    }

    // Enemy bullets.
    for (const s of this.enemyShots) {
      ctx.fillStyle = "#ff6b7a";
      ctx.shadowColor = "#ff4d5e";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (const p of this.projectiles) {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    for (const f of this.floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 3);
      text(ctx, f.text, f.x, f.y, { size: f.size, color: f.color, align: "center", weight: "800" });
    }
    ctx.globalAlpha = 1;

    this.renderChassis();

    if (this.joyId !== null) {
      ctx.strokeStyle = COLOR.metalLight;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.joyOx, this.joyOy, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = COLOR.amber;
      const dx = this.joyX - this.joyOx;
      const dy = this.joyY - this.joyOy;
      const mag = Math.hypot(dx, dy) || 1;
      const c = Math.min(mag, 60);
      ctx.beginPath();
      ctx.arc(this.joyOx + (dx / mag) * c, this.joyOy + (dy / mag) * c, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    this.renderHud();
    if (this.game.tutorialActive) this.renderTutorial();
  }

  private renderTutorial(): void {
    const { ctx, width, height } = this.game.vp;
    let msg = "";
    if (this.elapsed < 4.5) msg = "Hold anywhere to steer. Weapons fire on their own.";
    else if (this.overcharge >= this.overMax) msg = "Overcharge ready — tap the ⚡ button!";
    else if (this.elapsed < 9) msg = "Survive the timer. Fill the OC ring by killing enemies.";
    if (!msg) return;
    const w = Math.min(width - 32, 360);
    const x = width / 2 - w / 2;
    const y = height - 150;
    roundRect(ctx, x, y, w, 40, 10);
    ctx.fillStyle = "rgba(13,17,23,0.9)";
    ctx.fill();
    ctx.strokeStyle = COLOR.amber;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, msg, width / 2, y + 20, { size: 13, color: COLOR.text, align: "center", baseline: "middle" });
  }

  private renderChassis(): void {
    const { ctx } = this.game.vp;
    ctx.save();
    ctx.translate(this.cx, this.cy);
    if (this.overBoostT > 0) {
      ctx.shadowColor = COLOR.amber;
      ctx.shadowBlur = 20;
    }
    ctx.fillStyle = COLOR.metal;
    ctx.strokeStyle = COLOR.metalLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const px = Math.cos(a) * this.radius;
      const py = Math.sin(a) * this.radius;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLOR.energy;
    ctx.shadowColor = COLOR.energy;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const els = this.weapons.map((w) => w.w.element);
    els.forEach((el, i) => {
      const a = (i / Math.max(1, els.length)) * Math.PI * 2;
      ctx.fillStyle = ELEMENT[el].color;
      ctx.beginPath();
      ctx.arc(this.cx + Math.cos(a) * (this.radius + 6), this.cy + Math.sin(a) * (this.radius + 6), 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderHud(): void {
    const { ctx, width } = this.game.vp;
    const run = this.game.run;
    const pad = 16;

    roundRect(ctx, pad, 20, width - pad * 2, 14, 7);
    ctx.fillStyle = COLOR.bgPanel2;
    ctx.fill();
    roundRect(ctx, pad, 20, (width - pad * 2) * Math.max(0, run.hp / run.maxHp), 14, 7);
    ctx.fillStyle = COLOR.danger;
    ctx.fill();

    const wave = run.currentWave;
    text(ctx, wave.label, pad, 54, { size: 14, color: COLOR.text, weight: "700" });
    if (!wave.boss) {
      text(ctx, `${Math.ceil(Math.max(0, this.timeLeft))}s`, width - pad, 54, {
        size: 16,
        color: COLOR.amber,
        align: "right",
        weight: "800",
      });
    } else if (this.boss) {
      text(ctx, this.boss.enraged ? "ENRAGED!" : "BOSS", width - pad, 54, {
        size: 13,
        color: COLOR.danger,
        align: "right",
        weight: "800",
      });
    }
    text(ctx, `Salvage ${run.salvage}`, pad, 74, { size: 13, color: COLOR.amber });

    const b = this.overBtn;
    const ready = this.overcharge >= this.overMax;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = ready ? COLOR.amber : COLOR.bgPanel2;
    ctx.fill();
    ctx.strokeStyle = ready ? "#fff" : COLOR.energy;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r - 4, -Math.PI / 2, -Math.PI / 2 + (this.overcharge / this.overMax) * Math.PI * 2);
    ctx.stroke();
    text(ctx, ready ? "⚡" : "OC", b.x, b.y, {
      size: ready ? 30 : 15,
      color: ready ? "#05070a" : COLOR.textDim,
      align: "center",
      baseline: "middle",
      weight: "800",
    });
  }
}
