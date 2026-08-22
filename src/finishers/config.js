// FINISHERS — feature configuration and the "seen it" ledger.
//
// The master switch lives HERE rather than in ui/settings.js on purpose: this
// whole feature is additive, and a flag that needs an edit to an existing file
// is a merge conflict waiting to happen. It reads a saved override out of its
// own localStorage key, so a player who turns finishers off keeps them off,
// and nothing outside this directory has to know the setting exists.
//
// Turn them off from the console with `__finishers.enabled = false` (dev), or
// permanently with `setFinishersEnabled(false)`.

const KEY = 'jujutsu-battlegrounds.finishers';
const OLD_KEY = 'cursed-arena.finishers';   // pre-rename key; read-only fallback

export const FINISHERS = {
  // THE FLAG THE BRIEF ASKS FOR. Defaults ON.
  enabled: true,
  // A finisher is never skippable on its first viewing. After that, any action
  // button ends it. START and SELECT are excluded — they are pause and the
  // control legend, and eating those would be a worse bug than not skipping.
  skipAfterSeen: true,
  // Set true to make every finisher skippable immediately (test affordance).
  alwaysSkippable: false,
  // Forget every "seen" mark at boot. Test affordance; never on in a build.
  forgetSeen: false
};

try {
  const raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY);
  if (raw) Object.assign(FINISHERS, JSON.parse(raw));
} catch (e) { /* private mode / corrupt: the defaults above stand */ }

export function setFinishersEnabled(on) {
  FINISHERS.enabled = !!on;
  try { localStorage.setItem(KEY, JSON.stringify({ enabled: FINISHERS.enabled })); } catch (e) { }
  return FINISHERS.enabled;
}

export function finishersEnabled() { return !!FINISHERS.enabled; }

// ---------------------------------------------------------------------------
// THE SEEN LEDGER. Per finisher id, not per character: a second finisher added
// to a character later has to earn its own first full viewing.
const SEEN = 'ca_fin_seen:';

export function hasSeen(id) {
  if (FINISHERS.forgetSeen) return false;
  try { return !!localStorage.getItem(SEEN + id); } catch (e) { return false; }
}

export function markSeen(id) {
  try { localStorage.setItem(SEEN + id, '1'); } catch (e) { }
}

export function clearSeen() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(SEEN)) localStorage.removeItem(k);
    }
  } catch (e) { }
}

if (import.meta.env?.DEV) {
  // DEV ONLY. Lets a test session replay first-viewings and flip the switch
  // without a rebuild. Nothing in the shipped flow reads this.
  window.__finishers = FINISHERS;
  window.__finishersClearSeen = clearSeen;
}
