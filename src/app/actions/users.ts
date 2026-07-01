"use server";

import prisma from "@/lib/prisma";
import { getSession } from "./auth";
import { hashPassword } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

// =============================
// إنشاء موظف جديد
// =============================
interface CreateEmployeeInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  branchId?: string;
}

export async function createEmployeeAction(input: CreateEmployeeInput) {
  const session = await getSession();
  if (!session || !["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"].includes(session.role)) {
    return { error: "غير مصرح لك بهذه العملية." };
  }

  try {
    // التحقق من عدم تكرار البريد أو الهاتف
    const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingEmail) return { error: "البريد الإلكتروني مستخدم مسبقاً." };

    const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (existingPhone) return { error: "رقم الهاتف مسجل مسبقاً في النظام." };

    const passwordHash = hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role,
        branchId: input.branchId || null,
      },
    });

    // تسجيل العملية في سجل التدقيق
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE_USER",
        entityType: "User",
        entityId: user.id,
        newValues: JSON.stringify({ name: user.name, role: user.role, email: user.email }),
      },
    });

    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error: any) {
    console.error("خطأ إنشاء موظف:", error);
    return { error: "حدث خطأ أثناء إنشاء الموظف: " + (error?.message || error) };
  }
}

// =============================
// إنشاء وكيل خارجي جديد
// =============================
interface CreateAgentInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  branchId?: string;
  commissionType: string;
  commissionRate: number;
  area?: string;
}

export async function createAgentAction(input: CreateAgentInput) {
  const session = await getSession();
  if (!session || !["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"].includes(session.role)) {
    return { error: "غير مصرح لك بهذه العملية." };
  }

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingEmail) return { error: "البريد الإلكتروني مستخدم مسبقاً." };

    const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (existingPhone) return { error: "رقم الهاتف مسجل مسبقاً." };

    const passwordHash = hashPassword(input.password);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash,
          role: "AGENT",
          branchId: input.branchId || null,
        },
      });

      await tx.agent.create({
        data: {
          userId: user.id,
          commissionType: input.commissionType,
          commissionRate: input.commissionRate,
          area: input.area || null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "CREATE_AGENT",
          entityType: "Agent",
          entityId: user.id,
          newValues: JSON.stringify({ name: user.name, area: input.area, commission: input.commissionRate }),
        },
      });
    });

    revalidatePath("/dashboard/agents");
    return { success: true };
  } catch (error: any) {
    console.error("خطأ إنشاء وكيل:", error);
    return { error: "حدث خطأ أثناء إنشاء الوكيل: " + (error?.message || error) };
  }
}

// =============================
// إنشاء سائق/مندوب جديد
// =============================
interface CreateDriverInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  branchId?: string;
  vehiclePlate?: string;
  licenseNumber?: string;
}

export async function createDriverAction(input: CreateDriverInput) {
  const session = await getSession();
  if (!session || !["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"].includes(session.role)) {
    return { error: "غير مصرح لك بهذه العملية." };
  }

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingEmail) return { error: "البريد الإلكتروني مستخدم مسبقاً." };

    const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (existingPhone) return { error: "رقم الهاتف مسجل مسبقاً." };

    const passwordHash = hashPassword(input.password);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash,
          role: "DRIVER",
          branchId: input.branchId || null,
        },
      });

      await tx.driver.create({
        data: {
          userId: user.id,
          vehiclePlate: input.vehiclePlate || null,
          licenseNumber: input.licenseNumber || null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "CREATE_DRIVER",
          entityType: "Driver",
          entityId: user.id,
          newValues: JSON.stringify({ name: user.name, vehiclePlate: input.vehiclePlate }),
        },
      });
    });

    revalidatePath("/dashboard/drivers");
    return { success: true };
  } catch (error: any) {
    console.error("خطأ إنشاء سائق:", error);
    return { error: "حدث خطأ أثناء إنشاء السائق: " + (error?.message || error) };
  }
}

// =============================
// تفعيل/تعطيل حساب مستخدم
// =============================
export async function toggleUserStatusAction(userId: string) {
  const session = await getSession();
  if (!session || !["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"].includes(session.role)) {
    return { error: "غير مصرح لك بهذه العملية." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "المستخدم غير موجود." };

    const newActiveState = !user.isActive;

    await prisma.$transaction(async (tx) => {
      // تحديث حالة المستخدم
      await tx.user.update({
        where: { id: userId },
        data: { isActive: newActiveState },
      });

      // إذا كان وكيلاً، حدّث حالته
      if (user.role === "AGENT") {
        await tx.agent.updateMany({
          where: { userId },
          data: { status: newActiveState ? "ACTIVE" : "INACTIVE" },
        });
      }

      // إذا كان سائقاً، حدّث حالته
      if (user.role === "DRIVER") {
        await tx.driver.updateMany({
          where: { userId },
          data: { status: newActiveState ? "AVAILABLE" : "OFFLINE" },
        });
      }

      // تسجيل في سجل التدقيق
      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: newActiveState ? "ACTIVATE_USER" : "DEACTIVATE_USER",
          entityType: "User",
          entityId: userId,
          newValues: JSON.stringify({ name: user.name, role: user.role, isActive: newActiveState }),
        },
      });
    });

    revalidatePath("/dashboard/employees");
    revalidatePath("/dashboard/agents");
    revalidatePath("/dashboard/drivers");

    return { success: true, isActive: newActiveState };
  } catch (error: any) {
    console.error("خطأ تغيير حالة المستخدم:", error);
    return { error: "فشل تغيير حالة المستخدم: " + (error?.message || error) };
  }
}

