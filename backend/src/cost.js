// PEA TOU residential (approx, excl Ft/VAT — override via env TOU_PEAK/TOU_OFFPEAK).
// Peak: Mon–Fri 09:00–22:00. Off-peak: nights, weekends (public holidays treated as weekends manually).
export function isPeak(date = new Date()) {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  const h = date.getHours() + date.getMinutes() / 60;
  return h >= 9 && h < 22;
}

export function costOfKwh(kwh, at = new Date(), rates = {}) {
  const flat = process.env.TOU_FLAT || null;
  const peak = Number(flat ?? process.env.TOU_PEAK ?? rates.peak ?? 5.1135);
  const off = Number(flat ?? process.env.TOU_OFFPEAK ?? rates.offpeak ?? 2.6037);
  return kwh * (isPeak(at) ? peak : off);
}

export function dailyCost(rows, rates) {
  const sorted = [...rows].filter((r) => r.fwd != null).sort((a, b) => a.t - b.t);
  let kwh = 0, thb = 0, solarKwh = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dtH = (sorted[i].t - sorted[i - 1].t) / 3600000;
    const d = sorted[i].fwd - sorted[i - 1].fwd;
    if (d > 0 && d < 50) {
      kwh += d;
      thb += costOfKwh(d, new Date(sorted[i].t), rates);
    }
    const sw = sorted[i].solarW;
    if (dtH > 0 && dtH <= 0.5 && typeof sw === 'number' && sw >= 0) solarKwh += (sw * dtH) / 1000;
  }
  const r2 = (x) => Math.round(x * 100) / 100;
  return { kwh: r2(kwh), thb: r2(thb), solarKwh: r2(solarKwh), savedThb: r2(costOfKwh(solarKwh, new Date(), rates)) };
}
