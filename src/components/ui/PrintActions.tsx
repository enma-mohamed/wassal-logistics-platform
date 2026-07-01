"use client";

import Link from "next/link";
import { Printer, ArrowRight } from "lucide-react";

interface PrintActionsProps {
  shipmentId: string;
}

export default function PrintActions({ shipmentId }: PrintActionsProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem" }}>
      <Link href={`/dashboard/shipments/${shipmentId}`} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
        <ArrowRight size={16} />
        <span>الرجوع للتفاصيل</span>
      </Link>
      <button
        onClick={handlePrint}
        className="btn btn-primary"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}
      >
        <Printer size={16} />
        <span>بدء الطباعة الفورية</span>
      </button>
    </div>
  );
}
