// ดึง headers จริงของ micro-app จาก browser แล้วพิมพ์ออกมาเพื่อเอาไปใส่ backend .env
// วิธีใช้: เปิด us.device.tuya.ai ใน browser, เปิด devtools ดู request /device/dp/query แล้วก๊อป headers มาเทียบ
export function requiredHeaders() {
  return ['micro-app-id', 'micro-app-code', 'project-id', 'cookie'];
}
