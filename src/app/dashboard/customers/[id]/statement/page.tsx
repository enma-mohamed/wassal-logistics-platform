import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import StatementPrintActions from "@/components/ui/StatementPrintActions";
import { DollarSign, Package, CheckCircle2 } from "lucide-react";

export const revalidate = 0;

type Params = Promise<{ id: string }>;

export default async function CustomerStatementPage(props: { params: Params }) {
  const { id } = await props.params;

  // التحقق من المصادقة والصلاحيات
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // جلب بيانات العميل وشحناته المرسلة بالكامل
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      province: true,
      city: true,
      sentShipments: {
        include: {
          destBranch: true,
          originBranch: true,
          receiver: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  // العمليات الحسابية لكشف الحساب
  const sentShipments = customer.sentShipments;
  const totalSent = sentShipments.length;
  
  // شحنات تم تسليمها بنجاح (المبالغ المحصلة)
  const deliveredShipments = sentShipments.filter(s => s.status === "DELIVERED");
  const deliveredCount = deliveredShipments.length;

  // إجمالي مبالغ COD المستلمة فعلياً من المستلمين
  const totalCODCollected = deliveredShipments.reduce((sum, s) => {
    if (s.paymentMethod === "CASH_ON_DELIVERY") {
      return sum + s.collectionAmount;
    }
    return sum;
  }, 0);

  // إجمالي رسوم التوصيل المستحقة للنظام عن جميع الشحنات المرسلة (سواء تم تسليمها أو لا، حسب سياسة التوصيل)
  // أو فقط للشحنات غير الملغاة. دعنا نحسبها لجميع الشحنات باستثناء المرتجعة/الملغاة ليكون واقعياً ومحاسبياً
  const activeShipmentsForFees = sentShipments.filter(s => s.status !== "CANCELLED");
  const totalShippingFees = activeShipmentsForFees.reduce((sum, s) => sum + s.shippingFee, 0);

  // صافي مستحقات التاجر (التحصيل COD ناقص رسوم التوصيل)
  const netMerchantPayout = totalCODCollected - totalShippingFees;

  const statusTranslations: Record<string, string> = {
    PENDING_RECEIVE: "قيد انتظار الاستلام",
    RECEIVED_IN_BRANCH: "مستلم بالفرع",
    IN_SORTING: "في الفرز والتجهيز",
    IN_TRANSIT: "قيد النقل والتوصيل",
    ARRIVED_BRANCH: "وصلت فرع الوجهة",
    OUT_FOR_DELIVERY: "مع المندوب للتسليم",
    DELIVERED: "تم التسليم بنجاح",
    RETURNED: "مرتجعة للمرسل",
    CANCELLED: "ملغاة",
  };

  return (
    <div className="print-page-wrapper" style={{ direction: "rtl", fontFamily: "var(--font-cairo), sans-serif", padding: "1.5rem", maxWidth: "900px", margin: "0 auto", backgroundColor: "#fff", color: "#000" }}>
      {/* ستايلات مخصصة للطباعة وكشف الحساب */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background-color: #fff !important;
              color: #000 !important;
            }
            .statement-container {
              border: 1px solid #000 !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
          }
          .statement-container {
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            background-color: #fff;
            box-shadow: var(--shadow-sm);
          }
          .ledger-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1.5rem;
            font-size: 0.85rem;
          }
          .ledger-table th, .ledger-table td {
            border: 1px solid #cbd5e1;
            padding: 0.65rem 0.5rem;
            text-align: right;
          }
          .ledger-table th {
            background-color: #f1f5f9;
            font-weight: bold;
          }
          .ledger-card-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .summary-item-box {
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
          }
          .summary-item-box.success {
            background-color: #f0fdf4;
            border-color: #bbf7d0;
          }
          .summary-item-box.warning {
            background-color: #fffbeb;
            border-color: #fef3c7;
          }
          .summary-item-box.primary {
            background-color: #eff6ff;
            border-color: #bfdbfe;
          }
        `
      }} />

      {/* شريط الإجراءات والرجوع */}
      <StatementPrintActions />

      {/* كشف الحساب المالي الرئيسي */}
      <div className="statement-container">
        {/* الهيدر */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0 }}>منصة وصّـل للخدمات اللوجستية</h1>
            <span style={{ fontSize: "0.75rem", color: "#475569" }}>كشف حساب وتصفية مالية للعملاء والتجار</span>
          </div>
          <div style={{ textAlign: "left" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#1e3a8a" }}>كشف حساب عميل</h2>
            <span style={{ fontSize: "0.7rem", color: "#475569" }}>تاريخ الإصدار: {new Date().toLocaleDateString("ar-YE")}</span>
          </div>
        </div>

        {/* تفاصيل العميل */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", border: "1px solid #cbd5e1", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", backgroundColor: "#f8fafc" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "bold" }}>العميل / التاجر:</span>
            <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#000" }}>{customer.name}</div>
            <div style={{ fontSize: "0.9rem" }}>رقم الهاتف: {customer.phone}</div>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "bold" }}>الموقع والعنوان:</span>
            <div style={{ fontSize: "0.95rem", fontWeight: "bold" }}>{customer.province.name} - {customer.city.name}</div>
            <div style={{ fontSize: "0.85rem", color: "#475569" }}>{customer.address}</div>
          </div>
        </div>

        {/* الصناديق الملخصة للحساب المالي */}
        <div className="ledger-card-summary">
          <div className="summary-item-box warning">
            <span style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: "bold" }}>إجمالي التحصيل COD</span>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#b45309", margin: "0.25rem 0" }}>
              {totalCODCollected.toLocaleString("ar-YE")} <span style={{ fontSize: "0.85rem" }}>ريال</span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#475569" }}>مبالغ مستلمة من {deliveredCount} شحنات مسلّمة</span>
          </div>

          <div className="summary-item-box primary">
            <span style={{ fontSize: "0.75rem", color: "#1d4ed8", fontWeight: "bold" }}>رسوم التوصيل والخدمات</span>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1d4ed8", margin: "0.25rem 0" }}>
              {totalShippingFees.toLocaleString("ar-YE")} <span style={{ fontSize: "0.85rem" }}>ريال</span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#475569" }}>رسوم {totalSent} شحنات مرسلة نشطة</span>
          </div>

          <div className="summary-item-box success">
            <span style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: "bold" }}>صافي مستحقات التاجر</span>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#15803d", margin: "0.25rem 0" }}>
              {netMerchantPayout.toLocaleString("ar-YE")} <span style={{ fontSize: "0.85rem" }}>ريال</span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#475569" }}>المبلغ المستحق للتسوية والتسليم</span>
          </div>
        </div>

        {/* جدول حركات الشحنات */}
        <h3 style={{ margin: "1.5rem 0 0.5rem 0", fontSize: "1rem", borderBottom: "2px solid #cbd5e1", paddingBottom: "0.5rem" }}>كشف الشحنات التفصيلي</h3>
        {sentShipments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#475569" }}>لا توجد شحنات مرسلة لهذا العميل حتى الآن.</div>
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>رقم التتبع</th>
                <th>المستلم</th>
                <th>الوجهة</th>
                <th>نوع الدفع</th>
                <th>حالة الشحنة</th>
                <th>مبلغ COD (ريال)</th>
                <th>رسوم الشحن (ريال)</th>
                <th>صافي الناتج (ريال)</th>
                <th>تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {sentShipments.map((s) => {
                const isDelivered = s.status === "DELIVERED";
                const isCOD = s.paymentMethod === "CASH_ON_DELIVERY";
                
                // حساب الحقل المالي لكل شحنة مستقلة
                // إذا تم تسليم الشحنة و هي COD يكون الناتج الإيجابي للتاجر هو مبلغ COD ناقص رسوم الشحن.
                // إذا كانت غير مسلّمة أو ليست COD، يكون الناتج سلبياً برسم التوصيل (المترتب عليه).
                let netPayout = 0;
                if (isDelivered && isCOD) {
                  netPayout = s.collectionAmount - s.shippingFee;
                } else if (s.status !== "CANCELLED") {
                  netPayout = -s.shippingFee;
                }

                return (
                  <tr key={s.id} style={{ backgroundColor: isDelivered ? "#f0fdf4" : "transparent" }}>
                    <td style={{ fontWeight: "bold" }}>{s.trackingNumber}</td>
                    <td>{s.receiver.name}</td>
                    <td>{s.destBranch.name}</td>
                    <td>{isCOD ? "COD" : "مسبق"}</td>
                    <td style={{ fontWeight: "bold", color: isDelivered ? "#15803d" : "#000" }}>
                      {statusTranslations[s.status] || s.status}
                    </td>
                    <td>{isCOD ? s.collectionAmount.toLocaleString("ar-YE") : "—"}</td>
                    <td>{s.shippingFee.toLocaleString("ar-YE")}</td>
                    <td style={{ fontWeight: "bold", color: netPayout > 0 ? "#15803d" : netPayout < 0 ? "#b91c1c" : "#000" }}>
                      {netPayout > 0 ? `+${netPayout.toLocaleString("ar-YE")}` : netPayout === 0 ? "0" : netPayout.toLocaleString("ar-YE")}
                    </td>
                    <td>
                      {new Date(s.createdAt).toLocaleDateString("ar-YE", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* قسم التوقيعات القانونية للتصفية */}
        <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", borderTop: "1px dashed #cbd5e1", paddingTop: "2rem" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>توقيع محاسب النظام (وصّـل)</span>
            <div style={{ height: "60px" }}></div>
            <span>________________________</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>توقيع العميل / التاجر المستلم</span>
            <div style={{ height: "60px" }}></div>
            <span>________________________</span>
          </div>
        </div>
      </div>
    </div>
  );
}
