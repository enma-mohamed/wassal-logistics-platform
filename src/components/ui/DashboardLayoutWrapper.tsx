"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutWrapperProps {
  userRole: string;
  session: {
    id: string;
    name: string;
    email: string;
    role: string;
    branchId: string | null;
    branchName: string | null;
  };
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({
  userRole,
  session,
  children,
}: DashboardLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`dashboard-layout ${isSidebarOpen ? "sidebar-mobile-open" : ""}`}>
      {/* Sidebar with mobile toggle capability */}
      <Sidebar 
        userRole={userRole} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Overlay to close sidebar on mobile click */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="dashboard-content-wrapper">
        <Header 
          session={session} 
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        <main className="dashboard-main-content">{children}</main>
      </div>
    </div>
  );
}
