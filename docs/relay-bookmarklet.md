# ปุ่ม Relay คลิกเดียว (ให้ dashboard อัปเดตตลอดเอง)

ทำครั้งเดียว ใช้ได้ตลอด ไม่ต้องเปิด F12

## ขั้นตอน (1 นาที)

1. เปิด Chrome ในเครื่องนี้ ไปที่ `https://us.device.tuya.ai` ล็อกอินด้วย QR (ครั้งเดียว)
2. เปิดหน้า Device List ของบ้านค้างไว้ (แท็บนี้ห้ามปิด แต่พับไว้ได้)
3. สร้าง bookmark ใหม่ ตั้งชื่อ `Tuya Relay` ก๊อปโค้ด v3 ข้างล่างใส่ช่อง URL
   (ถ้ามี bookmark เก่า ให้แก้ URL เป็นโค้ดใหม่)
4. อยู่หน้า Device List แล้ว **คลิก bookmark 1 ครั้ง** จะมี popup `relay started`

## โค้ด bookmark v3 (ทุกอย่าง realtime: online + สวิตช์ย่อย + วัตต์)

```text
javascript:(function(){if(window.__relay)return alert('relay on');window.__relay=1;const H={'Content-Type':'application/json;charset=UTF-8','micro-app-code':'@tuya-fe/smart2c-app-device','micro-app-id':'2031674305368031282','project-id':'69459073','isolation-type':'homeId','uid':'az1650764274804vous3'};const NAMES={ eb2c311bb821f7630c9wvg: ['ไฟเลขที่บ้าน', 'ไฟโรงรถ', 'ไฟหน้าบ้าน link'], eb19bec12f89f86d19aff6: ['ระเบียง', 'ไฟสวย', 'ไฟสวย2'], ebdfed963b861a03bfhgfi: ['Bedlight', 'Circle3', 'Strip3', 'Downlight3'], 'eb0e07cbd548caba3ezvyt': ['Downlight2sd', 'ห้องเก็บ', 'Circle2sd', 'Tricklightlink'], 'eb6830635d5a2f6bc0wycq': ['Strip1ft', 'Circle1ft', 'ไฟหน้าประตู', 'Downlight1ft'], '022553357c87ce8b9eea': ['ไฟกลมหลัง', 'ไฟกลมหน้า', 'ไฟดาวไลท์'],  '022553357c87ce8b9f09': ['ไฟฝ้า', 'ไฟหน้าประตูหลัง', 'ไฟระเบียงหลัง'], };;const METER='eb0b9857bf4d24e73aujri',INV='eb050f906c2cbd90f0vmwd',SW=Object.keys(NAMES);let G={},P=null;async function devs(){const q=await fetch('/open-api/v1.0/m/sdf/device/pag/source-query',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({project_id:'69459073',page_no:1,page_size:20})});const j=await q.json();return j.result.data;}async function prop(id){const q=await fetch('/open-api/v2.0/m/sdf/ss/devices/properties',{method:'POST',headers:H,credentials:'include',body:JSON.stringify({device_ids:[id]})});const j=await q.json();return (j.result||{})[id]||[];}const num=a=>{const o={};a.forEach(e=>o[e.code]=e.value_object??e.value);return o;};async function full(){const list=await devs();const devices=list.map(d=>({id:d.device_id,name:d.device_name,room:d.installation_location,online:d.device_status===1}));for(const id of SW){try{const o=num(await prop(id));const nm=NAMES[id];devices.find(d=>d.id===id).gangs=nm.map((n,i)=>({name:n,on:String(o['switch_'+(i+1)])==='true'}));}catch(e){}}try{const m=num(await prop(METER));P={meter:{powerW:m.p_tot/10,voltage:m.v/10,forwardKwh:m.fwd_acc_kwh/100,reverseKwh:m.rev_acc_kwh/100,currentA:m.a_i,pf:m.a_pf==null?null:m.a_pf/100}};}catch(e){}try{const s=num(await prop(INV));P={...P,solar:{pvW:s.pv_power/10,acW:s.ac_power/10,totalKwh:(P&&P.solar?P.solar.totalKwh:0)||s.power_total/1000,temp:s.temp_current}};}catch(e){}G={};devices.forEach(d=>{if(d.gangs)G[d.id]=d.gangs;});return{devices:devices.map(d=>({...d,gangs:d.gangs||G[d.id]})),power:P,updatedAt:Date.now()};}async function post(b){await fetch('http://127.0.0.1:3001/api/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});}async function quick(){try{const list=await devs();post({devices:list.map(d=>{const g={id:d.device_id,name:d.device_name,room:d.installation_location,online:d.device_status===1};if(G[g.id])g.gangs=G[g.id];return g;}),power:P,updatedAt:Date.now()});}catch(e){}}setInterval(quick,5000);setInterval(async()=>{try{post(await full());}catch(e){}},30000);(async()=>{try{post(await full());}catch(e){quick();}})();alert('relay started');})()
```

## เช็คว่าสำเร็จ

เปิด `http://127.0.0.1:3001/api/devices` ดูช่อง `source`
ต้องเป็น `browser-relay` มีทั้ง `gangs` และ `power` อัปเดตเรื่อย ๆ
