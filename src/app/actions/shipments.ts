"use server";

import prisma from "@/lib/prisma";
import { getSession } from "./auth";
import { generateTrackingNumber } from "@/lib/tracking";
import { revalidatePath } from "next/cache";
import { sendShipmentCreatedNotifications, sendStatusChangeNotification } from "@/lib/whatsapp";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

interface CustomerInput {
  name: string;
  phone: string;
  altPhone?: string;
  provinceId: string;
  cityId: string;
  address: string;
  landmark?: string;
}

interface ShipmentItemInput {
  description: string;
  count: number;
  weight: number;
  price: number;
}

interface CreateShipmentInput {
  type: string;
  serviceType: string;
  paymentMethod: string;
  declaredValue: number;
  shippingFee: number;
  collectionAmount: number;
  notes?: string;
  metadataJson?: string;
  
  sender: CustomerInput;
  receiver: CustomerInput;
  
  originBranchId: string;
  destBranchId: string;
  
  items: ShipmentItemInput[];
}

/**
 * إنشاء شحنة جديدة في النظام
 */
export async function createShipmentAction(input: CreateShipmentInput) {
  const session = await getSession();
  if (!session) {
    return { error: "غير مصرح لك بالعملية. يرجى تسجيل الدخول." };
  }

  try {
    const trackingNumber = generateTrackingNumber();
    const otp = String(Math.floor(1000 + Math.random() * 9000));

    // تنفيذ العملية في معاملة واحدة (Transaction) لضمان اتساق البيانات
    const shipment = await prisma.$transaction(async (tx) => {
      // 1. البحث عن أو إنشاء المرسل
      let sender = await tx.customer.findUnique({
        where: { phone: input.sender.phone },
      });

      if (sender) {
        sender = await tx.customer.update({
          where: { id: sender.id },
          data: {
            name: input.sender.name,
            altPhone: input.sender.altPhone,
            provinceId: input.sender.provinceId,
            cityId: input.sender.cityId,
            address: input.sender.address,
            landmark: input.sender.landmark,
          },
        });
      } else {
        sender = await tx.customer.create({
          data: {
            name: input.sender.name,
            phone: input.sender.phone,
            altPhone: input.sender.altPhone,
            provinceId: input.sender.provinceId,
            cityId: input.sender.cityId,
            address: input.sender.address,
            landmark: input.sender.landmark,
          },
        });
      }

      // 2. البحث عن أو إنشاء المستلم
      let receiver = await tx.customer.findUnique({
        where: { phone: input.receiver.phone },
      });

      if (receiver) {
        receiver = await tx.customer.update({
          where: { id: receiver.id },
          data: {
            name: input.receiver.name,
            altPhone: input.receiver.altPhone,
            provinceId: input.receiver.provinceId,
            cityId: input.receiver.cityId,
            address: input.receiver.address,
            landmark: input.receiver.landmark,
          },
        });
      } else {
        receiver = await tx.customer.create({
          data: {
            name: input.receiver.name,
            phone: input.receiver.phone,
            altPhone: input.receiver.altPhone,
            provinceId: input.receiver.provinceId,
            cityId: input.receiver.cityId,
            address: input.receiver.address,
            landmark: input.receiver.landmark,
          },
        });
      }

      // حساب إجمالي الوزن من القطع
      const totalWeight = input.items.reduce((sum, item) => sum + item.weight * item.count, 0);

      // 3. إنشاء الشحنة
      const newShipment = await tx.shipment.create({
        data: {
          trackingNumber,
          status: "RECEIVED_IN_BRANCH", // تبدأ مستلمة في الفرع فور التسجيل
          type: input.type,
          serviceType: input.serviceType,
          senderId: sender.id,
          receiverId: receiver.id,
          originBranchId: input.originBranchId,
          destBranchId: input.destBranchId,
          weight: totalWeight || 1.0,
          declaredValue: input.declaredValue || 0,
          shippingFee: input.shippingFee || 0,
          collectionAmount: input.collectionAmount || 0,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "PREPAID" ? "PAID" : "UNPAID",
          notes: input.notes,
          metadataJson: input.metadataJson || null,
          otp,
          createdById: session.id,
        },
      });

      // 4. إضافة قطع الشحنة
      if (input.items && input.items.length > 0) {
        await tx.shipmentItem.createMany({
          data: input.items.map((item) => ({
            shipmentId: newShipment.id,
            description: item.description,
            count: item.count,
            weight: item.weight,
            price: item.price,
          })),
        });
      }

      // 5. تسجيل حدث إنشاء الشحنة في السجل التاريخي
      await tx.shipmentEvent.create({
        data: {
          shipmentId: newShipment.id,
          eventType: "CREATED",
          fromUserId: session.id,
          branchId: input.originBranchId,
          notes: "تم تسجيل الشحنة واستلامها في الفرع من قبل الموظف: " + session.name,
        },
      });

      // 6. تسجيل العملية في سجل التدقيق والأمن
      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "CREATE_SHIPMENT",
          entityType: "Shipment",
          entityId: newShipment.id,
          newValues: JSON.stringify({
            trackingNumber,
            origin: input.originBranchId,
            dest: input.destBranchId,
            fee: input.shippingFee,
          }),
        },
      });

      return newShipment;
    });

    revalidatePath("/dashboard/shipments");
    revalidatePath("/dashboard");

    // إرسال إشعارات الواتساب (غير حاجزة - لا تمنع الاستجابة)
    try {
      const originBranch = await prisma.branch.findUnique({ where: { id: input.originBranchId } });
      const destBranch = await prisma.branch.findUnique({ where: { id: input.destBranchId } });
      await sendShipmentCreatedNotifications({
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        senderName: input.sender.name,
        senderPhone: input.sender.phone,
        receiverName: input.receiver.name,
        receiverPhone: input.receiver.phone,
        originBranch: originBranch?.name || "فرع المصدر",
        destBranch: destBranch?.name || "فرع الوجهة",
        shippingFee: input.shippingFee,
        collectionAmount: input.collectionAmount,
        otp,
      });
    } catch (e) {
      console.warn("تحذير: فشل إرسال إشعارات الواتساب (لن يؤثر على العملية):", e);
    }

    return { success: true, trackingNumber: shipment.trackingNumber, id: shipment.id };
  } catch (error: unknown) {
    console.error("خطأ أثناء إنشاء الشحنة:", error);
    return { error: "حدث خطأ غير متوقع أثناء تسجيل الشحنة: " + getErrorMessage(error) };
  }
}

