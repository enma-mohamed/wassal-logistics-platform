"use client";

import { useState, useMemo } from "react";
import { Building, Phone, MapPin, Users, Package, CheckCircle } from "lucide-react";
import SearchFilter from "@/components/ui/SearchFilter";

interface BranchData {
  id: string;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
  province: {
    name: string;
  };
  manager: {
    name: string;
  } | null;
  _count: {
    employees: number;
    originShipments: number;
    destShipments: number;
  };
}

interface BranchesTableProps {
  branches: BranchData[];
}

export default function BranchesTable({ branches }: BranchesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const matchesSearch = !searchQuery ||
        branch.name.includes(searchQuery) ||
        branch.province.name.includes(searchQuery) ||
        branch.address.includes(searchQuery) ||
        (branch.manager?.name || "").includes(searchQuery);

      const matchesStatus = statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && branch.isActive) ||
        (statusFilter === "INACTIVE" && !branch.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [branches, searchQuery, statusFilter]);

  const activeCount = branches.filter(b => b.isActive).length;
  const totalEmployees = branches.reduce((sum, b) => sum + b._count.employees, 0);
  const totalShipments = branches.reduce((sum, b) => sum + b._count.originShipments + b._count.destShipments, 0);

  return (
    <>
      {/* بطاقات إحصائية للفروع */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>إجمالي الفروع</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{branches.length}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--secondary-light)", color: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>فروع نشطة</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--secondary)" }}>{activeCount}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>إجمالي موظفي الفروع</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#8b5cf6" }}>{totalEmployees}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>الشحنات المتداولة</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f59e0b" }}>{totalShipments}</span>
          </div>
        </div>
      </div>

      {/* شريط التصفية والبحث */}
      <div className="dashboard-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <SearchFilter
            placeholder="بحث باسم الفرع، المحافظة، العنوان أو المدير..."
            onSearch={setSearchQuery}
          />
          <div className="form-group" style={{ marginBottom: 0, minWidth: "160px" }}>
            <label className="form-label" style={{ fontSize: "0.8rem" }}>حالة الفرع</label>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: "42px", fontSize: "0.9rem" }}
            >
              <option value="ALL">الكل</option>
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">معطل</option>
            </select>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, paddingBottom: "0.5rem" }}>
            عرض {filteredBranches.length} من {branches.length}
          </div>
        </div>
      </div>

      {/* جدول الفروع */}
      <div className="dashboard-card table-container">
        {filteredBranches.length === 0 ? (
          <div className="empty-state">
            <Building size={48} className="empty-icon" />
            <p>{searchQuery || statusFilter !== "ALL" ? "لا توجد نتائج تطابق معايير البحث" : "لا يوجد فروع مسجلة حالياً في النظام."}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الفرع</th>
                <th>المحافظة</th>
                <th>رقم الهاتف</th>
                <th>العنوان</th>
                <th>مدير الفرع</th>
                <th>الموظفين</th>
                <th>الشحنات الصادرة</th>
                <th>الشحنات الواردة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch) => (
                <tr key={branch.id}>
                  <td className="tracking-cell" style={{ color: "var(--text)", fontWeight: 700 }}>{branch.name}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <MapPin size={14} style={{ color: "var(--text-muted)" }} />
                      <span>{branch.province.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Phone size={14} style={{ color: "var(--text-muted)" }} />
                      <span>{branch.phone}</span>
                    </div>
                  </td>
                  <td>{branch.address}</td>
                  <td>
                    {branch.manager ? (
                      <div style={{ fontWeight: 600 }}>{branch.manager.name}</div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>غير معين</span>
                    )}
                  </td>
                  <td>
                    <span className="payment-method-badge" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Users size={12} />
                      <span>{branch._count.employees} موظفين</span>
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>{branch._count.originShipments} صادرة</td>
                  <td style={{ fontWeight: 700, color: "var(--secondary)" }}>{branch._count.destShipments} واردة</td>
                  <td>
                    <span className={`status-badge ${branch.isActive ? "status-success" : "status-danger"}`}>
                      {branch.isActive ? "نشط" : "معطل"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
