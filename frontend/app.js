function el(id) { return document.getElementById(id); }
function setHtml(id, html) { const e = el(id); if (e) e.innerHTML = html; }
function setText(id, txt) { const e = el(id); if (e) e.textContent = txt; }
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function showTab(which) {
  const d = document.getElementById('devices'), t = document.getElementById('timeline');
  const bd = document.getElementById('tabDev'), bt = document.getElementById('tabTl');
  if (which === 'tl') {
    if (d) d.style.display = 'none';
    if (t) { t.style.display = 'block'; loadTimeline(); }
    if (bd) bd.style.background = 'rgba(255,255,255,.06)';
    if (bt) bt.style.background = 'rgba(10,132,255,.25)';
  } else {
    if (d) d.style.display = '';
    if (t) t.style.display = 'none';
    if (bd) bd.style.background = 'rgba(10,132,255,.25)';
    if (bt) bt.style.background = 'rgba(255,255,255,.06)';
  }
}
async function loadTimeline() {
  const t = document.getElementById('timeline');
  if (!t) return;
  t.textContent = 'โหลด…';
  try {
    const log = await (await fetch('/api/devicelog')).json();
    t.innerHTML = log.length ? log.slice(0, 60).map(e => '<div class="row"><span><b>' + esc(e.name || '') + '</b> — ' + esc(e.detail || '') + '</span><span class="staleTag">' + new Date(e.t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + '</span></div>').join('') : 'ยังไม่มีเหตุการณ์';
  } catch (e) { t.textContent = 'โหลดไม่ได้'; }
}
async function showLog(id, name) {
  setText('mTitle', name);
  const mf = el('mFull');
  if (mf) mf.href = '/apps/2031674305368031282/log?device_id=' + id;
  const md = el('modal');
  if (md) md.style.display = 'block';
  setHtml('mBody', 'โหลด…');
  const row = (a, b, t) => '<div class="logrow"><span class="lval">' + esc(b) + '</span><div>' + esc(a) + '</div><div class="ltime">' + esc(t) + '</div></div>';
  try {
    const live = await (await fetch('/api/tuyalog?dev_id=' + id + '&hours=24')).json();
    if (Array.isArray(live) && live.length) {
      setHtml('mBody', live.map(e => row(e.event_name || e.dp_name || e.name || '?', e.event_detail ?? e.value ?? '', new Date(e.event_time || e.time || Date.now()).toLocaleString('th-TH'))).join(''));
      return;
    }
  } catch (e) {}
  try {
    const log = await (await fetch('/api/devicelog?dev_id=' + id)).json();
    setHtml('mBody', log.length ? log.map(e => row(e.detail, '', new Date(e.t).toLocaleString('th-TH'))).join('') : 'ยังไม่มีเหตุการณ์ตั้งแต่เริ่มจด (จดทุกครั้งที่สถานะเปลี่ยน)');
  } catch (e) { setText('mBody', 'โหลดไม่ได้'); }
}
let tickTimer = null, cd = 5, busy = false;
setInterval(() => { cd = Math.max(0, cd - 1); const e = el('cd'); if (e) e.textContent = 'รีเฟรชใน ' + cd + 'วิ'; }, 1000);
function manualRefresh() { cd = 5; tick(true); }
async function tick(manual) {
  if (busy) return;
  busy = true;
  try {
    setText('ver', 'js: ok ' + new Date().toLocaleTimeString('th-TH'));
    const r = await fetch('/api/devices');
    const d = await r.json();
    const p = d.power || {};
    const solarW = p.solar ? p.solar.acW : null;
    const homeW = p.meter ? p.meter.powerW : null;
    let gridTxt = '—', gridLbl = 'รอข้อมูล', gridCol = '#b6c2d3';
    let homeTxt = '—';
    if (solarW != null && homeW != null) {
      const grid = Math.round(homeW * 10) / 10, home = Math.round((solarW + homeW) * 10) / 10;
      gridTxt = Math.round(Math.abs(grid)) + ' W';
      gridLbl = grid <= 0 ? 'ขายกริด' : 'ดึงกริด';
      gridCol = grid <= 0 ? '#30d158' : '#0a84ff';
      homeTxt = Math.round(home) + ' W';
    }
    setHtml('live', '<span class="live"><span class="dot"></span>LIVE</span> <span class="staleTag">' + new Date(d.updatedAt).toLocaleTimeString('th-TH') + ' • ' + d.source + '</span> <span class="staleTag" id="cd">รีเฟรชใน 5วิ</span> <button onclick="manualRefresh()" style="background:rgba(10,132,255,.25);border:1px solid rgba(10,132,255,.5);color:#fff;border-radius:10px;min-height:32px;padding:0 10px;font-size:12px">รีเฟรช</button>');
    const ageMin = Math.floor((Date.now() - d.updatedAt) / 60000);
    setHtml('warn', ageMin >= 15 ? '<div class="panel" style="border-color:rgba(255,159,10,.5);margin-bottom:10px">ข้อมูลเก่า ' + ageMin + ' นาทีแล้ว — backend ยังไม่ได้รอบใหม่ กดรีเฟรชหน้านี้ไม่ช่วย ต้องป้อนข้อมูลใหม่</div>' : '');
    const solarTxt = solarW == null ? '—' : Math.round(solarW) + ' W';
    const gridDirExport = solarW != null && homeW != null && (homeW - solarW) <= 0;
    setHtml('flow', '<svg viewBox="0 0 360 132" style="width:100%;max-width:330px;height:auto;display:block;margin:0 auto" role="img" aria-label="energy flow">'
      + '<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#888" stroke-width="1.2"/></marker></defs>'
      + '<g stroke="#facc15" stroke-width="2" fill="none"><circle cx="45" cy="60" r="10"/><path d="M45,42v-6M45,78v6M27,60h-6M63,60h6M32,47l-4,-4M58,47l4,-4M32,73l-4,4M58,73l4,4"/></g>'
      + '<rect x="155" y="36" width="50" height="48" rx="10" fill="rgba(10,132,255,.12)" stroke="#0a84ff" stroke-width="2"/><path d="M168,62 L180,50 L192,62 V74 H168 Z" fill="none" stroke="#5eb0ff" stroke-width="2.5" stroke-linejoin="round"/>'
      + '<circle cx="315" cy="60" r="24" fill="rgba(48,209,88,.10)" stroke="#30d158" stroke-width="2"/><polygon points="318,46 307,63 314,63 311,74 323,55 316,55" fill="#30d158"/>'
      + '<line x1="72" y1="60" x2="150" y2="60" class="flowline" marker-end="url(#ah)"/>'
      + '<line x1="' + (gridDirExport ? 205 : 288) + '" y1="60" x2="' + (gridDirExport ? 288 : 205) + '" y2="60" class="flowline" marker-end="url(#ah)"/>'
      + '<text x="45" y="108" text-anchor="middle" fill="#facc15" font-weight="800" font-size="15">' + solarTxt + '</text><text x="45" y="124" text-anchor="middle" fill="#b6c2d3" font-size="10">โซล่า BFAD</text>'
      + '<text x="180" y="108" text-anchor="middle" fill="#fff" font-weight="800" font-size="15">' + homeTxt + '</text><text x="180" y="124" text-anchor="middle" fill="#b6c2d3" font-size="10">ใช้ในบ้าน</text>'
      + '<text x="315" y="108" text-anchor="middle" fill="' + gridCol + '" font-weight="800" font-size="15">' + gridTxt + '</text><text x="315" y="124" text-anchor="middle" fill="#b6c2d3" font-size="10">' + gridLbl + '</text></svg>'
      + (p.meter ? '<div class="staleTag">ไฟ ' + p.meter.voltage + 'V • กระแส ' + (p.meter.currentA != null ? p.meter.currentA + 'mA • PF ' + p.meter.pf : '—') + '<br>ใช้สะสม ' + p.meter.forwardKwh + ' kWh • ขายสะสม ' + p.meter.reverseKwh + ' kWh' + (p.solar ? ' • โซล่า ' + p.solar.temp + '°C' : '') + '</div><div id="costline" class="staleTag"></div>' : '<div class="staleTag">ค่า mock — รอข้อมูลมิเตอร์</div>'));
    const onGangs = d.devices.flatMap(x => x.gangs || []).filter(g => g.on).length;
    const offCount = d.devices.length - d.onCount;
    setText('devTitle', 'ออนไลน์ ' + d.onCount + ' • เปิดจริง ' + onGangs + ' ช่อง • ดับ ' + offCount);
    const iconFor = (x) => {
      if (!x.online) return '<span class="devicon off">○</span>';
      if (x.type === 'meter') return '<span class="devicon meter">≋</span>';
      if (x.type === 'solar') return '<span class="devicon solar">☀</span>';
      if (x.type === 'light') return '<span class="devicon solar">☼</span>';
      if ((x.gangs || []).some(g => g.on)) return '<span class="devicon sw">●</span>';
      return '<span class="devicon off">○</span>';
    };
    const sorted = [...d.devices].filter(x => x.type !== 'meter' && x.type !== 'solar').sort((a, b) => {
      const r = (x) => !x.online ? 3 : ((x.gangs || []).some(g => g.on) ? 1 : (x.gangs ? 2 : 1));
      return r(a) - r(b);
    });
    setHtml('devices', sorted.map(x => {
      const on = (x.gangs || []).filter(g => g.on).length;
      const badge = !x.online ? '<span class="pill off">offline</span>' : on > 0 ? '<span class="pill on">เปิด ' + on + '</span>' : (x.gangs ? '<span class="staleTag">ปิดหมด</span>' : '<span class="staleTag">online</span>');
      const gangs = (x.gangs || []).map(g => '<div class="row"><span class="gang">↳ ' + g.name + '</span><span class="tgl' + (g.on ? ' on' : '') + '"><i></i></span></div>').join('');
      return '<div class="panel devcard' + (!x.online ? ' dim' : '') + '" onclick="showLog(\'' + x.id + '\',\'' + x.name.replace(/'/g, '') + '\')" style="cursor:pointer"><div class="row dev devhead">' + iconFor(x) + '<span style="flex:1">' + x.name + '<br><span class="staleTag">' + x.room + '</span></span>' + badge + '</div>' + gangs + '</div>';
    }).join(''));
    try {
      const c = await (await fetch('/api/cost')).json();
      const el = document.getElementById('costline');
      if (el && (c.kwh > 0 || c.points > 0)) el.innerHTML = 'วันนี้ใช้ ' + c.kwh + ' kWh ≈ ฿' + c.thb + ' <span class="staleTag">(TOU โดยประมาณ ไม่รวม Ft/VAT)</span>';
    } catch {}
    try {
      const st = await (await fetch('/api/status')).json();
      if (st.loginNeeded) {
        setHtml('qrbox', '<div class="panel" style="border-color:rgba(255,159,10,.5);margin-bottom:10px;text-align:center">เชื่อมต่อ Tuya หลุด — เปิดแอป Smart Life สแกน QR นี้<br><span class="staleTag">QR เปลี่ยนทุกครั้งที่โหลด ถ้าสแกนไม่ทันให้รีเฟรช</span><img src="/api/qr?t=' + Date.now() + '" style="max-width:220px;display:block;margin:8px auto;border-radius:12px"></div>');
      } else if (st.autoError && ageMin >= 5) {
        setHtml('qrbox', '<div class="panel" style="margin-bottom:10px;text-align:center">ดึงข้อมูลอัตโนมัติขัดข้อง (' + esc(st.autoError.message) + ') — กำลังลองใหม่เอง</div>');
      } else {
        setHtml('qrbox', '');
      }
    } catch {}
  } catch (e) {
    setHtml('live', '<span class="pill off">หลุด — กำลังต่อใหม่</span> <button onclick="manualRefresh()" style="background:rgba(10,132,255,.25);border:1px solid rgba(10,132,255,.5);color:#fff;border-radius:10px;min-height:32px;padding:0 10px;font-size:12px">รีเฟรช</button>');
    try { fetch('/api/clientlog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg: String((e && e.message) || e), url: location.href }) }); } catch {}
  }
  busy = false;
  clearTimeout(tickTimer);
  cd = 5;
  tickTimer = setTimeout(tick, 5000);
  setTimeout(() => document.body.classList.add('seen'), 800);
}
tick();
