import prisma from "@/lib/prisma";
import DriverAddButton from "@/components/ui/DriverAddButton";
import DriversTable from "@/components/ui/DriversTable";

export const revalidate = 0;

export default async function DriversPage() {
  const [drivers, branches] = await Promise.all([
    prisma.driver.findMany({
      include: {
        user: {
          include: { branch: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.branch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const serializedDrivers = drivers.map((driver) => ({
    id: driver.id,
    status: driver.status,
    vehiclePlate: driver.vehiclePlate,
    licenseNumber: driver.licenseNumber,
    rating: driver.rating,
    user: {
      id: driver.user.id,
      name: driver.user.name,
      email: driver.user.email,
      phone: driver.user.phone,
      branch: driver.user.branch ? { name: driver.user.branch.name } : null,
    },
  }));

  return (
    <div className="drivers-page-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">إدارة مناديب وسائقي التوصيل</h1>
          <p className="page-subtitle">عرض وتتبع قائمة السائقين والمناديب الداخليين، لوحات مركباتهم، وحالتهم التشغيلية الحالية</p>
        </div>
        <DriverAddButton branches={branches} />
      </div>

      <DriversTable drivers={serializedDrivers} branches={branches} />
    </div>
  );
}
