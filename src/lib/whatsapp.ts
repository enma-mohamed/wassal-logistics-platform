/**
 * محاكي إشعارات الواتساب اللوجستي
 * يقوم بتوليد رسائل واتساب جاهزة لكل حدث لوجستي
 * مع إمكانية ربطه لاحقاً بأي WhatsApp Business API
 */

import prisma from "@/lib/prisma";

interface ShipmentNotificationData {
  shipmentId: string;
  trackingNumber: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  originBranch: string;
  destBranch: string;
  shippingFee: number;
  collectionAmount: number;
  otp?: string | null;
  driverName?: string;
  driverPhone?: string;
  status?: string;
}

// رابط التتبع العام — يمكن تخصيصه عبر NEXT_PUBLIC_TRACK_URL
const TRACK_BASE =
  process.env.NEXT_PUBLIC_TRACK_URL || process.env.NEXT_PUBLIC_APP_URL ||
  "https://wassal-logistics-platform-sand.vercel.app";

const getTrackUrl = (trackingNumber: string) =>
  `${TRACK_BASE}/track?num=${encodeURIComponent(trackingNumber)}`;

/**
 * توليد رسالة الواتساب حسب نوع الحدث
 */
function generateMessage(
  type: string,
  data: ShipmentNotificationData
): { toPhone: string; toName: string; body: string } | null {
  const trackUrl = getTrackUrl(data.trackingNumber);

  switch (type) {
    case "SHIPMENT_CREATED":
      return {
        toPhone: data.senderPhone,
        toName: data.senderName,
        body: `🟢 *منصة وصّل للشحن*\n\nمرحباً ${data.senderName}،\n\n✅ تم تسجيل شحنتك بنجاح!\n\n📦 رقم التتبع: *${data.trackingNumber}*\n📍 من: ${data.originBranch}\n📍 إلى: ${data.destBranch}\n👤 المستلم: ${data.receiverName}\n💰 رسوم الشحن: ${data.shippingFee.toLocaleString()} ريال\n${data.collectionAmount > 0 ? `💵 مبلغ التحصيل COD: ${data.collectionAmount.toLocaleString()} ريال\n` : ""}\n🔗 تتبع شحنتك: ${trackUrl}\n\nشكراً لاختياركم وصّل! 🚀`,
      };

    case "SHIPMENT_CREATED_RECEIVER":
      return {
        toPhone: data.receiverPhone,
        toName: data.receiverName,
        body: `📬 *منصة وصّل للشحن*\n\nمرحباً ${data.receiverName}،\n\n📦 لديك شحنة قادمة إليك!\n\n🔢 رقم التتبع: *${data.trackingNumber}*\n👤 المرسل: ${data.senderName}\n📍 من: ${data.originBranch}\n📍 إلى: ${data.destBranch}\n${data.collectionAmount > 0 ? `\n💵 المبلغ المطلوب عند الاستلام: ${data.collectionAmount.toLocaleString()} ريال` : ""}\n\n🔗 تتبع الشحنة: ${trackUrl}\n\nمنصة وصّل - توصيل أسرع وأمانات أكثر أماناً 🛡️`,
      };

    case "OUT_FOR_DELIVERY":
      return {
        toPhone: data.receiverPhone,
        toName: data.receiverName,
        body: `🚚 *منصة وصّل - شحنتك في الطريق!*\n\nمرحباً ${data.receiverName}،\n\n✨ شحنتك رقم *${data.trackingNumber}* خرجت الآن مع المندوب وفي طريقها إليك!\n${data.driverName ? `\n👤 اسم المندوب: ${data.driverName}\n📞 هاتف المندوب: ${data.driverPhone || "غير متوفر"}` : ""}\n${data.collectionAmount > 0 ? `\n💵 المبلغ المطلوب عند الاستلام: ${data.collectionAmount.toLocaleString()} ريال` : ""}\n\n⚠️ يرجى تجهيز المبلغ والتواجد في العنوان المحدد.\n\n🔗 تتبع الشحنة: ${trackUrl}\n\nمنصة وصّل 🚀`,
      };

    case "OTP_SENT":
      return {
        toPhone: data.receiverPhone,
        toName: data.receiverName,
        body: `🔐 *منصة وصّل - رمز التحقق*\n\nمرحباً ${data.receiverName}،\n\nرمز التحقق لتسليم الشحنة *${data.trackingNumber}*:\n\n🔑 الرمز: *${data.otp}*\n\n⚠️ لا تشارك هذا الرمز مع أي شخص.\nقم بإعطائه للمندوب فقط عند استلام الشحنة.\n\nمنصة وصّل 🛡️`,
      };

    case "DELIVERED":
      return {
        toPhone: data.senderPhone,
        toName: data.senderName,
        body: `✅ *منصة وصّل - تم التسليم!*\n\nمرحباً ${data.senderName}،\n\n🎉 تم تسليم شحنتك رقم *${data.trackingNumber}* بنجاح للمستلم ${data.receiverName}.\n${data.collectionAmount > 0 ? `\n💰 مبلغ التحصيل: ${data.collectionAmount.toLocaleString()} ريال\n📋 سيتم تحويل المبلغ لحسابك خلال الفترة المحددة.` : ""}\n\n🔗 تفاصيل الشحنة: ${trackUrl}\n\nشكراً لثقتكم في وصّل! 💖`,
      };

    case "RETURNED":
      return {
        toPhone: data.senderPhone,
        toName: data.senderName,
        body: `🔴 *منصة وصّل - شحنة مرتجعة*\n\nمرحباً ${data.senderName}،\n\n⚠️ للأسف، تم إرجاع شحنتك رقم *${data.trackingNumber}*.\n\nالسبب: تعذر التسليم للمستلم ${data.receiverName}.\n\n📍 يمكنك استلام شحنتك من الفرع أو إعادة ترتيب التوصيل.\n\n🔗 تفاصيل الشحنة: ${trackUrl}\n\nمنصة وصّل - نعتذر عن أي إزعاج 🙏`,
      };

    default:
      return null;
  }
}

