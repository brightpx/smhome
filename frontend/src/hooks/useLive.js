export function isStale(updatedAt, intervalMs = 5000) {
  return Date.now() - updatedAt > intervalMs * 2;
}
