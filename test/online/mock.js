// A stand-in for the slice of InstantDB the game uses, relayed through the
// Node test harness (`window.__mockSend` / `window.__mockRecv`) so that two
// SEPARATE browsers — each with a visible, un-throttled page and its own
// localStorage — can talk to each other without a websocket.
window.__mockInstant = function () {
  let docs = {};
  const queries = new Set();
  const rooms = new Map();
  const sid = 'sid-' + Math.random().toString(36).slice(2, 8);

  const rowsFor = (d, q) => {
    const out = {};
    for (const ns in q) {
      let list = Object.values(d[ns] || {});
      const where = q[ns]?.$?.where;
      if (where) list = list.filter(r => Object.entries(where).every(([k, v]) => r[k] === v));
      out[ns] = list;
    }
    return out;
  };
  const notifyQueries = () => { for (const fn of queries) fn(docs); };

  const pushPresence = r => {
    const peers = {};
    for (const [k, v] of r.peers) peers[k] = { ...v, peerId: k };
    const slice = { user: r.presence, peers, isLoading: false };
    for (const h of r.pHandlers) h(slice);
  };

  window.__mockRecv = m => {
    if (m.t === 'docs') { docs = m.docs; notifyQueries(); return; }
    const r = rooms.get(m.room);
    if (!r) return;
    if (m.t === 'presence') {
      if (m.sid === sid) return;
      r.peers.set(m.sid, m.data);
      r.beats.set(m.sid, Date.now());
      pushPresence(r);
    } else if (m.t === 'bye') {
      if (r.peers.delete(m.sid)) { r.beats.delete(m.sid); pushPresence(r); }
    } else if (m.t === 'topic') {
      const hs = r.tHandlers.get(m.topic);
      if (hs) for (const h of hs.slice()) h(m.data, m.sid === sid ? r.presence : r.peers.get(m.sid));
    }
  };
  const send = m => { try { window.__mockSend(JSON.stringify(m)); } catch { } };

  // Presence heartbeat + expiry, so a page that is killed is actually noticed.
  setInterval(() => {
    const now = Date.now();
    for (const r of rooms.values()) {
      let changed = false;
      for (const [k, t] of r.beats) if (now - t > 2500) { r.peers.delete(k); r.beats.delete(k); changed = true; }
      if (changed) pushPresence(r);
      send({ t: 'presence', room: r.id, sid, data: r.presence });
    }
  }, 700);

  const uid = () => 'm' + Math.random().toString(36).slice(2, 12);
  const tx = new Proxy({}, {
    get: (_, ns) => new Proxy({}, {
      get: (__, id) => ({
        update: obj => ({ ns, id, op: 'update', obj }),
        delete: () => ({ ns, id, op: 'delete' })
      })
    })
  });

  const db = {
    tx,
    transact: chunks => {
      send({ t: 'tx', chunks: Array.isArray(chunks) ? chunks : [chunks] });
      return Promise.resolve({ status: 'synced' });
    },
    queryOnce: q => new Promise(res => setTimeout(() => res({ data: rowsFor(docs, q) }), 40)),
    subscribeQuery: (q, cb) => {
      const fn = d => cb({ data: rowsFor(d, q) });
      queries.add(fn);
      fn(docs);
      send({ t: 'sync' });
      return () => queries.delete(fn);
    },
    subscribeConnectionStatus: cb => { cb('authenticated'); return () => { }; },
    joinRoom: (type, id, opts = {}) => {
      let r = rooms.get(id);
      if (!r) rooms.set(id, r = { id, presence: opts.initialPresence || {}, peers: new Map(), beats: new Map(), pHandlers: [], tHandlers: new Map() });
      send({ t: 'presence', room: id, sid, data: r.presence });
      return {
        leaveRoom: () => { send({ t: 'bye', room: id, sid }); rooms.delete(id); },
        publishPresence: data => { r.presence = { ...r.presence, ...data }; send({ t: 'presence', room: id, sid, data: r.presence }); pushPresence(r); },
        subscribePresence: (o, cb) => { r.pHandlers.push(cb); pushPresence(r); return () => { r.pHandlers = r.pHandlers.filter(h => h !== cb); }; },
        getPresence: () => ({ user: r.presence, peers: {}, isLoading: false }),
        publishTopic: (topic, data) => send({ t: 'topic', room: id, topic, data, sid }),
        subscribeTopic: (topic, cb) => {
          let hs = r.tHandlers.get(topic);
          if (!hs) r.tHandlers.set(topic, hs = []);
          hs.push(cb);
          return () => r.tHandlers.set(topic, hs.filter(h => h !== cb));
        }
      };
    }
  };
  return { db, api: { id: uid, tx, lookup: null } };
};
