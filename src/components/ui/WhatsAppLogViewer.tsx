"use client";

import React, { useState } from "react";
import { MessageCircle, Phone, Clock, Search, ChevronDown, ChevronUp, Send, CheckCheck, AlertCircle } from "lucide-react";

interface WhatsAppLogItem {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  recipientPhone: string;
  recipientName: string;
  messageType: string;
  messageBody: string;
  status: string;
  direction: string;
  createdAt: string;
}

interface WhatsAppLogViewerProps {
  logs: WhatsAppLogItem[];
}

const messageTypeLabels: Record<string, { text: string; color: string; icon: string }> = {
  SHIPMENT_CREATED: { text: "إشعار تسجيل شحنة (للمرسل)", color: "#10b981", icon: "📦" },
  SHIPMENT_CREATED_RECEIVER: { text: "إشعار شحنة قادمة (للمستلم)", color: "#6366f1", icon: "📬" },
  OUT_FOR_DELIVERY: { text: "خرجت للتوصيل", color: "#f59e0b", icon: "🚚" },
  OTP_SENT: { text: "رمز التحقق OTP", color: "#ef4444", icon: "🔐" },
  DELIVERED: { text: "تم التسليم بنجاح", color: "#22c55e", icon: "✅" },
  RETURNED: { text: "شحنة مرتجعة", color: "#ef4444", icon: "🔴" },
  STATUS_UPDATE: { text: "تحديث حالة", color: "#64748b", icon: "🔄" },
};

const statusIcons: Record<string, React.ReactNode> = {
  QUEUED: <Clock size={14} style={{ color: "#94a3b8" }} />,
  SENT: <Send size={14} style={{ color: "#3b82f6" }} />,
  DELIVERED: <CheckCheck size={14} style={{ color: "#22c55e" }} />,
  FAILED: <AlertCircle size={14} style={{ color: "#ef4444" }} />,
};

export default function WhatsAppLogViewer({ logs }: WhatsAppLogViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipientPhone.includes(searchTerm) ||
      log.recipientName.includes(searchTerm);
    const matchesType = filterType === "ALL" || log.messageType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* شريط البحث والفلترة */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          backgroundColor: "var(--surface)",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 250px" }}>
          <Search size={16} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input
            type="text"
            className="form-input"
            placeholder="بحث برقم التتبع أو الهاتف أو الاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingRight: "2.25rem" }}
          />
        </div>

        <select
          className="form-input"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ flex: "0 0 220px" }}
        >
          <option value="ALL">جميع أنواع الإشعارات</option>
          {Object.entries(messageTypeLabels).map(([key, val]) => (
            <option key={key} value={key}>
              {val.icon} {val.text}
            </option>
          ))}
        </select>
      </div>

      {/* قائمة الرسائل بتصميم واتساب */}
      <div style={{ maxHeight: "600px", overflowY: "auto" }}>
        {filteredLogs.length === 0 ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            <MessageCircle size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
            <p style={{ fontSize: "1.1rem" }}>لا توجد إشعارات مسجلة بعد</p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
              ستظهر الإشعارات هنا تلقائياً عند إنشاء أو تحديث حالة الشحنات
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const typeInfo = messageTypeLabels[log.messageType] || { text: log.messageType, color: "#64748b", icon: "📧" };
            const isExpanded = expandedId === log.id;

            return (
              <div
                key={log.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  transition: "background-color 0.15s",
                }}
              >
                {/* رأس الرسالة (قابل للضغط) */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.875rem 1.25rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "right",
                    color: "var(--text)",
                    transition: "background-color 0.15s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {/* أيقونة واتساب */}
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #25d366, #128c7e)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "1.2rem",
                      color: "white",
                      boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)",
                    }}
                  >
                    {typeInfo.icon}
                  </div>

                  {/* تفاصيل مختصرة */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{log.recipientName}</span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          backgroundColor: `${typeInfo.color}15`,
                          color: typeInfo.color,
                          fontWeight: 500,
                        }}
                      >
                        {typeInfo.text}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Phone size={12} />
                        {log.recipientPhone}
                      </span>
                      <span>📦 {log.trackingNumber}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        {statusIcons[log.status]}
                        {log.status === "SENT" ? "تم الإرسال" : log.status === "QUEUED" ? "في الانتظار" : log.status === "DELIVERED" ? "تم التوصيل" : "فشل"}
                      </span>
                    </div>
                  </div>

                  {/* الوقت + توسيع */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {new Date(log.createdAt).toLocaleString("ar-YE", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* محتوى الرسالة الموسّع (بتصميم فقاعة واتساب) */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "0 1.25rem 1rem 1.25rem",
                      animation: "fadeIn 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        background: "linear-gradient(135deg, #dcf8c6 0%, #c5e8b0 100%)",
                        borderRadius: "0 12px 12px 12px",
                        padding: "1rem 1.25rem",
                        maxWidth: "90%",
                        position: "relative",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        color: "#1a1a1a",
                      }}
                    >
                      <pre
                        style={{
                          fontFamily: "inherit",
                          fontSize: "0.85rem",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          margin: 0,
                          direction: "rtl",
                        }}
                      >
                        {log.messageBody}
                      </pre>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          gap: "0.25rem",
                          marginTop: "0.5rem",
                          fontSize: "0.7rem",
                          color: "#5d7c52",
                        }}
                      >
                        <span>
                          {new Date(log.createdAt).toLocaleString("ar-YE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <CheckCheck size={14} style={{ color: "#4fc3f7" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
