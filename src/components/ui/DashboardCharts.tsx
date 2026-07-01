"use client";

import { useState } from "react";
import { TrendingUp, PieChart } from "lucide-react";

interface ChartDataPoint {
  name: string;
  count: number;
}

interface DashboardChartsProps {
  dailyData: ChartDataPoint[];
  statusData: {
    status: string;
    text: string;
    count: number;
    color: string;
  }[];
}

export default function DashboardCharts({ dailyData, statusData }: DashboardChartsProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // حساب الحد الأقصى للقيم لتحديد نسبة الطول في مخطط SVG
  const maxCount = Math.max(...dailyData.map((d) => d.count), 5); // حد أدنى 5 لجمالية الرسم

  // حساب إجمالي الشحنات لنسب المئوية
  const totalStatusCount = statusData.reduce((sum, s) => sum + s.count, 0) || 1;

  // إحداثيات ومقاسات الـ SVG للمخطط العمودي
  const svgWidth = 500;
  const svgHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const barWidth = 32;
  const gap = (chartWidth - barWidth * dailyData.length) / (dailyData.length - 1 || 1);

  return (
    <div className="charts-grid-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
      {/* 1. مخطط الأعمدة البيانية لحجم الشحنات الأسبوعي */}
      <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 className="section-title-with-icon" style={{ margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <TrendingUp size={18} className="text-blue" />
          <span>حجم الشحنات اليومي (آخر 7 أيام)</span>
        </h3>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" style={{ overflow: "visible" }}>
            {/* التدرج اللوني للأعمدة */}
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--secondary)" />
                <stop offset="100%" stopColor="var(--secondary-hover)" />
              </linearGradient>
            </defs>

            {/* خطوط الشبكة الأفقية وقيم المحور Y */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const yVal = chartHeight * (1 - ratio) + paddingTop;
              const label = Math.round(maxCount * ratio);
              return (
                <g key={index}>
                  <line
                    x1={paddingLeft}
                    y1={yVal}
                    x2={svgWidth - paddingRight}
                    y2={yVal}
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={yVal + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="var(--text-muted)"
                    fontWeight="600"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* رسم الأعمدة والأقلام الحرة */}
            {dailyData.map((data, index) => {
              const barHeight = (data.count / maxCount) * chartHeight;
              const x = paddingLeft + index * (barWidth + gap);
              const y = chartHeight - barHeight + paddingTop;
              const isHovered = hoveredBar === index;

              return (
                <g
                  key={index}
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* العمود */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={isHovered ? "url(#barGradientHover)" : "url(#barGradient)"}
                    rx="4"
                    style={{
                      transition: "all 0.3s ease",
                      transformOrigin: `${x + barWidth / 2}px ${chartHeight + paddingTop}px`,
                      transform: isHovered ? "scaleY(1.05)" : "scaleY(1)",
                    }}
                  />
                  
                  {/* التلميح العددي فوق العمود */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill={isHovered ? "var(--secondary)" : "var(--text)"}
                    style={{
                      opacity: isHovered || data.count > 0 ? 1 : 0,
                      transition: "opacity 0.2s ease, fill 0.2s ease",
                    }}
                  >
                    {data.count}
                  </text>

                  {/* اسم اليوم أسفل العمود */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + paddingTop + 20}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={isHovered ? "var(--primary)" : "var(--text-secondary)"}
                  >
                    {data.name}
                  </text>
                </g>
              );
            })}

            {/* خط القاعدة */}
            <line
              x1={paddingLeft}
              y1={chartHeight + paddingTop}
              x2={svgWidth - paddingRight}
              y2={chartHeight + paddingTop}
              stroke="var(--border)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* 2. توزيع الحالات ونسبها المئوية */}
      <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 className="section-title-with-icon" style={{ margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <PieChart size={18} className="text-secondary" />
          <span>توزيع حالات الشحنات الحالية</span>
        </h3>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "1rem" }}>
          {statusData.map((item, index) => {
            const percentage = Math.round((item.count / totalStatusCount) * 100);
            return (
              <div key={index} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: item.color }}></span>
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>{item.text}</span>
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    <span style={{ fontWeight: "bold", color: "var(--text)" }}>{item.count}</span> شحنة ({percentage}%)
                  </div>
                </div>
                {/* شريط التقدم الجذاب */}
                <div style={{ width: "100%", height: "8px", backgroundColor: "var(--background)", borderRadius: "10px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                      borderRadius: "10px",
                      transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
