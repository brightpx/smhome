async function showLog(id, name) {
  document.getElementById('mTitle').textContent = name;
  document.getElementById('mFull').href = '/apps/2031674305368031282/log?device_id=' + id;
  document.getElementById('modal').style.display = 'block';
  document.getElementById('mBody').textContent = 'โหลด…';
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const row = (a, b, t) => '<div class="logrow"><span class="lval">' + esc(b) + '</span><div>' + esc(a) + '</div><div class="ltime">' + esc(t) + '</div></div>';
  try {
    const live = await (await fetch('/api/tuyalog?dev_id=' + id + '&hours=24')).json();
    if (Array.isArray(live) && live.length) {
      document.getElementById('mBody').innerHTML = live.map(e => row(e.event_name || e.dp_name || e.name || '?', e.event_detail ?? e.value ?? '', new Date(e.event_time || e.time || Date.now()).toLocaleString('th-TH'))).join('');
      return;
    }
  } catch (e) {}
  try {
    const log = await (await fetch('/api/devicelog?dev_id=' + id)).json();
    document.getElementById('mBody').innerHTML = log.length ? log.map(e => row(e.detail, '', new Date(e.t).toLocaleString('th-TH'))).join('') : 'ยังไม่มีเหตุการณ์ตั้งแต่เริ่มจด (จดทุกครั้งที่สถานะเปลี่ยน)';
  } catch (e) { document.getElementById('mBody').textContent = 'โหลดไม่ได้'; }
}
let tickTimer = null, cd = 5, busy = false;
setInterval(() => { cd = Math.max(0, cd - 1); const el = document.getElementById('cd'); if (el) el.textContent = 'รีเฟรชใน ' + cd + 'วิ'; }, 1000);
function manualRefresh() { cd = 5; tick(true); }
async function tick(manual) {
  if (busy) return;
  busy = true;
  try {
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    document.getElementById('ver').textContent = 'js: ok ' + new Date().toLocaleTimeString('th-TH');
    const r = await fetch('/api/devices');
    const d = await r.json();
    const p = d.power || {};
    const solarW = p.solar ? p.solar.acW : null;
    const homeW = p.meter ? p.meter.powerW : null;
    let gridTxt = '—', gridLbl = 'รอข้อมูล', gridCol = '#b6c2d3';
    if (solarW != null && homeW != null) {
      const grid = Math.round((homeW - solarW) * 10) / 10;
      gridTxt = Math.round(Math.abs(grid)) + ' W';
      gridLbl = grid <= 0 ? 'ขายกริด' : 'ดึงกริด';
      gridCol = grid <= 0 ? '#30d158' : '#0a84ff';
    }
    document.getElementById('live').innerHTML = '<span class="live"><span class="dot"></span>LIVE</span> <span class="staleTag">' + new Date(d.updatedAt).toLocaleTimeString('th-TH') + ' • ' + d.source + '</span> <span class="staleTag" id="cd">รีเฟรชใน 5วิ</span> <button onclick="manualRefresh()" style="background:rgba(10,132,255,.25);border:1px solid rgba(10,132,255,.5);color:#fff;border-radius:10px;min-height:32px;padding:0 10px;font-size:12px">รีเฟรช</button>';
    const ageMin = Math.floor((Date.now() - d.updatedAt) / 60000);
    const staleBanner = ageMin >= 15 ? '<div class="panel" style="border-color:rgba(255,159,10,.5);margin-bottom:10px">ข้อมูลเก่า ' + ageMin + ' นาทีแล้ว — backend ยังไม่ได้รอบใหม่ กดรีเฟรชหน้านี้ไม่ช่วย ต้องป้อนข้อมูลใหม่</div>' : '';
    document.getElementById('warn').innerHTML = staleBanner;
    const solarTxt = solarW == null ? '—' : Math.round(solarW) + ' W';
    const homeTxt = homeW == null ? '—' : Math.round(homeW) + ' W';
    const gridDirExport = solarW != null && homeW != null && (homeW - solarW) <= 0;
    document.getElementById('flow').innerHTML = '<svg viewBox="0 0 360 132" style="width:100%;max-width:330px;height:auto;display:block;margin:0 auto" role="img" aria-label="energy flow">'
      + '<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#888" stroke-width="1.2"/></marker></defs>'
      + '<circle cx="45" cy="60" r="24" fill="rgba(250,204,21,.15)" stroke="#facc15" stroke-width="2"/><text x="45" y="66" text-anchor="middle" font-size="18">☀</text>'
      + '<rect x="155" y="36" width="50" height="48" rx="10" fill="rgba(10,132,255,.12)" stroke="#0a84ff" stroke-width="2"/><text x="180" y="64" text-anchor="middle" font-size="20">⌂</text>'
      + '<circle cx="315" cy="60" r="24" fill="rgba(48,209,88,.10)" stroke="#30d158" stroke-width="2"/><text x="315" y="66" text-anchor="middle" font-size="18">⚡</text>'
      + '<line x1="72" y1="60" x2="150" y2="60" class="flowline" marker-end="url(#ah)"/>'
      + '<line x1="' + (gridDirExport ? 205 : 288) + '" y1="60" x2="' + (gridDirExport ? 288 : 205) + '" y2="60" class="flowline" marker-end="url(#ah)"/>'
      + '<text x="45" y="108" text-anchor="middle" fill="#facc15" font-weight="800" font-size="15">' + solarTxt + '</text><text x="45" y="124" text-anchor="middle" fill="#b6c2d3" font-size="10">โซล่า BFAD</text>'
      + '<text x="180" y="108" text-anchor="middle" fill="#fff" font-weight="800" font-size="15">' + homeTxt + '</text><text x="180" y="124" text-anchor="middle" fill="#b6c2d3" font-size="10">ใช้ในบ้าน</text>'
      + '<text x="315" y="108" text-anchor="middle" fill="' + gridCol + '" font-weight="800" font-size="15">' + gridTxt + '</text><text x="315" y="124" text-anchor="middle" fill="#b6c2d3" font-size="10">' + gridLbl + '</text></svg>'
      + (p.meter ? '<div class="staleTag">ไฟ ' + p.meter.voltage + 'V • กระแส ' + (p.meter.currentA != null ? p.meter.currentA + 'mA • PF ' + p.meter.pf : '—') + '<br>ใช้สะสม ' + p.meter.forwardKwh + ' kWh • ขายสะสม ' + p.meter.reverseKwh + ' kWh' + (p.solar ? ' • โซล่า ' + p.solar.temp + '°C' : '') + '</div>' : '<div class="staleTag">ค่า mock — รอข้อมูลมิเตอร์</div>');
    const onGangs = d.devices.flatMap(x => x.gangs || []).filter(g => g.on).length;
    const offCount = d.devices.length - d.onCount;
    document.getElementById('devTitle').textContent = 'ออนไลน์ ' + d.onCount + ' • เปิดจริง ' + onGangs + ' ช่อง • ดับ ' + offCount;
    const order = { meter: 0, solar: 0 };
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
    document.getElementById('devices').innerHTML = sorted.map(x => {
      const on = (x.gangs || []).filter(g => g.on).length;
      const badge = !x.online ? '<span class="pill off">offline</span>' : on > 0 ? '<span class="pill on">เปิด ' + on + '</span>' : (x.gangs ? '<span class="staleTag">ปิดหมด</span>' : '<span class="staleTag">online</span>');
      const gangs = (x.gangs || []).map(g => '<div class="row"><span class="gang">↳ ' + g.name + '</span><span class="tgl' + (g.on ? ' on' : '') + '"><i></i></span></div>').join('');
      const extra = !x.gangs ? (x.type === 'meter' && p.meter ? '<div class="row"><span class="gang">↳ กำลังไฟ</span><span>' + p.meter.powerW + ' W</span></div>' : x.type === 'solar' && p.solar ? '<div class="row"><span class="gang">↳ ผลิต</span><span>' + p.solar.acW + ' W</span></div>' : '') : '';
      return '<div class="panel devcard' + (!x.online ? ' dim' : '') + '" onclick="showLog(\'' + x.id + '\',\'' + x.name.replace(/'/g, '') + '\')" style="cursor:pointer"><div class="row dev devhead">' + iconFor(x) + '<span style="flex:1">' + x.name + '<br><span class="staleTag">' + x.room + '</span></span>' + badge + '</div>' + gangs + extra + '</div>';
    }).join('');
    try {
      const st = await (await fetch('/api/status')).json();
      if (st.loginNeeded) {
        document.getElementById('qrbox').innerHTML = '<div class="panel" style="border-color:rgba(255,159,10,.5);margin-bottom:10px;text-align:center">เชื่อมต่อ Tuya หลุด — เปิดแอป Smart Life สแกน QR นี้<br><span class="staleTag">QR เปลี่ยนทุกครั้งที่โหลด ถ้าสแกนไม่ทันให้รีเฟรช</span><img src="/api/qr?t=' + Date.now() + '" style="max-width:220px;display:block;margin:8px auto;border-radius:12px"></div>';
      } else if (st.autoError && ageMin >= 5) {
        document.getElementById('qrbox').innerHTML = '<div class="panel" style="margin-bottom:10px;text-align:center">ดึงข้อมูลอัตโนมัติขัดข้อง (' + esc(st.autoError.message) + ') — กำลังลองใหม่เอง</div>';
      } else {
        document.getElementById('qrbox').innerHTML = '';
      }
    } catch {}
  } catch (e) {
    const msg = 'โหลดไม่เข้า: ' + (e && e.message ? e.message : e);
    document.getElementById('live').innerHTML = '<span class="pill off">หลุด — กำลังต่อใหม่</span> <button onclick="manualRefresh()" style="background:rgba(10,132,255,.25);border:1px solid rgba(10,132,255,.5);color:#fff;border-radius:10px;min-height:32px;padding:0 10px;font-size:12px">รีเฟรช</button>';
    document.getElementById('warn').innerHTML = '<div class="panel" style="border-color:rgba(255,69,58,.5)">' + msg + ' • เปิดด้วย http://127.0.0.1:3001/ นะ ไม่ใช่ไฟล์</div>';
    try { fetch('/api/clientlog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg, url: location.href }) }); } catch {}
  }
  busy = false;
  clearTimeout(tickTimer);
  cd = 5;
  tickTimer = setTimeout(tick, 5000);
  setTimeout(() => document.body.classList.add('seen'), 800);
}
tick();
