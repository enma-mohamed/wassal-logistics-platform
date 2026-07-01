"use client";

import { Download } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportData {
  totalShipments: number;
  deliveredShipments: number;
  returnedShipments: number;
  deliverySuccessRate: number;
  returnRate: number;
  totalShippingFees: number;
  totalCOD: number;
  avgShippingFee: number;
  avgCOD: number;
}

export default function ReportExportButton({ data }: { data: ExportData }) {
  const handleExport = () => {
    const rows = [
      { المؤشر: "إجمالي الشحنات المسجلة", القيمة: data.totalShipments, الواحدة: "شحنة" },
      { المؤشر: "الشحنات المسلّمة بنجاح", القيمة: data.deliveredShipments, الواحدة: "شحنة" },
      { المؤشر: "الشحنات المرتجعة", القيمة: data.returnedShipments, الواحدة: "شحنة" },
      { المؤشر: "معدل التوصيل الناجح", القيمة: data.deliverySuccessRate, الواحدة: "%" },
      { المؤشر: "نسبة المرتجعات", القيمة: data.returnRate, الواحدة: "%" },
      { المؤشر: "إجمالي رسوم الشحن", القيمة: data.totalShippingFees, الواحدة: "ريال يمني" },
      { المؤشر: "إجمالي مبالغ COD المستهدفة", القيمة: data.totalCOD, الواحدة: "ريال يمني" },
      { المؤشر: "متوسط رسوم الشحنة", القيمة: data.avgShippingFee, الواحدة: "ريال يمني" },
      { المؤشر: "متوسط مبلغ COD", القيمة: data.avgCOD, الواحدة: "ريال يمني" },
      { المؤشر: "إجمالي الإيرادات والتحصيلات", القيمة: data.totalShippingFees + data.totalCOD, الواحدة: "ريال يمني" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `wassal-report-${dateStr}.xlsx`, { compression: true });
  };

  return (
    <button
      onClick={handleExport}
      className="btn btn-secondary"
      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      title="تصدير التقرير بصيغة Excel"
    >
      <Download size={18} />
      <span>تصدير تقرير Excel</span>
    </button>
  );
}

