async function tick() {
  try {
    const r = await fetch('/api/devices');
    const d = await r.json();
    const stale = d.source === 'mock';
    const p = d.power || {};
    const solar = p.solar ? p.solar.acW / 1000 : 2.4;
    const home = p.meter ? p.meter.powerW / 1000 : 1.8;
    const grid = Math.round((home - solar) * 100) / 100;
    document.getElementById('live').innerHTML = '<span class="live"><span class="dot"></span>LIVE</span> <span class="staleTag">' + new Date(d.updatedAt).toLocaleTimeString('th-TH') + ' • ' + d.source + '</span>';
    document.getElementById('flow').innerHTML = '<div class="flowNums"><div><div class="v" style="color:#facc15">' + solar.toFixed(2) + 'kW</div><div class="staleTag">โซล่า BFAD</div></div><div>→</div><div><div class="v">' + home.toFixed(2) + 'kW</div><div class="staleTag">ใช้ Smart Meter</div></div><div>→</div><div><div class="v" style="color:' + (grid <= 0 ? '#30d158' : '#0a84ff') + '">' + Math.abs(grid).toFixed(2) + 'kW</div><div class="staleTag">' + (grid <= 0 ? 'ขายกริด' : 'ดึงกริด') + '</div></div></div>' + (p.meter ? '<div class="staleTag">ไฟ ' + p.meter.voltage + 'V • ใช้สะสม ' + p.meter.forwardKwh + 'kWh • โซล่าสะสม ' + p.solar.totalKwh + 'kWh</div>' : '<div class="staleTag">ค่า mock — รอข้อมูลมิเตอร์</div>');
    const rooms = {};
    d.devices.filter(x => x.online).forEach(x => { (rooms[x.room] = rooms[x.room] || []).push(x); });
    const onGangs = d.devices.flatMap(x => x.gangs || []).filter(g => g.on).length;
    document.getElementById('devTitle').textContent = 'ออนไลน์ ' + d.onCount + ' • เปิดจริง ' + onGangs + ' ช่อง • ดับ ' + (d.devices.length - d.onCount);
    document.getElementById('devices').innerHTML = Object.keys(rooms).map(room => '<div class="room">' + room + '</div>' + rooms[room].map(x => {
      const head = '<div class="row"><span>' + x.name + '</span><span class="staleTag">online</span></div>';
      const gangs = (x.gangs || []).map(g => '<div class="row"><span style="padding-left:12px">↳ ' + g.name + '</span><span class="pill ' + (g.on ? 'on">ON' : 'off">OFF') + '</span></div>').join('');
      const extra = !x.gangs ? (x.type === 'meter' && p.meter ? '<div class="row"><span style="padding-left:12px">↳ กำลังไฟ</span><span>' + p.meter.powerW + 'W</span></div>' : x.type === 'solar' && p.solar ? '<div class="row"><span style="padding-left:12px">↳ ผลิต</span><span>' + p.solar.acW + 'W</span></div>' : '<div class="row"><span style="padding-left:12px">↳ สถานะสวิตช์</span><span class="staleTag">ไม่ยืนยัน</span></div>') : '';
      return head + gangs + extra;
    }).join('')).join('');
  } catch (e) {
    document.getElementById('live').innerHTML = '<span class="pill off">หลุด — กำลังต่อใหม่</span>';
  }
  setTimeout(tick, 5000);
}
tick();
