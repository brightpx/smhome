export function shouldNotify(state) {
  if (state.sessionExpired) return true;
  if (state.online === false) return true;
  return false;
}
