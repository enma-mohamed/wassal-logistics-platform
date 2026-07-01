import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import crypto from "crypto";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });


const SALT = "wassal_secret_salt_key_123";
function hashPassword(password: string): string {
  return crypto.createHmac("sha256", SALT).update(password).digest("hex");
}

// محافظات ومدن الجمهورية اليمنية
const yemenData: { province: string; cities: string[] }[] = [
  { province: "أمانة العاصمة", cities: ["صنعاء القديمة", "معين", "الصافية", "شعوب", "الثورة", "السبعين", "التحرير", "أزال", "بني الحارث"] },
  { province: "عدن", cities: ["كريتر", "المعلا", "التواهي", "خور مكسر", "المنصورة", "الشيخ عثمان", "دار سعد", "البريقة"] },
  { province: "تعز", cities: ["تعز المدينة", "التربة", "المخا", "شرعب السلام", "ماوية", "المعافر", "صبر الموادم", "الحجرية"] },
  { province: "الحديدة", cities: ["الحديدة المدينة", "بيت الفقيه", "زبيد", "باجل", "الخوخة", "المنصورية", "اللحية", "حيس"] },
  { province: "إب", cities: ["إب المدينة", "جبلة", "يريم", "القاعدة", "العدين", "بعدان", "السياني", "المخادر"] },
  { province: "حضرموت", cities: ["المكلا", "سيئون", "تريم", "شبام", "الشحر", "القطن", "غيل باوزير", "الديس الشرقية"] },
  { province: "ذمار", cities: ["ذمار المدينة", "عنس", "المنار", "جهران", "مغرب عنس", "ضوران آنس", "وصاب العالي", "وصاب السافل"] },
  { province: "حجة", cities: ["حجة المدينة", "عبس", "حرض", "ميدي", "مستبأ", "كشر", "بني العوام", "الشغادرة"] },
  { province: "المحويت", cities: ["المحويت المدينة", "شبام كوكبان", "الرجم", "الطويلة", "ملحان", "حفاش", "الخبت"] },
  { province: "صعدة", cities: ["صعدة المدينة", "ضحيان", "مجز", "حيدان", "كتاف", "باقم", "رازح", "غمر"] },
  { province: "عمران", cities: ["عمران المدينة", "ثلاء", "حبور ظليمة", "خمر", "ريدة", "السودة", "حوث", "مسور"] },
  { province: "البيضاء", cities: ["البيضاء المدينة", "رداع", "مكيراس", "الصومعة", "ذي ناعم", "ولد ربيع", "النعمان"] },
  { province: "مأرب", cities: ["مأرب المدينة", "صرواح", "مدغل", "حريب", "الجوبة", "رغوان", "ماهلية"] },
  { province: "الجوف", cities: ["الحزم", "الغيل", "خراب المراشي", "برط العنان", "المطمة", "الخلق"] },
  { province: "شبوة", cities: ["عتق", "بيحان", "عزان", "ميفعة", "حبان", "الروضة", "نصاب", "عرماء"] },
  { province: "أبين", cities: ["زنجبار", "جعار", "خنفر", "لودر", "المحفد", "أحور", "مودية"] },
  { province: "لحج", cities: ["الحوطة", "تُبن", "الحبيلين", "طور الباحة", "يافع", "المسيمير", "المضاربة"] },
  { province: "الضالع", cities: ["الضالع المدينة", "قعطبة", "دمت", "الحصين", "الأزارق", "جبن"] },
  { province: "المهرة", cities: ["الغيضة", "قشن", "سيحوت", "حصوين", "المسيلة", "حوف", "منعر"] },
  { province: "سقطرى", cities: ["حديبو", "قلنسية", "نوجد"] },
  { province: "ريمة", cities: ["الجبين", "بلاد الطعام", "كسمة", "مزهر", "الجعفرية", "السلفية"] },
  { province: "صنعاء", cities: ["بني حشيش", "سنحان", "بلاد الروس", "همدان", "الحيمة الداخلية", "نهم", "مناخة", "خولان"] },
];

