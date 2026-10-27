export function groupOn(devices) {  const grouped = {};
  for (const d of devices) {
    if (!d.online) continue;
    if (!grouped[d.room]) grouped[d.room] = [];
    grouped[d.room].push(d);
  }
  return grouped;
}

export function onCountOf(d) {
  return (d.gangs || []).filter((g) => g.on).length;
}

export function sortDevices(devices) {
  const rank = (d) => {
    if (!d.online) return 3;
    if (d.type === 'meter' || d.type === 'solar') return 0;
    if (onCountOf(d) > 0) return 1;
    if (d.gangs) return 2;
    return 1;
  };
  return [...devices].sort((a, b) => rank(a) - rank(b) || onCountOf(b) - onCountOf(a));
}
