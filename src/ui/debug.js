// Debug overlay (F3): state names, frame data, all three resources, domain
// state, barrier integrity, frame timing, hitbox spheres + skeletons.
import * as THREE from 'three';
// CURSED SPEECH. The brief asks that every command's range be visible in the
// debug overlay, and the resistance curve alongside it — both are numbers a
// player cannot infer from watching, and both decide whether a word was worth
// saying. `SPEECH-ON-ME` prints on EVERY fighter, not just Inumaki, because
// the interesting number is the one on the person being commanded.
import {
  tierDef as throatTier, boundKey as cmdKey, affordable,
  resistOf, resistBand, RESIST_BANDS
} from '../combat/speech.js';

export class DebugOverlay {
  constructor(root, scene) {
    this.scene = scene;
    this.on = false;
    this.el = document.createElement('div');
    this.el.className = 'debug-panel';
    root.appendChild(this.el);
    this.helpers = [];
    this.hitSpheres = [];
  }

  toggle(match) {
    this.on = !this.on;
    this.el.classList.toggle('on', this.on);
    if (this.on && match) {
      for (const f of match.fighters) {
        const h = new THREE.SkeletonHelper(f.model.group);
        this.scene.add(h);
        this.helpers.push(h);
        const hs = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xff4040, wireframe: true, transparent: true, opacity: 0.5 }));
        hs.visible = false;
        this.scene.add(hs);
        this.hitSpheres.push({ mesh: hs, fighter: f });
        const hurt = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.0, 4, 8),
          new THREE.MeshBasicMaterial({ color: 0x40c8ff, wireframe: true, transparent: true, opacity: 0.3 }));
        this.scene.add(hurt);
        this.hitSpheres.push({ mesh: hurt, fighter: f, hurt: true });
      }
    } else {
      for (const h of this.helpers) this.scene.remove(h);
      for (const h of this.hitSpheres) this.scene.remove(h.mesh);
      this.helpers = [];
      this.hitSpheres = [];
    }
  }

  update(match, timing) {
    if (!this.on || !match) return;
    const d = match.domains.state;
    const cl = match.domains.clashState;
    const fmt = f => `${f.cfg.id.padEnd(7)} st=${f.state.padEnd(12)} f=${String(f.f).padStart(3)}
  hp=${f.res.hp.toFixed(1).padStart(6)} maxCE=${f.res.maxCE.toFixed(1)} curCE=${f.res.curCE.toFixed(1)} sta=${f.res.stamina.toFixed(0)}
  juggle=${f.juggle} iF=${f.iFrames} armor=${f.armorFrames} backlash=${f.backlash.toFixed(1)}${f.cores ? `
  CORES: ${f.cores.map(c => `${c.short}${c.key === f.stance ? '*' : ' '}${c.alive ? Math.round(c.hp) + '/' + Math.round(c.max) : 'DEAD'}`).join('  ')}  stance=${f.stance}  total=${Math.round(f.cores.reduce((a2, c) => a2 + Math.max(0, c.hp), 0))}${f.allCoresT > 0 ? `  ULT ${f.allCoresT.toFixed(1)}s x${f.allCoresMult.toFixed(2)}` : ''}` : ''}${f.cfg.charge ? `
  CHARGE: ${f.charge.toFixed(1)}/${f.cfg.charge.max} tier=${f.chargeTier} dmg=x${(f.dmgMult / f.stats.damageScale).toFixed(2)} arc=${f.arcChain}/${f.amberT > 0 ? (f.cfg.ultimate.chain ?? 6) : (f.cfg.special.chain ?? 3)} win=${f.arcWindow.toFixed(2)}${f.amberT > 0 ? `  AMBER ${f.amberT.toFixed(1)}s` : ''}` : ''}${f.cfg.gluttony ? `
  GLUT: ${f.gluttony.toFixed(1)}/${f.cfg.gluttony.max} stage=${f.growthStage}/${f.cfg.gluttony.thresholds.length} scale=${f.growthScale.toFixed(3)} reach=x${f.reachScale.toFixed(2)} hp+${f.growthHpBonus}` : ''}${f.cfg.flora ? `
  FLORA: terrain=${f.terrain ?? '—'} regen=${(f.floraRate ?? 0).toFixed(2)}/s slow=${f.floraSlow.toFixed(2)} fireVuln=x${f.fireMult}` : ''}${f.cfg.throat ? `
  THROAT: ${f.throat.toFixed(1)}/${f.cfg.throat.max} tier=${f.throatTier}(${throatTier(f.throatTier).name}) rest=${f.throatRest.toFixed(2)}${f.voiceSpent ? ' SPENT' : ''} durX=${throatTier(f.throatTier).dur.toFixed(2)} dmgX=${throatTier(f.throatTier).dmg.toFixed(2)}
  BOUND: RB=${cmdKey(f, 'ct1')} RT=${cmdKey(f, 'ct2')}${f.utter ? '  SAYING=' + f.utter.key : ''}
  RANGES: ${f.cfg.commands.order.map(k => {
    const c = f.cfg.commands.defs[k];
    return `${c.short}=${c.range.toFixed(1)}m/${c.throat}${affordable(f, c) ? '' : 'x'}`;
  }).join('  ')}` : ''}${f.cfg.throat || f.forced || f.sleepT > 0 || f.twisted || f.rootT > 0 ? `
  SPEECH-ON-ME: resist=${(resistOf(f) * 100).toFixed(0)}% (${RESIST_BANDS[resistBand(f)]}) root=${f.rootT.toFixed(2)} sleep=${f.sleepT.toFixed(2)}x${f.sleepMult.toFixed(2)} twist=${f.twisted ? f.twisted.t.toFixed(2) + 'x' + f.twisted.mult : '—'} forced=${f.forced ? f.forced.mode + ' ' + f.forced.t.toFixed(2) : '—'}` : ''}${f.melt ? `
  MELT: ${f.melt.t.toFixed(1)}s chip x${f.melt.chip} stam x${f.melt.stamina}` : ''}
  ${f.copySlot ? 'copy=' + f.copySlot.name : ''}${f.ratioMark ? ' MARK' : ''}${f.buffs.overtime > 0 ? ' OT' : ''}${f.buffs.voidDebuff > 0 ? ' VOIDDBF' : ''}${f.buffs.sukuna > 0 ? ' SUKUNA=' + f.buffs.sukuna.toFixed(1) : ''}${f.buffs.resolve > 0 ? ' RESOLVE' : ''}${f.cfg.special ? `
  SP: ${f.cfg.special.key} cd=${Math.max(0, f.specialCD).toFixed(1)}/${f.specialCDMax.toFixed(1)}${f.cfg.special.key === 'nanami_ratio' ? ` sweep=${f.ratioSweep == null ? '—' : f.ratioSweep.toFixed(3)} red=${f.cfg.special.mark} win=±${f.cfg.special.hitWindow} primed=${f.ratioPrimed} (F7 forces)` : ''}` : ''}${f.cfg.blackFlash ? `
  BF: t=${String(f.bfT).padStart(2)} window=${f.bfT > 0 && f.bfT <= f.cfg.blackFlash.window ? 'OPEN' : f.bfT > 0 ? 'lockout' : '—'} chain=${f.bfChain} base=${f.bfBase.toFixed(1)}` : ''}`;
    const sw = match.domains.swordDebug?.();
    // TERRAIN. Exposed for every seat, not just Hanami's — the classification
    // touches all seven maps and "what is this surface" has to be checkable
    // anywhere on any of them, including indoors and on upper floors.
    const terr = match.arena?.terrainAt
      ? match.fighters.map(f => {
        const stat = match.arena.terrainAt(f.pos.x, f.pos.z, f.pos.y);
        const live = match.flora?.terrainFor(f);
        return `${f.cfg.id}@(${f.pos.x.toFixed(1)},${f.pos.y.toFixed(1)},${f.pos.z.toFixed(1)})=`
          + `${stat}${live && live !== stat ? '->' + live : ''}`;
      }).join('  ')
      : '—';
    const sm = match.swarms;
    this.el.textContent =
      `FPS ${timing.fps.toFixed(0)}  logic ${timing.logicMs.toFixed(2)}ms  ts=${match.timeScale.toFixed(2)} hitstop=${match.hitstopFrames}
TERRAIN: ${terr}
FLORA : fields=${match.flora?.fields.length ?? 0} buds=${match.flora?.buds.length ?? 0}
SWARM : roaches=${sm?.roaches.length ?? 0}/${sm ? 220 : 0} obscure=${(sm?.obscure ?? 0).toFixed(2)} infest=${sm?.infest ? sm.infest.t.toFixed(1) + 's' : '—'}
${match.fighters.map(fmt).join('\n')}
DOMAIN: ${d ? `${d.def.name} ${d.phase} t=${(d.timer ?? 0).toFixed(1)} integ=${d.integrity.toFixed(0)} castF=${d.castF}` : '—'}
CLASH : ${cl ? `${(cl.dur - cl.t).toFixed(1)}s left  ${cl.a.cfg.id}=${cl.dmgA.toFixed(1)} dmg  ${cl.b.cfg.id}=${cl.dmgB.toFixed(1)} dmg` : '—'}${sw ? `
SWORDS: ${sw.live ? `${sw.remaining} embedded${sw.falling ? ' +falling' : ''}` : 'inactive'}  carried=${sw.carried ? 'YES' : 'no'}  last=${sw.last ?? '—'}  seed=${sw.seed ?? '—'}
ROLLS : force=${sw.forced ?? 'off'} (F6 cycles)  weights: ${sw.weights}` : ''}`;
    for (const h of this.hitSpheres) {
      const f = h.fighter;
      if (h.hurt) {
        h.mesh.position.copy(f.pos).add(new THREE.Vector3(0, 1.05, 0));
      } else {
        const win = f.activeHit;
        h.mesh.visible = !!win && !win.confirmed;
        if (win) {
          const fw = f.forward();
          h.mesh.position.copy(f.pos).addScaledVector(fw, (win.def.reach ?? 1.4) * 0.7);
          h.mesh.position.y = f.pos.y + 1.25;
        }
      }
    }
  }
}
