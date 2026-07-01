"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { logoutAction } from "@/app/actions/auth";
import { getRecentNotificationsAction, AuditNotification } from "@/app/actions/notifications";
import { changePasswordAction } from "@/app/actions/users";
import { LogOut, Building, Shield, Bell, Package, CheckCircle2, Edit, Key, RefreshCw, Lock } from "lucide-react";

interface HeaderProps {
  session: {
    id: string;
    name: string;
    email: string;
    role: string;
    branchId: string | null;
    branchName: string | null;
  };
  onMenuToggle?: () => void;
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

export default function Header({ session, onMenuToggle }: HeaderProps) {
  const [notifications, setNotifications] = useState<AuditNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // حالات تغيير كلمة المرور
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("كلمة المرور الجديدة وتأكيدها غير متطابقين.");
      return;
    }

    startTransition(async () => {
      const res = await changePasswordAction({ oldPassword, newPassword });
      if (res.error) {
        setPasswordError(res.error);
      } else {
        setPasswordSuccess(res.message || "تم تغيير كلمة المرور بنجاح.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setIsPasswordModalOpen(false), 2000);
      }
    });
  };

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await getRecentNotificationsAction();
    if (res.notifications) {
      setNotifications(res.notifications);
    }
    setLoading(false);
  }, []);

  // جلب الإشعارات عند التحميل الأولي
  useEffect(() => {
    const initialLoad = setTimeout(fetchNotifications, 0);
    // جلب الإشعارات كل دقيقة تلقائياً
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen) {
      fetchNotifications();
    }
  };

  const getNotificationText = (action: string, userName: string) => {
    if (action === "CREATE_SHIPMENT") return `قام ${userName} بتسجيل شحنة جديدة`;
    if (action.startsWith("UPDATE_STATUS_")) {
      const status = action.replace("UPDATE_STATUS_", "");
      const statusText: Record<string, string> = {
        DELIVERED: "تأكيد تسليم شحنة بنجاح",
        OUT_FOR_DELIVERY: "إسـناد شحنة للمندوب",
        IN_TRANSIT: "شحـن شحنة بين الفروع",
        RECEIVED_IN_BRANCH: "استلام شحنة بالفرع",
      };
      return `${userName}: ${statusText[status] || `تغيير حالة شحنة إلى ${status}`}`;
    }
    if (action === "UPDATE_SHIPMENT") return `قام ${userName} بتعديل بيانات شحنة`;
    if (action === "LOGIN") return `سجل ${userName} دخوله للنظام`;
    return `قام ${userName} بإجراء: ${action}`;
  };

  const getNotificationIcon = (action: string) => {
    if (action === "CREATE_SHIPMENT") return <Package size={14} className="text-blue" />;
    if (action.includes("DELIVERED")) return <CheckCircle2 size={14} className="text-green" />;
    if (action === "UPDATE_SHIPMENT") return <Edit size={14} className="text-warning" />;
    if (action === "LOGIN") return <Key size={14} style={{ color: "#8b5cf6" }} />;
    return <RefreshCw size={14} className="text-muted" />;
  };

  return (
    <header className="dashboard-header" style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="sidebar-toggle-btn btn btn-outline"
            style={{
              padding: "0.5rem",
              borderRadius: "var(--radius-md)",
              width: "38px",
              height: "38px",
              display: "none", // Controlled via media queries in CSS
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--surface)",
              border: "1.5px solid var(--border)",
            }}
            title="القائمة"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        )}
        <div className="header-info">
          <h2 className="header-welcome-text">مرحباً، {session.name}</h2>
          <p className="header-sub-text">لوحة التحكم اللوجستية للمنصة</p>
        </div>
      </div>

      <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {session.branchName && (
          <div className="header-badge header-branch-badge">
            <Building size={16} />
            <span>{session.branchName}</span>
          </div>
        )}

        <div className="header-badge header-role-badge">
          <Shield size={16} />
          <span>{roleNames[session.role] || session.role}</span>
        </div>

        {/* جرس الإشعارات الحية */}
        <div style={{ position: "relative" }}>
          <button
            onClick={toggleNotifications}
            className="btn btn-outline"
            style={{
              padding: "0.5rem",
              borderRadius: "50%",
              width: "38px",
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              border: "1.5px solid var(--border)",
              backgroundColor: "var(--surface)",
            }}
            title="الحركات الأخيرة"
          >
            <Bell size={18} style={{ color: "var(--text-secondary)" }} />
            {notifications.length > 0 && (
              <span style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                backgroundColor: "var(--danger)",
                borderRadius: "50%",
                width: "8px",
                height: "8px",
                border: "1.5px solid white",
              }}></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="dashboard-card dropdown-panel" style={{
              position: "absolute",
              top: "48px",
              left: 0,
              width: "320px",
              zIndex: 100,
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>أحدث حركات النظام</span>
                <button onClick={fetchNotifications} style={{ padding: "0.25rem", background: "none", border: "none", cursor: "pointer" }} title="تحديث">
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    لا توجد تنبيهات حالية.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{
                      display: "flex",
                      gap: "0.5rem",
                      padding: "0.5rem",
                      borderRadius: "var(--radius-sm)",
                      borderBottom: "1px dashed var(--border)",
                      fontSize: "0.78rem",
                      alignItems: "flex-start",
                      transition: "background-color 0.2s",
                    }} className="notification-item-hover">
                      <div style={{ marginTop: "2px" }}>
                        {getNotificationIcon(n.action)}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", flex: 1 }}>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>{getNotificationText(n.action, n.userName)}</span>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                          {new Date(n.createdAt).toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setIsPasswordModalOpen(true);
            setPasswordError("");
            setPasswordSuccess("");
          }}
          className="btn btn-outline"
          title="تغيير كلمة المرور"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            height: "38px",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--text-secondary)",
          }}
        >
          <Lock size={16} />
          <span>كلمة المرور</span>
        </button>

        <button onClick={handleLogout} className="header-logout-btn btn" title="تسجيل الخروج" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", height: "38px" }}>
          <LogOut size={16} />
          <span>خروج</span>
        </button>
      </div>

      {/* مودال تغيير كلمة المرور */}
      {isPasswordModalOpen && (
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
            maxWidth: "400px",
            padding: "1.75rem",
            boxShadow: "var(--shadow-2xl)",
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            position: "relative",
            animation: "modalFadeIn 0.3s ease",
          }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text)" }}>تغيير كلمة المرور</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>تحديث كلمة المرور الخاصة بحسابك لحماية حسابك</p>

            <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {passwordError && (
                <div style={{
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}>
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div style={{
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}>
                  {passwordSuccess}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>كلمة المرور الحالية</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ height: "40px" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ height: "40px" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ height: "40px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{ flex: 1, height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {isPending ? "جاري التحديث..." : "تحديث كلمة المرور"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
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
    </header>
  );
}
