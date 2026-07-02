import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/app/actions/auth";
import PrintActions from "@/components/ui/PrintActions";
import ShipmentBarcode from "@/components/ui/ShipmentBarcode";
import QRCode from "qrcode";
import { AlertTriangle, BadgeCheck, FileText, Package, ShieldCheck, Truck } from "lucide-react";

export const revalidate = 0;

type Params = Promise<{ id: string }>;

function safeParseMetadata(metadataJson: string | null | undefined) {
  try {
    return metadataJson ? JSON.parse(metadataJson) : {};
  } catch {
    return {};
  }
}

function getTypeLabel(type: string) {
  if (type === "DOCUMENTS") return "مستندات / وثائق";
  if (type === "SECURE_PARCEL") return "أمانة ثمينة";
  return "طرد / كرتون";
}

function getTypeHint(type: string, isFragile?: boolean) {
  if (isFragile) return "قابل للكسر - تعامل بحذر شديد";
  if (type === "DOCUMENTS") return "يُحفظ مستويا ويمنع الثني أو البلل";
  if (type === "SECURE_PARCEL") return "أمانة مغلقة - لا تفتح إلا للمعني";
  return "شحنة عادية - تُعامل وفق إجراءات النقل المعتادة";
}

function getServiceLabel(serviceType: string) {
  if (serviceType === "URGENT") return "شحن مستعجل";
  if (serviceType === "INSURED") return "شحن مؤمّن";
  if (serviceType === "RETURN_SERVICE") return "خدمة إرجاع";
  return "شحن عادي";
}

