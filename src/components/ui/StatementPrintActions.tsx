"use client";

import Link from "next/link";
import { ArrowRight, Printer } from "lucide-react";

export default function StatementPrintActions() {
  return (
    <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem" }}>
      <Link href="/dashboard/customers" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
        <ArrowRight size={16} />
        <span>الرجوع للعملاء</span>
      </Link>
      <button
        onClick={() => window.print()}
        className="btn btn-primary"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}
      >
        <Printer size={16} />
        <span>طباعة كشف الحساب</span>
      </button>
    </div>
  );
}
