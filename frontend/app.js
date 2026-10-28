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
  let cloudHtml = '';
  try {
    const live = await (await fetch('/api/tuyalog?dev_id=' + id + '&hours=168')).json();
    if (Array.isArray(live) && live.length) {
      cloudHtml = '<div class="staleTag" style="margin:4px 0">Tuya ย้อนหลัง 7 วัน (' + live.length + ')</div>' + live.slice(0, 200).map(e => row(e.event_name || e.dp_name || e.name || '?', e.event_detail ?? e.value ?? '', new Date(e.event_time || e.time || Date.now()).toLocaleString('th-TH'))).join('');
    }
  } catch (e) {}
  try {
    const log = await (await fetch('/api/devicelog?dev_id=' + id)).json();
    const localHtml = Array.isArray(log) && log.length
      ? '<div class="staleTag" style="margin:8px 0 4px">เครื่องนี้จดเอง (' + log.length + ')</div>' + log.slice(0, 200).map(e => row(e.detail, '', new Date(e.t).toLocaleString('th-TH'))).join('')
      : '';
    if (cloudHtml || localHtml) setHtml('mBody', cloudHtml + localHtml);
    else setHtml('mBody', 'ยังไม่มีเหตุการณ์ตั้งแต่เริ่มจด (จดทุกครั้งที่สถานะเปลี่ยน)');
  } catch (e) {
    if (cloudHtml) setHtml('mBody', cloudHtml);
    else setText('mBody', 'โหลดไม่ได้');
  }
  setHtml('mBody', document.getElementById('mBody').innerHTML + '<div style="margin-top:12px;border-top:1px solid rgba(255,255,255,.1);padding-top:8px"><div class="staleTag">แก้ชื่อสวิตช์ (ต้องตรงช่องจริง กดบันทึกแล้วจะใช้ชื่อใหม่ทันที)</div><div id="nameEdit"></div><button onclick="saveNames(\'' + id + '\')" style="background:rgba(10,132,255,.25);border:1px solid rgba(10,132,255,.5);color:#fff;border-radius:10px;min-height:40px;padding:0 14px;margin-top:8px">บันทึกชื่อ</button></div>');
  try {
    const g = await (await fetch('/api/gangnames?dev_id=' + id)).json();
    const names = g.names || [];
    const n = Math.max(names.length, 8);
    let html = '';
    for (let i = 0; i < Math.min(names.length || 4, 8); i++) html += '<input data-gang="' + i + '" value="' + esc(names[i] || '') + '" placeholder="ช่อง ' + (i + 1) + '" style="width:100%;margin:4px 0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:8px;color:#e2e8f0;padding:8px;min-height:40px">';
    document.getElementById('nameEdit').innerHTML = html || '<div class="staleTag">อุปกรณ์นี้ไม่มีสวิตช์ย่อย</div>';
  } catch {}
}

