"use client";

import { useState } from "react";
import AddEmployeeForm from "@/components/forms/AddEmployeeForm";
import { UserPlus } from "lucide-react";

interface EmployeeAddButtonProps {
  branches: { id: string; name: string }[];
}

export default function EmployeeAddButton({ branches }: EmployeeAddButtonProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <UserPlus size={18} />
        <span>إضافة موظف جديد</span>
      </button>
      {showForm && <AddEmployeeForm branches={branches} onClose={() => setShowForm(false)} />}
    </>
  );
}
