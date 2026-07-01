"use server";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
import { cookies } from "next/headers";

export async function loginAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { branch: true },
  });

  if (!user) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  if (!user.isActive) {
    return { error: "هذا الحساب معطّل. تواصل مع مدير النظام." };
  }

  const passwordHash = hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  // حفظ بيانات الجلسة
  const cookieStore = await cookies();
  const sessionData = JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    branchName: user.branch?.name || null,
  });

  cookieStore.set("wassal_session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 أيام
    path: "/",
  });

  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("wassal_session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("wassal_session");
  if (!session) return null;
  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}
