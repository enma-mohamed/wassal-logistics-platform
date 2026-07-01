import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditShipmentForm from "@/components/forms/EditShipmentForm";
import { getSystemSettings } from "@/lib/settings";
import { getSession } from "@/app/actions/auth";

export const revalidate = 0; // إيقاف الكاش لرؤية التغييرات فوراً

type Params = Promise<{ id: string }>;

export default async function EditShipmentPage(props: { params: Params }) {
  const { id } = await props.params;

  // 1. التحقق من جلسة المستخدم وصلاحياته
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // السماح للمشرفين ومديري الفروع وموظفي الاستقبال فقط بالتعديل
  const allowedRoles = ["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST"];
  if (!allowedRoles.includes(session.role)) {
    redirect("/dashboard");
  }

  // 2. جلب تفاصيل الشحنة من قاعدة البيانات
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      sender: true,
      receiver: true,
      items: true,
    },
  });

  if (!shipment) {
    notFound();
  }

  // 3. جلب البيانات المساعدة للنموذج
  const provinces = await prisma.province.findMany({
    where: { isActive: true },
    include: {
      cities: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const pricingRules = await prisma.pricingRule.findMany({
    where: { isActive: true },
  });

  // 4. جلب إعدادات النظام التشغيلية
  const systemSettings = getSystemSettings();

  return (
    <div className="edit-shipment-page-container">
      <EditShipmentForm
        shipment={shipment}
        provinces={provinces}
        branches={branches}
        pricingRules={pricingRules}
        manualFeesEnabled={systemSettings.manualFeesEnabled}
        forceWeight={systemSettings.forceWeight}
      />
    </div>
  );
}