/**
 * إرسال إشعار واتساب (محاكي) وتسجيله في قاعدة البيانات
 */
export async function sendWhatsAppNotification(
  type: string,
  data: ShipmentNotificationData
): Promise<{ success: boolean; logId?: string }> {
  try {
    const msg = generateMessage(type, data);
    if (!msg) return { success: false };

    // تسجيل الرسالة في قاعدة البيانات (محاكي)
    const log = await prisma.whatsAppLog.create({
      data: {
        shipmentId: data.shipmentId,
        trackingNumber: data.trackingNumber,
        recipientPhone: msg.toPhone,
        recipientName: msg.toName,
        messageType: type,
        messageBody: msg.body,
        status: "SENT", // محاكي: نعتبرها مُرسلة فوراً
        direction: "OUTBOUND",
      },
    });

    console.log(
      `📱 [WhatsApp Simulator] ${type} → ${msg.toPhone} (${msg.toName})`
    );

    return { success: true, logId: log.id };
  } catch (error) {
    console.error("خطأ أثناء تسجيل إشعار الواتساب:", error);
    return { success: false };
  }
}

/**
 * إرسال إشعارات متعددة لحدث واحد (مثلاً: إشعار المرسل والمستلم معاً عند إنشاء الشحنة)
 */
export async function sendShipmentCreatedNotifications(
  data: ShipmentNotificationData
) {
  // إشعار المرسل
  await sendWhatsAppNotification("SHIPMENT_CREATED", data);
  // إشعار المستلم
  await sendWhatsAppNotification("SHIPMENT_CREATED_RECEIVER", data);
  // إرسال OTP للمستلم
  if (data.otp) {
    await sendWhatsAppNotification("OTP_SENT", data);
  }
}

/**
 * إرسال إشعار تغيير الحالة
 */
export async function sendStatusChangeNotification(
  data: ShipmentNotificationData,
  newStatus: string
) {
  switch (newStatus) {
    case "OUT_FOR_DELIVERY":
      await sendWhatsAppNotification("OUT_FOR_DELIVERY", data);
      break;
    case "DELIVERED":
      await sendWhatsAppNotification("DELIVERED", data);
      break;
    case "RETURNED":
      await sendWhatsAppNotification("RETURNED", data);
      break;
  }
}
