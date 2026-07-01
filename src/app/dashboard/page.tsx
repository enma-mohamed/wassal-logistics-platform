import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Plus,
  Truck,
  AlertTriangle,
} from "lucide-react";
import DashboardCharts from "@/components/ui/DashboardCharts";

export const revalidate = 0; // عدم التخزين المؤقت لضمان حداثة البيانات

export default async function DashboardPage() {
  // جلب إحصائيات الشحنات من قاعدة البيانات
  const totalShipments = await prisma.shipment.count();
  
  const pendingCount = await prisma.shipment.count({
    where: {
      status: {
        in: ["PENDING_RECEIVE", "RECEIVED_IN_BRANCH", "IN_SORTING", "IN_TRANSIT", "ARRIVED_BRANCH"],
      },
    },
  });

  const outForDeliveryCount = await prisma.shipment.count({
    where: { status: "OUT_FOR_DELIVERY" },
  });

  const deliveredCount = await prisma.shipment.count({
    where: { status: "DELIVERED" },
  });

  const returnedCount = await prisma.shipment.count({
    where: { status: "RETURNED" },
  });

  // حساب المبالغ المالية
  const totalShippingFees = await prisma.shipment.aggregate({
    _sum: { shippingFee: true },
  });

  const totalCODPending = await prisma.shipment.aggregate({
    where: {
      paymentMethod: "CASH_ON_DELIVERY",
      status: { not: "DELIVERED" },
    },
    _sum: { collectionAmount: true },
  });

  const totalCODCollected = await prisma.shipment.aggregate({
    where: {
      paymentMethod: "CASH_ON_DELIVERY",
      status: "DELIVERED",
    },
    _sum: { collectionAmount: true },
  });

  // ----------------- جلب وتجهيز بيانات المخططات البيانية -----------------
  // 1. حساب الشحنات لآخر 7 أيام
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyShipments = await prisma.shipment.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    select: { createdAt: true },
  });

  const dailyDataMap: Record<string, number> = {};
  const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  // تهيئة الأيام السبعة الأخيرة
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = dayNames[d.getDay()];
    dailyDataMap[dayName] = 0;
  }

  weeklyShipments.forEach((s) => {
    const dayName = dayNames[new Date(s.createdAt).getDay()];
    if (dailyDataMap[dayName] !== undefined) {
      dailyDataMap[dayName]++;
    }
  });

  const chartDailyData = Object.entries(dailyDataMap).map(([name, count]) => ({
    name,
    count,
  }));

  // 2. حساب توزيع حالات الشحنات الحالية
  const deliveredStatus = await prisma.shipment.count({ where: { status: "DELIVERED" } });
  const pendingStatus = await prisma.shipment.count({
    where: {
      status: {
        in: ["PENDING_RECEIVE", "RECEIVED_IN_BRANCH", "IN_SORTING", "IN_TRANSIT", "ARRIVED_BRANCH"],
      },
    },
  });
  const deliveryStatus = await prisma.shipment.count({ where: { status: "OUT_FOR_DELIVERY" } });
  const returnedStatus = await prisma.shipment.count({ where: { status: "RETURNED" } });

  const statusChartsData = [
    { status: "DELIVERED", text: "تم التسليم بنجاح 🟢", count: deliveredStatus, color: "var(--secondary)" },
    { status: "OUT_FOR_DELIVERY", text: "خارج مع المندوب 🟣", count: deliveryStatus, color: "#8b5cf6" },
    { status: "PENDING", text: "في الفرز والمعالجة 🟡", count: pendingStatus, color: "var(--warning)" },
    { status: "RETURNED", text: "مرتجعة للمرسل 🔴", count: returnedStatus, color: "var(--danger)" },
  ];

  // جلب آخر 5 شحنات
  const recentShipments = await prisma.shipment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      sender: true,
      receiver: true,
      originBranch: true,
      destBranch: true,
    },
  });

  // ترجمة الحالات إلى العربية مع الألوان المقابلة
  const statusTranslations: Record<string, { text: string; class: string }> = {
    PENDING_RECEIVE: { text: "قيد انتظار الاستلام", class: "status-pending" },
    RECEIVED_IN_BRANCH: { text: "تم الاستلام في الفرع", class: "status-received" },
    IN_SORTING: { text: "في الفرز والتجهيز", class: "status-sorting" },
    IN_TRANSIT: { text: "قيد النقل والتوصيل", class: "status-transit" },
    ARRIVED_BRANCH: { text: "وصلت فرع الوجهة", class: "status-arrived" },
    OUT_FOR_DELIVERY: { text: "خرجت مع المندوب", class: "status-delivery" },
    DELIVERED: { text: "تم التسليم بنجاح", class: "status-success" },
    RETURNED: { text: "مرتجعة للمرسل", class: "status-returned" },
    CANCELLED: { text: "ملغاة", class: "status-danger" },
  };

  return (
    <div className="dashboard-home">
      {/* قسم الترحيب والإجراءات السريعة */}
      <div className="dashboard-welcome-section">
        <div>
          <h1 className="welcome-title">نظرة عامة على النظام</h1>
          <p className="welcome-subtitle">تحديث فوري لحالة الشحنات وحركة التحصيل المالي اليوم</p>
        </div>
        <div className="welcome-actions">
          <Link href="/dashboard/shipments/new" className="btn btn-primary">
            <Plus size={18} />
            <span>تسجيل شحنة جديدة</span>
          </Link>
          <Link href="/dashboard/tracking" className="btn btn-outline">
            <span>تتبع شحنة</span>
          </Link>
        </div>
      </div>

      {/* بطاقات الإحصائيات التشغيلية */}
      <div className="stats-grid">
        <div className="dashboard-card stat-card">
          <div className="stat-icon-wrapper icon-blue">
            <Package size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">إجمالي الشحنات</span>
            <span className="stat-value">{totalShipments}</span>
          </div>
        </div>

        <div className="dashboard-card stat-card">
          <div className="stat-icon-wrapper icon-warning">
            <Clock size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">شحنات قيد المعالجة</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
        </div>

        <div className="dashboard-card stat-card">
          <div className="stat-icon-wrapper icon-purple">
            <Truck size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">خارجة للتوصيل اليوم</span>
            <span className="stat-value">{outForDeliveryCount}</span>
          </div>
        </div>

        <div className="dashboard-card stat-card">
          <div className="stat-icon-wrapper icon-green">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">شحنات مسلّمة</span>
            <span className="stat-value">{deliveredCount}</span>
          </div>
        </div>

        <div className="dashboard-card stat-card">
          <div className="stat-icon-wrapper icon-red">
            <XCircle size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">شحنات مرتجعة</span>
            <span className="stat-value">{returnedCount}</span>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات المالية */}
      <div className="finance-stats-grid">
        <div className="dashboard-card finance-card">
          <div className="finance-header">
            <div className="stat-icon-wrapper icon-green">
              <DollarSign size={22} />
            </div>
            <span className="finance-label">إجمالي إيرادات الشحن</span>
          </div>
          <span className="finance-value text-green">
            {(totalShippingFees._sum.shippingFee || 0).toLocaleString("ar-YE")} <span className="currency">ريال</span>
          </span>
          <p className="finance-desc">إجمالي رسوم الشحن المدفوعة والآجلة</p>
        </div>

        <div className="dashboard-card finance-card">
          <div className="finance-header">
            <div className="stat-icon-wrapper icon-warning">
              <Clock size={22} />
            </div>
            <span className="finance-label">مبالغ COD معلقة (تحت التحصيل)</span>
          </div>
          <span className="finance-value text-warning">
            {(totalCODPending._sum.collectionAmount || 0).toLocaleString("ar-YE")} <span className="currency">ريال</span>
          </span>
          <p className="finance-desc">مبالغ التحصيل عند التسليم الجاري نقلها</p>
        </div>

        <div className="dashboard-card finance-card">
          <div className="finance-header">
            <div className="stat-icon-wrapper icon-blue">
              <TrendingUp size={22} />
            </div>
            <span className="finance-label">مبالغ COD محصّلة (جاهزة للتسوية)</span>
          </div>
          <span className="finance-value text-blue">
            {(totalCODCollected._sum.collectionAmount || 0).toLocaleString("ar-YE")} <span className="currency">ريال</span>
          </span>
          <p className="finance-desc">المبالغ التي تم استلامها من العملاء وستسلم للتجار</p>
        </div>
      </div>

      {/* الرسوم البيانية التفاعلية */}
      <DashboardCharts dailyData={chartDailyData} statusData={statusChartsData} />

      {/* آخر الشحنات */}
      <div className="recent-shipments-section">
        <div className="section-header">
          <h3 className="section-title">آخر الشحنات المسجلة</h3>
          <Link href="/dashboard/shipments" className="btn-text">
            <span>عرض كل الشحنات</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="dashboard-card table-container">
          {recentShipments.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={48} className="empty-icon" />
              <p>لا توجد شحنات مسجلة حالياً في النظام.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم التتبع</th>
                  <th>المرسل</th>
                  <th>المستلم</th>
                  <th>الخط الملاحي</th>
                  <th>طريقة الدفع</th>
                  <th>مبلغ COD</th>
                  <th>الحالة</th>
                  <th>تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments.map((shipment) => {
                  const statusInfo = statusTranslations[shipment.status] || {
                    text: shipment.status,
                    class: "",
                  };

                  return (
                    <tr key={shipment.id}>
                      <td className="tracking-cell">
                        <Link href={`/dashboard/shipments/${shipment.id}`} className="tracking-link">
                          {shipment.trackingNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="user-info-cell">
                          <span className="cell-name">{shipment.sender.name}</span>
                          <span className="cell-phone">{shipment.sender.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-info-cell">
                          <span className="cell-name">{shipment.receiver.name}</span>
                          <span className="cell-phone">{shipment.receiver.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="route-cell">
                          <span>{shipment.originBranch.name}</span>
                          <span className="route-arrow">←</span>
                          <span>{shipment.destBranch.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="payment-method-badge">
                          {shipment.paymentMethod === "CASH_ON_DELIVERY" ? "تحصيل COD" : "مسبق الدفع"}
                        </span>
                      </td>
                      <td className="cod-amount-cell">
                        {shipment.collectionAmount > 0
                          ? `${shipment.collectionAmount.toLocaleString("ar-YE")} ريال`
                          : "—"}
                      </td>
                      <td>
                        <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>
                      </td>
                      <td className="date-cell">
                        {new Date(shipment.createdAt).toLocaleDateString("ar-YE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