/**
 * تحديث حالة الشحنة وتسجيل الحدث
 */
export async function updateShipmentStatusAction(
  shipmentId: string,
  newStatus: string,
  notes?: string,
  agentId?: string,
  driverId?: string
) {
  const session = await getSession();
  if (!session) {
    return { error: "غير مصرح لك بالعملية. يرجى تسجيل الدخول." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const oldShipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
      });

      if (!oldShipment) {
        throw new Error("الشحنة غير موجودة");
      }

      // تحديث بيانات الشحنة
      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: newStatus,
          agentId: agentId !== undefined ? agentId : oldShipment.agentId,
          driverId: driverId !== undefined ? driverId : oldShipment.driverId,
          paymentStatus: newStatus === "DELIVERED" ? "PAID" : oldShipment.paymentStatus,
        },
      });

      // تسجيل حدث الحالة الجديد
      await tx.shipmentEvent.create({
        data: {
          shipmentId,
          eventType: newStatus,
          fromUserId: session.id,
          branchId: session.branchId,
          notes: notes || `تم تحديث حالة الشحنة إلى: ${newStatus}`,
        },
      });

      // تسجيل العملية في سجل التدقيق
      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: `UPDATE_STATUS_${newStatus}`,
          entityType: "Shipment",
          entityId: shipmentId,
          oldValues: JSON.stringify({ status: oldShipment.status }),
          newValues: JSON.stringify({ status: newStatus }),
        },
      });

      return updated;
    });

    revalidatePath(`/dashboard/shipments/${shipmentId}`);
    revalidatePath("/dashboard/shipments");
    revalidatePath("/dashboard");

    // إرسال إشعارات واتساب عند تغيير الحالة
    try {
      const fullShipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: { sender: true, receiver: true, originBranch: true, destBranch: true },
      });
      if (fullShipment) {
        await sendStatusChangeNotification({
          shipmentId: fullShipment.id,
          trackingNumber: fullShipment.trackingNumber,
          senderName: fullShipment.sender.name,
          senderPhone: fullShipment.sender.phone,
          receiverName: fullShipment.receiver.name,
          receiverPhone: fullShipment.receiver.phone,
          originBranch: fullShipment.originBranch.name,
          destBranch: fullShipment.destBranch.name,
          shippingFee: fullShipment.shippingFee,
          collectionAmount: fullShipment.collectionAmount,
          otp: fullShipment.otp,
        }, newStatus);
      }
    } catch (e) {
      console.warn("تحذير: فشل إرسال إشعار الواتساب عند تغيير الحالة:", e);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("خطأ أثناء تحديث حالة الشحنة:", error);
    return { error: getErrorMessage(error) || "فشل تحديث حالة الشحنة" };
  }
}

