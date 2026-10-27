async function tick() {
  try {
    const r = await fetch('/api/devices');
    const d = await r.json();
    const p = d.power || {};
    const solarW = p.solar ? p.solar.acW : null;
    const homeW = p.meter ? p.meter.powerW : null;
    const solar = solarW == null ? '—' : (solarW / 1000).toFixed(2) + '<small>kW</small>';
    const home = homeW == null ? '—' : (homeW / 1000).toFixed(2) + '<small>kW</small>';
    let gridTxt = '—', gridLbl = 'รอข้อมูล', gridCol = '#b6c2d3';
    if (solarW != null && homeW != null) {
      const grid = Math.round((homeW - solarW) * 10) / 10;
      gridTxt = (Math.abs(grid) / 1000).toFixed(2) + '<small>kW</small>';
      gridLbl = grid <= 0 ? 'ขายกริด' : 'ดึงกริด';
      gridCol = grid <= 0 ? '#30d158' : '#0a84ff';
    }
    document.getElementById('live').innerHTML = '<span class="live"><span class="dot"></span>LIVE</span> <span class="staleTag">' + new Date(d.updatedAt).toLocaleTimeString('th-TH') + ' • ' + d.source + '</span>';
    document.getElementById('flow').innerHTML = '<div class="flowNums"><div><div class="v" style="color:#facc15">' + solar + '</div><div class="staleTag">โซล่า BFAD</div></div><div class="arr">→</div><div><div class="v">' + home + '</div><div class="staleTag">ใช้ในบ้าน</div></div><div class="arr">→</div><div><div class="v" style="color:' + gridCol + '">' + gridTxt + '</div><div class="staleTag">' + gridLbl + '</div></div></div>' + (p.meter ? '<div class="staleTag">ไฟ ' + p.meter.voltage + 'V • ใช้สะสม ' + p.meter.forwardKwh + ' kWh • โซล่าสะสม ' + p.solar.totalKwh + ' kWh</div>' : '<div class="staleTag">ค่า mock — รอข้อมูลมิเตอร์</div>') + '<div id="chart" class="staleTag">โหลดกราฟ…</div>';
    const rooms = {};
    d.devices.filter(x => x.online).forEach(x => { (rooms[x.room] = rooms[x.room] || []).push(x); });
    const onGangs = d.devices.flatMap(x => x.gangs || []).filter(g => g.on).length;
    document.getElementById('devTitle').textContent = 'ออนไลน์ ' + d.onCount + ' • เปิดจริง ' + onGangs + ' ช่อง • ดับ ' + (d.devices.length - d.onCount);
    document.getElementById('devices').innerHTML = Object.keys(rooms).map(room => '<div class="room">' + room + ' <span class="staleTag">' + rooms[room].length + ' ตัว</span></div>' + rooms[room].map(x => {
      const head = '<div class="row dev"><span>' + x.name + '</span><span class="staleTag">online</span></div>';
      const gangs = (x.gangs || []).map(g => '<div class="row"><span class="gang">↳ ' + g.name + '</span>' + (g.on ? '<span class="pill on">เปิด</span>' : '<span class="staleTag">ปิด</span>') + '</div>').join('');
      const extra = !x.gangs ? (x.type === 'meter' && p.meter ? '<div class="row"><span class="gang">↳ กำลังไฟ</span><span>' + p.meter.powerW + ' W</span></div>' : x.type === 'solar' && p.solar ? '<div class="row"><span class="gang">↳ ผลิต</span><span>' + p.solar.acW + ' W</span></div>' : '<div class="row"><span class="gang">↳ สถานะสวิตช์</span><span class="staleTag">ไม่ยืนยัน</span></div>') : '';
      return head + gangs + extra;
    }).join('')).join('');
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
  } catch (e) {
    document.getElementById('live').innerHTML = '<span class="pill off">หลุด — กำลังต่อใหม่</span>';
  }
  setTimeout(tick, 5000);
}
tick();
