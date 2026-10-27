# ปุ่ม Relay คลิกเดียว (ให้ dashboard อัปเดตตลอดเอง)

ทำครั้งเดียว ใช้ได้ตลอด ไม่ต้องเปิด F12

## ขั้นตอน (1 นาที)

1. เปิด Chrome ในเครื่องนี้ ไปที่ `https://us.device.tuya.ai` แล้วล็อกอินด้วย QR (ครั้งเดียว)
2. สร้าง bookmark ใหม่ (กด Ctrl+Shift+O → เพิ่มบุ๊กมาร์ก) ตั้งชื่อ `Tuya Relay`
   แล้วก๊อปโค้ดข้างล่างใส่ช่อง URL
3. เปิดหน้า Device List ของบ้านค้างไว้ แล้ว **คลิก bookmark `Tuya Relay` 1 ครั้ง**
   จากนั้นแท็บนั้นจะส่งค่ามาที่ backend เองทุก 5 วินาที ตราบที่แท็บเปิดอยู่

## โค้ด bookmark (ก๊อปทั้งบรรทัด)

```text
javascript:(function(){if(window.__relay)return alert('relay on');window.__relay=1;setInterval(async()=>{try{const q=await fetch('/open-api/v1.0/m/sdf/device/pag/source-query',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({project_id:'69459073',page_no:1,page_size:20})});const j=await q.json();await fetch('http://127.0.0.1:3001/api/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({devices:j.result.data.map(d=>({id:d.device_id,name:d.device_name,room:d.installation_location,online:d.device_status===1})),updatedAt:Date.now()})});}catch(e){}},5000);alert('relay started');})()
```

## เช็คว่าสำเร็จ

เปิด `http://127.0.0.1:3001/api/devices` ดูช่อง `source`
ต้องเป็น `browser-relay` (ไม่ใช่ `tuya-web` / `mock`)
