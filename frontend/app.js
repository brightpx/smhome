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
    document.getElementById('devTitle').textContent = 'เปิดอยู่ ' + d.onCount + ' • ดับ ' + (d.devices.length - d.onCount);
    document.getElementById('devices').innerHTML = Object.keys(rooms).map(room => '<div class="room">' + room + '</div>' + rooms[room].map(x => '<div class="row"><span>' + x.name + '</span><span class="pill on">ON</span></div>').join('')).join('');
  } catch (e) {
    document.getElementById('live').innerHTML = '<span class="pill off">หลุด — กำลังต่อใหม่</span>';
  }
  setTimeout(tick, 5000);
}
tick();
