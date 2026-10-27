# ปุ่ม Relay คลิกเดียว (ให้ dashboard อัปเดตตลอดเอง)

ทำครั้งเดียว ใช้ได้ตลอด ไม่ต้องเปิด F12

## ขั้นตอน (1 นาที)

1. เปิด Chrome ในเครื่องนี้ ไปที่ `https://us.device.tuya.ai` แล้วล็อกอินด้วย QR (ครั้งเดียว)
2. เปิดหน้า Device List ของบ้านค้างไว้ (แท็บนี้ห้ามปิด แต่พับไว้ได้)
3. สร้าง bookmark ใหม่ ตั้งชื่อ `Tuya Relay` ก๊อปโค้ดข้างล่างใส่ช่อง URL
4. อยู่หน้า Device List แล้ว **คลิก bookmark 1 ครั้ง** จะมี popup `relay started`

## โค้ด bookmark v2 (ก๊อปทั้งบรรทัด รวมวัตต์สด)

```text
javascript:(function(){if(window.__relay)return alert('relay on');window.__relay=1;async function devs(){const q=await fetch('/open-api/v1.0/m/sdf/device/pag/source-query',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({project_id:'69459073',page_no:1,page_size:20})});const j=await q.json();return j.result.data.map(d=>({id:d.device_id,name:d.device_name,room:d.installation_location,online:d.device_status===1}));}async function post(b){await fetch('http://127.0.0.1:3001/api/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});}const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function power(){try{const out={};for(const n of ['Dual Channel Smart Meter','BFAD ไมโครอินเวอร์เตอร์']){const el=Array.from(document.querySelectorAll('span')).find(e=>e.textContent.trim()===n);if(!el)continue;el.click();await sleep(2500);const t=document.documentElement.innerText;const i=t.lastIndexOf(n);const s=t.slice(i,i+900);if(n[0]==='D'){const m=f=>{const x=s.match(f);return x?parseFloat(x[1]):null;};out.meter={powerW:m(/Total Active Power\s+([\d.]+)W/),voltage:m(/Current Voltage\s+([\d.]+)V/),forwardKwh:m(/Forward Total Energy\s+([\d.]+)/),reverseKwh:m(/Reverse Total Energy\s+([\d.]+)/)};}else{const m=f=>{const x=s.match(f);return x?parseFloat(x[1]):null;};out.solar={pvW:m(/光伏功率\s+([\d.]+)W/),acW:m(/交流功率\s+([\d.]+)W/),totalKwh:m(/Total power\s+([\d.]+)kW/),temp:m(/Inverter temperature\s+([\d.]+)/)};}}out.devices=await devs();out.updatedAt=Date.now();await post(out);}catch(e){const d=await devs();await post({devices:d,updatedAt:Date.now()});}}setInterval(async()=>{try{const d=await devs();await post({devices:d,updatedAt:Date.now()});}catch(e){}},5000);setInterval(power,30000);power();alert('relay started');})()
```

## เช็คว่าสำเร็จ

เปิด `http://127.0.0.1:3001/api/devices` ดูช่อง `source`
ต้องเป็น `browser-relay` และมี `power` อัปเดตทุก ~30 วินาที
