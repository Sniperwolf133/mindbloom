import { useState } from "react";

const SCORE_LABELS = {
  1: "Overwhelmed",
  2: "Stressed / Sad",
  3: "Okay",
  4: "Calm",
  5: "Happy",
};

const DOT_COLORS = {
  Happy: "#4BA880",
  Calm: "#6BAEE8",
  Okay: "#A78EF0",
  Stressed: "#F2A072",
  Sad: "#8A94B8",
  Overwhelmed: "#E57A8D",
};

export default function MoodTrendChart({ trends = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!trends.length) {
    return (
      <div className="flex flex-col items-center justify-center h-52 rounded-2xl bg-lavender-50/70 border border-dashed border-lavender-200 text-center px-6">
        <p className="text-sm font-medium text-plum-700">
          Your mood trend chart will bloom softly here after your first check-in.
        </p>
        <p className="text-xs text-plum-700/70 mt-1">
          No judgment, no grades — just gentle patterns over time.
        </p>
      </div>
    );
  }

  const width = 560;
  const height = 210;
  const padX = 48;
  const padY = 26;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const points = trends.map((t, idx) => {
    const x =
      trends.length === 1
        ? padX + plotW / 2
        : padX + (idx / (trends.length - 1)) * plotW;
    const y = padY + ((5 - t.score) / 4) * plotH;
    return { ...t, x, y };
  });

  const linePath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${padY + plotH} L ${points[0].x.toFixed(1)} ${padY + plotH} Z`
      : "";

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible">
        <defs>
          <linearGradient id="moodAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B6FE3" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#8B6FE3" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal score guide lines */}
        {[1, 2, 3, 4, 5].map((lvl) => {
          const y = padY + ((5 - lvl) / 4) * plotH;
          return (
            <g key={lvl}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="#EAE3F8"
                strokeDasharray="4 4"
              />
              <text
                x={padX - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#7B7296"
              >
                {lvl}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#moodAreaGrad)" />}

        {points.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="#8B6FE3"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((pt, idx) => (
          <g
            key={pt.date}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer"
          >
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredIdx === idx ? 9 : 6.5}
              fill={DOT_COLORS[pt.mood] || "#8B6FE3"}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              className="transition-all duration-150"
            />
            <text
              x={pt.x}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#6C6488"
            >
              {pt.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>

      {hoveredIdx !== null && points[hoveredIdx] && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-lavender-100 px-3.5 py-1 text-xs font-medium text-plum-800">
          <span>{points[hoveredIdx].date}</span>
          <span>•</span>
          <span>
            {points[hoveredIdx].mood} ({SCORE_LABELS[points[hoveredIdx].score] || "Check-in"})
          </span>
          <span>•</span>
          <span>{points[hoveredIdx].count} check-in(s)</span>
        </div>
      )}
    </div>
  );
}

