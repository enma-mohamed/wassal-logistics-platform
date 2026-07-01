import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users, Phone, MapPin, PackageMinus, PackagePlus, DollarSign } from "lucide-react";
import ExportTableButton from "@/components/ui/ExportTableButton";

export const revalidate = 0;

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      province: true,
      city: true,
      _count: {
        select: {
          sentShipments: true,
          receivedShipments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const customersForExport = customers.map((c) => ({
    name: c.name,
    phone: c.phone,
    altPhone: c.altPhone || "—",
    location: `${c.province.name} - ${c.city.name}`,
    address: `${c.address} ${c.landmark ? `(معلم: ${c.landmark})` : ""}`,
    sentCount: c._count.sentShipments,
    receivedCount: c._count.receivedShipments,
    createdAt: new Date(c.createdAt).toLocaleDateString("ar-YE"),
  }));

  const exportHeaders = {
    name: "اسم العميل",
    phone: "رقم الهاتف",
    altPhone: "الهاتف البديل",
    location: "الموقع (المحافظة - المدينة)",
    address: "العنوان بالتفصيل",
    sentCount: "شحنات مرسلة",
    receivedCount: "شحنات مستلمة",
    createdAt: "تاريخ التسجيل",
  };

  return (
    <div className="customers-page-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">إدارة العملاء</h1>
          <p className="page-subtitle">عرض وتتبع قائمة المرسلين والمستقبلين المسجلين في منصة وصّل وإحصائيات شحناتهم والتقارير المالية</p>
        </div>
        <ExportTableButton data={customersForExport} headers={exportHeaders} fileName="wassal-customers" buttonText="تصدير العملاء Excel" />
      </div>

      <div className="dashboard-card table-container">
        {customers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <p>لا يوجد عملاء مسجلين حالياً في النظام.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم العميل</th>
                <th>رقم الهاتف</th>
                <th>الهاتف البديل</th>
                <th>المنطقة والموقع</th>
                <th>العنوان بالتفصيل</th>
                <th>شحنات مرسلة</th>
                <th>شحنات مستلمة</th>
                <th>تاريخ التسجيل</th>
                <th style={{ textAlign: "center" }}>الحساب المالي</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="tracking-cell" style={{ color: "var(--text)" }}>{customer.name}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Phone size={14} style={{ color: "var(--text-muted)" }} />
                      <span>{customer.phone}</span>
                    </div>
                  </td>
                  <td>{customer.altPhone || "—"}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <MapPin size={14} style={{ color: "var(--text-muted)" }} />
                      <span>{customer.province.name} - {customer.city.name}</span>
                    </div>
                  </td>
                  <td>{customer.address} {customer.landmark ? `(معلم: ${customer.landmark})` : ""}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--primary)", fontWeight: 700 }}>
                      <PackageMinus size={16} />
                      <span>{customer._count.sentShipments} شحنة</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--secondary)", fontWeight: 700 }}>
                      <PackagePlus size={16} />
                      <span>{customer._count.receivedShipments} شحنة</span>
                    </div>
                  </td>
                  <td className="date-cell">
                    {new Date(customer.createdAt).toLocaleDateString("ar-YE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Link
                      href={`/dashboard/customers/${customer.id}/statement`}
                      className="btn btn-outline"
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", whiteSpace: "nowrap" }}
                    >
                      <DollarSign size={14} style={{ color: "var(--warning)" }} />
                      <span>كشف حساب</span>
                    </Link>
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
