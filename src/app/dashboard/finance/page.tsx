import prisma from "@/lib/prisma";
import { DollarSign, User, CreditCard, Calendar, TrendingUp, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import ExportTableButton from "@/components/ui/ExportTableButton";

export const revalidate = 0;

export default async function FinancePage() {
  const payments = await prisma.payment.findMany({
    include: {
      shipment: true,
      collectedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // حساب الإحصائيات المالية
  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const settledPayments = payments.filter(p => p.settled);
  const settledAmount = settledPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = totalAmount - settledAmount;

  const paymentTypes: Record<string, string> = {
    SHIPPING_FEE: "رسوم توصيل شحنة",
    COLLECTION_COD: "تحصيل COD عند الاستلام",
    INSURANCE_FEE: "رسوم تأمين أمانات",
    EXTRA_SERVICE: "رسوم خدمة إضافية",
  };

  const paymentMethods: Record<string, string> = {
    CASH: "نقداً (كاش)",
    BANK_TRANSFER: "تحويل بنكي",
    MOBILE_WALLET: "محفظة جوال إلكترونية",
    CREDIT: "آجل حساب عميل",
  };

  const paymentsForExport = payments.map((p) => ({
    trackingNumber: p.shipment.trackingNumber,
    amount: p.amount,
    typeText: paymentTypes[p.type] || p.type,
    methodText: paymentMethods[p.method] || p.method,
    statusText: p.status === "COMPLETED" ? "ناجح" : p.status === "PENDING" ? "معلق" : "فاشل",
    collector: p.collectedBy.name,
    settledText: p.settled ? "تمت التسوية" : "غير مسواة",
    createdAt: new Date(p.createdAt).toLocaleDateString("ar-YE"),
  }));

  const exportHeaders = {
    trackingNumber: "رقم تتبع الشحنة",
    amount: "المبلغ (ريال)",
    typeText: "نوع الحركة المالية",
    methodText: "طريقة الدفع",
    statusText: "حالة الحركة",
    collector: "المحصل",
    settledText: "التسوية المحاسبية",
    createdAt: "تاريخ الاستلام",
  };

  return (
    <div className="finance-page-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">الحسابات والمالية والتحصيلات</h1>
          <p className="page-subtitle">عرض حركات التحصيل ومبالغ COD المودعة وسجل المدفوعات اليومي لمنصة وصّل في اليمن</p>
        </div>
        <ExportTableButton data={paymentsForExport} headers={exportHeaders} fileName="wassal-finance" buttonText="تصدير الحركات المالية Excel" />
      </div>

      {/* بطاقات الإحصائيات المالية */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
        <div className="dashboard-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.75rem" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={22} />
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>إجمالي المبالغ المسجلة</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)" }}>
                {totalAmount.toLocaleString("ar-YE")} <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>ريال</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            عدد الحركات: <strong>{totalPayments}</strong> حركة مالية
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.75rem" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>تمت التسوية للتجار</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--secondary)" }}>
                {settledAmount.toLocaleString("ar-YE")} <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>ريال</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            عدد الحركات: <strong>{settledPayments.length}</strong> حركة مسواة
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.75rem" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>بانتظار التسوية</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--warning)" }}>
                {pendingAmount.toLocaleString("ar-YE")} <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>ريال</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            عدد الحركات: <strong>{totalPayments - settledPayments.length}</strong> حركة معلقة
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.75rem" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>نسبة التسوية</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#8b5cf6" }}>
                {totalPayments > 0 ? Math.round((settledPayments.length / totalPayments) * 100) : 0}%
              </div>
            </div>
          </div>
          <div style={{ width: "100%", height: "6px", borderRadius: "3px", background: "var(--border)", marginTop: "0.25rem" }}>
            <div style={{
              width: `${totalPayments > 0 ? Math.round((settledPayments.length / totalPayments) * 100) : 0}%`,
              height: "100%",
              borderRadius: "3px",
              background: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
              transition: "width 0.5s ease",
            }}></div>
          </div>
        </div>
      </div>

      <div className="dashboard-card table-container">
        <div className="section-header" style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <h3 className="section-title">دفتر الأستاذ للحركات المالية الأخيرة (آخر 30 حركة)</h3>
        </div>

        {payments.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={48} className="empty-icon" />
            <p>لا توجد مدفوعات مسجلة حالياً في النظام.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم العملية</th>
                <th>رقم الشحنة</th>
                <th>نوع المقبوضات</th>
                <th>طريقة الدفع</th>
                <th>القيمة المحصلة</th>
                <th>المستلم المالي</th>
                <th>تاريخ التحصيل</th>
                <th>حالة التسوية</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id}>
                  <td className="tracking-cell" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{pay.id.slice(0, 8).toUpperCase()}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: "var(--accent)" }}>{pay.shipment.trackingNumber}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{paymentTypes[pay.type] || pay.type}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--text-secondary)" }}>
                      <CreditCard size={13} />
                      <span>{paymentMethods[pay.method] || pay.method}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--secondary)", fontSize: "1.05rem" }}>
                    {pay.amount.toLocaleString("ar-YE")} ريال
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <User size={14} style={{ color: "var(--text-muted)" }} />
                      <span>{pay.collectedBy.name}</span>
                    </div>
                  </td>
                  <td className="date-cell">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                      <span>
                        {new Date(pay.createdAt).toLocaleDateString("ar-YE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${pay.settled ? "status-success" : "status-warning"}`}>
                      {pay.settled ? "تم التسوية للتجار" : "بانتظار التسوية"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
