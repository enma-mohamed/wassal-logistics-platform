"use server";

import { getSystemSettings, saveSystemSettings, SystemSettings } from "@/lib/settings";
import { revalidatePath } from "next/cache";

export async function getSystemSettingsAction(): Promise<SystemSettings> {
  return getSystemSettings();
}

export async function saveSystemSettingsAction(settings: SystemSettings) {
  const success = saveSystemSettings(settings);
  if (success) {
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/shipments/new");
    return { success: true };
  }
  return { error: "فشل حفظ إعدادات النظام" };
}
