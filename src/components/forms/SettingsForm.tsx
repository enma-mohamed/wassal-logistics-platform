"use client";

import { useEffect, useState } from "react";
import { saveSystemSettingsAction } from "@/app/actions/settings";
import { createThemeTokens, isValidHexColor } from "@/lib/theme";
import { Check, CircleDot, Palette, RefreshCw, Save, Sparkles } from "lucide-react";

interface SettingsFormProps {
  initialSystemSettings: {
    otpEnabled: boolean;
    manualFeesEnabled: boolean;
    forceWeight: boolean;
  };
}

const themeOptions = [
  { id: "blue", name: "أزرق ملكي", color: "#1e3a8a" },
  { id: "emerald", name: "أخضر زمردي", color: "#065f46" },
  { id: "purple", name: "أرجواني فاخر", color: "#5b21b6" },
  { id: "amber", name: "برتقالي دافئ", color: "#b45309" },
  { id: "dark", name: "الوضع الداكن", color: "#0f172a" },
];

const defaultCustomColor = "#1e3a8a";

function applyCustomThemeToDocument(color: string) {
  const tokens = createThemeTokens(color);
  document.documentElement.setAttribute("data-theme", "custom");
  document.documentElement.style.setProperty("--primary", tokens.primary);
  document.documentElement.style.setProperty("--primary-hover", tokens.primaryHover);
  document.documentElement.style.setProperty("--primary-light", tokens.primaryLight);
  document.documentElement.style.setProperty("--accent", tokens.accent);
  document.documentElement.style.setProperty("--accent-light", tokens.accentLight);
  document.documentElement.style.setProperty("--border-focus", tokens.borderFocus);
}

function readStoredValue(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) || fallback;
}

function readStoredArchive(key: string) {
  if (typeof window === "undefined") return [];
  const savedArchive = window.localStorage.getItem(key);
  if (!savedArchive) return [];
  try {
    const parsed = JSON.parse(savedArchive);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string" && isValidHexColor(item));
    }
  } catch {
    return [];
  }
  return [];
}

