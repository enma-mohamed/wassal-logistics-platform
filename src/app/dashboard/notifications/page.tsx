import prisma from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import WhatsAppLogViewer from "@/components/ui/WhatsAppLogViewer";

export const revalidate = 0;

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session || !["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"].includes(session.role)) {
    redirect("/dashboard");
  }

  const logs = await prisma.whatsAppLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // إحصائيات الإشعارات
  const totalLogs = await prisma.whatsAppLog.count();
  const sentLogs = await prisma.whatsAppLog.count({ where: { status: "SENT" } });
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayLogs = await prisma.whatsAppLog.count({
    where: { createdAt: { gte: todayStart } },
  });

  const stats = {
    total: totalLogs,
    sent: sentLogs,
    today: todayLogs,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header-section">
        <div>
          <h1 className="page-title">📱 سجل إشعارات الواتساب</h1>
          <p className="page-subtitle">
            محاكي الإشعارات اللوجستية - يُظهر جميع الرسائل المجهزة للإرسال عبر واتساب للمرسلين والمستلمين
          </p>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div className="dashboard-card stat-card">
          <div className="stat-card-content">
            <span className="stat-card-value">{stats.total}</span>
            <span className="stat-card-label">إجمالي الإشعارات</span>
          </div>
          <div className="stat-card-icon" style={{ backgroundColor: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>📨</div>
        </div>

        <div className="dashboard-card stat-card">
          <div className="stat-card-content">
            <span className="stat-card-value">{stats.sent}</span>
            <span className="stat-card-label">تم الإرسال بنجاح</span>
          </div>
          <div className="stat-card-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>✅</div>
        </div>

        <div className="dashboard-card stat-card">
          <div className="stat-card-content">
            <span className="stat-card-value">{stats.today}</span>
            <span className="stat-card-label">إشعارات اليوم</span>
          </div>
          <div className="stat-card-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>📅</div>
        </div>
      </div>

      {/* عارض سجل الرسائل */}
      <WhatsAppLogViewer logs={JSON.parse(JSON.stringify(logs))} />
    </div>
  );
}
