"use client";

import { useState, useMemo, useTransition } from "react";
import { Truck, Phone, Award, Building, Mail, CreditCard, Users, Zap, AlertTriangle, UserX, Trash2, UserCheck as UserCheckIcon, Edit2 } from "lucide-react";
import SearchFilter from "@/components/ui/SearchFilter";
import { toggleUserStatusAction, deleteUserAction, updateDriverAction } from "@/app/actions/users";

interface DriverData {
  id: string;
  status: string;
  vehiclePlate: string | null;
  licenseNumber: string | null;
  rating: number;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    branch: { name: string } | null;
  };
}

interface DriversTableProps {
  drivers: DriverData[];
  branches: { id: string; name: string }[];
}

const statusTranslations: Record<string, { text: string; class: string }> = {
  AVAILABLE: { text: "متاح للتوصيل", class: "status-success" },
  BUSY: { text: "مشغول حالياً", class: "status-warning" },
  OFFLINE: { text: "خارج الخدمة", class: "status-danger" },
};

export default function DriversTable({ drivers }: DriversTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = async (userId: string, name: string, isCurrentlyActive: boolean) => {
    if (confirm(`هل أنت متأكد من تغيير حالة نشاط السائق/المندوب: "${name}"؟`)) {
      startTransition(async () => {
        const res = await toggleUserStatusAction(userId);
        if (res.error) {
          alert(res.error);
        }
      });
    }
  };

  const handleDeleteDriver = async (userId: string, name: string) => {
    if (confirm(`⚠️ تحذير: هل أنت متأكد من حذف السائق/المندوب: "${name}" نهائياً من النظام؟`)) {
      startTransition(async () => {
        const res = await deleteUserAction(userId);
        if (res.error) {
          alert(res.error);
        } else if (res.warning) {
          alert(res.message);
        } else {
          alert(res.message || "تم حذف السائق بنجاح.");
        }
      });
    }
  };

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch = !searchQuery ||
        driver.user.name.includes(searchQuery) ||
        driver.user.email.includes(searchQuery) ||
        driver.user.phone.includes(searchQuery) ||
        (driver.vehiclePlate || "").includes(searchQuery);

      const matchesStatus = statusFilter === "ALL" || driver.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchQuery, statusFilter]);

  const availableCount = drivers.filter(d => d.status === "AVAILABLE").length;
  const busyCount = drivers.filter(d => d.status === "BUSY").length;
  const avgRating = drivers.length > 0 ? (drivers.reduce((s, d) => s + d.rating, 0) / drivers.length).toFixed(1) : "0";

  return (
    <>
      {/* بطاقات إحصائية */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>إجمالي المناديب</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{drivers.length}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--secondary-light)", color: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>جاهزون للتوصيل</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--secondary)" }}>{availableCount}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--warning-light)", color: "var(--warning)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Truck size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>في مهمات توصيل</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--warning)" }}>{busyCount}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>متوسط التقييم</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f59e0b" }}>{avgRating} ⭐</span>
          </div>
        </div>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="dashboard-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <SearchFilter
            placeholder="بحث بالاسم أو رقم اللوحة أو الهاتف..."
            onSearch={setSearchQuery}
          />
          <div className="form-group" style={{ marginBottom: 0, minWidth: "160px" }}>
            <label className="form-label" style={{ fontSize: "0.8rem" }}>الحالة التشغيلية</label>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: "42px", fontSize: "0.9rem" }}
            >
              <option value="ALL">الكل</option>
              <option value="AVAILABLE">متاح</option>
              <option value="BUSY">مشغول</option>
              <option value="OFFLINE">خارج الخدمة</option>
            </select>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, paddingBottom: "0.5rem" }}>
            عرض {filteredDrivers.length} من {drivers.length}
          </div>
        </div>
      </div>

      {/* جدول السائقين */}
      <div className="dashboard-card table-container">
        {filteredDrivers.length === 0 ? (
          <div className="empty-state">
            <Truck size={48} className="empty-icon" />
            <p>{searchQuery || statusFilter !== "ALL" ? "لا توجد نتائج تطابق معايير البحث" : "لا يوجد سائقين أو مناديب مسجلين حالياً في النظام."}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم السائق</th>
                <th>رقم الهاتف</th>
                <th>البريد الإلكتروني</th>
                <th>رقم لوحة المركبة</th>
                <th>رقم الرخصة</th>
                <th>الفرع المرتبط</th>
                <th>التقييم</th>
                <th>الحالة التشغيلية</th>
                <th className="no-print" style={{ textAlign: "center", width: "130px" }}>التحكم بالإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver) => {
                const statusInfo = statusTranslations[driver.status] || {
                  text: driver.status,
                  class: "",
                };
                const isCurrentlyActive = driver.status !== "OFFLINE";
                return (
                  <tr key={driver.id} style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
                    <td className="tracking-cell" style={{ color: "var(--text)" }}>{driver.user.name}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Phone size={14} style={{ color: "var(--text-muted)" }} />
                        <span>{driver.user.phone}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Mail size={14} style={{ color: "var(--text-muted)" }} />
                        <span>{driver.user.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 700 }}>
                        <CreditCard size={14} style={{ color: "var(--text-muted)" }} />
                        <span>{driver.vehiclePlate || "—"}</span>
                      </div>
                    </td>
                    <td>{driver.licenseNumber || "—"}</td>
                    <td>
                      {driver.user.branch ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Building size={14} style={{ color: "var(--text-muted)" }} />
                          <span>{driver.user.branch.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>إدارة عامة</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--warning)", fontWeight: 700 }}>
                        <Award size={14} />
                        <span>{driver.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${statusInfo.class}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="no-print">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                        {/* تفعيل/تعطيل */}
                        <button
                          onClick={() => handleToggleStatus(driver.user.id, driver.user.name, isCurrentlyActive)}
                          disabled={isPending}
                          className={`btn ${isCurrentlyActive ? "btn-outline" : "btn-primary"}`}
                          style={{
                            padding: "0.35rem 0.5rem",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            minWidth: "75px",
                            justifyContent: "center",
                            borderColor: isCurrentlyActive ? "#f59e0b" : "var(--primary)",
                            color: isCurrentlyActive ? "#d97706" : "#fff",
                            backgroundColor: isCurrentlyActive ? "rgba(245, 158, 11, 0.04)" : "var(--primary)",
                          }}
                          title={isCurrentlyActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                        >
                          {isCurrentlyActive ? <UserX size={13} /> : <UserCheckIcon size={13} />}
                          <span>{isCurrentlyActive ? "تعطيل" : "تفعيل"}</span>
                        </button>

                        {/* حذف نهائي */}
                        <button
                          onClick={() => handleDeleteDriver(driver.user.id, driver.user.name)}
                          disabled={isPending}
                          className="btn btn-outline"
                          style={{
                            padding: "0.35rem",
                            borderColor: "#ef4444",
                            color: "#ef4444",
                            backgroundColor: "rgba(239, 68, 68, 0.04)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="حذف السائق نهائياً"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
