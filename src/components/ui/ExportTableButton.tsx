"use client";

import React from "react";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportTableButtonProps {
  data: Record<string, unknown>[];
  headers: Record<string, string>; // Mapping of data keys to Excel headers (e.g., { name: "الاسم", phone: "الهاتف" })
  fileName?: string;
  buttonText?: string;
}

function getNestedValue(item: Record<string, unknown>, key: string): unknown {
  if (!key.includes(".")) {
    return item[key];
  }

  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") {
      return "";
    }
    const record = current as Record<string, unknown>;
    return record[part];
  }, item);
}

export default function ExportTableButton({
  data,
  headers,
  fileName = "export",
  buttonText = "تصدير البيانات",
}: ExportTableButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("لا توجد بيانات لتصديرها.");
      return;
    }

    const headerKeys = Object.keys(headers);
    const rows = data.map((item) => {
      const row: Record<string, string | number> = {};

      headerKeys.forEach((key) => {
        const value = getNestedValue(item, key);

        if (value === null || value === undefined) {
          row[headers[key]] = "";
        } else if (typeof value === "boolean") {
          row[headers[key]] = value ? "نعم" : "لا";
        } else if (typeof value === "string" || typeof value === "number") {
          row[headers[key]] = value;
        } else {
          row[headers[key]] = String(value);
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `${fileName}-${dateStr}.xlsx`, { compression: true });
  };

  return (
    <button
      onClick={handleExport}
      className="btn btn-outline"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        borderColor: "var(--border)",
        color: "var(--text-secondary)",
        backgroundColor: "var(--surface)",
        padding: "0.5rem 1rem",
        fontSize: "0.85rem",
        height: "42px",
      }}
      title="تصدير هذه القائمة بصيغة ملف Excel"
    >
      <FileSpreadsheet size={16} style={{ color: "#10b981" }} />
      <span>{buttonText}</span>
    </button>
  );
}
