import prisma from "@/lib/prisma";
import PricingRulesTable from "@/components/ui/PricingRulesTable";

export const revalidate = 0;

export default async function PricingPage() {
  const rules = await prisma.pricingRule.findMany({
    include: {
      originProvince: true,
      destProvince: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pricing-page-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header-section">
        <div>
          <h1 className="page-title">قواعد تسعير المحافظات</h1>
          <p className="page-subtitle">قائمة بتسعيرات النقل بين المحافظات وتكلفة الأوزان والخدمات المضافة في اليمن</p>
        </div>
      </div>

      <PricingRulesTable rules={rules} />
    </div>
  );
}
