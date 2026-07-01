"use server";

import prisma from "@/lib/prisma";
import { getSession } from "./auth";

export interface AuditNotification {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date;
  userName: string;
}

/**
 * جلب الإشعارات الحية الأخيرة من سجل العمليات
 */
export async function getRecentNotificationsAction(): Promise<{ notifications?: AuditNotification[]; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "غير مصرح لك بالعملية" };
  }

  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    const notifications = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt,
      userName: log.user?.name || "النظام",
    }));

    return { notifications };
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return { error: error?.message || "فشل جلب الإشعارات" };
  }
}
