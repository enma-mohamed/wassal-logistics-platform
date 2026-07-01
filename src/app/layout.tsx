import type { Metadata } from "next";
import { Cairo, Tajawal, Rubik } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800", "900"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "منصة وصّل | لإدارة الخدمات اللوجستية والتوصيل والأمانات",
  description: "النظام اللوجستي المتكامل لإدارة الشحنات والتحصيلات المالية والعملاء في اليمن",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable} ${rubik.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('wassal_theme') || 'blue';
                  var font = localStorage.getItem('wassal_font') || 'cairo';
                  var customColor = localStorage.getItem('wassal_custom_color') || '#1e3a8a';

                  function clamp(value) {
                    return Math.max(0, Math.min(255, value));
                  }

                  function hexToRgb(hex) {
                    var cleaned = (hex || '').replace('#', '').trim();
                    if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
                      cleaned = cleaned.split('').map(function (part) { return part + part; }).join('');
                    }
                    if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
                      return null;
                    }
                    var value = parseInt(cleaned, 16);
                    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
                  }

                  function tintColor(hex, percent) {
                    var rgb = hexToRgb(hex);
                    if (!rgb) return hex;
                    var mix = percent / 100;
                    return '#' + [rgb.r, rgb.g, rgb.b].map(function (channel, index) {
                      var value = clamp(Math.round(channel + (255 - channel) * mix));
                      return value.toString(16).padStart(2, '0');
                    }).join('');
                  }

                  function shadeColor(hex, percent) {
                    var rgb = hexToRgb(hex);
                    if (!rgb) return hex;
                    var factor = 1 + (percent / 100);
                    return '#' + [rgb.r, rgb.g, rgb.b].map(function (channel) {
                      var value = clamp(Math.round(channel * factor));
                      return value.toString(16).padStart(2, '0');
                    }).join('');
                  }

                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.setAttribute('data-font', font);
                  if (theme === 'custom') {
                    var rgb = hexToRgb(customColor);
                    var accent = tintColor(customColor, 8);
                    var accentRgb = hexToRgb(accent) || rgb;
                    if (rgb) {
                      document.documentElement.style.setProperty('--primary', customColor);
                      document.documentElement.style.setProperty('--primary-hover', shadeColor(customColor, -12));
                      document.documentElement.style.setProperty('--primary-light', 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.12)');
                      document.documentElement.style.setProperty('--accent', accent);
                      document.documentElement.style.setProperty('--accent-light', 'rgba(' + accentRgb.r + ', ' + accentRgb.g + ', ' + accentRgb.b + ', 0.15)');
                      document.documentElement.style.setProperty('--border-focus', customColor);
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