async function saveNames(id) {
  const inputs = Array.from(document.querySelectorAll('#nameEdit input'));
  const names = inputs.map(i => i.value.trim()).filter((v, i, a) => v !== '' || i < a.length);
  while (names.length && names[names.length - 1] === '') names.pop();
  const r = await (await fetch('/api/gangnames', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, names }) })).json();
  alert(r.names ? 'บันทึกแล้ว: ' + r.names.join(', ') : 'บันทึกไม่สำเร็จ');
  tick(true);
}
let tickTimer = null, cd = 5, busy = false;
setInterval(() => { cd = Math.max(0, cd - 1); const e = el('cd'); if (e) e.textContent = 'รีเฟรชใน ' + cd + 'วิ'; }, 1000);
function manualRefresh() { cd = 5; tick(true); }
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
async function togglePush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { alert('เบราว์เซอร์นี้ไม่รองรับ push'); return; }
    const reg = await navigator.serviceWorker.register('/sw.js');
    const ready = await navigator.serviceWorker.ready;
    let sub = await ready.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      const b = document.getElementById('bellBtn');
      if (b) b.textContent = '🔕';
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { alert('ต้องอนุญาต notification ก่อน'); return; }
    const { publicKey } = await (await fetch('/api/vapid-pubkey')).json();
    if (!publicKey) { alert('server ยังไม่มี VAPID key (รัน backend ใหม่แล้วลองอีกที)'); return; }
    sub = await ready.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
    const b = document.getElementById('bellBtn');
    if (b) b.textContent = '🔔';
    alert('เปิดแจ้งเตือนแล้ว');
  } catch (e) { alert('สมัครไม่สำเร็จ: ' + (e && e.message ? e.message : e)); }
}
function wxCollapsed() {
  try { return localStorage.getItem('wxhourCollapsed') !== '0'; } catch { return true; }
}
async function toggleWxHour() {
  try {
    const v = wxCollapsed() ? '0' : '1';
    localStorage.setItem('wxhourCollapsed', v);
    const card = document.getElementById('wxhour');
    const strip = card ? card.querySelector('.wxstrip') : null;
    const arrow = document.getElementById('wxarrow');
    if (strip) strip.style.display = v === '1' ? 'none' : '';
    if (arrow) arrow.textContent = v === '1' ? '▸' : '▾';
  } catch {}
}
async function tick(manual) {
  if (busy) return;
  busy = true;
  try {
    setText('ver', 'js: ok ' + new Date().toLocaleTimeString('th-TH'));
    const r = await fetch('/api/devices');
    const d = await r.json();
    const [w, c] = await Promise.all([
      fetch('/api/weather').then((x) => x.json()).catch(() => null),
      fetch('/api/cost').then((x) => x.json()).catch(() => null),
    ]);
    const tempPill = (t) => t == null ? '' : '<span class="pill ' + (t >= 60 ? 'hot' : t >= 50 ? 'warm' : 'cool') + '">โซล่า ' + t + '°C</span>';
    const wxIcon = (code) => {
      const sunFull = '<circle cx="12" cy="12" r="5" fill="none" stroke="#facc15" stroke-width="2"/><path d="M12,2v3M12,19v3M2,12h3M19,12h3M4.6,4.6l2.1,2.1M17.3,17.3l2.1,2.1M19.4,4.6l-2.1,2.1M6.7,17.3l-2.1,2.1" stroke="#facc15" stroke-width="1.6" stroke-linecap="round"/>';
      const sunSmall = '<circle cx="9" cy="9" r="3.5" fill="none" stroke="#facc15" stroke-width="1.8"/><path d="M9,1.5v2M9,14.5v2M1.5,9h2M14.5,9h2M3.8,3.8l1.4,1.4M12.8,12.8l1.4,1.4M14.2,3.8l-1.4,1.4M5.2,12.8l-1.4,1.4" stroke="#facc15" stroke-width="1.4" stroke-linecap="round"/>';
      const cloud = '<path d="M7,18.5 a4,4 0 0,1 .7,-7.9 A5.5,5.5 0 0,1 18.2,9.2 4.1,4.1 0 0,1 18,17.5 Z" fill="rgba(182,194,211,.16)" stroke="#b6c2d3" stroke-width="1.8" stroke-linejoin="round" transform="translate(0,-1)"/>';
      const rain = '<path d="M8.5,18.5 l-1.2,3 M12.5,18.5 l-1.2,3 M16.5,18.5 l-1.2,3" stroke="#5eb0ff" stroke-width="1.8" stroke-linecap="round"/>';
      const bolt = '<polygon points="13,12 8.5,18.5 12,18.5 11,23 16.5,15.5 13,15.5" fill="#ff9f0a"/>';
      const snow = '<circle cx="9" cy="19.5" r="1.1" fill="#cfe6ff"/><circle cx="13" cy="20.5" r="1.1" fill="#cfe6ff"/><circle cx="17" cy="19.5" r="1.1" fill="#cfe6ff"/>';
      const fog = '<path d="M7,18.5h10 M8.5,21h9" stroke="#b6c2d3" stroke-width="1.8" stroke-linecap="round"/>';
      let inner = cloud;
      if (code === 0 || code === 1) inner = sunFull;
      else if (code === 2) inner = sunSmall + cloud;
      else if (code === 45 || code === 48) inner = cloud + fog;
      else if ([51, 53, 55, 56, 57].includes(code)) inner = cloud + snow;
      else if ([71, 73, 75, 77, 85, 86].includes(code)) inner = cloud + snow;
      else if ([95, 96, 99].includes(code)) inner = cloud + bolt;
      else if (code !== 3) inner = cloud;
      if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) inner = cloud + rain;
      return '<svg viewBox="0 0 24 24" width="20" height="20" role="img" aria-hidden="true">' + inner + '</svg>';
    };
    const wxHtml = w && typeof w.tempC === 'number'
      ? 'บางแคเหนือ ' + w.tempC + '°C'
      : (document.getElementById('wxline') ? document.getElementById('wxline').innerHTML : '');
    const costHtml = c
      ? 'วันนี้ใช้ ' + (c.kwh || 0) + ' kWh ≈ ฿' + (c.thb || 0) + ' • โซล่าผลิต ' + (c.solarKwh || 0) + ' kWh ≈ ฿' + (c.savedThb || 0) + ' <span class="staleTag">(เรท 5 บาท/หน่วย ไม่รวม Ft/VAT)</span>'
      : (document.getElementById('costline') ? document.getElementById('costline').innerHTML : '');
    const wxHourHtml = (w && Array.isArray(w.hours) && w.hours.length)
      ? '<div class="wxhead" onclick="toggleWxHour()"><span class="staleTag">พยากรณ์รายชั่วโมง • บางแคเหนือ</span><span id="wxarrow" class="staleTag">' + (wxCollapsed() ? '▸' : '▾') + '</span></div><div class="wxstrip"' + (wxCollapsed() ? ' style="display:none"' : '') + '>' + w.hours.map((hh) => {
          const isNow = !!hh.now;
          const lbl = isNow ? 'ตอนนี้' : new Date(hh.t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          const pr = hh.precip != null && hh.precip >= 20 ? '<div class="wxpr">' + hh.precip + '%</div>' : '';
          return '<div class="wxh' + (isNow ? ' now' : '') + '"><div class="wxt">' + lbl + '</div>' + wxIcon(hh.code) + '<div class="wxv">' + (hh.tempC == null ? '—' : Math.round(hh.tempC) + '°') + '</div>' + pr + '</div>';
        }).join('') + '</div>'
      : (document.getElementById('wxhour') ? document.getElementById('wxhour').innerHTML : '');
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
      + (p.meter ? '<div class="staleTag">ไฟ ' + p.meter.voltage + 'V • กระแส ' + (p.meter.currentA != null ? p.meter.currentA + 'mA • PF ' + p.meter.pf : '—') + '<br>ใช้สะสม ' + p.meter.forwardKwh + ' kWh • ขายสะสม ' + p.meter.reverseKwh + ' kWh' + (p.solar && p.solar.temp != null ? ' • ' + tempPill(p.solar.temp) + (p.solar.temp >= 60 ? ' <b style="color:#ff453a">ร้อนจัด!</b>' : '') : '') + '</div>' : '<div class="staleTag">ค่า mock — รอข้อมูลมิเตอร์</div>') + '<div id="costline" class="staleTag">' + costHtml + '</div><div id="wxline" class="staleTag">' + wxHtml + '</div><div id="wxhour" class="wxcard">' + wxHourHtml + '</div>');
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
