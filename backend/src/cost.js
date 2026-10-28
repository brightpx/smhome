// PEA TOU residential (approx, excl Ft/VAT — override via env TOU_PEAK/TOU_OFFPEAK).
// Peak: Mon–Fri 09:00–22:00. Off-peak: nights, weekends (public holidays treated as weekends manually).
export function isPeak(date = new Date()) {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  const h = date.getHours() + date.getMinutes() / 60;
  return h >= 9 && h < 22;
}

export function costOfKwh(kwh, at = new Date(), rates = {}) {
  const peak = Number(process.env.TOU_PEAK || rates.peak || 5.1135);
  const off = Number(process.env.TOU_OFFPEAK || rates.offpeak || 2.6037);
  return kwh * (isPeak(at) ? peak : off);
}

export function dailyCost(rows, rates) {
  const sorted = [...rows].filter((r) => r.fwd != null).sort((a, b) => a.t - b.t);
  let kwh = 0, thb = 0;
  for (let i = 1; i < sorted.length; i++) {
    const d = sorted[i].fwd - sorted[i - 1].fwd;
    if (d <= 0 || d > 50) continue;
    kwh += d;
    thb += costOfKwh(d, new Date(sorted[i].t), rates);
  }
  return { kwh: Math.round(kwh * 100) / 100, thb: Math.round(thb * 100) / 100 };
}
