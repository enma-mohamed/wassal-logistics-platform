"use client";

import { useState, useMemo, useTransition } from "react";
import { Users, Mail, Phone, Building, Shield, Edit2, UserX, UserCheck as UserCheckIcon, MoreVertical, Trash2 } from "lucide-react";
import SearchFilter from "@/components/ui/SearchFilter";
import { toggleUserStatusAction, deleteUserAction, updateEmployeeAction } from "@/app/actions/users";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  branch: { id: string; name: string } | null;
}

interface EmployeesTableProps {
  employees: Employee[];
  branches: { id: string; name: string }[];
}

const roleNames: Record<string, string> = {
  SYSTEM_ADMIN: "مدير النظام",
  COMPANY_ADMIN: "مدير الشركة",
  BRANCH_MANAGER: "مدير الفرع",
  RECEPTIONIST: "موظف استقبال",
  DELIVERY_STAFF: "موظف تسليم",
  DRIVER: "سائق",
  AGENT: "وكيل خارجي",
  ACCOUNTANT: "محاسب مالية",
};

const roleBadgeColors: Record<string, { bg: string; color: string }> = {
  SYSTEM_ADMIN: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
  COMPANY_ADMIN: { bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" },
  BRANCH_MANAGER: { bg: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" },
  RECEPTIONIST: { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" },
  DELIVERY_STAFF: { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" },
  DRIVER: { bg: "rgba(20, 184, 166, 0.1)", color: "#14b8a6" },
  AGENT: { bg: "rgba(168, 85, 247, 0.1)", color: "#a855f7" },
  ACCOUNTANT: { bg: "rgba(99, 102, 241, 0.1)", color: "#6366f1" },
};

export default function EmployeesTable({ employees, branches }: EmployeesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // حالات تعديل بيانات الموظف
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editBranchId, setEditBranchId] = useState("");

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    startTransition(async () => {
      const res = await updateEmployeeAction({
        userId: editingEmployee.id,
        name: editName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        branchId: editBranchId,
      });

      if (res.error) {
        alert(res.error);
      } else {
        alert("تم تعديل بيانات الموظف بنجاح.");
        setEditingEmployee(null);
      }
    });
  };

  const handleToggleStatus = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من تغيير حالة الموظف/المستخدم: "${name}"؟`)) {
      startTransition(async () => {
        const res = await toggleUserStatusAction(id);
        if (res.error) {
          alert(res.error);
        }
      });
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`⚠️ تحذير: هل أنت متأكد من حذف الموظف/المستخدم: "${name}" نهائياً من النظام؟`)) {
      startTransition(async () => {
        const res = await deleteUserAction(id);
        if (res.error) {
          alert(res.error);
        } else if (res.warning) {
          alert(res.message);
        } else {
          alert(res.message || "تم حذف الحساب بنجاح.");
        }
      });
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = !searchQuery || 
        emp.name.includes(searchQuery) ||
        emp.email.includes(searchQuery) ||
        emp.phone.includes(searchQuery) ||
        (emp.branch?.name || "").includes(searchQuery);
      
      const matchesRole = roleFilter === "ALL" || emp.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || 
        (statusFilter === "ACTIVE" && emp.isActive) ||
        (statusFilter === "INACTIVE" && !emp.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, searchQuery, roleFilter, statusFilter]);

  const totalActive = employees.filter(e => e.isActive).length;
  const totalInactive = employees.filter(e => !e.isActive).length;

  return (
    <>
      {/* بطاقات إحصائية سريعة */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>إجمالي المستخدمين</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{employees.length}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--secondary-light)", color: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserCheckIcon size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>حسابات نشطة</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--secondary)" }}>{totalActive}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--danger-light)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserX size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>حسابات معطلة</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--danger)" }}>{totalInactive}</span>
          </div>
        </div>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="dashboard-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <SearchFilter
            placeholder="بحث بالاسم أو البريد أو الهاتف..."
            onSearch={setSearchQuery}
          />
          <div className="form-group" style={{ marginBottom: 0, minWidth: "160px" }}>
            <label className="form-label" style={{ fontSize: "0.8rem" }}>تصفية بالدور</label>
            <select
              className="form-input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ height: "42px", fontSize: "0.9rem" }}
            >
              <option value="ALL">جميع الأدوار</option>
              {Object.entries(roleNames).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: "140px" }}>
            <label className="form-label" style={{ fontSize: "0.8rem" }}>حالة الحساب</label>
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
            عرض {filteredEmployees.length} من {employees.length}
          </div>
        </div>
      </div>

      {/* جدول الموظفين */}
      <div className="dashboard-card table-container">
        {filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <p>{searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL" ? "لا توجد نتائج تطابق معايير البحث والتصفية" : "لا يوجد موظفين مسجلين حالياً في النظام."}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الموظف</th>
                <th>الصلاحية / الدور</th>
                <th>البريد الإلكتروني</th>
                <th>رقم الهاتف</th>
                <th>الفرع المرتبط</th>
                <th>تاريخ الانضمام</th>
                <th>الحالة</th>
                <th className="no-print" style={{ textAlign: "center", width: "130px" }}>التحكم بالإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const badgeColor = roleBadgeColors[emp.role] || { bg: "rgba(16, 185, 129, 0.08)", color: "var(--secondary)" };
                return (
                  <tr key={emp.id} style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
                    <td className="tracking-cell" style={{ color: "var(--text)" }}>{emp.name}</td>
                    <td>
                      <span className="header-badge header-role-badge" style={{ display: "inline-flex", gap: "0.25rem", background: badgeColor.bg, color: badgeColor.color }}>
                        <Shield size={14} />
                        <span>{roleNames[emp.role] || emp.role}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Mail size={14} style={{ color: "var(--text-muted)" }} />
                        <span>{emp.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Phone size={14} style={{ color: "var(--text-muted)" }} />
                        <span>{emp.phone}</span>
                      </div>
                    </td>
                    <td>
                      {emp.branch ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Building size={14} style={{ color: "var(--text-muted)" }} />
                          <span>{emp.branch.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>إدارة عامة</span>
                      )}
                    </td>
                    <td className="date-cell">
                      {new Date(emp.createdAt).toLocaleDateString("ar-YE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>
                      <span className={`status-badge ${emp.isActive ? "status-success" : "status-danger"}`}>
                        {emp.isActive ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td className="no-print">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                        {/* زر تفعيل/تعطيل */}
                        <button
                          onClick={() => handleToggleStatus(emp.id, emp.name)}
                          disabled={isPending}
                          className={`btn ${emp.isActive ? "btn-outline" : "btn-primary"}`}
                          style={{
                            padding: "0.35rem 0.5rem",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            minWidth: "75px",
                            justifyContent: "center",
                            borderColor: emp.isActive ? "#f59e0b" : "var(--primary)",
                            color: emp.isActive ? "#d97706" : "#fff",
                            backgroundColor: emp.isActive ? "rgba(245, 158, 11, 0.04)" : "var(--primary)",
                          }}
                          title={emp.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                        >
                          {emp.isActive ? <UserX size={13} /> : <UserCheckIcon size={13} />}
                          <span>{emp.isActive ? "تعطيل" : "تفعيل"}</span>
                        </button>

                        {/* زر التعديل */}
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setEditName(emp.name);
                            setEditEmail(emp.email);
                            setEditPhone(emp.phone);
                            setEditRole(emp.role);
                            setEditBranchId(emp.branch?.id || "");
                          }}
                          disabled={isPending}
                          className="btn btn-outline"
                          style={{
                            padding: "0.35rem",
                            borderColor: "#3b82f6",
                            color: "#3b82f6",
                            backgroundColor: "rgba(59, 130, 246, 0.04)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="تعديل بيانات الحساب"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* زر الحذف */}
                        <button
                          onClick={() => handleDeleteUser(emp.id, emp.name)}
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
                          title="حذف الحساب نهائياً"
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

      {/* مودال تعديل بيانات الموظف */}
      {editingEmployee && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem",
        }}>
          <div className="dashboard-card" style={{
            width: "100%",
            maxWidth: "450px",
            padding: "1.75rem",
            boxShadow: "var(--shadow-2xl)",
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            position: "relative",
            animation: "modalFadeIn 0.3s ease",
          }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text)" }}>تعديل بيانات الموظف</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>تحديث الصلاحية والفرع والبيانات الأساسية للمستخدم</p>

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>الاسم الكامل</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ height: "40px" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{ height: "40px" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>رقم الهاتف (الفريد)</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{ height: "40px" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>الدور / الصلاحية</label>
                <select
                  className="form-input"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  style={{ height: "40px" }}
                >
                  {Object.entries(roleNames).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>الفرع المرتبط</label>
                <select
                  className="form-input"
                  value={editBranchId}
                  onChange={(e) => setEditBranchId(e.target.value)}
                  style={{ height: "40px" }}
                >
                  <option value="">إدارة عامة / بدون فرع</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{ flex: 1, height: "40px" }}
                >
                  {isPending ? "جاري التحديث..." : "حفظ التعديلات"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  disabled={isPending}
                  className="btn btn-outline"
                  style={{ flex: 1, height: "40px" }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
