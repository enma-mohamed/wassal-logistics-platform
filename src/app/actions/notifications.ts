"use server";

import prisma from "@/lib/prisma";
import { getSession } from "./auth";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

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
  } catch (error: unknown) {
    console.error("Error fetching notifications:", error);
    return { error: getErrorMessage(error) || "فشل جلب الإشعارات" };
  }
}
