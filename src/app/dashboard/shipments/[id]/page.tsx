import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ShipmentStatusUpdater from "@/components/ui/ShipmentStatusUpdater";
import ShipmentRouteMap from "@/components/ui/ShipmentRouteMap";
import { getSession } from "@/app/actions/auth";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  Shield,
  DollarSign,
  Activity,
  Building,
  AlertTriangle,
  Edit,
  Printer,
} from "lucide-react";

export const revalidate = 0; // إيقاف الكاش

type Params = Promise<{ id: string }>;

export default async function ShipmentDetailsPage(props: { params: Params }) {
  const { id } = await props.params;
  const session = await getSession();

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      sender: {
        include: { province: true, city: true },
      },
      receiver: {
        include: { province: true, city: true },
      },
      originBranch: true,
      destBranch: true,
      items: true,
      events: {
        include: { fromUser: true },
        orderBy: { createdAt: "desc" },
      },
      createdBy: true,
    },
  });

  if (!shipment) {
    notFound();
  }

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

  const statusInfo = statusTranslations[shipment.status] || {
    text: shipment.status,
    class: "",
  };
  let shipmentMetadata: { isFragile?: boolean; labelStyle?: string } = {};
  try {
    shipmentMetadata = shipment.metadataJson ? JSON.parse(shipment.metadataJson) : {};
  } catch {
    shipmentMetadata = {};
  }

  const canEdit = session && ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST"].includes(session.role);

  return (
    <div className="shipment-details-container">
      {/* رأس الصفحة مع زر الرجوع */}
      <div className="details-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div className="header-nav-title">
          <Link href="/dashboard/shipments" className="btn btn-outline back-btn" title="الرجوع للقائمة">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="title-status-row">
              <h1 className="page-title">شحنة رقم {shipment.trackingNumber}</h1>
              <span className={`status-badge ${statusInfo.class} large-badge`}>
                {statusInfo.text}
              </span>
            </div>
            <p className="page-subtitle">تفاصيل الشحنة وأطرافها وحركة التحصيل المالي والسجل التاريخي للعمليات</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href={`/dashboard/shipments/${shipment.id}/print`} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Printer size={16} />
            <span>طباعة البوليصة</span>
          </Link>
          
          {canEdit && (
            <Link href={`/dashboard/shipments/${shipment.id}/edit`} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Edit size={16} />
              <span>تعديل الشحنة</span>
            </Link>
          )}
        </div>
      </div>

      {/* تخطيط الصفحة: عمودين */}
      <div className="details-grid-columns">
        {/* العمود الأيمن: البيانات الثابتة والقطع */}
        <div className="details-right-column">
          {/* مسار تتبع الشحنة المرئي */}
          <ShipmentRouteMap
            currentStatus={shipment.status}
            originProvince={shipment.sender.province.name}
            destProvince={shipment.receiver.province.name}
          />

          {/* بيانات المرسل والمستلم */}
          <div className="dashboard-card parties-card">
            <div className="parties-row">
              {/* المرسل */}
              <div className="party-block">
                <h3 className="section-title-with-icon">
                  <User size={16} className="text-blue" />
                  <span>بيانات المرسل</span>
                </h3>
                <div className="party-details">
                  <span className="party-name">{shipment.sender.name}</span>
                  <div className="party-info-item">
                    <Phone size={14} />
                    <span>{shipment.sender.phone}</span>
                  </div>
                  {shipment.sender.altPhone && (
                    <div className="party-info-item">
                      <Phone size={14} />
                      <span>{shipment.sender.altPhone} (هاتف بديل)</span>
                    </div>
                  )}
                  <div className="party-info-item">
                    <MapPin size={14} />
                    <span>
                      {shipment.sender.province.name} - {shipment.sender.city.name}
                    </span>
                  </div>
                  <div className="party-info-item address-item">
                    <span>{shipment.sender.address}</span>
                  </div>
                  {shipment.sender.landmark && (
                    <p className="party-landmark">معلم: {shipment.sender.landmark}</p>
                  )}
                </div>
              </div>

              <div className="parties-divider"></div>

              {/* المستلم */}
              <div className="party-block">
                <h3 className="section-title-with-icon">
                  <User size={16} className="text-green" />
                  <span>بيانات المستلم</span>
                </h3>
                <div className="party-details">
                  <span className="party-name">{shipment.receiver.name}</span>
                  <div className="party-info-item">
                    <Phone size={14} />
                    <span>{shipment.receiver.phone}</span>
                  </div>
                  {shipment.receiver.altPhone && (
                    <div className="party-info-item">
                      <Phone size={14} />
                      <span>{shipment.receiver.altPhone} (هاتف بديل)</span>
                    </div>
                  )}
                  <div className="party-info-item">
                    <MapPin size={14} />
                    <span>
                      {shipment.receiver.province.name} - {shipment.receiver.city.name}
                    </span>
                  </div>
                  <div className="party-info-item address-item">
                    <span>{shipment.receiver.address}</span>
                  </div>
                  {shipment.receiver.landmark && (
                    <p className="party-landmark">معلم: {shipment.receiver.landmark}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* تفاصيل الشحن والقطع */}
          <div className="dashboard-card specs-card">
            <h3 className="section-title-with-icon">
              <Shield size={16} />
              <span>المواصفات الفنية والمسار</span>
            </h3>

            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-label">فرع المصدر:</span>
                <span className="spec-value">{shipment.originBranch.name}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">فرع الوجهة:</span>
                <span className="spec-value">{shipment.destBranch.name}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">نوع الشحنة:</span>
                <span className="spec-value">
                  {shipment.type === "DOCUMENTS" ? "وثائق ومستندات" : "طرد / كرتون"}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">نوع الخدمة:</span>
                <span className="spec-value">
                  {shipment.serviceType === "URGENT"
                    ? "مستعجل ⚡"
                    : shipment.serviceType === "INSURED"
                    ? "أمانات مؤمنة 🛡️"
                    : "عادي"}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">الوزن الكلي:</span>
                <span className="spec-value">{shipment.weight} كجم</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">أمانة مصرح بها:</span>
                <span className="spec-value">
                  {shipment.declaredValue > 0 ? `${shipment.declaredValue.toLocaleString("ar-YE")} ريال` : "لا يوجد"}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">حساسية الشحنة:</span>
                <span className="spec-value">
                  {shipmentMetadata.isFragile ? "قابلة للكسر - تعامل بحذر" : "شحنة عادية"}
                </span>
              </div>
            </div>

            {shipment.notes && (
              <div className="shipment-notes-block">
                <strong>ملاحظات الشحنة:</strong>
                <p>{shipment.notes}</p>
              </div>
            )}

            {shipmentMetadata.isFragile && (
              <div className="shipment-notes-block" style={{ borderColor: "var(--warning)", backgroundColor: "rgba(245, 158, 11, 0.08)" }}>
                <strong>تنبيه الشحن:</strong>
                <p>هذه الشحنة مسجلة كقابلة للكسر. يوصى بوضعها في أعلى الملصق ومعاملتها بعناية أثناء التحميل والتسليم.</p>
              </div>
            )}
          </div>

          {/* قائمة محتويات الطرد */}
          <div className="dashboard-card items-card">
            <h3 className="section-title-with-icon">
              <Activity size={16} />
              <span>قطع ومحتويات الشحنة ({shipment.items.length})</span>
            </h3>

            <table className="items-table">
              <thead>
                <tr>
                  <th>الوصف</th>
                  <th>الكمية</th>
                  <th>الوزن (كجم)</th>
                  <th>القيمة التقديرية</th>
                </tr>
              </thead>
              <tbody>
                {shipment.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.count}</td>
                    <td>{item.weight} كجم</td>
                    <td>{item.price > 0 ? `${item.price.toLocaleString("ar-YE")} ريال` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* العمود الأيسر: تحديث الحالة، المالية، والخط الزمني للعمليات */}
        <div className="details-left-column">
          {/* تحديث الحالة */}
          <ShipmentStatusUpdater
            shipmentId={shipment.id}
            currentStatus={shipment.status}
            expectedOtp={shipment.otp}
          />

          {/* المالية والتحصيل */}
          <div className="dashboard-card finance-details-card">
            <h3 className="section-title-with-icon">
              <DollarSign size={16} />
              <span>الحساب المالي والتحصيل</span>
            </h3>

            <div className="finance-details-list">
              <div className="finance-detail-row">
                <span className="finance-detail-label">طريقة السداد:</span>
                <span className="finance-detail-value">
                  {shipment.paymentMethod === "CASH_ON_DELIVERY"
                    ? "الدفع عند الاستلام (COD)"
                    : shipment.paymentMethod === "PREPAID"
                    ? "مسبق الدفع"
                    : "آجل حساب عميل"}
                </span>
              </div>

              <div className="finance-detail-row">
                <span className="finance-detail-label">حالة الدفع:</span>
                <span
                  className={`finance-detail-value font-bold ${
                    shipment.paymentStatus === "PAID" ? "text-green" : "text-warning"
                  }`}
                >
                  {shipment.paymentStatus === "PAID" ? "تم السداد والتحصيل" : "غير مدفوع (بانتظار التسليم)"}
                </span>
              </div>

              <div className="finance-detail-row divider-row"></div>

              <div className="finance-detail-row highlight-row">
                <span className="finance-detail-label">رسوم التوصيل:</span>
                <span className="finance-detail-value font-bold text-blue">
                  {shipment.shippingFee.toLocaleString("ar-YE")} ريال
                </span>
              </div>

              {shipment.paymentMethod === "CASH_ON_DELIVERY" && (
                <div className="finance-detail-row highlight-row cod-row-light">
                  <span className="finance-detail-label">مبلغ التحصيل COD:</span>
                  <span className="finance-detail-value font-bold text-warning">
                    {shipment.collectionAmount.toLocaleString("ar-YE")} ريال
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* خط زمني للأحداث */}
          <div className="dashboard-card timeline-card">
            <h3 className="section-title-with-icon">
              <Activity size={16} />
              <span>السجل التاريخي وتتبع الأحداث</span>
            </h3>

            <div className="timeline-container">
              {shipment.events.map((event, idx) => {
                const eventTypeTranslations: Record<string, string> = {
                  CREATED: "تم تسجيل الشحنة واستلامها",
                  RECEIVED_IN_BRANCH: "تم تأكيد الاستلام في الفرع",
                  IN_SORTING: "بدء الفرز والتوزيع",
                  IN_TRANSIT: "شحنت قيد النقل البري",
                  ARRIVED_BRANCH: "وصلت فرع الاستلام",
                  OUT_FOR_DELIVERY: "خرجت للتوصيل النهائي",
                  DELIVERED: "تم تسليم الشحنة بنجاح",
                  RETURNED: "تم إرجاعها للمرسل",
                  CANCELLED: "تم إلغاء الشحنة",
                };

                return (
                  <div key={event.id} className="timeline-item">
                    <div className="timeline-dot-wrapper">
                      <div className={`timeline-dot ${idx === 0 ? "newest-dot" : ""}`}></div>
                      {idx < shipment.events.length - 1 && <div className="timeline-line"></div>}
                    </div>

                    <div className="timeline-content">
                      <div className="timeline-event-header">
                        <span className="timeline-event-name">
                          {eventTypeTranslations[event.eventType] || event.eventType}
                        </span>
                        <span className="timeline-event-date">
                          {new Date(event.createdAt).toLocaleString("ar-YE", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      
                      {event.notes && <p className="timeline-event-notes">{event.notes}</p>}
                      
                      {event.fromUser && (
                        <span className="timeline-operator">
                          المشغل: {event.fromUser.name} ({event.fromUser.role === "RECEPTIONIST" ? "موظف استقبال" : "مدير فرع"})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