export interface UpdateShipmentInput {
  id: string;
  type: string;
  serviceType: string;
  paymentMethod: string;
  declaredValue: number;
  shippingFee: number;
  collectionAmount: number;
  notes?: string;
  originBranchId: string;
  destBranchId: string;
  metadataJson?: string;
  
  sender: CustomerInput;
  receiver: CustomerInput;
  
  items: ShipmentItemInput[];
}

/**
 * تعديل شحنة بالكامل وتحديث أطرافها وقطعها
 */
export async function updateShipmentAction(input: UpdateShipmentInput) {
  const session = await getSession();
  if (!session) {
    return { error: "غير مصرح لك بالعملية. يرجى تسجيل الدخول." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. التأكد من وجود الشحنة
      const oldShipment = await tx.shipment.findUnique({
        where: { id: input.id },
        include: { sender: true, receiver: true, items: true },
      });

      if (!oldShipment) {
        throw new Error("الشحنة المطلوبة غير موجودة");
      }

      // 2. تحديث أو البحث عن المرسل عن طريق الهاتف
      let sender = await tx.customer.findUnique({
        where: { phone: input.sender.phone },
      });

      if (sender) {
        sender = await tx.customer.update({
          where: { id: sender.id },
          data: {
            name: input.sender.name,
            altPhone: input.sender.altPhone,
            provinceId: input.sender.provinceId,
            cityId: input.sender.cityId,
            address: input.sender.address,
            landmark: input.sender.landmark,
          },
        });
      } else {
        sender = await tx.customer.create({
          data: {
            name: input.sender.name,
            phone: input.sender.phone,
            altPhone: input.sender.altPhone,
            provinceId: input.sender.provinceId,
            cityId: input.sender.cityId,
            address: input.sender.address,
            landmark: input.sender.landmark,
          },
        });
      }

      // 3. تحديث أو البحث عن المستلم عن طريق الهاتف
      let receiver = await tx.customer.findUnique({
        where: { phone: input.receiver.phone },
      });

      if (receiver) {
        receiver = await tx.customer.update({
          where: { id: receiver.id },
          data: {
            name: input.receiver.name,
            altPhone: input.receiver.altPhone,
            provinceId: input.receiver.provinceId,
            cityId: input.receiver.cityId,
            address: input.receiver.address,
            landmark: input.receiver.landmark,
          },
        });
      } else {
        receiver = await tx.customer.create({
          data: {
            name: input.receiver.name,
            phone: input.receiver.phone,
            altPhone: input.receiver.altPhone,
            provinceId: input.receiver.provinceId,
            cityId: input.receiver.cityId,
            address: input.receiver.address,
            landmark: input.receiver.landmark,
          },
        });
      }

      // حساب إجمالي الوزن الجديد
      const totalWeight = input.items.reduce((sum, item) => sum + item.weight * item.count, 0);

      // 4. تحديث الشحنة
      const updatedShipment = await tx.shipment.update({
        where: { id: input.id },
        data: {
          type: input.type,
          serviceType: input.serviceType,
          senderId: sender.id,
          receiverId: receiver.id,
          originBranchId: input.originBranchId,
          destBranchId: input.destBranchId,
          weight: totalWeight || 1.0,
          declaredValue: input.declaredValue || 0,
          shippingFee: input.shippingFee || 0,
          collectionAmount: input.collectionAmount || 0,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "PREPAID" ? "PAID" : oldShipment.paymentStatus,
          notes: input.notes,
          metadataJson: input.metadataJson ?? oldShipment.metadataJson,
        },
      });

      // 5. تحديث قطع الشحنة (حذف القديم وإدخال الجديد)
      await tx.shipmentItem.deleteMany({
        where: { shipmentId: input.id },
      });

      if (input.items && input.items.length > 0) {
        await tx.shipmentItem.createMany({
          data: input.items.map((item) => ({
            shipmentId: input.id,
            description: item.description,
            count: item.count,
            weight: item.weight,
            price: item.price,
          })),
        });
      }

      // 6. تسجيل حدث التعديل في السجل التاريخي للشحنة
      await tx.shipmentEvent.create({
        data: {
          shipmentId: input.id,
          eventType: "UPDATED",
          fromUserId: session.id,
          branchId: session.branchId || input.originBranchId,
          notes: "تم تعديل تفاصيل الشحنة وأطرافها من قبل الموظف: " + session.name,
        },
      });

      // 7. تسجيل في سجل التدقيق
      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "UPDATE_SHIPMENT",
          entityType: "Shipment",
          entityId: input.id,
          oldValues: JSON.stringify({
            type: oldShipment.type,
            serviceType: oldShipment.serviceType,
            shippingFee: oldShipment.shippingFee,
            collectionAmount: oldShipment.collectionAmount,
          }),
          newValues: JSON.stringify({
            type: input.type,
            serviceType: input.serviceType,
            shippingFee: input.shippingFee,
            collectionAmount: input.collectionAmount,
          }),
        },
      });

      return updatedShipment;
    });

    revalidatePath(`/dashboard/shipments/${input.id}`);
    revalidatePath(`/dashboard/shipments/${input.id}/edit`);
    revalidatePath("/dashboard/shipments");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    console.error("خطأ أثناء تعديل الشحنة:", error);
    return { error: getErrorMessage(error) || "حدث خطأ غير متوقع أثناء تحديث الشحنة" };
  }
}

