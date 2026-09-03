// LEGACY HUD HOST — the old game's HUD (and its stylesheet) mounted inside a
// shadow root, so its 3k lines of CSS cannot touch the new front end and the
// new front end cannot touch it. Everything the old runtime calls on the HUD
// goes straight through.
import { HUD } from './hud.js';
import css from './style.css?inline';
export class LegacyHUD extends HUD {
  constructor(uiRoot) {
    const host = document.createElement('div');
    host.className = 'legacy-hud-host';
    host.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    uiRoot.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style'); style.textContent = css; shadow.appendChild(style);
    const inner = document.createElement('div'); inner.id = 'ui-root'; inner.style.cssText = 'position:absolute;inset:0;pointer-events:none;'; shadow.appendChild(inner);
    super(inner);
    this._host = host; this.shadowRoot = inner;
  }
  destroy() { try { super.destroy(); } catch (e) { /* */ } this._host.remove(); }
}

// A second, persistent shadow root with the same stylesheet for the old
// online panels (lobby overlay, connection banner, toast). They outlive any
// one match, so they cannot live in the HUD's host.
export function legacyShadow(uiRoot, cls = 'legacy-online-host') {
  const host = document.createElement('div');
  host.className = cls;
  host.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:40;';
  uiRoot.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style'); style.textContent = css + '\n.online-panel,.lobby-overlay,.net-banner,.online-toast{pointer-events:auto}'; shadow.appendChild(style);
  const inner = document.createElement('div'); inner.id = 'ui-root'; inner.style.cssText = 'position:absolute;inset:0;pointer-events:none;'; shadow.appendChild(inner);
  inner.host = host;
  return inner;
}
