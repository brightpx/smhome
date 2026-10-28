# Deploy to Render

## One-time setup

1. Push repo นี้ขึ้น GitHub (มีอยู่แล้วที่ `brightpx/smhome`)
2. Render Dashboard → New → Blueprint → เลือก repo นี้ (อ่าน `render.yaml` อัตโนมัติ)
   - หรือ New → Web Service → Runtime **Docker** → เลือก repo/branch
3. ถ้าสร้างแบบ manual (ไม่ใช้ Blueprint):
   - Runtime: Docker, Dockerfile path: `./Dockerfile`
   - Plan: Starter ขึ้นไป (ต้องมีดิสก์)
   - Add Disk: Name `smarthome-data`, Mount path `/app/data`, Size 1 GB
   - Health Check Path: `/` (default)
4. กด Deploy ครั้งแรกจะช้าหน่อย (โหลด image ~1 GB มี browser ในตัว)

## หลัง deploy เสร็จ

1. เปิด URL ของ service จะเจอหน้า dashboard + ป้าย QR (ข้อมูล mock ก่อน)
2. เอามือถือเปิดแอป Smart Life สแกน QR บนจอ **ครั้งเดียว**
3. backend จะจำ session ลงดิสก์ (`/app/data/profile`) ครั้งต่อไปไม่ต้องสแกนอีก
   จนกว่า Tuya จะเตะออก (หลายสัปดาห์) ถ้าหลุดก็สแกนใหม่จากหน้านี้ได้เลย

## หมายเหตุ

- ไม่ต้องตั้ง env อะไรเพิ่ม (`AUTO_POLL` เปิดอยู่แล้ว, `PORT` Render ใส่ให้เอง)
- ห้ามใช้ Native Node runtime + yarn: ต้องลง browser เองและไม่มีดิสก์ถาวร
  ถ้า Render ของคุณเป็นแบบ Node ให้ลบแล้วสร้างใหม่แบบ **Docker**
- Free tier จะ sleep: เปิดมาครั้งแรกรอ ~1 นาทีให้ auto-poll รอบแรกจบ
- `data/live.json` ใน image เป็นแค่ค่าเริ่มต้น ดิสก์จะทับด้วยค่าจริงหลัง poll