/**
 * البحث عن عميل برقم الهاتف لتسهيل التعبئة التلقائية
 */
export async function findCustomerByPhoneAction(phone: string) {
  const session = await getSession();
  if (!session) {
    return { error: "غير مصرح بالعملية. يرجى تسجيل الدخول." };
  }
  try {
    const customer = await prisma.customer.findUnique({
      where: { phone },
    });
    if (customer) {
      return {
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          altPhone: customer.altPhone || "",
          provinceId: customer.provinceId,
          cityId: customer.cityId,
          address: customer.address,
          landmark: customer.landmark || "",
        }
      };
    }
    return { success: false, message: "العميل غير مسجل مسبقاً" };
  } catch (error: unknown) {
    console.error("خطأ أثناء البحث عن العميل بموجب الهاتف:", error);
    return { error: "فشل البحث عن بيانات العميل" };
  }
}

// =============================
// تحديث جماعي لحالة الشحنات
// =============================
export async function bulkUpdateShipmentStatusAction(ids: string[], status: string, notes?: string) {
  const session = await getSession();
  if (!session) {
    return { error: "غير مصرح بالعملية. يرجى تسجيل الدخول." };
  }

  try {
    const updatedCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const id of ids) {
        const shipment = await tx.shipment.findUnique({
          where: { id },
          include: {
            sender: true,
            receiver: true,
            originBranch: true,
            destBranch: true,
          },
        });

        if (!shipment) continue;

        // تحديث الشحنة
        await tx.shipment.update({
          where: { id },
          data: { status },
        });

        // إضافة حدث للشحنة
        await tx.shipmentEvent.create({
          data: {
            shipmentId: id,
            eventType: status,
            fromUserId: session.id,
            location: shipment.destBranch.name,
            notes: notes || "تحديث جماعي لحالة الشحنة",
          },
        });

        // تسجيل في سجل التدقيق
        await tx.auditLog.create({
          data: {
            userId: session.id,
            action: `UPDATE_STATUS_${status}`,
            entityType: "Shipment",
            entityId: id,
            newValues: JSON.stringify({ oldStatus: shipment.status, newStatus: status }),
          },
        });

        // إرسال إشعارات الواتساب (خلفية)
        try {
          await sendStatusChangeNotification({
            shipmentId: id,
            trackingNumber: shipment.trackingNumber,
            senderName: shipment.sender.name,
            senderPhone: shipment.sender.phone,
            receiverName: shipment.receiver.name,
            receiverPhone: shipment.receiver.phone,
            originBranch: shipment.originBranch.name,
            destBranch: shipment.destBranch.name,
            shippingFee: shipment.shippingFee,
            collectionAmount: shipment.collectionAmount,
            status,
            otp: shipment.otp,
          }, status);
        } catch (err) {
          console.error("خطأ إشعار واتساب جماعي:", err);
        }

        count++;
      }
      return count;
    });

    revalidatePath("/dashboard/shipments");
    return { success: true, count: updatedCount };
  } catch (error: unknown) {
    console.error("خطأ التحديث الجماعي للحالة:", error);
    return { error: "فشل التحديث الجماعي للحالات: " + getErrorMessage(error) };
  }
}

