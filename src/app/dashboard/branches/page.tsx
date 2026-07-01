import prisma from "@/lib/prisma";
import BranchesTable from "@/components/ui/BranchesTable";

export const revalidate = 0;

export default async function BranchesPage() {
  const branches = await prisma.branch.findMany({
    include: {
      province: true,
      manager: true,
      _count: {
        select: {
          employees: true,
          originShipments: true,
          destShipments: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="branches-page-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header-section">
        <div>
          <h1 className="page-title">الفروع والمناطق اللوجستية</h1>
          <p className="page-subtitle">عرض وتتبع الفروع والمكاتب وتوزيع الموظفين والشحنات الصادرة والواردة لكل فرع</p>
        </div>
      </div>

      <BranchesTable branches={branches} />
    </div>
  );
}
