import prisma from "@/lib/prisma";
import Link from "next/link";
import { Search, AlertTriangle, Activity, MapPin, Calendar, Clock } from "lucide-react";
import ShipmentRouteMap from "@/components/ui/ShipmentRouteMap";

export const revalidate = 0; // إيقاف الكاش

type SearchParams = Promise<{ num?: string }>;

export default async function PublicTrackPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const num = typeof searchParams.num === "string" ? searchParams.num.trim() : "";

  let shipment = null;
  let error = false;

  if (num) {
    shipment = await prisma.shipment.findUnique({
      where: { trackingNumber: num },
      include: {
        originBranch: true,
        destBranch: true,
        sender: {
          include: { province: true },
        },
        receiver: {
          include: { province: true },
        },
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!shipment) {
      error = true;
    }
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

  const statusInfo = shipment ? (statusTranslations[shipment.status] || { text: shipment.status, class: "" }) : null;

  return (
    <div className="public-track-layout">
      {/* رأس الصفحة العام */}
      <header className="public-track-header">
        <div className="header-container">
          <Link href="/" className="public-logo">
            <div className="logo-icon">W</div>
            <span className="logo-text">وصّـل</span>
          </Link>
          <Link href="/login" className="btn btn-outline btn-sm login-link-btn">
            <span>دخول الموظفين</span>
          </Link>
        </div>
      </header>

      <main className="public-track-main">
        <div className="track-container">
          <div className="track-search-card dashboard-card">
            <h1 className="track-title">تتبع شحنتك</h1>
            <p className="track-subtitle">أدخل رقم التتبع الخاص بالطرد الخاص بك لمعرفة حالته وموقعه الحالي فوراً</p>

            <form action="/track" method="GET" className="track-form">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  name="num"
                  className="form-input search-input-field public-track-input"
                  placeholder="مثال: WSL12345678"
                  required
                  defaultValue={num}
                />
                <Search size={20} className="search-input-icon" />
              </div>
              <button type="submit" className="btn btn-primary track-submit-btn">
                <span>تتبع الآن</span>
              </button>
            </form>
          </div>

          {error && (
            <div className="dashboard-card error-card">
              <AlertTriangle size={32} className="text-red" />
              <div>
                <h3 className="error-title">رقم التتبع غير موجود</h3>
                <p className="error-desc">لم نتمكن من العثور على أي شحنة مسجلة برقم التتبع: {num}. يرجى التحقق من الرقم والمحاولة مرة أخرى.</p>
              </div>
            </div>
          )}

          {shipment && statusInfo && (
            <div className="track-results">
              {/* مسار تتبع الشحنة المرئي */}
              <ShipmentRouteMap
                currentStatus={shipment.status}
                originProvince={shipment.sender.province.name}
                destProvince={shipment.receiver.province.name}
              />

              {/* بطاقة ملخص الشحنة العام */}
              <div className="dashboard-card result-summary-card">
                <div className="summary-header">
                  <div>
                    <span className="summary-number-label">رقم التتبع للشحنة:</span>
                    <h2 className="summary-number">{shipment.trackingNumber}</h2>
                  </div>
                  <span className={`status-badge ${statusInfo.class} large-badge`}>
                    {statusInfo.text}
                  </span>
                </div>

                <div className="summary-grid">
                  <div className="summary-item">
                    <MapPin size={18} />
                    <div className="summary-item-data">
                      <span className="summary-item-label">فرع المصدر:</span>
                      <span className="summary-item-val">{shipment.originBranch.name}</span>
                    </div>
                  </div>

                  <div className="summary-item">
                    <MapPin size={18} />
                    <div className="summary-item-data">
                      <span className="summary-item-label">فرع الوجهة:</span>
                      <span className="summary-item-val">{shipment.destBranch.name}</span>
                    </div>
                  </div>

                  <div className="summary-item">
                    <Calendar size={18} />
                    <div className="summary-item-data">
                      <span className="summary-item-label">تاريخ التسجيل:</span>
                      <span className="summary-item-val">
                        {new Date(shipment.createdAt).toLocaleDateString("ar-YE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* خط تتبع الأحداث العام (يحمي الخصوصية بالكامل) */}
              <div className="dashboard-card public-timeline-card">
                <h3 className="section-title-with-icon">
                  <Activity size={18} />
                  <span>مسار حركة الشحنة</span>
                </h3>

                <div className="timeline-container public-timeline">
                  {shipment.events.map((event, idx) => {
                    const eventTypeTranslations: Record<string, string> = {
                      CREATED: "تم تسجيل الشحنة واستلامها في فرع المصدر",
                      RECEIVED_IN_BRANCH: "تم تأكيد فحص واستلام الشحنة في الفرع",
                      IN_SORTING: "تجهيز الشحنة وتغليفها للشحن البري",
                      IN_TRANSIT: "الشحنة مغادرة قيد النقل البري بين المحافظات",
                      ARRIVED_BRANCH: "وصلت الشحنة إلى فرع الوجهة بنجاح",
                      OUT_FOR_DELIVERY: "خرجت الشحنة مع المندوب للتسليم النهائي",
                      DELIVERED: "تم تسليم الشحنة بنجاح للمستلم",
                      RETURNED: "تم إرجاع الشحنة للمرسل",
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="public-track-footer">
        <p>منصة وصّل للخدمات اللوجستية والتوصيل والأمانات &copy; {new Date().getFullYear()}</p>
        <p className="footer-sub">منظومة نقل ذكية ومتكاملة تغطي كافة محافظات الجمهورية اليمنية</p>
      </footer>
    </div>
  );
}
