import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import DashboardLayoutWrapper from "@/components/ui/DashboardLayoutWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const serializedSession = {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    branchId: session.branchId || null,
    branchName: session.branchName || null,
  };

  return (
    <DashboardLayoutWrapper userRole={session.role} session={serializedSession}>
      {children}
    </DashboardLayoutWrapper>
  );
}
