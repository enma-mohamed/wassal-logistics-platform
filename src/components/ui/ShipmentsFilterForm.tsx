"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, RotateCcw } from "lucide-react";

interface Branch {
  id: string;
  name: string;
}

interface ShipmentsFilterFormProps {
  branches: Branch[];
}

export default function ShipmentsFilterForm({ branches }: ShipmentsFilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [branch, setBranch] = useState(searchParams.get("branch") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(q, status, branch);
  };

  const updateUrl = (searchVal: string, statusVal: string, branchVal: string) => {
    const params = new URLSearchParams();
    if (searchVal) params.set("q", searchVal);
    if (statusVal) params.set("status", statusVal);
    if (branchVal) params.set("branch", branchVal);

    startTransition(() => {
      router.push(`/dashboard/shipments?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setQ("");
    setStatus("");
    setBranch("");
    startTransition(() => {
      router.push("/dashboard/shipments");
    });
  };

  return (
    <form onSubmit={handleSearch} className="dashboard-card filter-form">
      <div className="filter-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="search-input">البحث العام</label>
          <div className="search-input-wrapper">
            <input
              id="search-input"
              type="text"
              className="form-input search-input-field"
              placeholder="رقم التتبع، المرسل، المستلم، الهاتف..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Search size={18} className="search-input-icon" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="status-select">حالة الشحنة</label>
          <select
            id="status-select"
            className="form-input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              updateUrl(q, e.target.value, branch);
            }}
          >
            <option value="">كل الحالات</option>
            <option value="PENDING_RECEIVE">قيد انتظار الاستلام</option>
            <option value="RECEIVED_IN_BRANCH">تم الاستلام في الفرع</option>
            <option value="IN_SORTING">في الفرز والتجهيز</option>
            <option value="IN_TRANSIT">قيد النقل والتوصيل</option>
            <option value="ARRIVED_BRANCH">وصلت فرع الوجهة</option>
            <option value="OUT_FOR_DELIVERY">خرجت مع المندوب</option>
            <option value="DELIVERED">تم التسليم بنجاح</option>
            <option value="RETURNED">مرتجعة للمرسل</option>
            <option value="CANCELLED">ملغاة</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="branch-select">الفرع (المصدر/الوجهة)</label>
          <select
            id="branch-select"
            className="form-input"
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              updateUrl(q, status, e.target.value);
            }}
          >
            <option value="">كل الفروع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-actions-group">
          <button type="submit" className="btn btn-primary search-btn" disabled={isPending}>
            <span>بحث</span>
          </button>
          <button type="button" className="btn btn-outline reset-btn" onClick={handleReset} title="إعادة تعيين">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </form>
  );
}
