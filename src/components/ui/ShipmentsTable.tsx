"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckSquare, Square, Truck, User, CheckCircle } from "lucide-react";
import { bulkUpdateShipmentStatusAction, bulkAssignDriverAction, bulkAssignAgentAction } from "@/app/actions/shipments";

interface ShipmentItem {
  id: string;
  trackingNumber: string;
  status: string;
  serviceType: string;
  paymentMethod: string;
  shippingFee: number;
  collectionAmount: number;
  createdAt: string;
  sender: { name: string; phone: string };
  receiver: { name: string; phone: string };
  originBranch: { name: string };
  destBranch: { name: string };
}

interface ShipmentsTableProps {
  shipments: ShipmentItem[];
  drivers: { id: string; name: string }[];
  agents: { id: string; name: string }[];
}

const statusTranslations: Record<string, { text: string; class: string }> = {
  PENDING_RECEIVE: { text: "قيد انتظار الاستلام", class: "status-pending" },
  RECEIVED_IN_BRANCH: { text: "تم الاستلام في الفرع", class: "status-received" },
  IN_SORTING: { text: "في الفرز والتجهيز", class: "status-sorting" },
  IN_TRANSIT: { text: "قيد النقل والتوصيل", class: "status-transit" },
  ARRIVED_BRANCH: { text: "وصلت فرع الوجهة", class: "status-arrived" },
  OUT_FOR_DELIVERY: { text: "خرجت مع المندوب", class: "status-delivery" },
  DELIVERED: { text: "تم التسليم بنجاح", class: "status-success" },
  RETURNED: { text: "مرتجعة للمرسل", class: "status-returned" },
  CANCELLED: { text: "ملغاة", class: "status-danger" },
};

