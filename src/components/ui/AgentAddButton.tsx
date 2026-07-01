"use client";

import { useState } from "react";
import AddAgentForm from "@/components/forms/AddAgentForm";
import { UserPlus } from "lucide-react";

interface AgentAddButtonProps {
  branches: { id: string; name: string }[];
}

export default function AgentAddButton({ branches }: AgentAddButtonProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <UserPlus size={18} />
        <span>إضافة وكيل جديد</span>
      </button>
      {showForm && <AddAgentForm branches={branches} onClose={() => setShowForm(false)} />}
    </>
  );
}
