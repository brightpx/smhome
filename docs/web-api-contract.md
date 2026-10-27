# Web API Contract — Tuya Smart Life Web (us.device.tuya.ai)

แหล่งข้อมูลจริงจาก session ที่ล็อกอินแล้ว (QR Smart Life) — project_id 69459073, บ้าน My Home

## Session

- Base: `https://us.device.tuya.ai`
- Auth: cookies `SAAS_AUTH_INFO` (uid az1650764274804vous3, user dechsaradecho@gmail.com), `_csrf`, `main-i18next`
- Storage: localStorage `SMART_HOME_ID=69459073`, `SMART_HOME_ISOLATION_TYPE=homeId`
- หมดอายุแล้วต้องสแกน QR ใหม่ที่ `/login?from=%2Fapps%2F2031674305368031282%2F`

## Endpoints ที่ใช้ได้ (พิสูจน์แล้ว 2026-10-27)

- `POST /open-api/v1.0/m/sdf/device/pag/source-query` body `{project_id:69459073, page_no:1, page_size:20}` → รายชื่อ 15 ตัว (total 15, online 10)
- `GET /open-api/v1.0/m/sdf/device/index/{device_id}?project_id=69459073` → detail ตัวเดียว (ลองกับ eb0b9857bf4d24e73aujri ได้)
- `GET /open-api/v1.0/m/sdf/device/capability/list` → capability list
- `GET /open-api/v1.0/m/sdf/space/trees?project_id=69459073` → โครงห้อง
- `POST /open-api/v1.0/m/sdf/device/count` → นับจำนวน

## Endpoints ที่ติดสิทธิ์ (ต้องมี micro-app headers)

- `GET /open-api/v1.0/m/sdf/device/dp/query?dev_id={id}` → ต้องมี headers ของ micro-app `@tuya-fe/smart2c-app-device` ไม่งั้น 403 `not belong to saas` (เจอใน main.27926488.js)
- วิธีแก้ backend: copy headers จาก browser request จริง (ดูใน devtools) หรือเปิด detail page แล้วอ่านค่าจาก UI ไปก่อน

## อุปกรณ์ 15 ตัว (จาก source-query)

Online 10:
- eb0b9857bf4d24e73aujri Dual Channel Smart Meter (Energy/Smart Electric Meter, PID ax1iylf5qp4iqlkg, ภายนอก)
- eb050f906c2cbd90f0vmwd BFAD ไมโครอินเวอร์เตอร์ (Energy/smart inverter, PID r5rqjwfvvehfyeks, ภายนอก)
- eb2c311bb821f7630c9wvg สวิทซ์หน้าประตูทางเข้า (Breaker, ภายนอก)
- eb19bec12f89f86d19aff6 สวิทซ์ระเบียงชั้นบน (Breaker, ภายนอก)
- ebdfed963b861a03bfhgfi สวิทช์ห้องนอน (Breaker, ห้องนอน)
- eb0e07cbd548caba3ezvyt สวิทซ์ห้องกินข้าว (Breaker, ห้องกินข้าว)
- eb6830635d5a2f6bc0wycq สวิทซ์ห้องครอบครัว (Breaker, ห้องครอบครัว)
- ebc37d6f76fa6360f4c8wc track light (Socket, ห้องครอบครัว)
- 022553357c87ce8b9eea สวิตช์ประตู (Switch, บ้านเก่า)
- 022553357c87ce8b9f09 สวิทซ์ระเบียง (Switch, บ้านเก่า)

Offline 5: eb544d4314590c19b4amnd Smart Plug, ebcd2469ad249dfea9u5nn ไฟผนัง, eb536bcaa83e0319fayoug ไฟฝ้า, eba62fbc9252c06f8bznpg ไฟกลม, eb9f9967accfa76ea2l1uc Smart remote control

## หมายเหตุ realtime

- โพลล์ source-query ทุก 5 วิ + index ของมิเตอร์/อินเวอร์เตอร์เพื่อเอาค่าไฟ
- ถ้า dp/query ยัง 403 ให้ใช้ค่าจาก UI detail + เก็บ last-known พร้อม stale flag