export default function SettingsForm({ initialSystemSettings }: SettingsFormProps) {
  const [otpEnabled, setOtpEnabled] = useState(initialSystemSettings.otpEnabled);
  const [manualFeesEnabled, setManualFeesEnabled] = useState(initialSystemSettings.manualFeesEnabled);
  const [forceWeight, setForceWeight] = useState(initialSystemSettings.forceWeight);

  const [theme, setTheme] = useState(() => readStoredValue("wassal_theme", "blue"));
  const [customColor, setCustomColor] = useState(() => readStoredValue("wassal_custom_color", defaultCustomColor));
  const [colorArchive, setColorArchive] = useState<string[]>(() => readStoredArchive("wassal_color_archive"));
  const [font, setFont] = useState(() => readStoredValue("wassal_font", "cairo"));

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-font", font);

    if (theme === "custom" && isValidHexColor(customColor)) {
      applyCustomThemeToDocument(customColor);
    }
  }, [theme, font, customColor]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("wassal_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    if (newTheme !== "custom") {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--primary-hover");
      document.documentElement.style.removeProperty("--primary-light");
      document.documentElement.style.removeProperty("--accent");
      document.documentElement.style.removeProperty("--accent-light");
      document.documentElement.style.removeProperty("--border-focus");
    } else {
      applyCustomThemeToDocument(customColor);
    }
  };

  const handleFontChange = (newFont: string) => {
    setFont(newFont);
    localStorage.setItem("wassal_font", newFont);
    document.documentElement.setAttribute("data-font", newFont);
  };

  const handleCustomColorChange = (nextColor: string) => {
    if (!isValidHexColor(nextColor)) return;

    const normalized = nextColor.startsWith("#") ? nextColor : `#${nextColor}`;
    setCustomColor(normalized);
    setTheme("custom");
    localStorage.setItem("wassal_theme", "custom");
    localStorage.setItem("wassal_custom_color", normalized);
    document.documentElement.setAttribute("data-theme", "custom");
    applyCustomThemeToDocument(normalized);

    setColorArchive((prev) => {
      const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);
      localStorage.setItem("wassal_color_archive", JSON.stringify(next));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    setError(null);

    const res = await saveSystemSettingsAction({
      otpEnabled,
      manualFeesEnabled,
      forceWeight,
    });

    setIsSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="settings-form">
      {success && (
        <div className="auth-error status-success-alert" style={{ marginBottom: "1.5rem", width: "100%" }}>
          <Check size={18} />
          <span>تم حفظ جميع التعديلات والإعدادات بنجاح!</span>
        </div>
      )}

      {error && (
        <div className="auth-error" style={{ marginBottom: "1.5rem", width: "100%" }}>
          <span>{error}</span>
        </div>
      )}

      <div className="form-section-columns">
        <div className="dashboard-card form-section-card">
          <h3 className="section-title-with-icon">
            <Palette size={18} className="text-blue" />
            <span>تخصيص المظهر والثيمات</span>
          </h3>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>اختر ثيم النظام</label>
            <div className="theme-options-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem", marginTop: "0.5rem" }}>
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleThemeChange(opt.id)}
                  className={`theme-opt-btn ${theme === opt.id ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: theme === opt.id ? "2px solid var(--primary)" : "1px solid var(--border)",
                    backgroundColor: theme === opt.id ? "var(--primary-light)" : "var(--surface)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    fontWeight: theme === opt.id ? 700 : 500,
                  }}
                >
                  <span style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: opt.color, display: "inline-block" }} />
                  <span style={{ fontSize: "0.85rem", color: "var(--text)" }}>{opt.name}</span>
                </button>
              ))}

              <div
                className={`theme-opt-btn ${theme === "custom" ? "active" : ""}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: theme === "custom" ? "2px solid var(--primary)" : "1px solid var(--border)",
                  background: theme === "custom" ? "linear-gradient(135deg, var(--primary-light), var(--surface))" : "var(--surface)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleThemeChange("custom")}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: 0,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  <Sparkles size={15} />
                  <span>لون مخصص</span>
                </button>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    aria-label="اختيار لون مخصص"
                    style={{
                      width: "44px",
                      height: "38px",
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)" }}>
                      {customColor.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>سيُحفظ في الأرشيف تلقائياً</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label className="form-label" style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <CircleDot size={14} />
              <span>أرشيف الألوان المخصصة</span>
            </label>
            {colorArchive.length === 0 ? (
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px dashed var(--border)",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  background: "var(--surface)",
                }}
              >
                لا يوجد لون محفوظ بعد. اختر لونًا مخصصًا ليظهر هنا.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                {colorArchive.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleCustomColorChange(color)}
                    title={`تطبيق اللون ${color}`}
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "14px",
                      border: theme === "custom" && customColor.toLowerCase() === color.toLowerCase() ? "3px solid var(--primary)" : "1px solid var(--border)",
                      background: color,
                      boxShadow: "var(--shadow-sm)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>اختر خط الخطوط العربية</label>
            <div className="font-options-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginTop: "0.5rem" }}>
              {[
                { id: "cairo", name: "خط كايرو (Cairo)", example: "ابجد هوز" },
                { id: "tajawal", name: "خط تجوال (Tajawal)", example: "ابجد هوز" },
                { id: "rubik", name: "خط روبيك (Rubik)", example: "ابجد هوز" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleFontChange(opt.id)}
                  className={`font-opt-btn ${font === opt.id ? "active" : ""}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: font === opt.id ? "2px solid var(--primary)" : "1px solid var(--border)",
                    backgroundColor: font === opt.id ? "var(--primary-light)" : "var(--surface)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    fontFamily: `var(--font-${opt.id})`,
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)" }}>{opt.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{opt.example}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card form-section-card">
          <h3 className="section-title-with-icon">
            <Sparkles size={18} className="text-secondary" />
            <span>قواعد التشغيل والأمان</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--border)", paddingBottom: "1rem" }}>
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>تأكيد التسليم برمز التحقق (OTP)</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>إلزام المندوب بإدخال الرمز لتسليم الطرد لضمان الأمان</p>
              </div>
              <label className="switch" style={{ position: "relative", display: "inline-block", width: "50px", height: "26px" }}>
                <input
                  type="checkbox"
                  checked={otpEnabled}
                  onChange={(e) => setOtpEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  className={`slider ${otpEnabled ? "active" : ""}`}
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: otpEnabled ? "var(--secondary)" : "#ccc",
                    transition: ".4s",
                    borderRadius: "34px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: "''",
                      height: "18px",
                      width: "18px",
                      left: otpEnabled ? "26px" : "4px",
                      bottom: "4px",
                      backgroundColor: "white",
                      transition: ".4s",
                      borderRadius: "50%",
                    }}
                  />
                </span>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--border)", paddingBottom: "1rem" }}>
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>تعديل رسوم الشحن يدوياً</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>السماح لموظفي الاستقبال بتجاوز التسعيرة التلقائية وحساب رسوم مخصصة</p>
              </div>
              <label className="switch" style={{ position: "relative", display: "inline-block", width: "50px", height: "26px" }}>
                <input
                  type="checkbox"
                  checked={manualFeesEnabled}
                  onChange={(e) => setManualFeesEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  className={`slider ${manualFeesEnabled ? "active" : ""}`}
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: manualFeesEnabled ? "var(--secondary)" : "#ccc",
                    transition: ".4s",
                    borderRadius: "34px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: "''",
                      height: "18px",
                      width: "18px",
                      left: manualFeesEnabled ? "26px" : "4px",
                      bottom: "4px",
                      backgroundColor: "white",
                      transition: ".4s",
                      borderRadius: "50%",
                    }}
                  />
                </span>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--border)", paddingBottom: "1rem" }}>
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>إلزام وزن الشحنات</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>عدم تمكين إكمال التسجيل دون كتابة وزن فعلي أكبر من الصفر</p>
              </div>
              <label className="switch" style={{ position: "relative", display: "inline-block", width: "50px", height: "26px" }}>
                <input
                  type="checkbox"
                  checked={forceWeight}
                  onChange={(e) => setForceWeight(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  className={`slider ${forceWeight ? "active" : ""}`}
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: forceWeight ? "var(--secondary)" : "#ccc",
                    transition: ".4s",
                    borderRadius: "34px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: "''",
                      height: "18px",
                      width: "18px",
                      left: forceWeight ? "26px" : "4px",
                      bottom: "4px",
                      backgroundColor: "white",
                      transition: ".4s",
                      borderRadius: "50%",
                    }}
                  />
                </span>
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
              }}
            >
              {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              <span>حفظ جميع التعديلات</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