export default function ShipmentsTable({ shipments, drivers, agents }: ShipmentsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSelectAll = () => {
    if (selectedIds.length === shipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(shipments.map((s) => s.id));
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus) return;
    if (selectedIds.length === 0) {
      alert("يرجى اختيار شحنة واحدة على الأقل.");
      return;
    }

    if (confirm(`هل أنت متأكد من تحديث حالة عدد ${selectedIds.length} شحنة إلى "${statusTranslations[bulkStatus]?.text || bulkStatus}"؟`)) {
      startTransition(async () => {
        const res = await bulkUpdateShipmentStatusAction(selectedIds, bulkStatus);
        if (res.error) {
          alert(res.error);
        } else {
          alert(`تم بنجاح تحديث حالة عدد ${res.count} شحنة.`);
          setSelectedIds([]);
          setBulkStatus("");
        }
      });
    }
  };

  const handleBulkAssignDriver = async () => {
    if (!selectedDriver) return;
    if (selectedIds.length === 0) {
      alert("يرجى اختيار شحنة واحدة على الأقل.");
      return;
    }

    const driverName = drivers.find(d => d.id === selectedDriver)?.name || "";
    if (confirm(`هل أنت متأكد من تعيين المندوب: "${driverName}" لعدد ${selectedIds.length} شحنة؟`)) {
      startTransition(async () => {
        const res = await bulkAssignDriverAction(selectedIds, selectedDriver);
        if (res.error) {
          alert(res.error);
        } else {
          alert("تم بنجاح تعيين المندوب للشحنات المحددة.");
          setSelectedIds([]);
          setSelectedDriver("");
        }
      });
    }
  };

  const handleBulkAssignAgent = async () => {
    if (!selectedAgent) return;
    if (selectedIds.length === 0) {
      alert("يرجى اختيار شحنة واحدة على الأقل.");
      return;
    }

    const agentName = agents.find(a => a.id === selectedAgent)?.name || "";
    if (confirm(`هل أنت متأكد من إسناد عدد ${selectedIds.length} شحنة للوكيل: "${agentName}"؟`)) {
      startTransition(async () => {
        const res = await bulkAssignAgentAction(selectedIds, selectedAgent);
        if (res.error) {
          alert(res.error);
        } else {
          alert("تم بنجاح إسناد الشحنات المحددة للوكيل.");
          setSelectedIds([]);
          setSelectedAgent("");
        }
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* شريط الإجراءات الجماعية */}
      {selectedIds.length > 0 && (
        <div
          className="dashboard-card"
          style={{
            padding: "1rem",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)",
            border: "1.5px solid var(--primary-light)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "slideDown 0.2s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", color: "var(--primary)" }}>
            <CheckSquare size={20} />
            <span>تم تحديد {selectedIds.length} شحنة</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
            {/* تحديث الحالة */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <select
                className="form-input"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                style={{ height: "38px", padding: "0 0.5rem", fontSize: "0.85rem", width: "160px", marginBottom: 0 }}
                disabled={isPending}
              >
                <option value="">تعديل الحالة جماعياً...</option>
                {Object.entries(statusTranslations).map(([key, value]) => (
                  <option key={key} value={key}>{value.text}</option>
                ))}
              </select>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus || isPending}
                className="btn btn-primary"
                style={{ height: "38px", padding: "0 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <CheckCircle size={15} />
                <span>تطبيق</span>
              </button>
            </div>

            {/* تعيين سائق */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <select
                className="form-input"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                style={{ height: "38px", padding: "0 0.5rem", fontSize: "0.85rem", width: "160px", marginBottom: 0 }}
                disabled={isPending}
              >
                <option value="">تعيين مندوب/سائق...</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
              <button
                onClick={handleBulkAssignDriver}
                disabled={!selectedDriver || isPending}
                className="btn btn-secondary"
                style={{ height: "38px", padding: "0 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <Truck size={15} />
                <span>إسناد</span>
              </button>
            </div>

            {/* تعيين وكيل */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <select
                className="form-input"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                style={{ height: "38px", padding: "0 0.5rem", fontSize: "0.85rem", width: "160px", marginBottom: 0 }}
                disabled={isPending}
              >
                <option value="">إسناد لوكيل خارجي...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
              <button
                onClick={handleBulkAssignAgent}
                disabled={!selectedAgent || isPending}
                className="btn btn-outline"
                style={{ height: "38px", padding: "0 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <User size={15} />
                <span>تكليف</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* جدول البيانات */}
      <div className="dashboard-card table-container" style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="no-print" style={{ width: "40px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)" }}
                >
                  {selectedIds.length === shipments.length && shipments.length > 0 ? (
                    <CheckSquare size={18} />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
              </th>
              <th>رقم التتبع</th>
              <th>المرسل</th>
              <th>المستلم</th>
              <th>المصدر ➔ الوجهة</th>
              <th>الخدمة / الدفع</th>
              <th>الرسوم والتحصيل</th>
              <th>الحالة</th>
              <th>تاريخ التسجيل</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => {
              const statusInfo = statusTranslations[shipment.status] || {
                text: shipment.status,
                class: "",
              };
              const isSelected = selectedIds.includes(shipment.id);

              return (
                <tr key={shipment.id} style={{ backgroundColor: isSelected ? "rgba(59, 130, 246, 0.02)" : "" }}>
                  <td className="no-print" style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleSelectRow(shipment.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: isSelected ? "var(--primary)" : "var(--text-muted)" }}
                    >
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="tracking-cell">{shipment.trackingNumber}</td>
                  <td>
                    <div className="user-info-cell">
                      <span className="cell-name">{shipment.sender.name}</span>
                      <span className="cell-phone">{shipment.sender.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-info-cell">
                      <span className="cell-name">{shipment.receiver.name}</span>
                      <span className="cell-phone">{shipment.receiver.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="route-cell">
                      <span>{shipment.originBranch.name}</span>
                      <span className="route-arrow">➔</span>
                      <span>{shipment.destBranch.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="service-cell">
                      <span className="service-type-text">
                        {shipment.serviceType === "URGENT"
                          ? "مستعجل ⚡"
                          : shipment.serviceType === "INSURED"
                          ? "أمانات 🛡️"
                          : "عادي"}
                      </span>
                      <span className="payment-method-text">
                        {shipment.paymentMethod === "CASH_ON_DELIVERY" ? "COD" : "Prepaid"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="finance-cell">
                      <div className="fee-row">
                        <span className="fee-label">الشحن:</span>
                        <span className="fee-val">{shipment.shippingFee.toLocaleString("ar-YE")} ريال</span>
                      </div>
                      {shipment.collectionAmount > 0 && (
                        <div className="fee-row cod-row">
                          <span className="fee-label">COD:</span>
                          <span className="fee-val font-bold">{shipment.collectionAmount.toLocaleString("ar-YE")} ريال</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>
                  </td>
                  <td className="date-cell">
                    {new Date(shipment.createdAt).toLocaleDateString("ar-YE", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                    })}
                  </td>
                  <td>
                    <Link href={`/dashboard/shipments/${shipment.id}`} className="btn btn-outline btn-sm table-action-btn">
                      <span>تفاصيل</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