// =============================
// حذف حساب مستخدم بأمان
// =============================
export async function deleteUserAction(userId: string) {
  const session = await getSession();
  if (!session || !["SYSTEM_ADMIN", "COMPANY_ADMIN"].includes(session.role)) {
    return { error: "غير مصرح لك بهذه العملية (تطلب صلاحية إدارة النظام)." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { agentProfile: true, driverProfile: true },
    });
    if (!user) return { error: "المستخدم غير موجود." };

    // لا تسمح للمستخدم بحذف نفسه
    if (user.id === session.id) {
      return { error: "لا يمكنك حذف حسابك الخاص الذي تسجل الدخول به حالياً." };
    }

    // 1. التحقق من الارتباطات في الجداول اللوجستية والمالية
    const [shipmentsCreated, shipmentsAsAgent, shipmentsAsDriver, eventsFrom, eventsTo, paymentsCollected] = await Promise.all([
      prisma.shipment.count({ where: { createdById: userId } }),
      user.agentProfile ? prisma.shipment.count({ where: { agentId: user.agentProfile.id } }) : 0,
      user.driverProfile ? prisma.shipment.count({ where: { driverId: user.driverProfile.id } }) : 0,
      prisma.shipmentEvent.count({ where: { fromUserId: userId } }),
      prisma.shipmentEvent.count({ where: { toUserId: userId } }),
      prisma.payment.count({ where: { collectedById: userId } }),
    ]);

    const totalReferences = shipmentsCreated + shipmentsAsAgent + shipmentsAsDriver + eventsFrom + eventsTo + paymentsCollected;

    if (totalReferences > 0) {
      // لوجود ارتباطات، نقوم بعمل تعطيل (Soft Delete) حماية لسلامة الحسابات
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { isActive: false },
        });

        if (user.role === "AGENT") {
          await tx.agent.updateMany({
            where: { userId },
            data: { status: "INACTIVE" },
          });
        }

        if (user.role === "DRIVER") {
          await tx.driver.updateMany({
            where: { userId },
            data: { status: "OFFLINE" },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: session.id,
            action: "DEACTIVATE_USER_ON_DELETE",
            entityType: "User",
            entityId: userId,
            newValues: JSON.stringify({ reason: "تم تعطيل الحساب بدلاً من الحذف لوجود معاملات مرتبطة" }),
          },
        });
      });

      revalidatePath("/dashboard/employees");
      revalidatePath("/dashboard/agents");
      revalidatePath("/dashboard/drivers");

      return {
        warning: true,
        message: "تم تعطيل هذا الحساب بنجاح لعدم تمكنه من الدخول للنظام. لم يتم الحذف نهائياً لوجود فواتير، شحنات، أو حركات مالية مسجلة باسمه سابقاً حفاظاً على سلامة التقارير المالية واللوجستية.",
      };
    }

    // 2. إذا لم يكن هناك أي ارتباطات، نقوم بالحذف الفعلي
    await prisma.$transaction(async (tx) => {
      // حذف التابع أولاً بسبب قيود الـ foreign key
      if (user.role === "AGENT") {
        await tx.agent.deleteMany({ where: { userId } });
      }
      if (user.role === "DRIVER") {
        await tx.driver.deleteMany({ where: { userId } });
      }

      await tx.user.delete({ where: { id: userId } });

      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "DELETE_USER",
          entityType: "User",
          entityId: userId,
          newValues: JSON.stringify({ name: user.name, role: user.role }),
        },
      });
    });

    revalidatePath("/dashboard/employees");
    revalidatePath("/dashboard/agents");
    revalidatePath("/dashboard/drivers");

    return { success: true, message: "تم حذف الحساب والملف الشخصي بنجاح تام." };
  } catch (error: any) {
    console.error("خطأ أثناء حذف المستخدم:", error);
    return { error: "فشل حذف المستخدم: " + (error?.message || error) };
  }
}

// =============================
// تغيير كلمة مرور المستخدم الحالي
// =============================
export async function changePasswordAction(input: { oldPassword: string; newPassword: string }) {
  const session = await getSession();
  if (!session) return { error: "يجب تسجيل الدخول أولاً." };

  try {
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return { error: "المستخدم غير موجود." };

    // التحقق من كلمة المرور القديمة
    const { verifyPassword } = await import("@/lib/auth-utils");
    const isOldValid = verifyPassword(input.oldPassword, user.passwordHash);
    if (!isOldValid) return { error: "كلمة المرور الحالية غير صحيحة." };

    if (input.newPassword.length < 6) {
      return { error: "يجب أن تكون كلمة المرور الجديدة مكونة من 6 خانات على الأقل." };
    }

    const { hashPassword } = await import("@/lib/auth-utils");
    const newHash = hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: session.id },
      data: { passwordHash: newHash },
    });

    // تسجيل العملية في سجل التدقيق
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CHANGE_PASSWORD",
        entityType: "User",
        entityId: session.id,
        newValues: JSON.stringify({ message: "تم تغيير كلمة المرور بنجاح" }),
      },
    });

    return { success: true, message: "تم تغيير كلمة المرور بنجاح تام." };
  } catch (error: any) {
    console.error("خطأ تغيير كلمة المرور:", error);
    return { error: "حدث خطأ أثناء تغيير كلمة المرور: " + (error?.message || error) };
  }
}

