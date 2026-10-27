export function isStale(updatedAt, intervalMs = 5000) {
  return Date.now() - updatedAt > intervalMs * 2;
}

export function staleMinutes(updatedAt) {
  return Math.floor((Date.now() - updatedAt) / 60000);
}
