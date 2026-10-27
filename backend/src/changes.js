export function diffSnapshots(prev, curr, now = Date.now()) {
  const events = [];
  const before = Object.fromEntries((prev?.devices || []).map((d) => [d.id, d]));
  for (const d of curr?.devices || []) {
    const p = before[d.id];
    if (!p) continue;
    if (!!p.online !== !!d.online) {
      events.push({ t: now, device_id: d.id, name: d.name, kind: 'online', detail: d.online ? 'ออนไลน์' : 'หลุด', from: !!p.online, to: !!d.online });
    }
    const pg = Object.fromEntries((p.gangs || []).map((g) => [g.name, g.on]));
    for (const g of d.gangs || []) {
      if (g.name in pg && !!pg[g.name] !== !!g.on) {
        events.push({ t: now, device_id: d.id, name: d.name, kind: 'gang', detail: g.name + ' → ' + (g.on ? 'เปิด' : 'ปิด'), from: !!pg[g.name], to: !!g.on });
      }
    }
  }
  return events;
}
