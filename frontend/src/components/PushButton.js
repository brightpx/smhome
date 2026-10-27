export function pushLabel(subscribed) {
  if (subscribed) return 'เปิดแจ้งเตือนแล้ว';
  return 'เปิด Web Push (iOS ต้อง Add to Home Screen ก่อน)';
}
