"use client";

import { useState, useMemo } from "react";
import { TrendingUp, MapPin, DollarSign, Scale, Percent, CheckCircle, ShieldAlert, AlertTriangle } from "lucide-react";
import SearchFilter from "@/components/ui/SearchFilter";

interface Province {
  id: string;
  name: string;
}

interface PricingRule {
  id: string;
  name: string;
  basePrice: number;
  weightRate: number;
  minPrice: number;
  serviceMultiplier: number;
  isActive: boolean;
  originProvince: Province;
  destProvince: Province;
}

interface PricingRulesTableProps {
  rules: PricingRule[];
}

export default function PricingRulesTable({ rules }: PricingRulesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch = !searchQuery ||
        rule.name.includes(searchQuery) ||
        rule.originProvince.name.includes(searchQuery) ||
        rule.destProvince.name.includes(searchQuery);

      const matchesStatus = statusFilter === "ALL" || 
        (statusFilter === "ACTIVE" && rule.isActive) ||
        (statusFilter === "INACTIVE" && !rule.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [rules, searchQuery, statusFilter]);

  const activeCount = rules.filter(r => r.isActive).length;
  const avgBasePrice = rules.length > 0 ? Math.round(rules.reduce((s, r) => s + r.basePrice, 0) / rules.length) : 0;
  const maxBasePrice = rules.length > 0 ? Math.max(...rules.map(r => r.basePrice)) : 0;

  return (
    <>
      {/* بطاقات إحصائية للمسافات والأسعار */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>إجمالي القواعد</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{rules.length}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--secondary-light)", color: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>القواعد النشطة</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--secondary)" }}>{activeCount}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DollarSign size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>متوسط السعر الأساسي</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6366f1" }}>{avgBasePrice.toLocaleString("ar-YE")} <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>ريال</span></span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "var(--radius-md)", background: "var(--warning-light)", color: "var(--warning)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>أعلى تكلفة شحن</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--warning)" }}>{maxBasePrice.toLocaleString("ar-YE")} <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>ريال</span></span>
          </div>
        </div>
      </div>

      {/* شريط البحث والفرز */}
      <div className="dashboard-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <SearchFilter
            placeholder="بحث باسم القاعدة، محافظة المصدر، أو الوجهة..."
            onSearch={setSearchQuery}
          />
          <div className="form-group" style={{ marginBottom: 0, minWidth: "160px" }}>
            <label className="form-label" style={{ fontSize: "0.8rem" }}>حالة القاعدة</label>
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
            عرض {filteredRules.length} من {rules.length}
          </div>
        </div>
      </div>

      {/* جدول قواعد التسعير */}
      <div className="dashboard-card table-container">
        {filteredRules.length === 0 ? (
          <div className="empty-state">
            <TrendingUp size={48} className="empty-icon" />
            <p>{searchQuery || statusFilter !== "ALL" ? "لا توجد نتائج تطابق معايير البحث والتصفية" : "لا توجد قواعد تسعير مسجلة حالياً في النظام."}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>قاعدة التسعير</th>
                <th>محافظة المصدر</th>
                <th>محافظة الوجهة</th>
                <th>السعر الأساسي (أول 1 كجم)</th>
                <th>سعر الكيلو الإضافي</th>
                <th>الحد الأدنى للسعر</th>
                <th>معامل الخدمة المستعجلة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule.id}>
                  <td className="tracking-cell" style={{ color: "var(--text)", fontWeight: 700 }}>{rule.name}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <MapPin size={14} style={{ color: "var(--text-muted)" }} />
                      <span>{rule.originProvince.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <MapPin size={14} style={{ color: "var(--text-muted)" }} />
                      <span>{rule.destProvince.name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                    {rule.basePrice.toLocaleString("ar-YE")} ريال
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Scale size={12} style={{ color: "var(--text-muted)" }} />
                      <span>{rule.weightRate.toLocaleString("ar-YE")} ريال / كجم</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {rule.minPrice.toLocaleString("ar-YE")} ريال
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Percent size={12} style={{ color: "var(--text-muted)" }} />
                      <span>x{rule.serviceMultiplier}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${rule.isActive ? "status-success" : "status-danger"}`}>
                      {rule.isActive ? "نشط" : "معطل"}
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