// =============================
// تعيين جماعي لسائقي التوصيل
// =============================
export async function bulkAssignDriverAction(ids: string[], driverId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "غير مصرح بالعملية. يرجى تسجيل الدخول." };
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });
    if (!driver) return { error: "السائق المحدد غير موجود." };

    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        const shipment = await tx.shipment.findUnique({ where: { id } });
        if (!shipment) continue;

        // تحديث السائق وتحديث الحالة إلى OUT_FOR_DELIVERY تلقائياً لتسهيل العمل
        await tx.shipment.update({
          where: { id },
          data: {
            driverId,
            status: "OUT_FOR_DELIVERY",
          },
        });

        // إضافة حدث
        await tx.shipmentEvent.create({
          data: {
            shipmentId: id,
            eventType: "OUT_FOR_DELIVERY",
            fromUserId: session.id,
            location: shipment.destBranchId ? (await tx.branch.findUnique({ where: { id: shipment.destBranchId } }))?.name : null,
            notes: `إسناد جماعي وتكليف المندوب: ${driver.user.name}`,
          },
        });

        // تسجيل في سجل التدقيق
        await tx.auditLog.create({
          data: {
            userId: session.id,
            action: "ASSIGN_DRIVER",
            entityType: "Shipment",
            entityId: id,
            newValues: JSON.stringify({ driverId, driverName: driver.user.name }),
          },
        });
      }
    });

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error: unknown) {
    console.error("خطأ الإسناد الجماعي للسائق:", error);
    return { error: "فشل الإسناد الجماعي للسائق: " + getErrorMessage(error) };
  }
}

// =============================
// تعيين جماعي للوكلاء الخارجيين
// =============================
export async function bulkAssignAgentAction(ids: string[], agentId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "غير مصرح بالعملية. يرجى تسجيل الدخول." };
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });
    if (!agent) return { error: "الوكيل المحدد غير موجود." };

    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        await tx.shipment.update({
          where: { id },
          data: { agentId },
        });

        // تسجيل في سجل التدقيق
        await tx.auditLog.create({
          data: {
            userId: session.id,
            action: "ASSIGN_AGENT",
            entityType: "Shipment",
            entityId: id,
            newValues: JSON.stringify({ agentId, agentName: agent.user.name }),
          },
        });
      }
    });

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error: unknown) {
    console.error("خطأ الإسناد الجماعي للوكيل:", error);
    return { error: "فشل الإسناد الجماعي للوكيل: " + getErrorMessage(error) };
  }
}
