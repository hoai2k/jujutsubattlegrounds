// DEV-ONLY map contact sheet. Builds every map, renders it from its own
// `previewCam` beauty shot with that map's light rig and fog, and POSTs the
// frame to the vite /__shot sink so the whole set can be eyeballed at once
// after a layout change.
//
// Not imported by the game; call it from the console:
//   (await import('/src/arena/mapshot.js')).shootAll()
import * as THREE from 'three';
import { MAP_IDS, buildMap, currentQuality } from './index.js';
import { applyXray, setXrayFocus, clearXrayFocus } from '../art/shaders/xray.js';

export async function shootAll(opts = {}) {
  const W = opts.width ?? 1100, H = opts.height ?? 620;
  const ids = opts.ids || MAP_IDS;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);

  const done = [];
  for (const id of ids) {
    const scene = new THREE.Scene();
    const key = new THREE.DirectionalLight(0xffe2c0, 2.35); key.position.set(7, 11, 5);
    const rim = new THREE.DirectionalLight(0x84b0ff, 1.7); rim.position.set(-6, 8, -7);
    const hemi = new THREE.HemisphereLight(0x8698cf, 0x4c4036, 0.62);
    scene.add(key, rim, hemi);

    const map = buildMap(id, { quality: currentQuality() });
    scene.add(map.group);
    // `bg` overrides the map's own sky colour — set it to something violent and
    // any patch of the frame that turns that colour is a hole in the geometry
    // rather than a surface. Fastest way to tell a leak from a lit wall.
    scene.background = new THREE.Color(opts.bg ?? map.background);
    if (opts.bg !== undefined) {
      map.group.traverse(o => { if (o.material && o.material.side === THREE.BackSide) o.visible = false; });
    }
    scene.fog = opts.bg !== undefined ? null : map.fog;
    const L = map.lightRig;
    if (L?.key) { key.color.setHex(L.key.color); key.intensity = L.key.intensity; key.position.set(...L.key.pos); }
    if (L?.rim) { rim.color.setHex(L.rim.color); rim.intensity = L.rim.intensity; rim.position.set(...L.rim.pos); }
    if (L?.hemi) { hemi.color.setHex(L.hemi.sky); hemi.groundColor.setHex(L.hemi.ground); hemi.intensity = L.hemi.intensity; }

    const cam = new THREE.PerspectiveCamera(50, W / H, 0.05, 400);
    const pc = map.previewCam || { pos: [0, 14, 26], look: [0, 1, 0] };
    cam.position.set(...pc.pos);
    cam.lookAt(new THREE.Vector3(...pc.look));
    clearXrayFocus();
    applyXray(cam);

    map.update(0.016, cam);
    renderer.render(scene, cam);
    const data = canvas.toDataURL('image/png');
    await fetch('/__shot', { method: 'POST', body: JSON.stringify({ name: 'map_' + id, data }) });
    done.push(id);
    scene.remove(map.group);
    map.dispose?.();
  }
  renderer.dispose();
  return done;
}

// A gameplay-eye view: stand the camera where a fighter's chase rig would be
// and point the x-ray at the fighter, so the cutout can be seen working.
export async function shootPlay(id, opts = {}) {
  const W = opts.width ?? 1100, H = opts.height ?? 620;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  const scene = new THREE.Scene();
  const key = new THREE.DirectionalLight(0xffe2c0, 2.35); key.position.set(7, 11, 5);
  const rim = new THREE.DirectionalLight(0x84b0ff, 1.7); rim.position.set(-6, 8, -7);
  const hemi = new THREE.HemisphereLight(0x8698cf, 0x4c4036, 0.62);
  scene.add(key, rim, hemi);
  const map = buildMap(id, { quality: currentQuality() });
  scene.add(map.group);
  scene.background = new THREE.Color(map.background);
  scene.fog = map.fog;
  const L = map.lightRig;
  if (L?.key) { key.color.setHex(L.key.color); key.intensity = L.key.intensity; key.position.set(...L.key.pos); }
  if (L?.rim) { rim.color.setHex(L.rim.color); rim.intensity = L.rim.intensity; rim.position.set(...L.rim.pos); }
  if (L?.hemi) { hemi.color.setHex(L.hemi.sky); hemi.groundColor.setHex(L.hemi.ground); hemi.intensity = L.hemi.intensity; }

  // a stand-in for the fighter, so it is obvious whether the cutout reveals him
  const subject = new THREE.Vector3(...(opts.at || [0, 0, 0]));
  subject.y = map.bounds.floorAt(subject.x, subject.z, Infinity);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 1.05, 6, 12),
    new THREE.MeshBasicMaterial({ color: 0xff3060 }));
  body.position.copy(subject).setY(subject.y + 0.95);
  scene.add(body);

  const cam = new THREE.PerspectiveCamera(50, W / H, 0.05, 400);
  const a = opts.yaw ?? 0, d = opts.dist ?? 5.2;
  cam.position.set(subject.x + Math.sin(a) * d, subject.y + 2.1, subject.z + Math.cos(a) * d);
  cam.lookAt(subject.x, subject.y + 1.2, subject.z);
  cam.updateMatrixWorld();
  setXrayFocus(cam, body.position);
  applyXray(cam);
  map.update(0.016, cam);
  renderer.render(scene, cam);
  await fetch('/__shot', {
    method: 'POST',
    body: JSON.stringify({ name: opts.name || ('play_' + id), data: canvas.toDataURL('image/png') })
  });
  clearXrayFocus();
  renderer.dispose();
  return 'ok';
}