async function main() {
  console.log("🌱 بدء إدخال البيانات الأولية...");

  // إنشاء المحافظات والمدن
  for (const item of yemenData) {
    const province = await prisma.province.upsert({
      where: { name: item.province },
      update: {},
      create: { name: item.province },
    });

    for (const cityName of item.cities) {
      await prisma.city.upsert({
        where: { name_provinceId: { name: cityName, provinceId: province.id } },
        update: {},
        create: { name: cityName, provinceId: province.id },
      });
    }
    console.log(`  ✅ ${item.province} (${item.cities.length} مدينة)`);
  }

  // إنشاء الفروع لجميع المحافظات
  const provinces = await prisma.province.findMany();
  let mainBranch: any;
  let capitalProvince: any;
  let adenProvince: any;

  for (const province of provinces) {
    let branchName = `فرع ${province.name}`;
    let phone = `0${Math.floor(2 + Math.random() * 8)}-${Math.floor(100000 + Math.random() * 900000)}`;
    let address = `${province.name}، الشارع العام`;

    if (province.name === "أمانة العاصمة") {
      branchName = "الفرع الرئيسي - صنعاء";
      phone = "01-234567";
      address = "صنعاء، شارع الستين";
    } else if (province.name === "عدن") {
      branchName = "فرع عدن";
      phone = "02-345678";
      address = "عدن، المعلا";
    } else if (province.name === "تعز") {
      branchName = "فرع تعز";
      phone = "04-567890";
      address = "تعز، شارع جمال";
    }

    const branch = await prisma.branch.upsert({
      where: { name: branchName },
      update: {},
      create: {
        name: branchName,
        provinceId: province.id,
        phone,
        address,
      },
    });

    if (province.name === "أمانة العاصمة") {
      mainBranch = branch;
      capitalProvince = province;
    } else if (province.name === "عدن") {
      adenProvince = province;
    }
  }

  if (!mainBranch) {
    capitalProvince = await prisma.province.findUnique({ where: { name: "أمانة العاصمة" } });
    if (!capitalProvince) throw new Error("لم يتم العثور على محافظة أمانة العاصمة");
    mainBranch = await prisma.branch.findUnique({ where: { name: "الفرع الرئيسي - صنعاء" } });
    if (!mainBranch) throw new Error("الفرع الرئيسي غير موجود");
  }
  console.log("  ✅ تم إنشاء الفروع لجميع المحافظات الـ 22");

  // إنشاء المستخدم الإداري
  const admin = await prisma.user.upsert({
    where: { email: "admin@wassal.ye" },
    update: {},
    create: {
      name: "مدير النظام",
      email: "admin@wassal.ye",
      phone: "777000000",
      passwordHash: hashPassword("admin123"),
      role: "SYSTEM_ADMIN",
      branchId: mainBranch.id,
    },
  });
  console.log("  ✅ مدير النظام (admin@wassal.ye / admin123)");

  // إنشاء مستخدمين تجريبيين
  const branchManager = await prisma.user.upsert({
    where: { email: "manager@wassal.ye" },
    update: {},
    create: {
      name: "أحمد المدير",
      email: "manager@wassal.ye",
      phone: "777111111",
      passwordHash: hashPassword("manager123"),
      role: "BRANCH_MANAGER",
      branchId: mainBranch.id,
    },
  });
  console.log("  ✅ مدير فرع (manager@wassal.ye / manager123)");

  const receptionist = await prisma.user.upsert({
    where: { email: "reception@wassal.ye" },
    update: {},
    create: {
      name: "سارة الاستقبال",
      email: "reception@wassal.ye",
      phone: "777222222",
      passwordHash: hashPassword("reception123"),
      role: "RECEPTIONIST",
      branchId: mainBranch.id,
    },
  });
  console.log("  ✅ موظف استقبال (reception@wassal.ye / reception123)");

  // إنشاء وكيل تجريبي
  const agentUser = await prisma.user.upsert({
    where: { email: "agent@wassal.ye" },
    update: {},
    create: {
      name: "حسين الوكيل",
      email: "agent@wassal.ye",
      phone: "777333333",
      passwordHash: hashPassword("agent123"),
      role: "AGENT",
      branchId: mainBranch.id,
    },
  });

  await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      userId: agentUser.id,
      commissionType: "PERCENTAGE",
      commissionRate: 10,
      area: "صنعاء القديمة والسبعين",
      status: "ACTIVE",
      rating: 4.8,
    },
  });
  console.log("  ✅ وكيل خارجي (agent@wassal.ye / agent123)");

  // إنشاء سائق تجريبي
  const driverUser = await prisma.user.upsert({
    where: { email: "driver@wassal.ye" },
    update: {},
    create: {
      name: "خالد السائق",
      email: "driver@wassal.ye",
      phone: "777444444",
      passwordHash: hashPassword("driver123"),
      role: "DRIVER",
      branchId: mainBranch.id,
    },
  });

  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      status: "AVAILABLE",
      vehiclePlate: "صنعاء - 2/12345",
      licenseNumber: "LIC-88291-YE",
      rating: 4.9,
    },
  });
  console.log("  ✅ سائق توصيل (driver@wassal.ye / driver123)");
  const capitalCity = await prisma.city.findFirst({ where: { provinceId: capitalProvince.id } });
  if (!capitalCity) throw new Error("لم يتم العثور على مدينة في أمانة العاصمة");

  const sender = await prisma.customer.upsert({
    where: { phone: "777888001" },
    update: {},
    create: {
      name: "محمد العامري",
      phone: "777888001",
      provinceId: capitalProvince.id,
      cityId: capitalCity.id,
      address: "صنعاء، حي شميلة",
      landmark: "بجوار مسجد الرحمة",
    },
  });

  let receiverCity = capitalCity;
  if (adenProvince) {
    const adenCity = await prisma.city.findFirst({ where: { provinceId: adenProvince.id } });
    if (adenCity) receiverCity = adenCity;
  }

  const receiver = await prisma.customer.upsert({
    where: { phone: "777888002" },
    update: {},
    create: {
      name: "علي السعيدي",
      phone: "777888002",
      provinceId: adenProvince?.id || capitalProvince.id,
      cityId: receiverCity.id,
      address: "عدن، كريتر",
      landmark: "مقابل البنك المركزي",
    },
  });
  console.log("  ✅ عملاء تجريبيين");

  // إنشاء قواعد تسعير تجريبية لجميع المحافظات الـ 22 (484 مسار)
  const allProvinces = await prisma.province.findMany();
  for (const origin of allProvinces) {
    for (const dest of allProvinces) {
      const isSameProvince = origin.id === dest.id;
      await prisma.pricingRule.upsert({
        where: { originProvinceId_destProvinceId: { originProvinceId: origin.id, destProvinceId: dest.id } },
        update: {},
        create: {
          name: `${origin.name} → ${dest.name}`,
          originProvinceId: origin.id,
          destProvinceId: dest.id,
          basePrice: isSameProvince ? 800 : 2000,
          weightRate: isSameProvince ? 100 : 250,
          minPrice: isSameProvince ? 800 : 2000,
          serviceMultiplier: 1.5,
          isActive: true,
        },
      });
    }
  }
  console.log("  ✅ تم إنشاء 484 قاعدة تسعير لجميع مسارات المحافظات");

  // إنشاء شحنات تجريبية
  const adenBranch = await prisma.branch.findFirst({ where: { name: "فرع عدن" } });
  const statuses = ["RECEIVED_IN_BRANCH", "IN_TRANSIT", "ARRIVED_BRANCH", "OUT_FOR_DELIVERY", "DELIVERED", "RETURNED"];
  const serviceTypes = ["REGULAR", "URGENT", "INSURED"];

  for (let i = 1; i <= 15; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const trackNum = `WSL-${String(Date.now()).slice(-6)}-${String(i).padStart(4, "0")}`;
    const fee = 1000 + Math.floor(Math.random() * 3000);
    const cod = Math.random() > 0.5 ? Math.floor(Math.random() * 50000) : 0;

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber: trackNum,
        status,
        serviceType,
        senderId: sender.id,
        receiverId: receiver.id,
        originBranchId: mainBranch.id,
        destBranchId: adenBranch?.id || mainBranch.id,
        weight: 0.5 + Math.random() * 10,
        shippingFee: fee,
        collectionAmount: cod,
        paymentMethod: cod > 0 ? "CASH_ON_DELIVERY" : "PREPAID",
        paymentStatus: status === "DELIVERED" ? "PAID" : "UNPAID",
        createdById: receptionist.id,
        otp: String(1000 + Math.floor(Math.random() * 9000)),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      },
    });

    // إضافة أحداث
    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        eventType: "CREATED",
        fromUserId: receptionist.id,
        branchId: mainBranch.id,
        notes: "تم تسجيل الشحنة",
        createdAt: shipment.createdAt,
      },
    });

    if (["IN_TRANSIT", "ARRIVED_BRANCH", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status)) {
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          eventType: "DEPARTED",
          branchId: mainBranch.id,
          notes: "تم شحنها من الفرع الرئيسي",
          createdAt: new Date(shipment.createdAt.getTime() + 3600000),
        },
      });
    }

    if (status === "DELIVERED") {
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          eventType: "DELIVERED",
          notes: "تم التسليم بنجاح",
          createdAt: new Date(shipment.createdAt.getTime() + 86400000),
        },
      });
    }
  }
  console.log("  ✅ 15 شحنة تجريبية مع أحداثها");

  console.log("\n🎉 تم إدخال جميع البيانات الأولية بنجاح!");
  console.log("\n📌 بيانات الدخول:");
  console.log("   مدير النظام: admin@wassal.ye / admin123");
  console.log("   مدير الفرع:  manager@wassal.ye / manager123");
  console.log("   الاستقبال:   reception@wassal.ye / reception123");
}

main()
  .catch((e) => {
    console.error("❌ خطأ:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