export default async function PrintWaybillPage(props: { params: Params }) {
  const { id } = await props.params;

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      sender: { include: { province: true, city: true } },
      receiver: { include: { province: true, city: true } },
      originBranch: true,
      destBranch: true,
      items: true,
      createdBy: true,
    },
  });

  if (!shipment) {
    notFound();
  }

  const metadata = safeParseMetadata(shipment.metadataJson) as { isFragile?: boolean; labelStyle?: string };
  const isFragile = Boolean(metadata.isFragile);
  const TRACK_BASE =
    process.env.NEXT_PUBLIC_TRACK_URL || process.env.NEXT_PUBLIC_APP_URL ||
    "https://wassal-logistics-platform-sand.vercel.app";

  const qrDataUrl = await QRCode.toDataURL(
    `${TRACK_BASE}/track?num=${encodeURIComponent(shipment.trackingNumber)}`,
    { margin: 1, width: 240 }
  );

  return (
    <div
      className="print-page-wrapper"
      style={{
        direction: "rtl",
        fontFamily: "var(--font-cairo), sans-serif",
        padding: "1.25rem",
        maxWidth: "900px",
        margin: "0 auto",
        backgroundColor: "#fff",
        color: "#0f172a",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4; margin: 10mm; }
              .no-print { display: none !important; }
              body { background: #fff !important; color: #000 !important; }
              .print-shell { box-shadow: none !important; border-color: #000 !important; }
              .label-shell { break-inside: avoid; page-break-inside: avoid; }
            }
            .print-shell {
              border: 1.5px solid #cbd5e1;
              border-radius: 18px;
              overflow: hidden;
              background: #fff;
              box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
            }
            .print-header {
              display: grid;
              grid-template-columns: 1.5fr 1fr;
              gap: 1rem;
              padding: 1.1rem 1.25rem;
              background: linear-gradient(135deg, rgba(30, 58, 138, 0.08), rgba(16, 185, 129, 0.06));
              border-bottom: 1px solid #e2e8f0;
            }
            .brand-badge {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.4rem 0.75rem;
              border-radius: 9999px;
              background: #0f172a;
              color: #fff;
              font-size: 0.8rem;
              font-weight: 700;
              width: fit-content;
            }
            .label-title {
              font-size: 1.25rem;
              font-weight: 900;
              margin: 0.45rem 0 0.25rem 0;
              letter-spacing: 0.2px;
            }
            .label-subtitle {
              font-size: 0.82rem;
              color: #475569;
              line-height: 1.6;
            }
            .top-meta-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.75rem;
            }
            .meta-box {
              border-radius: 14px;
              border: 1px solid #e2e8f0;
              padding: 0.75rem;
              background: rgba(255, 255, 255, 0.7);
            }
            .meta-label {
              font-size: 0.72rem;
              color: #64748b;
              font-weight: 700;
              margin-bottom: 0.2rem;
            }
            .meta-value {
              font-size: 0.95rem;
              font-weight: 800;
              color: #0f172a;
            }
            .label-grid {
              display: grid;
              grid-template-columns: 1.25fr 0.75fr;
              gap: 1rem;
              padding: 1.25rem;
            }
            .section-card {
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 1rem;
              background: #fff;
            }
            .section-heading {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.85rem;
              font-weight: 800;
              color: #334155;
              margin-bottom: 0.9rem;
              padding-bottom: 0.55rem;
              border-bottom: 1px solid #e2e8f0;
            }
            .identity-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.75rem;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              gap: 0.75rem;
              padding: 0.55rem 0;
              border-bottom: 1px dashed #e2e8f0;
              font-size: 0.88rem;
            }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #64748b; font-weight: 700; }
            .detail-value { color: #0f172a; font-weight: 800; text-align: left; }
            .warning-box {
              border: 1.5px solid #f59e0b;
              border-right-width: 5px;
              border-radius: 16px;
              padding: 0.9rem 1rem;
              background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(254, 243, 199, 0.65));
              margin-top: 1rem;
            }
            .warning-title {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.85rem;
              font-weight: 900;
              color: #b45309;
              margin-bottom: 0.35rem;
            }
            .warning-text {
              font-size: 0.82rem;
              color: #7c2d12;
              line-height: 1.7;
            }
            .barcode-panel {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 1rem 0.75rem;
              background: #fff;
            }
            .tracking-pill {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 0.35rem 0.65rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 900;
              border: 1px solid #cbd5e1;
              margin-bottom: 0.75rem;
            }
            .badge-chip {
              display: inline-flex;
              align-items: center;
              gap: 0.35rem;
              padding: 0.3rem 0.6rem;
              border-radius: 9999px;
              font-size: 0.74rem;
              font-weight: 800;
              width: fit-content;
            }
            .badge-chip.blue { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
            .badge-chip.green { background: rgba(16, 185, 129, 0.12); color: #047857; }
            .badge-chip.orange { background: rgba(245, 158, 11, 0.14); color: #b45309; }
            .badge-chip.red { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }
            .sender-receiver {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.75rem;
            }
            .party-card {
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              padding: 0.85rem;
              background: #fff;
            }
            .party-name {
              font-weight: 900;
              font-size: 0.95rem;
              margin-bottom: 0.3rem;
            }
            .party-meta {
              font-size: 0.76rem;
              color: #475569;
              line-height: 1.7;
            }
            .footer-row {
              display: flex;
              justify-content: space-between;
              gap: 1rem;
              padding: 0.9rem 1.25rem 1.25rem;
              border-top: 1px solid #e2e8f0;
              font-size: 0.75rem;
              color: #64748b;
            }
          `,
        }}
      />

      <div className="no-print" style={{ marginBottom: "1rem" }}>
        <PrintActions shipmentId={shipment.id} />
      </div>

      <div className="print-shell label-shell">
        <div className="print-header">
          <div>
            <div className="brand-badge">
              <Truck size={14} />
              <span>منصة وصّل اللوجستية</span>
            </div>
            <h1 className="label-title">ملصق الشحنة والباركود</h1>
            <p className="label-subtitle">
              ملصق جاهز للطباعة يحتوي على رقم التتبع، QR، الباركود، ونوع الشحنة مع تعليمات المعالجة.
            </p>
          </div>

          <div className="top-meta-grid">
            <div className="meta-box">
              <div className="meta-label">رقم التتبع</div>
              <div className="meta-value">{shipment.trackingNumber}</div>
            </div>
            <div className="meta-box">
              <div className="meta-label">تاريخ التسجيل</div>
              <div className="meta-value">{new Date(shipment.createdAt).toLocaleDateString("ar-YE")}</div>
            </div>
            <div className="meta-box">
              <div className="meta-label">الحالة</div>
              <div className="meta-value">{shipment.status}</div>
            </div>
            <div className="meta-box">
              <div className="meta-label">نوع الخدمة</div>
              <div className="meta-value">{getServiceLabel(shipment.serviceType)}</div>
            </div>
          </div>
        </div>

        <div className="label-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="section-card">
              <div className="section-heading">
                <Package size={14} />
                <span>ملخص الشحنة</span>
              </div>

              <div className="identity-grid">
                <div className="detail-row">
                  <span className="detail-label">نوع الشحنة</span>
                  <span className="detail-value">{getTypeLabel(shipment.type)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">الوزن</span>
                  <span className="detail-value">{shipment.weight.toFixed(1)} كجم</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">عدد القطع</span>
                  <span className="detail-value">{shipment.items.length} قطعة</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">رسوم الشحن</span>
                  <span className="detail-value">{shipment.shippingFee.toLocaleString("ar-YE")} ريال</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">طريقة السداد</span>
                  <span className="detail-value">
                    {shipment.paymentMethod === "CASH_ON_DELIVERY"
                      ? "عند الاستلام"
                      : shipment.paymentMethod === "PREPAID"
                      ? "مدفوع مقدماً"
                      : "آجل على الحساب"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">مبلغ COD</span>
                  <span className="detail-value">
                    {shipment.paymentMethod === "CASH_ON_DELIVERY"
                      ? `${shipment.collectionAmount.toLocaleString("ar-YE")} ريال`
                      : "لا يوجد"}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "0.85rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <span className={`badge-chip ${shipment.type === "DOCUMENTS" ? "blue" : shipment.type === "SECURE_PARCEL" ? "green" : "orange"}`}>
                  {shipment.type === "DOCUMENTS" ? <FileText size={12} /> : <ShieldCheck size={12} />}
                  <span>{getTypeLabel(shipment.type)}</span>
                </span>
                <span className={`badge-chip ${shipment.serviceType === "URGENT" ? "red" : shipment.serviceType === "INSURED" ? "green" : "blue"}`}>
                  <BadgeCheck size={12} />
                  <span>{getServiceLabel(shipment.serviceType)}</span>
                </span>
                {isFragile && (
                  <span className="badge-chip red">
                    <AlertTriangle size={12} />
                    <span>قابل للكسر</span>
                  </span>
                )}
              </div>

              <div className="warning-box">
                <div className="warning-title">
                  <AlertTriangle size={14} />
                  <span>{isFragile ? "تعليمات كسر" : "تعليمات المعالجة"}</span>
                </div>
                <div className="warning-text">{getTypeHint(shipment.type, isFragile)}</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-heading">
                <Truck size={14} />
                <span>المسار</span>
              </div>

              <div className="identity-grid">
                <div className="detail-row">
                  <span className="detail-label">فرع المصدر</span>
                  <span className="detail-value">{shipment.originBranch.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">فرع الوجهة</span>
                  <span className="detail-value">{shipment.destBranch.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">المرسل</span>
                  <span className="detail-value">{shipment.sender.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">المستلم</span>
                  <span className="detail-value">{shipment.receiver.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="barcode-panel">
              <div className="tracking-pill">Barcode</div>
              <ShipmentBarcode value={shipment.trackingNumber} />
            </div>

            <div className="barcode-panel">
              <div className="tracking-pill">QR</div>
              <Image src={qrDataUrl} alt="QR Code" width={160} height={160} unoptimized />
              <div style={{ marginTop: "0.7rem", fontSize: "0.78rem", color: "#64748b", fontWeight: 700 }}>
                امسح الكود لتتبع الشحنة
              </div>
            </div>

            <div className="section-card">
              <div className="section-heading">
                <ShieldCheck size={14} />
                <span>ملاحظات ومحتوى</span>
              </div>

              {shipment.notes ? (
                <div className="detail-row" style={{ alignItems: "flex-start" }}>
                  <span className="detail-label">ملاحظات الشحن</span>
                  <span className="detail-value" style={{ textAlign: "right", lineHeight: 1.8 }}>
                    {shipment.notes}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>لا توجد ملاحظات إضافية.</div>
              )}

              <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.5rem" }}>
                {shipment.sender.landmark && (
                  <div className="detail-row">
                    <span className="detail-label">معلم المرسل</span>
                    <span className="detail-value">{shipment.sender.landmark}</span>
                  </div>
                )}
                {shipment.receiver.landmark && (
                  <div className="detail-row">
                    <span className="detail-label">معلم المستلم</span>
                    <span className="detail-value">{shipment.receiver.landmark}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">عدد العناصر</span>
                  <span className="detail-value">{shipment.items.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isFragile && (
          <div style={{ padding: "0 1.25rem 1.25rem" }}>
            <div className="warning-box" style={{ marginTop: 0 }}>
              <div className="warning-title">
                <AlertTriangle size={14} />
                <span>تنبيه ملصق الكسور</span>
              </div>
              <div className="warning-text">
                هذه الشحنة تحتاج وضع ملصق ظاهر على أعلى الطرد، وعدم رصها تحت الأوزان الثقيلة، وتسجيل ملاحظة الحذر لدى المندوب.
              </div>
            </div>
          </div>
        )}

        <div className="footer-row">
          <span>الموظف المسجل: {shipment.createdBy.name}</span>
          <span>منصة وصّل © {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
