// HEAD STYLE — which head builder each character is built with.
// ===========================================================================
// Two heads exist: `classic` (geo.js animeHead + humanoid.js addFace — a
// sphere with the face pressed flat and the features as quads in front of it)
// and `sculpt` (head2.js — brow, sockets, cheekbones, nose and chin in the
// mesh, the face placed on the skin). The table below is the roster's
// decision, one line per character; anyone not listed gets `sculpt`.
//
// It lives here, and not in each character file, so that a character can be
// REVERTED with one line and so that the faces bench
// (/workbench/?edit=faces) can build both versions of any character side by
// side without the character file knowing. The bench exports this table.
//
// Resolution order: a runtime override (the bench, or `?head=classic` on any
// URL) > this table > `spec.head` in the character file > 'sculpt'.
// ===========================================================================
export const HEAD_STYLE = {
  // the creature heads: a mask, a volcano, a skull, a bear, a squid. They
  // build their own head over the base and the sculpt has nothing to add
  hanami: 'classic',
  jogo: 'classic',
  kurourushi: 'classic',
  mahoraga: 'classic',
  panda: 'classic',
  dagon: 'classic'
};

let override = null;
if (typeof location !== 'undefined') {
  const q = new URLSearchParams(location.search).get('head');
  if (q === 'classic' || q === 'sculpt') override = q;
}

/** Force a style for every model built until cleared (the faces bench). */
export function setHeadStyleOverride(style) { override = style || null; }
export function getHeadStyleOverride() { return override; }

export function headStyleFor(id, spec) {
  if (override) return override;
  const base = String(id || '').split(':')[0];
  return HEAD_STYLE[base] ?? spec?.head ?? 'sculpt';
}
