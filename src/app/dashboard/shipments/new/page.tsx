import prisma from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import ShipmentForm from "@/components/forms/ShipmentForm";
import { redirect } from "next/navigation";

export const revalidate = 0; // إيقاف الكاش

export default async function NewShipmentPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // 1. جلب المحافظات والمدن لفرز أطراف الشحنة
  const provinces = await prisma.province.findMany({
    include: {
      cities: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // 2. جلب الفروع لتحديد الوجهات والمسارات
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
  });

  // 3. جلب قواعد التسعير المتاحة للحساب التلقائي لرسوم الشحن
  const pricingRules = await prisma.pricingRule.findMany({
    select: {
      id: true,
      originProvinceId: true,
      destProvinceId: true,
      basePrice: true,
      weightRate: true,
      serviceMultiplier: true,
      minPrice: true,
    },
  });

  return (
    <div className="new-shipment-page">
      <div className="page-header-section" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">تسجيل شحنة جديدة</h1>
          <p className="page-subtitle">أدخل بيانات المرسل والمستلم وتفاصيل الطرد لإنشاء رقم التتبع وحساب التكلفة</p>
        </div>
      </div>

      <ShipmentForm
        provinces={provinces}
        branches={branches}
        pricingRules={pricingRules}
        defaultOriginBranchId={session.branchId}
      />
    </div>
  );
}
