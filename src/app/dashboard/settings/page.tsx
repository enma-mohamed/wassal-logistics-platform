import prisma from "@/lib/prisma";
import SettingsForm from "@/components/forms/SettingsForm";
import { getSystemSettings } from "@/lib/settings";

export const revalidate = 0; // إيقاف الكاش لرؤية التغييرات فوراً

export default async function SettingsPage() {
  const systemSettings = getSystemSettings();

  return (
    <div className="settings-page-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header-section">
        <div>
          <h1 className="page-title">إعدادات المنصة العامة</h1>
          <p className="page-subtitle">تعديل بارامترات النظام وقواعد تشغيل الشحنات والأمن وتخصيص ثيمات الألوان في اليمن</p>
        </div>
      </div>

      <SettingsForm initialSystemSettings={systemSettings} />
    </div>
  );
}
