"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateShipmentAction, findCustomerByPhoneAction } from "@/app/actions/shipments";
import { User, MapPin, Package, DollarSign, Plus, Trash2, Check, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

interface City {
  id: string;
  name: string;
  provinceId: string;
}

interface Province {
  id: string;
  name: string;
  cities: City[];
}

interface Branch {
  id: string;
  name: string;
}

interface PricingRule {
  id: string;
  originProvinceId: string;
  destProvinceId: string;
  basePrice: number;
  weightRate: number;
  serviceMultiplier: number;
  minPrice: number;
}

interface EditShipmentFormProps {
  shipment: {
    id: string;
    trackingNumber: string;
    status: string;
    type: string;
    serviceType: string;
    paymentMethod: string;
    declaredValue: number;
    shippingFee: number;
    collectionAmount: number;
    notes: string | null;
    metadataJson: string | null;
    originBranchId: string;
    destBranchId: string;
    sender: {
      id: string;
      name: string;
      phone: string;
      altPhone: string | null;
      provinceId: string;
      cityId: string;
      address: string;
      landmark: string | null;
    };
    receiver: {
      id: string;
      name: string;
      phone: string;
      altPhone: string | null;
      provinceId: string;
      cityId: string;
      address: string;
      landmark: string | null;
    };
    items: {
      id: string;
      description: string;
      count: number;
      weight: number;
      price: number;
    }[];
  };
  provinces: Province[];
  branches: Branch[];
  pricingRules: PricingRule[];
  manualFeesEnabled: boolean;
  forceWeight: boolean;
}

export default function EditShipmentForm({
  shipment,
  provinces,
  branches,
  pricingRules,
  manualFeesEnabled,
  forceWeight,
}: EditShipmentFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. بيانات المرسل
  const [senderName, setSenderName] = useState(shipment.sender.name);
  const [senderPhone, setSenderPhone] = useState(shipment.sender.phone);
  const [senderAltPhone, setSenderAltPhone] = useState(shipment.sender.altPhone || "");
  const [senderProvinceId, setSenderProvinceId] = useState(shipment.sender.provinceId);
  const [senderCityId, setSenderCityId] = useState(shipment.sender.cityId);
  const [senderAddress, setSenderAddress] = useState(shipment.sender.address);
  const [senderLandmark, setSenderLandmark] = useState(shipment.sender.landmark || "");

  // 2. بيانات المستلم
  const [receiverName, setReceiverName] = useState(shipment.receiver.name);
  const [receiverPhone, setReceiverPhone] = useState(shipment.receiver.phone);
  const [receiverAltPhone, setReceiverAltPhone] = useState(shipment.receiver.altPhone || "");
  const [receiverProvinceId, setReceiverProvinceId] = useState(shipment.receiver.provinceId);
  const [receiverCityId, setReceiverCityId] = useState(shipment.receiver.cityId);
  const [receiverAddress, setReceiverAddress] = useState(shipment.receiver.address);
  const [receiverLandmark, setReceiverLandmark] = useState(shipment.receiver.landmark || "");

  // 3. تفاصيل الشحن والوجهة
  const [originBranchId, setOriginBranchId] = useState(shipment.originBranchId);
  const [destBranchId, setDestBranchId] = useState(shipment.destBranchId);
  const [shipmentType, setShipmentType] = useState(shipment.type);
  const [serviceType, setServiceType] = useState(shipment.serviceType);
  const [paymentMethod, setPaymentMethod] = useState(shipment.paymentMethod);
  const [declaredValue, setDeclaredValue] = useState(shipment.declaredValue);
  const [notes, setNotes] = useState(shipment.notes || "");
  const shipmentMetadata = (() => {
    try {
      return shipment.metadataJson ? JSON.parse(shipment.metadataJson) : {};
    } catch {
      return {};
    }
  })();
  const [isFragile, setIsFragile] = useState(Boolean(shipmentMetadata.isFragile));

  // 4. قطع الشحنة
  const [items, setItems] = useState<{ description: string; count: number; weight: number; price: number }[]>(
    shipment.items.map(item => ({
      description: item.description,
      count: item.count,
      weight: item.weight,
      price: item.price,
    }))
  );

  // المالي
  const [shippingFee, setShippingFee] = useState(shipment.shippingFee);
  const [isManualFee, setIsManualFee] = useState(shipment.shippingFee !== 0);
  const [collectionAmount, setCollectionAmount] = useState(shipment.collectionAmount);

  // البحث التلقائي عن المرسل عند تغيير الهاتف (إذا اختلف عن الهاتف الأصلي)
  useEffect(() => {
    if (senderPhone.trim().length === 9 && senderPhone.trim() !== shipment.sender.phone) {
      const lookupSender = async () => {
        const res = await findCustomerByPhoneAction(senderPhone.trim());
        if (res.success && res.customer) {
          const c = res.customer;
          setSenderName(c.name);
          setSenderAltPhone(c.altPhone || "");
          setSenderProvinceId(c.provinceId);
          setSenderCityId(c.cityId);
          setSenderAddress(c.address);
          setSenderLandmark(c.landmark || "");
        }
      };
      lookupSender();
    }
  }, [senderPhone, shipment.sender.phone]);

  // البحث التلقائي عن المستلم عند تغيير الهاتف (إذا اختلف عن الهاتف الأصلي)
  useEffect(() => {
    if (receiverPhone.trim().length === 9 && receiverPhone.trim() !== shipment.receiver.phone) {
      const lookupReceiver = async () => {
        const res = await findCustomerByPhoneAction(receiverPhone.trim());
        if (res.success && res.customer) {
          const c = res.customer;
          setReceiverName(c.name);
          setReceiverAltPhone(c.altPhone || "");
          setReceiverProvinceId(c.provinceId);
          setReceiverCityId(c.cityId);
          setReceiverAddress(c.address);
          setReceiverLandmark(c.landmark || "");
        }
      };
      lookupReceiver();
    }
  }, [receiverPhone, shipment.receiver.phone]);

  // تحديث الفرع الافتراضي للمستلم بناءً على محافظة المستلم عند التغيير
  useEffect(() => {
    if (receiverProvinceId && receiverProvinceId !== shipment.receiver.provinceId) {
      const receiverProvinceName = provinces.find((p) => p.id === receiverProvinceId)?.name || "";
      const targetBranch = branches.find((b) => {
        if (receiverProvinceName === "أمانة العاصمة" || receiverProvinceName === "صنعاء") {
          return b.name.includes("صنعاء");
        }
        return b.name.includes(receiverProvinceName);
      });
      if (targetBranch) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDestBranchId(targetBranch.id);
      }
    }
  }, [receiverProvinceId, branches, provinces, shipment.receiver.provinceId]);

  // حساب التكلفة التلقائية عند تغيير الوزن أو المحافظات أو نوع الخدمة
  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.count, 0);

  useEffect(() => {
    // احسب التكلفة تلقائياً فقط إذا لم تكن مدخلة يدوياً أو إذا كان التعديل اليدوي معطلاً بالنظام
    if (!isManualFee || !manualFeesEnabled) {
      if (senderProvinceId && receiverProvinceId) {
        const rule = pricingRules.find(
          (r) =>
            r.originProvinceId === senderProvinceId && r.destProvinceId === receiverProvinceId
        );

        if (rule) {
          let fee = rule.basePrice;
          if (totalWeight > 1) {
            fee += (totalWeight - 1) * rule.weightRate;
          }
          if (serviceType === "URGENT") {
            fee = fee * rule.serviceMultiplier;
          }
          fee = Math.max(fee, rule.minPrice);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setShippingFee(Math.round(fee));
        } else {
          const defaultFee = senderProvinceId === receiverProvinceId ? 800 : 1500;
          setShippingFee(defaultFee + Math.max(0, totalWeight - 1) * 200);
        }
      }
    }
  }, [senderProvinceId, receiverProvinceId, totalWeight, serviceType, pricingRules, isManualFee, manualFeesEnabled]);

  const senderCities = provinces.find((p) => p.id === senderProvinceId)?.cities || [];
  const receiverCities = provinces.find((p) => p.id === receiverProvinceId)?.cities || [];

  const handleAddItem = () => {
    setItems([...items, { description: "قطعة إضافية", count: 1, weight: 0.5, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, val: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // التحقق من المدخلات
    if (!senderName || !senderPhone || !senderProvinceId || !senderCityId || !senderAddress) {
      setError("يرجى ملء جميع البيانات الأساسية للمرسل");
      return;
    }

    if (!receiverName || !receiverPhone || !receiverProvinceId || !receiverCityId || !receiverAddress) {
      setError("يرجى ملء جميع البيانات الأساسية للمستلم");
      return;
    }

    if (!originBranchId || !destBranchId) {
      setError("يرجى تحديد فرع المصدر وفرع الوجهة");
      return;
    }

    if (items.length === 0) {
      setError("يجب إضافة قطعة واحدة على الأقل في الشحنة");
      return;
    }

    // التحقق من الوزن إذا كان إلزامياً
    if (forceWeight) {
      const invalidItem = items.some((item) => !item.weight || item.weight <= 0);
      if (invalidItem) {
        setError("إعدادات النظام تلزم كتابة وزن صحيح (أكبر من صفر) لكل قطعة");
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      id: shipment.id,
      type: shipmentType,
      serviceType,
      paymentMethod,
      declaredValue: Number(declaredValue),
      shippingFee: Number(shippingFee),
      collectionAmount: paymentMethod === "CASH_ON_DELIVERY" ? Number(collectionAmount) : 0,
      notes,
      metadataJson: JSON.stringify({
        isFragile,
        labelStyle: shipmentType === "DOCUMENTS" ? "document" : shipmentType === "SECURE_PARCEL" ? "secure" : "standard",
      }),
      originBranchId,
      destBranchId,
      sender: {
        name: senderName,
        phone: senderPhone,
        altPhone: senderAltPhone || undefined,
        provinceId: senderProvinceId,
        cityId: senderCityId,
        address: senderAddress,
        landmark: senderLandmark || undefined,
      },
      receiver: {
        name: receiverName,
        phone: receiverPhone,
        altPhone: receiverAltPhone || undefined,
        provinceId: receiverProvinceId,
        cityId: receiverCityId,
        address: receiverAddress,
        landmark: receiverLandmark || undefined,
      },
      items: items.map((item) => ({
        description: item.description,
        count: Number(item.count),
        weight: Number(item.weight),
        price: Number(item.price),
      })),
    };

    const res = await updateShipmentAction(payload);

    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/shipments/${shipment.id}`);
        router.refresh();
      }, 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="shipment-form" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="details-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href={`/dashboard/shipments/${shipment.id}`} className="btn btn-outline back-btn" style={{ padding: "0.5rem" }}>
            <ArrowRight size={18} />
          </Link>
          <div>
            <h1 className="page-title">تعديل الشحنة #{shipment.trackingNumber}</h1>
            <p className="page-subtitle">تعديل الأطراف، المواصفات الفنية، والقطع الخاصة بالشحنة</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="auth-error status-success-alert" style={{ width: "100%", padding: "1rem" }}>
          <Check size={18} />
          <span>تم حفظ التعديلات بنجاح! جاري تحويلك لتفاصيل الشحنة...</span>
        </div>
      )}

      {error && (
        <div className="auth-error" style={{ width: "100%", padding: "1rem" }}>
          <span>{error}</span>
        </div>
      )}

      {/* تخطيط الأطراف في صفين متجاورين */}
      <div className="form-section-columns" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* المرسل */}
        <div className="dashboard-card form-section-card">
          <h3 className="section-title-with-icon">
            <User size={18} className="text-blue" />
            <span>بيانات المرسل</span>
          </h3>

          <div style={{ marginTop: "1rem" }}>
            <div className="form-group">
              <label className="form-label">اسم المرسل الكلي *</label>
              <input
                type="text"
                className="form-input"
                placeholder="الاسم الثلاثي أو اسم الشركة"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">رقم الهاتف الأساسي *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="77xxxxxxx"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">رقم هاتف بديل (اختياري)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="7xxxxxxxx"
                  value={senderAltPhone}
                  onChange={(e) => setSenderAltPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">المحافظة *</label>
                <select
                  className="form-input"
                  value={senderProvinceId}
                  onChange={(e) => {
                    setSenderProvinceId(e.target.value);
                    setSenderCityId(""); // تفريغ المدينة عند تغيير المحافظة
                  }}
                  required
                >
                  <option value="">اختر المحافظة...</option>
                  {provinces.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">المديرية / المدينة *</label>
                <select
                  className="form-input"
                  value={senderCityId}
                  onChange={(e) => setSenderCityId(e.target.value)}
                  required
                  disabled={!senderProvinceId}
                >
                  <option value="">اختر المدينة...</option>
                  {senderCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">العنوان بالتفصيل *</label>
              <input
                type="text"
                className="form-input"
                placeholder="الشارع، الحارة، اسم المحل أو العمارة"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">معلم بارز (اختياري)</label>
              <input
                type="text"
                className="form-input"
                placeholder="بجوار مسجد... أو جولة..."
                value={senderLandmark}
                onChange={(e) => setSenderLandmark(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* المستلم */}
        <div className="dashboard-card form-section-card">
          <h3 className="section-title-with-icon">
            <User size={18} className="text-green" />
            <span>بيانات المستلم</span>
          </h3>

          <div style={{ marginTop: "1rem" }}>
            <div className="form-group">
              <label className="form-label">اسم المستلم الكلي *</label>
              <input
                type="text"
                className="form-input"
                placeholder="اسم الشخص المستلم ثنائياً أو ثلاثياً"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">رقم الهاتف الأساسي *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="77xxxxxxx"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">رقم هاتف بديل (اختياري)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="7xxxxxxxx"
                  value={receiverAltPhone}
                  onChange={(e) => setReceiverAltPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">المحافظة الوجهة *</label>
                <select
                  className="form-input"
                  value={receiverProvinceId}
                  onChange={(e) => {
                    setReceiverProvinceId(e.target.value);
                    setReceiverCityId("");
                  }}
                  required
                >
                  <option value="">اختر المحافظة...</option>
                  {provinces.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">المديرية / المدينة الوجهة *</label>
                <select
                  className="form-input"
                  value={receiverCityId}
                  onChange={(e) => setReceiverCityId(e.target.value)}
                  required
                  disabled={!receiverProvinceId}
                >
                  <option value="">اختر المدينة...</option>
                  {receiverCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">العنوان بالتفصيل للمستلم *</label>
              <input
                type="text"
                className="form-input"
                placeholder="الشارع، الحارة، أو المنزل بالتفصيل لسهولة التوصيل"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">معلم بارز (اختياري)</label>
              <input
                type="text"
                className="form-input"
                placeholder="بجوار مستشفى... أو مدرسة..."
                value={receiverLandmark}
                onChange={(e) => setReceiverLandmark(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* المسار والتفاصيل الفنية للشحنة */}
      <div className="dashboard-card form-section-card">
        <h3 className="section-title-with-icon">
          <MapPin size={18} className="text-blue" />
          <span>المسار والمواصفات التشغيلية</span>
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          <div className="form-group">
            <label className="form-label">فرع الاستلام (المصدر) *</label>
            <select
              className="form-input"
              value={originBranchId}
              onChange={(e) => setOriginBranchId(e.target.value)}
              required
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">فرع التسليم (الوجهة) *</label>
            <select
              className="form-input"
              value={destBranchId}
              onChange={(e) => setDestBranchId(e.target.value)}
              required
            >
              <option value="">اختر الفرع الوجهة...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">نوع الشحنة *</label>
            <select
              className="form-input"
              value={shipmentType}
              onChange={(e) => setShipmentType(e.target.value)}
              required
            >
              <option value="PARCEL">طرد / كرتون عام</option>
              <option value="DOCUMENTS">مستندات ووثائق مغلقة</option>
              <option value="SECURE_PARCEL">أمانات ثمينة / مغلف سري</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">نوع الخدمة *</label>
            <select
              className="form-input"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
            >
              <option value="REGULAR">توصيل عادي (قياسي)</option>
              <option value="URGENT">توصيل سريع (⚡ مستعجل)</option>
              <option value="INSURED">أمانات مؤمنة (🛡️ تعويض 100%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* محتويات الطرد والقطع */}
      <div className="dashboard-card form-section-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 className="section-title-with-icon" style={{ margin: 0 }}>
            <Package size={18} className="text-secondary" />
            <span>قطع ومحتويات الشحنة التفصيلية</span>
          </h3>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleAddItem}
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          >
            <Plus size={16} />
            <span>إضافة قطعة أخرى</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="items-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "right" }}>
                <th style={{ padding: "0.75rem 0.5rem" }}>وصف المحتوى بالتفصيل *</th>
                <th style={{ padding: "0.75rem 0.5rem", width: "100px" }}>الكمية *</th>
                <th style={{ padding: "0.75rem 0.5rem", width: "130px" }}>الوزن التقريبي (كجم)</th>
                <th style={{ padding: "0.75rem 0.5rem", width: "160px" }}>القيمة التقديرية (اختياري)</th>
                <th style={{ padding: "0.75rem 0.5rem", width: "60px", textAlign: "center" }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem 0.5rem" }}>
                    <input
                      type="text"
                      className="form-input"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      placeholder="مثال: ملابس، لابتوب مستعمل، مستندات..."
                      required
                    />
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem" }}>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={item.count}
                      onChange={(e) => handleItemChange(index, "count", Math.max(1, parseInt(e.target.value) || 1))}
                      required
                    />
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem" }}>
                    <input
                      type="number"
                      className="form-input"
                      step="0.1"
                      min="0"
                      value={item.weight}
                      onChange={(e) => handleItemChange(index, "weight", Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="1.0"
                    />
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem" }}>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="ريال يمني"
                    />
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                    <button
                      type="button"
                      className="btn-text text-danger"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                      style={{ padding: "0.25rem", display: "inline-flex", cursor: items.length === 1 ? "not-allowed" : "pointer" }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* الحساب المالي والملاحظات */}
      <div className="dashboard-card form-section-card">
        <h3 className="section-title-with-icon">
          <DollarSign size={18} className="text-warning" />
          <span>المصاريف وطريقة التحصيل المالي</span>
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1rem" }}>
          {/* اليمين: الحسابات */}
          <div>
            <div className="form-group">
              <label className="form-label">طريقة الدفع وسداد الرسوم *</label>
              <select
                className="form-input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                <option value="CASH_ON_DELIVERY">الدفع عند التسليم للمستلم (COD)</option>
                <option value="PREPAID">مدفوع مقدماً من المرسل (PREPAID)</option>
                <option value="ACCOUNT_DEBIT">آجل - على الحساب المفتوح للعميل</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="form-label">رسوم التوصيل (ريال) *</label>
                  {manualFeesEnabled && (
                    <label style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", color: "var(--text-secondary)" }}>
                      <input
                        type="checkbox"
                        checked={isManualFee}
                        onChange={(e) => setIsManualFee(e.target.checked)}
                      />
                      <span>تعديل يدوي</span>
                    </label>
                  )}
                </div>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={manualFeesEnabled ? !isManualFee : true}
                  style={{
                    backgroundColor: (manualFeesEnabled && isManualFee) ? "var(--surface)" : "var(--surface-hover)",
                    fontWeight: "bold",
                  }}
                  required
                />
              </div>

              {paymentMethod === "CASH_ON_DELIVERY" && (
                <div className="form-group">
                  <label className="form-label">مبلغ التحصيل COD المطلوب (ريال) *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={collectionAmount}
                    onChange={(e) => setCollectionAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ fontWeight: "bold", color: "var(--warning)" }}
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: "0.5rem" }}>
              <label className="form-label">تأمين قيمة الشحنة الاختياري (ريال)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="لأغراض تقدير التعويضات في حال الضرر"
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}>
              <label style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: isFragile ? "var(--warning-light)" : "var(--surface)",
                cursor: "pointer",
                fontWeight: 700,
              }}>
                <input
                  type="checkbox"
                  checked={isFragile}
                  onChange={(e) => setIsFragile(e.target.checked)}
                />
                <span>هذه الشحنة قابلة للكسر</span>
              </label>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                سيظهر تنبيه واضح على الملصق وورقة الطباعة.
              </span>
            </div>
          </div>

          {/* اليسار: ملاحظات الشحن */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">ملاحظات تسليم الشحنة</label>
              <textarea
                className="form-input"
                placeholder="أية توجيهات للمندوب أو شروط خاصة بالتسليم للعميل..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ height: "100%", minHeight: "120px", resize: "vertical" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* أزرار الحفظ */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
        <Link href={`/dashboard/shipments/${shipment.id}`} className="btn btn-outline">
          إلغاء والتراجع
        </Link>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          style={{ minWidth: "150px" }}
        >
          {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <Check size={18} />}
          <span>حفظ تعديلات الشحنة</span>
        </button>
      </div>
    </form>
  );
}
