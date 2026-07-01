"use client";

import { useState } from "react";
import { updateShipmentStatusAction } from "@/app/actions/shipments";
import { RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";

interface ShipmentStatusUpdaterProps {
  shipmentId: string;
  currentStatus: string;
  expectedOtp: string | null;
}

const statusOptions = [
  { value: "RECEIVED_IN_BRANCH", label: "تم الاستلام في الفرع" },
  { value: "IN_SORTING", label: "في الفرز والتجهيز" },
  { value: "IN_TRANSIT", label: "قيد النقل والتوصيل (من فرع لآخر)" },
  { value: "ARRIVED_BRANCH", label: "وصلت فرع الوجهة" },
  { value: "OUT_FOR_DELIVERY", label: "خرجت مع المندوب للتسليم" },
  { value: "DELIVERED", label: "تم التسليم بنجاح للمستلم" },
  { value: "RETURNED", label: "مرتجعة للمرسل" },
  { value: "CANCELLED", label: "ملغاة" },
];

export default function ShipmentStatusUpdater({
  shipmentId,
  currentStatus,
  expectedOtp,
}: ShipmentStatusUpdaterProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // إذا كانت الحالة تسليم، نتحقق من الـ OTP
    if (newStatus === "DELIVERED" && expectedOtp) {
      if (otpInput.trim() !== expectedOtp.trim()) {
        setError("رمز التحقق OTP غير صحيح. لا يمكن تأكيد تسليم الشحنة المالي والأمانات دون الرمز الصحيح.");
        return;
      }
    }

    setIsSubmitting(true);
    const res = await updateShipmentStatusAction(shipmentId, newStatus, notes);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setNotes("");
      setOtpInput("");
      // تحديث الصفحة تلقائياً بعد ثانيتين لرؤية التاريخ والحدث الجديد
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="dashboard-card status-updater-card">
      <h3 className="section-title-with-icon">
        <RefreshCw size={18} />
        <span>تحديث حالة الشحنة</span>
      </h3>

      <form onSubmit={handleSubmit} className="status-updater-form">
        {error && <div className="auth-error status-error">{error}</div>}
        {success && (
          <div className="auth-error status-success-alert">
            <ShieldCheck size={18} />
            <span>تم تحديث حالة الشحنة بنجاح! جاري تحديث الصفحة...</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">الحالة الجديدة</label>
          <select
            className="form-input"
            value={newStatus}
            onChange={(e) => {
              setNewStatus(e.target.value);
              setError(null);
            }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {newStatus === "DELIVERED" && expectedOtp && (
          <div className="form-group otp-input-group">
            <label className="form-label font-bold text-green">
              رمز التحقق من التسليم (OTP) المطلوب *
            </label>
            <input
              type="text"
              className="form-input otp-field"
              placeholder="أدخل رمز 4 أرقام المستلم"
              maxLength={4}
              required
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
            />
            <p className="field-desc warning-desc">
              <AlertTriangle size={12} style={{ display: "inline", marginLeft: "2px" }} />
              يرجى إدخال رمز التحقق المستلم على هاتف المستلم لتأكيد صحة عملية التسليم.
              {process.env.NODE_ENV !== "production" && (
                <strong style={{ marginRight: "4px", color: "var(--accent)" }}>
                  (الرمز للتجربة: {expectedOtp})
                </strong>
              )}
            </p>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">ملاحظات التحديث / خط السير</label>
          <textarea
            className="form-input textarea-field"
            placeholder="مثال: تم تحميل الشحنة على شاحنة النقل، أو تم التسليم للمستلم أحمد..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary status-submit-btn"
          disabled={isSubmitting || newStatus === currentStatus && notes.trim() === ""}
        >
          <span>{isSubmitting ? "جاري التحديث..." : "حفظ وتحديث الحالة"}</span>
        </button>
      </form>
    </div>
  );
}
