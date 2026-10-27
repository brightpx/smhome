async function tick() {
  try {
    const r = await fetch('/api/devices');
    const d = await r.json();
    const p = d.power || {};
    const solarW = p.solar ? p.solar.acW : null;
    const homeW = p.meter ? p.meter.powerW : null;
    const solar = solarW == null ? '—' : Math.round(solarW) + '<small>W</small>';
    const home = homeW == null ? '—' : (homeW / 1000).toFixed(2) + '<small>kW</small>';
    let gridTxt = '—', gridLbl = 'รอข้อมูล', gridCol = '#b6c2d3';
    if (solarW != null && homeW != null) {
      const grid = Math.round((homeW - solarW) * 10) / 10;
      gridTxt = (Math.abs(grid) / 1000).toFixed(2) + '<small>kW</small>';
      gridLbl = grid <= 0 ? 'ขายกริด' : 'ดึงกริด';
      gridCol = grid <= 0 ? '#30d158' : '#0a84ff';
    }
    document.getElementById('live').innerHTML = '<span class="live"><span class="dot"></span>LIVE</span> <span class="staleTag">' + new Date(d.updatedAt).toLocaleTimeString('th-TH') + ' • ' + d.source + '</span>';
    const ageMin = Math.floor((Date.now() - d.updatedAt) / 60000);
    const staleBanner = ageMin >= 15 ? '<div class="panel" style="border-color:rgba(255,159,10,.5);margin-bottom:10px">ข้อมูลเก่า ' + ageMin + ' นาทีแล้ว — backend ยังไม่ได้รอบใหม่ กดรีเฟรชหน้านี้ไม่ช่วย ต้องป้อนข้อมูลใหม่</div>' : '';
    document.getElementById('warn').innerHTML = staleBanner;
    document.getElementById('flow').innerHTML = '<div class="flowNums"><div><div class="v" style="color:#facc15">' + solar + '</div><div class="staleTag">โซล่า BFAD</div></div><div class="arr">→</div><div><div class="v">' + home + '</div><div class="staleTag">ใช้ในบ้าน</div></div><div class="arr">→</div><div><div class="v" style="color:' + gridCol + '">' + gridTxt + '</div><div class="staleTag">' + gridLbl + '</div></div></div>' + (p.meter ? '<div class="staleTag">ไฟ ' + p.meter.voltage + 'V • ใช้สะสม ' + p.meter.forwardKwh + ' kWh • โซล่าสะสม ' + p.solar.totalKwh + ' kWh</div>' : '<div class="staleTag">ค่า mock — รอข้อมูลมิเตอร์</div>') + '<div id="chart" class="staleTag">โหลดกราฟ…</div>';
    const onGangs = d.devices.flatMap(x => x.gangs || []).filter(g => g.on).length;
    const offCount = d.devices.length - d.onCount;
    document.getElementById('devTitle').textContent = 'ออนไลน์ ' + d.onCount + ' • เปิดจริง ' + onGangs + ' ช่อง • ดับ ' + offCount;
    const order = { meter: 0, solar: 0 };
    const sorted = [...d.devices].sort((a, b) => {
      const r = (x) => !x.online ? 3 : (x.type === 'meter' || x.type === 'solar') ? 0 : ((x.gangs || []).some(g => g.on) ? 1 : (x.gangs ? 2 : 1));
      return r(a) - r(b);
    });
    document.getElementById('devices').innerHTML = sorted.map(x => {
      const on = (x.gangs || []).filter(g => g.on).length;
      const badge = !x.online ? '<span class="pill off">offline</span>' : on > 0 ? '<span class="pill on">เปิด ' + on + '</span>' : (x.gangs ? '<span class="staleTag">ปิดหมด</span>' : '<span class="staleTag">online</span>');
      const gangs = (x.gangs || []).map(g => '<div class="row"><span class="gang">↳ ' + g.name + '</span>' + (g.on ? '<span class="pill on">เปิด</span>' : '<span class="staleTag">ปิด</span>') + '</div>').join('');
      const extra = !x.gangs ? (x.type === 'meter' && p.meter ? '<div class="row"><span class="gang">↳ กำลังไฟ</span><span>' + p.meter.powerW + ' W</span></div>' : x.type === 'solar' && p.solar ? '<div class="row"><span class="gang">↳ ผลิต</span><span>' + p.solar.acW + ' W</span></div>' : '') : '';
      return '<div class="panel devcard' + (!x.online ? ' dim' : '') + '"><div class="row dev"><span>' + x.name + '</span>' + badge + '</div><div class="staleTag">' + x.room + '</div>' + gangs + extra + '</div>';
    }).join('');
    try {
      const h = await (await fetch('/api/history')).json();
      const el = document.getElementById('chart');
      if (el && h.length) {
        const last = h.slice(-24);
        const max = Math.max.apply(null, last.map(e => e.meterW || 0).concat([1]));
        el.innerHTML = 'ใช้ไฟ 2 ชม.ล่าสุด: <span class="bars">' + last.map(e => '<i style="height:' + Math.max(2, Math.round((e.meterW || 0) / max * 28)) + 'px" title="' + e.meterW + 'W"></i>').join('') + '</span> <span class="staleTag">' + h.length + ' จุด</span>';
      } else if (el) {
        el.textContent = 'เริ่มจดประวัติแล้ว กราฟจะขึ้นเมื่อมีข้อมูล';
      }
    } catch {}
    try {
      const st = await (await fetch('/api/status')).json();
      document.getElementById('qrbox').innerHTML = st.loginNeeded ? '<div class="panel" style="border-color:rgba(255,159,10,.5);margin-bottom:10px;text-align:center">เชื่อมต่อ Tuya หลุด — เปิดแอป Smart Life สแกน QR นี้<img src="/api/qr?t=' + Date.now() + '" style="max-width:220px;display:block;margin:8px auto;border-radius:12px"></div>' : '';
    } catch {}
  } catch (e) {
    const msg = 'โหลดไม่เข้า: ' + (e && e.message ? e.message : e);
    document.getElementById('live').innerHTML = '<span class="pill off">หลุด — กำลังต่อใหม่</span>';
    document.getElementById('warn').innerHTML = '<div class="panel" style="border-color:rgba(255,69,58,.5)">' + msg + ' • เปิดด้วย http://127.0.0.1:3001/ นะ ไม่ใช่ไฟล์</div>';
    try { fetch('/api/clientlog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg, url: location.href }) }); } catch {}
  }
  setTimeout(tick, 5000);
  setTimeout(() => document.body.classList.add('seen'), 800);
}
tick();
