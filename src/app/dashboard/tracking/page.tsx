import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Search, AlertTriangle, SearchCode } from "lucide-react";

export const revalidate = 0;

type SearchParams = Promise<{ q?: string }>;

export default async function InternalTrackingPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  let error = false;

  if (q) {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber: q },
    });

    if (shipment) {
      redirect(`/dashboard/shipments/${shipment.id}`);
    } else {
      error = true;
    }
  }

  return (
    <div className="internal-track-container" style={{ maxWidth: "600px", margin: "3rem auto" }}>
      <div className="dashboard-card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", padding: "1rem", background: "var(--primary-light)", borderRadius: "50%", color: "var(--primary)", marginBottom: "1.5rem" }}>
          <SearchCode size={36} />
        </div>
        
        <h1 className="page-title" style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          البحث والتتبع السريع للشحنات
        </h1>
        <p className="page-subtitle" style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>
          أدخل رقم التتبع للانتقال المباشر لصفحة تفاصيل الشحنة وتحديث حالتها أو طباعة الملصق
        </p>

        <form action="/dashboard/tracking" method="GET" style={{ display: "flex", gap: "1rem" }}>
          <div className="search-input-wrapper" style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              name="q"
              className="form-input search-input-field"
              placeholder="مثال: WSL12345678"
              required
              defaultValue={q}
              style={{ paddingLeft: "2.5rem" }}
            />
            <Search size={18} className="search-input-icon" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>
          <button type="submit" className="btn btn-primary">
            <span>تتبع الشحنة</span>
          </button>
        </form>

        {error && (
          <div className="error-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem", marginTop: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)", textAlign: "right" }}>
            <AlertTriangle size={24} className="text-red" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontWeight: 700, color: "var(--danger)", fontSize: "0.95rem", marginBottom: "0.15rem" }}>
                عذراً، لم يتم العثور على الشحنة
              </h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                تأكد من صحة رقم التتبع المكتوب: &quot;{q}&quot; وأنه مسجل في النظام.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
