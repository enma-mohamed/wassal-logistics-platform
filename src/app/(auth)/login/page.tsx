"use client";

import { useActionState, useEffect, startTransition } from "react";
import { loginAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.success) {
      // استخدام window.location.href للتأكد من إعادة تحميل كاملة لتحديث الكوكيز وحالة لوحة التحكم
      window.location.href = "/dashboard";
    }
  }, [state, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-title">منصة وصّل</h1>
        <p className="auth-subtitle">نظام إدارة التوصيل والأمانات اللوجستي</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {state?.error && <div className="auth-error">{state.error}</div>}

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="email">
            البريد الإلكتروني
          </label>
          <input
            className="auth-input"
            type="email"
            id="email"
            name="email"
            placeholder="example@wassal.ye"
            required
            defaultValue="admin@wassal.ye" // تسهيلاً للتطوير والتجربة
          />
        </div>

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="password">
            كلمة المرور
          </label>
          <input
            className="auth-input"
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            required
            defaultValue="admin123" // تسهيلاً للتطوير والتجربة
          />
        </div>

        <button className="auth-btn" type="submit" disabled={isPending}>
          {isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </form>

      <div className="auth-footer">
        طوّر بواسطة فريق التطوير التقني لمنصة وصّل &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
