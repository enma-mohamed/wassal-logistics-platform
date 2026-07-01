"use client";

import { useState, useMemo, useTransition } from "react";
import { UserCheck, Phone, MapPin, Award, Building, Mail, TrendingUp, Users, UserX, Trash2, Edit2 } from "lucide-react";
import SearchFilter from "@/components/ui/SearchFilter";
import { toggleUserStatusAction, deleteUserAction, updateAgentAction } from "@/app/actions/users";

interface AgentData {
  id: string;
  area: string | null;
  commissionType: string;
  commissionRate: number;
  status: string;
  rating: number;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    branch: { name: string } | null;
  };
}

interface AgentsTableProps {
  agents: AgentData[];
  branches: { id: string; name: string }[];
}

export default function AgentsTable({ agents, branches }: AgentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // حالات تعديل الوكيل
  const [editingAgent, setEditingAgent] = useState<AgentData | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editCommissionType, setEditCommissionType] = useState("FIXED");
  const [editCommissionRate, setEditCommissionRate] = useState(0);
  const [editArea, setEditArea] = useState("");

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    startTransition(async () => {
      const res = await updateAgentAction({
        userId: editingAgent.user.id,
        name: editName,
        email: editEmail,
        phone: editPhone,
        branchId: editBranchId,
        commissionType: editCommissionType,
        commissionRate: Number(editCommissionRate),
        area: editArea,
      });

      if (res.error) {
        alert(res.error);
      } else {
        alert("تم تعديل بيانات الوكيل بنجاح.");
        setEditingAgent(null);
      }
    });
  };

  const handleToggleStatus = async (userId: string, name: string) => {
    if (confirm(`هل أنت متأكد من تغيير حالة نشاط الوكيل: "${name}"؟`)) {
      startTransition(async () => {
        const res = await toggleUserStatusAction(userId);
        if (res.error) {
          alert(res.error);
        }
      });
    }
  };

  const handleDeleteAgent = async (userId: string, name: string) => {
    if (confirm(`⚠️ تحذير: هل أنت متأكد من حذف الوكيل: "${name}" نهائياً من النظام؟`)) {
      startTransition(async () => {
        const res = await deleteUserAction(userId);
        if (res.error) {
          alert(res.error);
        } else if (res.warning) {
          alert(res.message);
        } else {
          alert(res.message || "تم حذف الوكيل بنجاح.");
        }
      });
    }
  };

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch = !searchQuery ||
        agent.user.name.includes(searchQuery) ||
        agent.user.email.includes(searchQuery) ||
        agent.user.phone.includes(searchQuery) ||
        (agent.area || "").includes(searchQuery);

      const matchesStatus = statusFilter === "ALL" || agent.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agents, searchQuery, statusFilter]);

  const activeCount = agents.filter(a => a.status === "ACTIVE").length;
  const avgRating = agents.length > 0 ? (agents.reduce((s, a) => s + a.rating, 0) / agents.length).toFixed(1) : "0";
  const avgCommission = agents.length > 0 ? (agents.reduce((s, a) => s + a.commissionRate, 0) / agents.length).toFixed(1) : "0";

  return (
    <>
      {/* بطاقات إحصائية */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>إجمالي الوكلاء</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{agents.length}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--secondary-light)", color: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserCheck size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>وكلاء نشطون</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--secondary)" }}>{activeCount}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--warning-light)", color: "var(--warning)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>متوسط التقييم</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--warning)" }}>{avgRating} ⭐</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>متوسط العمولة</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)" }}>{avgCommission}</span>
          </div>
        </div>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="dashboard-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <SearchFilter
            placeholder="بحث بالاسم أو المنطقة أو الهاتف..."
            onSearch={setSearchQuery}
          />
          <div className="form-group" style={{ marginBottom: 0, minWidth: "160px" }}>
            <label className="form-label" style={{ fontSize: "0.8rem" }}>حالة الوكيل</label>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: "42px", fontSize: "0.9rem" }}
            >
              <option value="ALL">الكل</option>
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">غير نشط</option>
              <option value="SUSPENDED">موقوف</option>
            </select>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, paddingBottom: "0.5rem" }}>
            عرض {filteredAgents.length} من {agents.length}
          </div>
        </div>
      </div>

      {/* جدول الوكلاء */}
      <div className="dashboard-card table-container">
        {filteredAgents.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={48} className="empty-icon" />
            <p>{searchQuery || statusFilter !== "ALL" ? "لا توجد نتائج تطابق معايير البحث" : "لا يوجد وكلاء مسجلين حالياً في النظام."}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الوكيل</th>
                <th>رقم الهاتف</th>
                <th>البريد الإلكتروني</th>
                <th>منطقة التغطية</th>
                <th>الفرع المرتبط</th>
                <th>نوع العمولة</th>
                <th>نسبة/قيمة العمولة</th>
                <th>التقييم</th>
                <th>الحالة</th>
                <th className="no-print" style={{ textAlign: "center", width: "130px" }}>التحكم بالإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => (
                <tr key={agent.id} style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
                  <td className="tracking-cell" style={{ color: "var(--text)" }}>{agent.user.name}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Phone size={14} style={{ color: "var(--text-muted)" }} />
                      <span>{agent.user.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Mail size={14} style={{ color: "var(--text-muted)" }} />
                      <span>{agent.user.email}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <MapPin size={14} style={{ color: "var(--text-muted)" }} />
                      <span>{agent.area || "غير محددة"}</span>
                    </div>
                  </td>
                  <td>
                    {agent.user.branch ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Building size={14} style={{ color: "var(--text-muted)" }} />
                        <span>{agent.user.branch.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>إدارة عامة</span>
                    )}
                  </td>
                  <td>
                    <span className="payment-method-badge">
                      {agent.commissionType === "PERCENTAGE" ? "نسبة مئوية" : "قيمة ثابتة"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                    {agent.commissionType === "PERCENTAGE"
                      ? `${agent.commissionRate}%`
                      : `${agent.commissionRate.toLocaleString("ar-YE")} ريال`}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--warning)", fontWeight: 700 }}>
                      <Award size={14} />
                      <span>{agent.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      agent.status === "ACTIVE"
                        ? "status-success"
                        : agent.status === "INACTIVE"
                        ? "status-warning"
                        : "status-danger"
                    }`}>
                      {agent.status === "ACTIVE" ? "نشط" : agent.status === "INACTIVE" ? "غير نشط" : "موقوف"}
                    </span>
                  </td>
                  <td className="no-print">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      {/* تفعيل/تعطيل */}
                      <button
                        onClick={() => handleToggleStatus(agent.user.id, agent.user.name)}
                        disabled={isPending}
                        className={`btn ${agent.status === "ACTIVE" ? "btn-outline" : "btn-primary"}`}
                        style={{
                          padding: "0.35rem 0.5rem",
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          minWidth: "75px",
                          justifyContent: "center",
                          borderColor: agent.status === "ACTIVE" ? "#f59e0b" : "var(--primary)",
                          color: agent.status === "ACTIVE" ? "#d97706" : "#fff",
                          backgroundColor: agent.status === "ACTIVE" ? "rgba(245, 158, 11, 0.04)" : "var(--primary)",
                        }}
                        title={agent.status === "ACTIVE" ? "تعطيل الحساب" : "تفعيل الحساب"}
                      >
                        {agent.status === "ACTIVE" ? <UserX size={13} /> : <UserCheck size={13} />}
                        <span>{agent.status === "ACTIVE" ? "تعطيل" : "تفعيل"}</span>
                      </button>

                      {/* زر التعديل */}
                      <button
                        onClick={() => {
                          setEditingAgent(agent);
                          setEditName(agent.user.name);
                          setEditEmail(agent.user.email);
                          setEditPhone(agent.user.phone);
                          setEditBranchId("");
                          setEditCommissionType(agent.commissionType);
                          setEditCommissionRate(agent.commissionRate);
                          setEditArea(agent.area || "");
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
                        title="تعديل بيانات الوكيل"
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* حذف نهائي */}
                      <button
                        onClick={() => handleDeleteAgent(agent.user.id, agent.user.name)}
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
                        title="حذف الوكيل نهائياً"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* مودال تعديل بيانات الوكيل */}
      {editingAgent && (
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
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text)" }}>تعديل بيانات الوكيل الخارجي</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>تحديث عمولة الوكيل، منطقة التغطية وبياناته الأساسية</p>

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
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>رقم الهاتف</label>
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
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>منطقة التغطية</label>
                <input
                  type="text"
                  className="form-input"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  placeholder="مثال: صنعاء القديمة، تعز، عدن..."
                  style={{ height: "40px" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>نوع عمولة الوكيل</label>
                <select
                  className="form-input"
                  value={editCommissionType}
                  onChange={(e) => setEditCommissionType(e.target.value)}
                  style={{ height: "40px" }}
                >
                  <option value="FIXED">قيمة ثابتة (ريال يمني)</option>
                  <option value="PERCENTAGE">نسبة مئوية (%)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>قيمة أو نسبة العمولة</label>
                <input
                  type="number"
                  required
                  className="form-input"
                  value={editCommissionRate}
                  onChange={(e) => setEditCommissionRate(Number(e.target.value))}
                  style={{ height: "40px" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>الفرع المرتبط</label>
                <select
                  className="form-input"
                  value={editBranchId}
                  onChange={(e) => setEditBranchId(e.target.value)}
                  style={{ height: "40px" }}
                >
                  <option value="">بدون فرع (إدارة عامة)</option>
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
                  onClick={() => setEditingAgent(null)}
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