// =============================
// تعديل بيانات موظف/مستخدم
// =============================
interface UpdateEmployeeInput {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  branchId?: string;
}

export async function updateEmployeeAction(input: UpdateEmployeeInput) {
  const session = await getSession();
  if (!session || !["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"].includes(session.role)) {
    return { error: "غير مصرح لك بهذه العملية." };
  }

  try {
    // التحقق من عدم تكرار البريد أو الهاتف لحساب آخر
    const existingEmail = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: input.userId } },
    });
    if (existingEmail) return { error: "البريد الإلكتروني مستخدم مسبقاً لحساب آخر." };

    const existingPhone = await prisma.user.findFirst({
      where: { phone: input.phone, NOT: { id: input.userId } },
    });
    if (existingPhone) return { error: "رقم الهاتف مسجل مسبقاً لحساب آخر." };

    const updatedUser = await prisma.user.update({
      where: { id: input.userId },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        branchId: input.branchId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE_USER",
        entityType: "User",
        entityId: input.userId,
        newValues: JSON.stringify({ name: updatedUser.name, role: updatedUser.role, email: updatedUser.email }),
      },
    });

    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error: any) {
    console.error("خطأ تعديل موظف:", error);
    return { error: "فشل تعديل بيانات الموظف: " + (error?.message || error) };
  }
}

// =============================
// تعديل بيانات وكيل خارجي
// =============================
interface UpdateAgentInput {
  userId: string;
  name: string;
  email: string;
  phone: string;
  branchId?: string;
  commissionType: string;
  commissionRate: number;
  area?: string;
}

export async function updateAgentAction(input: UpdateAgentInput) {
  const session = await getSession();
  if (!session || !["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"].includes(session.role)) {
    return { error: "غير مصرح لك بهذه العملية." };
  }

  try {
    const existingEmail = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: input.userId } },
    });
    if (existingEmail) return { error: "البريد الإلكتروني مستخدم مسبقاً لحساب آخر." };

    const existingPhone = await prisma.user.findFirst({
      where: { phone: input.phone, NOT: { id: input.userId } },
    });
    if (existingPhone) return { error: "رقم الهاتف مسجل مسبقاً لحساب آخر." };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: input.userId },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          branchId: input.branchId || null,
        },
      });

      await tx.agent.update({
        where: { userId: input.userId },
        data: {
          commissionType: input.commissionType,
          commissionRate: input.commissionRate,
          area: input.area || null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "UPDATE_AGENT",
          entityType: "Agent",
          entityId: input.userId,
          newValues: JSON.stringify({ name: input.name, commissionRate: input.commissionRate, area: input.area }),
        },
      });
    });

    revalidatePath("/dashboard/agents");
    return { success: true };
  } catch (error: any) {
    console.error("خطأ تعديل وكيل:", error);
    return { error: "فشل تعديل بيانات الوكيل: " + (error?.message || error) };
  }
}

// =============================
// تعديل بيانات سائق/مندوب
// =============================
interface UpdateDriverInput {
  userId: string;
  name: string;
  email: string;
  phone: string;
  branchId?: string;
  vehiclePlate?: string;
  licenseNumber?: string;
}

export async function updateDriverAction(input: UpdateDriverInput) {
  const session = await getSession();
  if (!session || !["SYSTEM_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER"].includes(session.role)) {
    return { error: "غير مصرح لك بهذه العملية." };
  }

  try {
    const existingEmail = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: input.userId } },
    });
    if (existingEmail) return { error: "البريد الإلكتروني مستخدم مسبقاً لحساب آخر." };

    const existingPhone = await prisma.user.findFirst({
      where: { phone: input.phone, NOT: { id: input.userId } },
    });
    if (existingPhone) return { error: "رقم الهاتف مسجل مسبقاً لحساب آخر." };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: input.userId },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          branchId: input.branchId || null,
        },
      });

      await tx.driver.update({
        where: { userId: input.userId },
        data: {
          vehiclePlate: input.vehiclePlate || null,
          licenseNumber: input.licenseNumber || null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "UPDATE_DRIVER",
          entityType: "Driver",
          entityId: input.userId,
          newValues: JSON.stringify({ name: input.name, vehiclePlate: input.vehiclePlate }),
        },
      });
    });

    revalidatePath("/dashboard/drivers");
    return { success: true };
  } catch (error: any) {
    console.error("خطأ تعديل سائق:", error);
    return { error: "فشل تعديل بيانات السائق: " + (error?.message || error) };
  }
}
