import prisma from "@/lib/prisma";
import { BarChart3, TrendingUp, Percent, Award, ShieldAlert, Calendar, Package, Users, Truck } from "lucide-react";
import ReportExportButton from "@/components/ui/ReportExportButton";

export const revalidate = 0;

export default async function ReportsPage() {
  // حساب مؤشرات الأداء الأساسية
  const totalShipments = await prisma.shipment.count();
  const deliveredShipments = await prisma.shipment.count({ where: { status: "DELIVERED" } });
  const returnedShipments = await prisma.shipment.count({ where: { status: "RETURNED" } });
  const pendingShipments = await prisma.shipment.count({
    where: {
      status: {
        in: ["PENDING_RECEIVE", "RECEIVED_IN_BRANCH", "IN_SORTING", "IN_TRANSIT", "ARRIVED_BRANCH", "OUT_FOR_DELIVERY"],
      },
    },
  });

  const deliverySuccessRate = totalShipments > 0
    ? Math.round((deliveredShipments / totalShipments) * 100)
    : 0;

  const returnRate = totalShipments > 0
    ? Math.round((returnedShipments / totalShipments) * 100)
    : 0;

  // جلب إحصائيات مالية
  const feeStats = await prisma.shipment.aggregate({
    _sum: { shippingFee: true },
    _avg: { shippingFee: true },
  });

  const codStats = await prisma.shipment.aggregate({
    where: { paymentMethod: "CASH_ON_DELIVERY" },
    _sum: { collectionAmount: true },
    _avg: { collectionAmount: true },
  });

  // إحصائيات إضافية
  const totalCustomers = await prisma.customer.count();
  const totalDrivers = await prisma.driver.count();
  const totalAgents = await prisma.agent.count();
  const totalBranches = await prisma.branch.count({ where: { isActive: true } });

  const exportData = {
    totalShipments,
    deliveredShipments,
    returnedShipments,
    deliverySuccessRate,
    returnRate,
    totalShippingFees: feeStats._sum.shippingFee || 0,
    totalCOD: codStats._sum.collectionAmount || 0,
    avgShippingFee: Math.round(feeStats._avg.shippingFee || 0),
    avgCOD: Math.round(codStats._avg.collectionAmount || 0),
  };

  return (
    <div className="reports-page-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">التقارير التحليلية والإحصائيات</h1>
          <p className="page-subtitle">تحليلات الأداء التشغيلي ومعدلات نجاح التوصيل والإيرادات والتحصيلات COD في اليمن</p>
        </div>
        <ReportExportButton data={exportData} />
      </div>

      {/* مؤشرات الأداء التشغيلي */}
      <div className="stats-grid">
        <div className="dashboard-card stat-card">
          <div className="stat-icon-wrapper icon-green">
            <Award size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">معدل التوصيل الناجح</span>
            <span className="stat-value text-green">{deliverySuccessRate}%</span>
          </div>
        </div>

        <div className="dashboard-card stat-card">
          <div className="stat-icon-wrapper icon-red">
            <ShieldAlert size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">نسبة مرتجعات الشحن</span>
            <span className="stat-value" style={{ color: "var(--danger)" }}>{returnRate}%</span>
          </div>
        </div>

        <div className="dashboard-card stat-card">
          <div className="stat-icon-wrapper icon-blue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">متوسط رسوم الشحنة</span>
            <span className="stat-value">
              {Math.round(feeStats._avg.shippingFee || 0).toLocaleString("ar-YE")} <span style={{ fontSize: "0.85rem" }}>ريال</span>
            </span>
          </div>
        </div>

        <div className="dashboard-card stat-card">
          <div className="stat-icon-wrapper icon-warning">
            <Percent size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">متوسط مبالغ تحصيل COD</span>
            <span className="stat-value text-warning">
              {Math.round(codStats._avg.collectionAmount || 0).toLocaleString("ar-YE")} <span style={{ fontSize: "0.85rem" }}>ريال</span>
            </span>
          </div>
        </div>
      </div>

      {/* إحصائيات تشغيلية سريعة */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>إجمالي الشحنات</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800 }}>{totalShipments}</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>العملاء</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800 }}>{totalCustomers}</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Truck size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>المناديب</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800 }}>{totalDrivers}</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>الوكلاء</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800 }}>{totalAgents}</div>
          </div>
        </div>
      </div>

      {/* تفاصيل المؤشرات الإحصائية العامة */}
      <div className="finance-stats-grid">
        <div className="dashboard-card finance-card">
          <h3 className="section-title-with-icon" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
            <Calendar size={18} />
            <span>ملخص الأداء العملياتي التراكمي</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>إجمالي الشحنات المسجلة:</span>
              <span style={{ fontWeight: 700 }}>{totalShipments} شحنة</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>تم التوصيل للعميل:</span>
              <span style={{ fontWeight: 700, color: "var(--secondary)" }}>{deliveredShipments} شحنة</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>قيد المعالجة والتوصيل:</span>
              <span style={{ fontWeight: 700, color: "var(--warning)" }}>{pendingShipments} شحنة</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>المرتجعة للمرسلين:</span>
              <span style={{ fontWeight: 700, color: "var(--danger)" }}>{returnedShipments} شحنة</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>الفروع النشطة:</span>
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>{totalBranches} فرع</span>
            </div>
          </div>

          {/* شريط مرئي لتوزيع الحالات */}
          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>توزيع حالات الشحنات:</div>
            <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", gap: "2px" }}>
              {totalShipments > 0 && (
                <>
                  <div style={{ width: `${(deliveredShipments / totalShipments) * 100}%`, background: "var(--secondary)", borderRadius: "6px", transition: "width 0.5s ease" }} title={`مسلّمة: ${deliveredShipments}`}></div>
                  <div style={{ width: `${(pendingShipments / totalShipments) * 100}%`, background: "var(--warning)", borderRadius: "6px", transition: "width 0.5s ease" }} title={`قيد المعالجة: ${pendingShipments}`}></div>
                  <div style={{ width: `${(returnedShipments / totalShipments) * 100}%`, background: "var(--danger)", borderRadius: "6px", transition: "width 0.5s ease" }} title={`مرتجعة: ${returnedShipments}`}></div>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.75rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--secondary)", display: "inline-block" }}></span>
                مسلّمة
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--warning)", display: "inline-block" }}></span>
                قيد المعالجة
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--danger)", display: "inline-block" }}></span>
                مرتجعة
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-card finance-card">
          <h3 className="section-title-with-icon" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
            <TrendingUp size={18} />
            <span>الحصيلة المالية المقدرة</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>إجمالي رسوم الشحن:</span>
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                {(feeStats._sum.shippingFee || 0).toLocaleString("ar-YE")} ريال
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>إجمالي مبالغ COD المستهدفة:</span>
              <span style={{ fontWeight: 700, color: "var(--warning)" }}>
                {(codStats._sum.collectionAmount || 0).toLocaleString("ar-YE")} ريال
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>إجمالي قيمة التحصيل والإيرادات:</span>
              <span style={{ fontWeight: 700, color: "var(--secondary)" }}>
                {((feeStats._sum.shippingFee || 0) + (codStats._sum.collectionAmount || 0)).toLocaleString("ar-YE")} ريال
              </span>
            </div>
          </div>

          {/* بطاقة الإيرادات المالية */}
          <div style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            background: "linear-gradient(135deg, var(--primary-light), var(--secondary-light))",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.5rem" }}>
              💰 صافي الإيرادات التقديرية
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--secondary)" }}>
              {((feeStats._sum.shippingFee || 0) + (codStats._sum.collectionAmount || 0)).toLocaleString("ar-YE")}
              <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", marginRight: "0.25rem" }}> ريال يمني</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              مجموع رسوم الشحن + تحصيلات COD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
