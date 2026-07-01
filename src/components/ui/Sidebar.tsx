"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  Truck,
  UserCheck,
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings,
  Search,
  UsersRound,
  X,
  MessageCircle,
} from "lucide-react";

interface SidebarProps {
  userRole: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ userRole, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "الرئيسية",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "ACCOUNTANT"],
    },
    {
      title: "إدارة الشحنات",
      path: "/dashboard/shipments",
      icon: Package,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST"],
    },
    {
      title: "التتبع السريع",
      path: "/dashboard/tracking",
      icon: Search,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST"],
    },
    {
      title: "إدارة العملاء",
      path: "/dashboard/customers",
      icon: Users,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST"],
    },
    {
      title: "الفروع والمناطق",
      path: "/dashboard/branches",
      icon: MapPin,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN"],
    },
    {
      title: "الموظفين",
      path: "/dashboard/employees",
      icon: UsersRound,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"],
    },
    {
      title: "الوكلاء",
      path: "/dashboard/agents",
      icon: UserCheck,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"],
    },
    {
      title: "السائقين",
      path: "/dashboard/drivers",
      icon: Truck,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"],
    },
    {
      title: "محرك التسعير",
      path: "/dashboard/pricing",
      icon: TrendingUp,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN"],
    },
    {
      title: "المالية والتحصيلات",
      path: "/dashboard/finance",
      icon: DollarSign,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "ACCOUNTANT"],
    },
    {
      title: "التقارير والإحصائيات",
      path: "/dashboard/reports",
      icon: BarChart3,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "ACCOUNTANT"],
    },
    {
      title: "إشعارات الواتساب",
      path: "/dashboard/notifications",
      icon: MessageCircle,
      roles: ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"],
    },
    {
      title: "الإعدادات العامة",
      path: "/dashboard/settings",
      icon: Settings,
      roles: ["SYSTEM_ADMIN"],
    },
  ];

  const allowedMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className={`dashboard-sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-logo-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="sidebar-logo-icon">W</div>
          <span className="sidebar-logo-text">وصّـل</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "0.25rem",
              display: "none", // Controlled via media queries in CSS
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={20} className="sidebar-nav-icon" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
