"use client";

import { Truck, MapPin, CheckCircle2 } from "lucide-react";

interface ShipmentRouteMapProps {
  currentStatus: string;
  originProvince: string;
  destProvince: string;
}

// الخطوات اللوجستية وتحديد تقدم الشاحنة
const routeSteps = [
  { status: "RECEIVED_IN_BRANCH", label: "الاستلام بالفرع", progress: 10 },
  { status: "IN_SORTING", label: "الفرز والتعبئة", progress: 30 },
  { status: "IN_TRANSIT", label: "قيد النقل البري", progress: 60 },
  { status: "ARRIVED_BRANCH", label: "فرع الوصول", progress: 85 },
  { status: "DELIVERED", label: "تم التسليم بنجاح", progress: 100 },
];

export default function ShipmentRouteMap({
  currentStatus,
  originProvince,
  destProvince,
}: ShipmentRouteMapProps) {
  const activeStepIndex = (() => {
    if (currentStatus === "PENDING_RECEIVE") {
      return -1;
    }
    if (currentStatus === "CANCELLED" || currentStatus === "RETURNED") {
      return -2;
    }

    const idx = routeSteps.findIndex((step) => {
      if (step.status === currentStatus) return true;
      if (currentStatus === "OUT_FOR_DELIVERY" && step.status === "ARRIVED_BRANCH") return true;
      return false;
    });

    if (idx !== -1) {
      return idx;
    }
    if (currentStatus === "DELIVERED") {
      return 4;
    }
    return 0;
  })();

  // نسبة التقدم الكلي للرسم البياني
  let overallProgress = 0;
  if (activeStepIndex === -1) overallProgress = 0;
  else if (activeStepIndex === -2) overallProgress = 0;
  else {
    overallProgress = routeSteps[activeStepIndex]?.progress || 0;
  }

  return (
    <div className="dashboard-card route-map-card" style={{ padding: "1.5rem" }}>
      <h3 className="section-title-with-icon" style={{ marginBottom: "1.5rem" }}>
        <MapPin size={18} className="text-blue" />
        <span>المسار اللوجستي المرئي لحركة الطرد</span>
      </h3>

      {/* خريطة الخط والتقدم المرئي بالـ SVG */}
      <div className="route-map-container" style={{ position: "relative", margin: "2rem 0" }}>
        
        {/* معلومات المنشأ والوجهة */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: "bold" }}>
          <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            📍 من: <span className="text-blue" style={{ fontSize: "1rem" }}>{originProvince}</span>
          </span>
          <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            🏁 إلى: <span className="text-green" style={{ fontSize: "1rem" }}>{destProvince}</span>
          </span>
        </div>

        {/* مسار الـ SVG التفاعلي */}
        <div style={{ position: "relative", height: "80px", width: "100%", overflow: "visible" }}>
          {/* خط الخلفية الرمادي */}
          <div
            style={{
              position: "absolute",
              top: "30px",
              left: "5%",
              right: "5%",
              height: "6px",
              backgroundColor: "var(--border)",
              borderRadius: "3px",
              zIndex: 1,
            }}
          ></div>

          {/* خط التقدم الملون */}
          <div
            style={{
              position: "absolute",
              top: "30px",
              right: "5%", // متوافق مع اتجاه RTL
              width: `${Math.max(0, Math.min(overallProgress - 5, 90))}%`,
              height: "6px",
              background: "linear-gradient(90deg, var(--primary) 0%, #10b981 100%)",
              borderRadius: "3px",
              zIndex: 2,
              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          ></div>

          {/* أيقونة شاحنة النقل المتحركة */}
          {activeStepIndex >= 0 && activeStepIndex < 5 && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: `calc(${5 + (overallProgress * 0.9)}% - 20px)`, // حساب الموضع مع RTL
                zIndex: 3,
                transition: "right 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: "var(--primary)",
                  color: "white",
                  padding: "6px",
                  borderRadius: "50%",
                  boxShadow: "0 4px 10px rgba(99, 102, 241, 0.4)",
                  animation: "bounce 2s infinite ease-in-out",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Truck size={18} />
              </div>
            </div>
          )}

          {/* نقاط المحطات / التشييك */}
          <div
            style={{
              position: "absolute",
              top: "18px",
              left: "5%",
              right: "5%",
              display: "flex",
              justifyContent: "space-between",
              zIndex: 2,
            }}
          >
            {routeSteps.map((step, idx) => {
              const isCompleted = idx < activeStepIndex;
              const isActive = idx === activeStepIndex;
              return (
                <div
                  key={step.status}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* الدائرة */}
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: isCompleted
                        ? "#10b981"
                        : isActive
                        ? "var(--primary)"
                        : "var(--surface)",
                      border: `3px solid ${
                        isCompleted ? "#10b981" : isActive ? "var(--primary)" : "var(--border)"
                      }`,
                      color: isCompleted || isActive ? "white" : "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      boxShadow: isActive ? "0 0 0 6px rgba(99, 102, 241, 0.15)" : "none",
                      transition: "all 0.3s ease",
                      cursor: "default",
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>

                  {/* التسمية بالأسفل */}
                  <span
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive
                        ? "var(--primary)"
                        : isCompleted
                        ? "var(--text)"
                        : "var(--text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* تنبيه للحالات غير الاعتيادية */}
      {currentStatus === "CANCELLED" && (
        <div className="auth-error" style={{ margin: "1rem 0 0 0", display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
          <span>⚠️ تم إلغاء هذه الشحنة بالكامل من قبل النظام أو موظف الفرع.</span>
        </div>
      )}
      {currentStatus === "RETURNED" && (
        <div className="auth-error" style={{ margin: "1rem 0 0 0", display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(245, 158, 11, 0.08)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
          <span>🔄 الشحنة مرتجعة حالياً وقيد الإرسال العكسي إلى التاجر/المرسل.</span>
        </div>
      )}

      {/* أنيميشن المرجوحة المخصصة بالارتداد */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}
