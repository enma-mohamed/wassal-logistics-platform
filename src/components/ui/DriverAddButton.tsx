"use client";

import { useState } from "react";
import AddDriverForm from "@/components/forms/AddDriverForm";
import { UserPlus } from "lucide-react";

interface DriverAddButtonProps {
  branches: { id: string; name: string }[];
}

export default function DriverAddButton({ branches }: DriverAddButtonProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <UserPlus size={18} />
        <span>إضافة سائق جديد</span>
      </button>
      {showForm && <AddDriverForm branches={branches} onClose={() => setShowForm(false)} />}
    </>
  );
}
