"use client";

import { useState } from "react";
import { createAgentAction } from "@/app/actions/users";
import { UserPlus, X, Check, RefreshCw } from "lucide-react";

interface AddAgentFormProps {
  branches: { id: string; name: string }[];
  onClose: () => void;
}

export default function AddAgentForm({ branches, onClose }: AddAgentFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("");
  const [commissionType, setCommissionType] = useState("FIXED");
  const [commissionRate, setCommissionRate] = useState(0);
  const [area, setArea] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !phone || !password) {
      setError("يرجى تعبئة جميع الحقول المطلوبة.");
      return;
    }

    setIsSaving(true);
    const res = await createAgentAction({ name, email, phone, password, branchId: branchId || undefined, commissionType, commissionRate, area: area || undefined });
    setIsSaving(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1200);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
        <div className="modal-header">
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <UserPlus size={20} className="text-blue" />
            <span>إضافة وكيل خارجي جديد</span>
          </h3>
          <button type="button" onClick={onClose} className="modal-close-btn" title="إغلاق">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="modal-body" style={{ textAlign: "center", padding: "2rem" }}>
            <Check size={48} style={{ color: "var(--secondary)", marginBottom: "0.75rem" }} />
            <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>تم إضافة الوكيل بنجاح!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body">
            {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">اسم الوكيل الكامل *</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: وكيل صنعاء الجنوبية" required />
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني *</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@wassal.ye" required />
              </div>
              <div className="form-group">
                <label className="form-label">رقم الهاتف *</label>
                <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="777123456" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">كلمة المرور *</label>
              <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة مرور قوية" required minLength={4} />
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">الفرع المرتبط</label>
                <select className="form-input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  <option value="">بلا فرع محدد</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">منطقة التغطية اللوجستية</label>
                <input type="text" className="form-input" value={area} onChange={(e) => setArea(e.target.value)} placeholder="مثال: حي النهضة، صنعاء" />
              </div>
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">نوع العمولة</label>
                <select className="form-input" value={commissionType} onChange={(e) => setCommissionType(e.target.value)}>
                  <option value="FIXED">قيمة ثابتة (ريال)</option>
                  <option value="PERCENTAGE">نسبة مئوية (%)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">قيمة / نسبة العمولة</label>
                <input type="number" className="form-input" value={commissionRate} onChange={(e) => setCommissionRate(Number(e.target.value))} min={0} step={0.1} />
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
              <button type="button" onClick={onClose} className="btn btn-outline">إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
                <span>{isSaving ? "جاري الحفظ..." : "إضافة الوكيل"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
