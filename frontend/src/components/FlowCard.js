export function calcGrid(solarKw, homeKw) {
  return Math.round((solarKw - homeKw) * 10) / 10;
}
