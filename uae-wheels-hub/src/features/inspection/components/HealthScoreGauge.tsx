import React from 'react';

interface HealthScoreGaugeProps {
  score: number;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ score }) => {
  const radius = 38;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = '#ef4444'; // red
  if (score >= 90) color = '#10b981'; // emerald
  else if (score >= 70) color = '#f59e0b'; // amber

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg] transition-all duration-1000 ease-out"
      >
        <circle
          stroke="#334155"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="opacity-20"
        />
        <circle
          stroke={color}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-white" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] text-white/60">/100</span>
      </div>
    </div>
  );
};
