import prisma from "@/lib/prisma";
import EmployeeAddButton from "@/components/ui/EmployeeAddButton";
import EmployeesTable from "@/components/ui/EmployeesTable";

export const revalidate = 0;

export default async function EmployeesPage() {
  const [employees, branches] = await Promise.all([
    prisma.user.findMany({
      include: { branch: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.branch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  // Serialize dates for client component
  const serializedEmployees = employees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    phone: emp.phone,
    role: emp.role,
    isActive: emp.isActive,
    createdAt: emp.createdAt.toISOString(),
    branch: emp.branch ? { id: emp.branch.id, name: emp.branch.name } : null,
  }));

  return (
    <div className="employees-page-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">إدارة الموظفين والمستخدمين</h1>
          <p className="page-subtitle">عرض صلاحيات وهواتف وفروع الموظفين النشطين في منصة وصّل</p>
        </div>
        <EmployeeAddButton branches={branches} />
      </div>

      <EmployeesTable employees={serializedEmployees} branches={branches} />
    </div>
  );
}
