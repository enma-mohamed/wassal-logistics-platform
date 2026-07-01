import prisma from "@/lib/prisma";
import Link from "next/link";
import ShipmentsFilterForm from "@/components/ui/ShipmentsFilterForm";
import ExportTableButton from "@/components/ui/ExportTableButton";
import ShipmentsTable from "@/components/ui/ShipmentsTable";
import { Plus, ArrowUpRight, AlertTriangle } from "lucide-react";

export const revalidate = 0; // إيقاف الكاش للحصول على البيانات المحدثة

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ShipmentsPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const branch = typeof searchParams.branch === "string" ? searchParams.branch : undefined;

  // جلب قائمة الفروع للتصفية
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // بناء شروط التصفية والاستعلام
  const whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (branch) {
    whereClause.OR = [
      { originBranchId: branch },
      { destBranchId: branch },
    ];
  }

  if (q) {
    const searchConditions = [
      { trackingNumber: { contains: q } },
      { sender: { name: { contains: q } } },
      { sender: { phone: { contains: q } } },
      { receiver: { name: { contains: q } } },
      { receiver: { phone: { contains: q } } },
    ];

    if (whereClause.OR) {
      whereClause.AND = [
        { OR: whereClause.OR },
        { OR: searchConditions },
      ];
      delete whereClause.OR;
    } else {
      whereClause.OR = searchConditions;
    }
  }

  // جلب الشحنات مع تعيين تفاصيلها
  const shipments = await prisma.shipment.findMany({
    where: whereClause,
    include: {
      sender: true,
      receiver: true,
      originBranch: true,
      destBranch: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // جلب السائقين والوكلاء النشطين للإسناد الجماعي
  const [drivers, agents] = await Promise.all([
    prisma.driver.findMany({
      include: { user: true },
      where: { user: { isActive: true } },
    }),
    prisma.agent.findMany({
      include: { user: true },
      where: { user: { isActive: true } },
    }),
  ]);

  const serializedDrivers = drivers.map((d) => ({ id: d.id, name: d.user.name }));
  const serializedAgents = agents.map((a) => ({ id: a.id, name: a.user.name }));

  const serializedShipments = shipments.map((s) => ({
    id: s.id,
    trackingNumber: s.trackingNumber,
    status: s.status,
    serviceType: s.serviceType,
    paymentMethod: s.paymentMethod,
    shippingFee: s.shippingFee,
    collectionAmount: s.collectionAmount,
    createdAt: s.createdAt.toISOString(),
    sender: { name: s.sender.name, phone: s.sender.phone },
    receiver: { name: s.receiver.name, phone: s.receiver.phone },
    originBranch: { name: s.originBranch.name },
    destBranch: { name: s.destBranch.name },
  }));

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

  // تجهيز البيانات للتصدير بصيغة إكسيل
  const shipmentsForExport = shipments.map((shipment) => {
    const statusInfo = statusTranslations[shipment.status] || { text: shipment.status };
    return {
      trackingNumber: shipment.trackingNumber,
      senderName: shipment.sender.name,
      senderPhone: shipment.sender.phone,
      receiverName: shipment.receiver.name,
      receiverPhone: shipment.receiver.phone,
      originBranchName: shipment.originBranch.name,
      destBranchName: shipment.destBranch.name,
      serviceType: shipment.serviceType === "URGENT" ? "مستعجل" : shipment.serviceType === "INSURED" ? "أمانات" : "عادي",
      paymentMethod: shipment.paymentMethod === "CASH_ON_DELIVERY" ? "عند الاستلام (COD)" : "دفع مسبق",
      shippingFee: shipment.shippingFee,
      collectionAmount: shipment.collectionAmount,
      statusText: statusInfo.text,
      createdAt: new Date(shipment.createdAt).toLocaleDateString("ar-YE"),
    };
  });

  const exportHeaders = {
    trackingNumber: "رقم التتبع",
    senderName: "اسم المرسل",
    senderPhone: "هاتف المرسل",
    receiverName: "اسم المستلم",
    receiverPhone: "هاتف المستلم",
    originBranchName: "فرع المصدر",
    destBranchName: "فرع الوجهة",
    serviceType: "نوع الخدمة",
    paymentMethod: "طريقة الدفع",
    shippingFee: "رسوم الشحن (ريال)",
    collectionAmount: "مبلغ التحصيل COD (ريال)",
    statusText: "حالة الشحنة",
    createdAt: "تاريخ التسجيل",
  };

  return (
    <div className="shipments-page-container">
      {/* رأس الصفحة */}
      <div className="page-header-section">
        <div>
          <h1 className="page-title">إدارة شحنات منصة وصّل</h1>
          <p className="page-subtitle">قائمة بجميع الشحنات المسجلة وعمليات البحث والفلترة التفصيلية</p>
        </div>
        <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
          <ExportTableButton data={shipmentsForExport} headers={exportHeaders} fileName="wassal-shipments" buttonText="تصدير شحنات Excel" />
          <Link href="/dashboard/shipments/new" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Plus size={18} />
            <span>تسجيل شحنة جديدة</span>
          </Link>
        </div>
      </div>

      {/* نموذج البحث والتصفية */}
      <ShipmentsFilterForm branches={branches} />

      {/* جدول عرض البيانات التفاعلي المشتمل على العمليات الجماعية */}
      {shipments.length === 0 ? (
        <div className="dashboard-card table-container">
          <div className="empty-state">
            <AlertTriangle size={48} className="empty-icon" />
            <p>لم يتم العثور على أي شحنات تطابق معايير البحث المحددة.</p>
          </div>
        </div>
      ) : (
        <ShipmentsTable
          shipments={serializedShipments}
          drivers={serializedDrivers}
          agents={serializedAgents}
        />
      )}
    </div>
  );
}
