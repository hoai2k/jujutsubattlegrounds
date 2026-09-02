export const eq = (a, b, m = '') => { if (a !== b) throw new Error(`${m} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`); };
export const ok = (v, m = 'expected truthy') => { if (!v) throw new Error(m); };
export const near = (a, b, eps = 1e-6, m = '') => { if (Math.abs(a - b) > eps) throw new Error(`${m} expected ~${b} got ${a}`); };
