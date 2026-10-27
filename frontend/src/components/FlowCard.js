export function calcGrid(solarKw, homeKw) {
  return Math.round((solarKw - homeKw) * 10) / 10;
}

export function renderFlow({ solarKw, homeKw, stale, online = true }) {
  if (stale || online === false) return `<div class="stale">— ข้อมูลเก่า รออัปเดต</div>`;
  const grid = calcGrid(solarKw, homeKw);
  return `<div>${solarKw} → ${homeKw} → ${grid}</div>`;
}
