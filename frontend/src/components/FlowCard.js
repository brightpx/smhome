export function calcGrid(solarKw, homeKw) {
  return Math.round((solarKw - homeKw) * 10) / 10;
}

export function fmtSolarW(w) {
  if (w == null) return '—';
  return Math.round(w) + ' W';
}

export function homeUseW(solarW, meterW) {
  if (solarW == null || meterW == null) return null;
  return Math.round((solarW + meterW) * 10) / 10;
}

export function renderFlow({ solarKw, homeKw, stale, online = true }) {
  if (stale || online === false) return `<div class="stale">— ข้อมูลเก่า รออัปเดต</div>`;
  const grid = calcGrid(solarKw, homeKw);
  return `<div>${solarKw} → ${homeKw} → ${grid}</div>`;
}

export function solarTempPill(t) {
  if (t == null) return '';
  const cls = t >= 60 ? 'hot' : t >= 50 ? 'warm' : 'cool';
  return `<span class="pill ${cls}">โซล่า ${t}°C</span>`;
}
