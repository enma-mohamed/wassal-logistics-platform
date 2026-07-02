# وصّل | منصة إدارة الشحنات والخدمات اللوجستية

منصة عربية متكاملة لإدارة الشحنات والتوصيل والعمليات المالية والتتبع داخل شبكة فروع وشركاء تشغيلية. المشروع مبني بـ Next.js و Prisma ويهدف إلى توفير تجربة تشغيلية احترافية للشركات التي تتعامل مع الشحنات والـ COD والعمليات اليومية.

## اسم مقترح للمستودع على GitHub

- الاسم المقترح: `wassal-logistics-platform`
- الاسم المختصر: `wassal`
- الوصف المقترح: `Arabic logistics and delivery management platform for shipments, branches, customers, agents, drivers, and financial collections.`

## نظرة عامة

تقدم المنصة واجهة تشغيلية عربية بالكامل مع:

- إدارة الشحنات من التسجيل إلى التسليم
- تتبع حالة الشحنة خطوة بخطوة
- إدارة الفروع والموظفين والعميل والوسطاء والسائقين
- إدارة التحصيل المالي والرسوم والـ COD
- لوحة تحكم تحليلية لعرض الإحصائيات اليومية
- دعم واجهة RTL باللغة العربية
- قاعدة بيانات محلية عبر Prisma SQLite مع بيانات أولية جاهزة

## المميزات الرئيسية

- تسجيل شحنات جديدة مع بيانات المرسل والمستلم
- إدارة حالات الشحنة: استلام، فرز، نقل، توصيل، تسليم، مرتجعة
- إدارة العملاء والفرع والوكيل والسائق
- إدارة قواعد التسعير والرسوم
- تتبع الشحنات عبر لوحة الإدارة
- تقارير وإحصائيات تشغيلية ومالية
- واجهة حديثة مبنية على Next.js App Router

## التكنولوجيا المستخدمة

- Next.js 16
- React 19
- TypeScript
- Prisma ORM
- SQLite
- CSS Modules و Tailwind-style custom styles
- Lucide Icons
- Recharts

## هيكل المشروع

- src/app: الصفحات والروابط الرئيسية
- src/components: المكونات القابلة لإعادة الاستخدام
- src/actions: منطق الأعمال والعمليات
- src/lib: الإعدادات والمساعدات العامة
- prisma: مخطط قاعدة البيانات والبيانات الأولية

## المتطلبات

- Node.js 18 أو أحدث
- npm أو yarn أو pnpm

## التثبيت

```bash
npm install
# أو
yarn
# أو
pnpm install
```

## الخطوة 1: تثبيت الحزم المطلوبة لـ Supabase

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## الخطوة 2: إضافة ملفات Supabase والبيئة

أنشئ أو عدّل ملف [.env.local](.env.local) وأضف:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY"
```

تمت إضافة ملفات المساعدات في:
- [src/utils/supabase/client.ts](src/utils/supabase/client.ts)
- [src/utils/supabase/server.ts](src/utils/supabase/server.ts)
- [src/utils/supabase/middleware.ts](src/utils/supabase/middleware.ts)

وتم ربط middleware الحالي مع Supabase بحيث يتم Refresh للـ session عند الحاجة.

## الخطوة 3: إعداد Supabase / Prisma على Vercel

1. افتح مشروعك على Vercel وأضف المتغيرات التالية في Environment Variables:
   - DATABASE_URL
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
2. شغّل Prisma على قاعدة Supabase:

```bash
npx prisma generate
npx prisma db push
node prisma/seed.ts
```

3. إذا أردت، يمكنك تثبيت Agent Skills اختياريًا من Supabase:

```bash
npx skills add supabase/agent-skills
```

## إعداد قاعدة البيانات

هذا المشروع يستخدم Prisma مع SQLite. بعد التثبيت، يمكنك تهيئة قاعدة البيانات والبيانات الأولية باستخدام:

```bash
npx prisma generate
npx prisma db push
node prisma/seed.ts
```

> إذا كانت قاعدة البيانات غير موجودة، سيتم إنشاء ملف prisma/dev.db تلقائيًا عند تشغيل Prisma.

## تشغيل المشروع

```bash
npm run dev
# أو
yarn dev
# أو
pnpm dev
```

ثم افتح المتصفح على:

```text
http://localhost:3000
```

## بيانات الدخول الافتراضية

بعد تشغيل البذرة Seed، سيتم تهيئة حسابات تجريبية مثل:

- مدير النظام: `admin@wassal.ye` / `admin123`
- مدير فرع: `manager@wassal.ye` / `manager123`
- موظف استقبال: `reception@wassal.ye` / `reception123`
- وكيل: `agent@wassal.ye` / `agent123`
- سائق: `driver@wassal.ye` / `driver123`

## أوامر مفيدة

```bash
npm run build
npm run lint
```

## المساهمة

إذا أردت المساهمة في المشروع:

1. Fork المستودع
2. أنشئ فرعًا جديدًا
3. أضف التعديلات الخاصة بك
4. افتح Pull Request

## الرخصة

هذا المشروع مخصص للاستخدام الداخلي والتطوير المؤسسي، ويمكن تعديله حسب احتياج الفريق.
