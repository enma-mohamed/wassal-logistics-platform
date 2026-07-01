/**
 * توليد رقم تتبع فريد للشحنة
 * التنسيق: WSL + 8 أرقام من الطابع الزمني + 4 أرقام عشوائية
 * مثال: WSL582910482918
 */
export function generateTrackingNumber(): string {
  const timestampPart = String(Date.now()).slice(-8);
  const randomPart = String(Math.floor(1000 + Math.random() * 9000));
  return `WSL${timestampPart}${randomPart}`;
}
