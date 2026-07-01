"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createShipmentAction, findCustomerByPhoneAction } from "@/app/actions/shipments";
import { User, Package, DollarSign, Plus, Trash2, Check } from "lucide-react";

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

interface ShipmentFormProps {
  provinces: Province[];
  branches: Branch[];
  pricingRules: PricingRule[];
  defaultOriginBranchId: string | null;
}

export default function ShipmentForm({
  provinces,
  branches,
  pricingRules,
  defaultOriginBranchId,
}: ShipmentFormProps) {
  const router = useRouter();
  const resolveBranchForProvince = useCallback((provinceId: string) => {
    const provinceName = provinces.find((p) => p.id === provinceId)?.name || "";
    return branches.find((b) => {
      if (provinceName === "أمانة العاصمة" || provinceName === "صنعاء") {
        return b.name.includes("صنعاء");
      }
      return b.name.includes(provinceName);
    });
  }, [branches, provinces]);

  const calculateShippingFee = useCallback((
    originProvinceId: string,
    destProvinceId: string,
    weight: number,
    currentServiceType: string
  ) => {
    if (!originProvinceId || !destProvinceId) {
      return 1000;
    }

    const rule = pricingRules.find(
      (r) => r.originProvinceId === originProvinceId && r.destProvinceId === destProvinceId
    );

    if (rule) {
      let fee = rule.basePrice;
      if (weight > 1) {
        fee += (weight - 1) * rule.weightRate;
      }
      if (currentServiceType === "URGENT") {
        fee *= rule.serviceMultiplier;
      }
      return Math.round(Math.max(fee, rule.minPrice));
    }

    const defaultFee = originProvinceId === destProvinceId ? 800 : 1500;
    return Math.round(defaultFee + Math.max(0, weight - 1) * 200);
  }, [pricingRules]);

  // تتبع الخطوات (1: المرسل والمستلم، 2: تفاصيل الشحنة والقطع، 3: المالية والمراجعة)
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. بيانات المرسل
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAltPhone, setSenderAltPhone] = useState("");
  const [senderProvinceId, setSenderProvinceId] = useState("");
  const [senderCityId, setSenderCityId] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderLandmark, setSenderLandmark] = useState("");

  // 2. بيانات المستلم
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAltPhone, setReceiverAltPhone] = useState("");
  const [receiverProvinceId, setReceiverProvinceId] = useState("");
  const [receiverCityId, setReceiverCityId] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverLandmark, setReceiverLandmark] = useState("");

  // 3. تفاصيل الشحن والوجهة
  const [originBranchId, setOriginBranchId] = useState(defaultOriginBranchId || "");
  const [destBranchId, setDestBranchId] = useState("");
  const [shipmentType, setShipmentType] = useState("PARCEL");
  const [serviceType, setServiceType] = useState("REGULAR");
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [declaredValue, setDeclaredValue] = useState(0);
  const [notes, setNotes] = useState("");
  const [isFragile, setIsFragile] = useState(false);

  // 4. قطع الشحنة
  const [items, setItems] = useState<{ description: string; count: number; weight: number; price: number }[]>([
    { description: "طرد محتويات عامة", count: 1, weight: 1.0, price: 0 },
  ]);

  const [collectionAmount, setCollectionAmount] = useState(0);

  // البحث التلقائي عن المرسل عند إدخال الهاتف
  useEffect(() => {
    if (senderPhone.trim().length === 9) {
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
  }, [senderPhone, resolveBranchForProvince]);

  // البحث التلقائي عن المستلم عند إدخال الهاتف
  useEffect(() => {
    if (receiverPhone.trim().length === 9) {
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
          const targetBranch = resolveBranchForProvince(c.provinceId);
          if (targetBranch) {
            setDestBranchId(targetBranch.id);
          }
        }
      };
      lookupReceiver();
    }
  }, [receiverPhone, resolveBranchForProvince]);

  // حساب التكلفة التلقائية عند تغيير الوزن أو المحافظات أو نوع الخدمة
  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.count, 0);
  const shippingFee = useMemo(
    () => calculateShippingFee(senderProvinceId, receiverProvinceId, totalWeight, serviceType),
    [senderProvinceId, receiverProvinceId, totalWeight, serviceType, calculateShippingFee]
  );

  // تحديث المدن المتاحة للمرسل والمستلم
  const senderCities = provinces.find((p) => p.id === senderProvinceId)?.cities || [];
  const receiverCities = provinces.find((p) => p.id === receiverProvinceId)?.cities || [];

  // إدارة إضافة وحذف قطع الشحنة
  const handleAddItem = () => {
    setItems([...items, { description: "", count: 1, weight: 0.5, price: 0 }]);
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

  const handleReceiverProvinceChange = (provinceId: string) => {
    setReceiverProvinceId(provinceId);
    setReceiverCityId("");
    const targetBranch = resolveBranchForProvince(provinceId);
    if (targetBranch) {
      setDestBranchId(targetBranch.id);
    }
  };

  // تسليم البيانات
  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    const inputData = {
      type: shipmentType,
      serviceType,
      paymentMethod,
      declaredValue,
      shippingFee,
      collectionAmount: paymentMethod === "CASH_ON_DELIVERY" ? collectionAmount : 0,
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
      items,
    };

    const res = await createShipmentAction(inputData);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      router.push(`/dashboard/shipments/${res.id}`);
    }
  };

  return (
    <div className="shipment-form-container">
      {/* مؤشر الخطوات */}
      <div className="form-steps-indicator">
        <div className={`step-node ${step >= 1 ? "active" : ""}`}>
          <div className="step-number">{step > 1 ? <Check size={16} /> : "1"}</div>
          <span className="step-label">أطراف الشحنة</span>
        </div>
        <div className="step-line"></div>
        <div className={`step-node ${step >= 2 ? "active" : ""}`}>
          <div className="step-number">{step > 2 ? <Check size={16} /> : "2"}</div>
          <span className="step-label">تفاصيل الطرد والقطع</span>
        </div>
        <div className="step-line"></div>
        <div className={`step-node ${step >= 3 ? "active" : ""}`}>
          <div className="step-number">3</div>
          <span className="step-label">التسعير والمراجعة</span>
        </div>
      </div>

      {error && <div className="auth-error form-error">{error}</div>}

      {/* الخطوة 1: المرسل والمستلم */}
      {step === 1 && (
        <div className="form-step-content">
          <div className="form-section-columns">
            {/* بيانات المرسل */}
            <div className="dashboard-card form-section-card">
              <h3 className="section-title-with-icon">
                <User size={18} />
                <span>بيانات المرسل</span>
              </h3>
              
              <div className="form-group">
                <label className="form-label">رقم الهاتف *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="777XXXXXX"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">الاسم الكامل *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">هاتف بديل</label>
                <input
                  type="text"
                  className="form-input"
                  value={senderAltPhone}
                  onChange={(e) => setSenderAltPhone(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">المحافظة *</label>
                  <select
                    className="form-input"
                    required
                    value={senderProvinceId}
                    onChange={(e) => {
                      setSenderProvinceId(e.target.value);
                      setSenderCityId("");
                    }}
                  >
                    <option value="">اختر المحافظة</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">المدينة/المديرية *</label>
                  <select
                    className="form-input"
                    required
                    value={senderCityId}
                    onChange={(e) => setSenderCityId(e.target.value)}
                    disabled={!senderProvinceId}
                  >
                    <option value="">اختر المدينة</option>
                    {senderCities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">العنوان بالتفصيل *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="الشارع، اسم الحارة..."
                  required
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">معلم بارز</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="بجوار سوبرماركت..."
                  value={senderLandmark}
                  onChange={(e) => setSenderLandmark(e.target.value)}
                />
              </div>
            </div>

            {/* بيانات المستلم */}
            <div className="dashboard-card form-section-card">
              <h3 className="section-title-with-icon">
                <User size={18} />
                <span>بيانات المستلم</span>
              </h3>

              <div className="form-group">
                <label className="form-label">رقم الهاتف *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="777XXXXXX"
                  required
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">الاسم الكامل *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">هاتف بديل</label>
                <input
                  type="text"
                  className="form-input"
                  value={receiverAltPhone}
                  onChange={(e) => setReceiverAltPhone(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">المحافظة *</label>
                  <select
                    className="form-input"
                    required
                    value={receiverProvinceId}
                    onChange={(e) => handleReceiverProvinceChange(e.target.value)}
                  >
                    <option value="">اختر المحافظة</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">المدينة/المديرية *</label>
                  <select
                    className="form-input"
                    required
                    value={receiverCityId}
                    onChange={(e) => setReceiverCityId(e.target.value)}
                    disabled={!receiverProvinceId}
                  >
                    <option value="">اختر المدينة</option>
                    {receiverCities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">العنوان بالتفصيل *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="الشارع، اسم الحارة..."
                  required
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">معلم بارز</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="بجوار سوبرماركت..."
                  value={receiverLandmark}
                  onChange={(e) => setReceiverLandmark(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-footer-actions">
            <span>* حقول إجبارية</span>
            <button
              type="button"
              className="btn btn-primary next-btn"
              disabled={
                !senderPhone ||
                !senderName ||
                !senderProvinceId ||
                !senderCityId ||
                !senderAddress ||
                !receiverPhone ||
                !receiverName ||
                !receiverProvinceId ||
                !receiverCityId ||
                !receiverAddress
              }
              onClick={() => setStep(2)}
            >
              <span>التالي: تفاصيل الطرد</span>
            </button>
          </div>
        </div>
      )}

      {/* الخطوة 2: تفاصيل الطرد والقطع */}
      {step === 2 && (
        <div className="form-step-content">
          <div className="dashboard-card form-section-card">
            <h3 className="section-title-with-icon">
              <Package size={18} />
              <span>تفاصيل الشحنة والمسار اللوجستي</span>
            </h3>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">فرع الاستلام (المصدر)</label>
                <select
                  className="form-input"
                  value={originBranchId}
                  onChange={(e) => setOriginBranchId(e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">فرع الوجهة *</label>
                <select
                  className="form-input"
                  required
                  value={destBranchId}
                  onChange={(e) => setDestBranchId(e.target.value)}
                >
                  <option value="">اختر فرع الوجهة</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">نوع الشحنة</label>
                <select
                  className="form-input"
                  value={shipmentType}
                  onChange={(e) => setShipmentType(e.target.value)}
                >
                  <option value="PARCEL">طرد / كرتون</option>
                  <option value="DOCUMENTS">وثائق / ملفات</option>
                  <option value="SECURE_PARCEL">محتويات ثمينة (أمانة)</option>
                </select>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">نوع الخدمة</label>
                <select
                  className="form-input"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  <option value="REGULAR">شحن عادي</option>
                  <option value="URGENT">شحن مستعجل (سرعة قصوى)</option>
                  <option value="INSURED">شحن مؤمن عليه ضد التلف والفقد</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">القيمة المصرح بها للأمانة (ريال يمني)</label>
                <input
                  type="number"
                  className="form-input"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات على الشحنة</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="قابل للكسر، محتويات حساسة، احتياطات خاصة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
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

          {/* إضافة قطع الطرد */}
          <div className="dashboard-card form-section-card items-section-card">
            <div className="items-section-header">
              <h3 className="section-title-with-icon">
                <Package size={18} />
                <span>محتويات الطرد بالتفصيل ({items.length} قطعة)</span>
              </h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleAddItem}>
                <Plus size={16} />
                <span>إضافة قطعة</span>
              </button>
            </div>

            <div className="items-list">
              {items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="form-group item-desc-group">
                    <label className="form-label">وصف القطعة *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="ملابس، لابتوب، قطع غيار..."
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    />
                  </div>

                  <div className="form-group item-small-group">
                    <label className="form-label">العدد *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="1"
                      value={item.count}
                      onChange={(e) => handleItemChange(index, "count", Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group item-small-group">
                    <label className="form-label">الوزن (كجم) *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      step="0.1"
                      min="0.1"
                      value={item.weight}
                      onChange={(e) => handleItemChange(index, "weight", Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group item-small-group">
                    <label className="form-label">سعر القطعة التقديري</label>
                    <input
                      type="number"
                      className="form-input"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", Number(e.target.value))}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline delete-item-btn"
                    disabled={items.length === 1}
                    onClick={() => handleRemoveItem(index)}
                    title="حذف القطعة"
                  >
                    <Trash2 size={16} className="text-red" />
                  </button>
                </div>
              ))}
            </div>

            <div className="items-summary-bar">
              <span>إجمالي الوزن الفعلي للشحنة: <strong>{totalWeight.toFixed(1)} كجم</strong></span>
            </div>
          </div>

          <div className="form-footer-actions">
            <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
              <span>السابق</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!destBranchId || items.some((it) => !it.description || it.count < 1 || it.weight <= 0)}
              onClick={() => setStep(3)}
            >
              <span>التالي: التسعير والمالية</span>
            </button>
          </div>
        </div>
      )}

      {/* الخطوة 3: التسعير والمالية والمراجعة */}
      {step === 3 && (
        <div className="form-step-content">
          <div className="form-section-columns">
            {/* إعدادات التسعير والتحصيل المالي */}
            <div className="dashboard-card form-section-card">
              <h3 className="section-title-with-icon">
                <DollarSign size={18} />
                <span>التسعير والتحصيل المالي</span>
              </h3>

              <div className="form-group">
                <label className="form-label">طريقة الدفع</label>
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH_ON_DELIVERY">الدفع عند الاستلام (تحصيل COD)</option>
                  <option value="PREPAID">مسبق الدفع (مدفوعة من المرسل)</option>
                  <option value="ACCOUNT_DEBIT">آجل على حساب العميل (المرسل)</option>
                </select>
              </div>

              {paymentMethod === "CASH_ON_DELIVERY" && (
                <div className="form-group">
                  <label className="form-label">المبلغ المطلوب تحصيله عند التسليم (COD) *</label>
                  <div className="input-with-currency-wrapper">
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="1"
                      value={collectionAmount}
                      onChange={(e) => setCollectionAmount(Number(e.target.value))}
                    />
                    <span className="input-currency-label">ريال يمني</span>
                  </div>
                  <p className="field-desc">هذا المبلغ سيقوم المندوب بتحصيله من المستلم وتسليمه للمرسل لاحقاً</p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">رسوم شحن وتوصيل الطرد (تعديل يدوي إن لزم) *</label>
                <div className="input-with-currency-wrapper">
                  <input
                    type="number"
                    className="form-input"
                    required
                    min="0"
                    value={shippingFee}
                    readOnly
                  />
                  <span className="input-currency-label">ريال يمني</span>
                </div>
                <p className="field-desc">تم الحساب تلقائياً بناءً على قواعد تسعير المناطق والوزن {totalWeight.toFixed(1)} كجم</p>
              </div>
            </div>

            {/* مراجعة تفاصيل الشحنة كاملة قبل الحفظ */}
            <div className="dashboard-card form-section-card review-card">
              <h3 className="section-title-with-icon">
                <Check size={18} />
                <span>مراجعة ملخص الشحنة</span>
              </h3>

              <div className="review-summary-list">
                <div className="review-item">
                  <span className="review-label">المرسل:</span>
                  <span className="review-value">{senderName} ({senderPhone})</span>
                </div>
                <div className="review-item">
                  <span className="review-label">محافظة المرسل:</span>
                  <span className="review-value">
                    {provinces.find((p) => p.id === senderProvinceId)?.name} -{" "}
                    {senderCities.find((c) => c.id === senderCityId)?.name}
                  </span>
                </div>
                <div className="review-item-divider"></div>
                <div className="review-item">
                  <span className="review-label">المستلم:</span>
                  <span className="review-value">{receiverName} ({receiverPhone})</span>
                </div>
                <div className="review-item">
                  <span className="review-label">محافظة المستلم:</span>
                  <span className="review-value">
                    {provinces.find((p) => p.id === receiverProvinceId)?.name} -{" "}
                    {receiverCities.find((c) => c.id === receiverCityId)?.name}
                  </span>
                </div>
                <div className="review-item-divider"></div>
                <div className="review-item">
                  <span className="review-label">المسار اللوجستي:</span>
                  <span className="review-value font-bold">
                    {branches.find((b) => b.id === originBranchId)?.name} ➔{" "}
                    {branches.find((b) => b.id === destBranchId)?.name}
                  </span>
                </div>
                <div className="review-item">
                  <span className="review-label">إجمالي الوزن والقطع:</span>
                  <span className="review-value">
                    {totalWeight.toFixed(1)} كجم ({items.length} قطع)
                  </span>
                </div>
                <div className="review-item-divider"></div>
                <div className="review-item">
                  <span className="review-label">طريقة السداد:</span>
                  <span className="review-value font-bold">
                    {paymentMethod === "CASH_ON_DELIVERY"
                      ? "الدفع عند الاستلام (COD)"
                      : paymentMethod === "PREPAID"
                      ? "مسبق الدفع"
                      : "آجل حساب عميل"}
                  </span>
                </div>
                <div className="review-item highlight-item font-green">
                  <span className="review-label">رسوم التوصيل:</span>
                  <span className="review-value">{shippingFee.toLocaleString("ar-YE")} ريال يمني</span>
                </div>
                {paymentMethod === "CASH_ON_DELIVERY" && (
                  <div className="review-item highlight-item font-warning">
                    <span className="review-label">مبلغ التحصيل (COD):</span>
                    <span className="review-value">{collectionAmount.toLocaleString("ar-YE")} ريال يمني</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-footer-actions">
            <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>
              <span>السابق</span>
            </button>
            <button
              type="button"
              className="btn btn-primary save-shipment-btn"
              disabled={isSubmitting || shippingFee < 0 || (paymentMethod === "CASH_ON_DELIVERY" && collectionAmount <= 0)}
              onClick={handleSubmit}
            >
              <span>{isSubmitting ? "جاري حفظ الشحنة..." : "حفظ وتأكيد تسجيل الشحنة"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
