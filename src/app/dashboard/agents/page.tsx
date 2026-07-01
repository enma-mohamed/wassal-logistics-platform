import prisma from "@/lib/prisma";
import AgentAddButton from "@/components/ui/AgentAddButton";
import AgentsTable from "@/components/ui/AgentsTable";

export const revalidate = 0;

export default async function AgentsPage() {
  const [agents, branches] = await Promise.all([
    prisma.agent.findMany({
      include: {
        user: {
          include: { branch: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.branch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const serializedAgents = agents.map((agent) => ({
    id: agent.id,
    area: agent.area,
    commissionType: agent.commissionType,
    commissionRate: agent.commissionRate,
    status: agent.status,
    rating: agent.rating,
    user: {
      id: agent.user.id,
      name: agent.user.name,
      email: agent.user.email,
      phone: agent.user.phone,
      branch: agent.user.branch ? { name: agent.user.branch.name } : null,
    },
  }));

  return (
    <div className="agents-page-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">إدارة الوكلاء الخارجيين</h1>
          <p className="page-subtitle">عرض وتتبع قائمة الوكلاء الخارجيين النشطين ومناطق تغطيتهم ونسب عمولاتهم بالريال اليمني</p>
        </div>
        <AgentAddButton branches={branches} />
      </div>

      <AgentsTable agents={serializedAgents} branches={branches} />
    </div>
  );
}
