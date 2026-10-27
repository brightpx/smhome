export function groupOn(devices) {
  const grouped = {};
  for (const d of devices) {
    if (!d.online) continue;
    if (!grouped[d.room]) grouped[d.room] = [];
    grouped[d.room].push(d);
  }
  return grouped;
}
