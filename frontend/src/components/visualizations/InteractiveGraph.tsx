import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';

interface InteractiveGraphProps {
  data: Array<{ x: number; y: number }>;
  lineColor?: string;
  showGrid?: boolean;
  xDomain?: [number, number];
  yDomain?: [number, number];
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  data,
  lineColor = 'var(--tg-theme-button-color, #3390ec)',
  showGrid = true,
  xDomain = [-10, 10],
  yDomain = [-10, 10],
}) => {
  const textColor = 'var(--tg-theme-hint-color, #999)';
  const gridColor = 'var(--tg-theme-secondary-bg-color, #f0f0f0)';

  return (
    <div className="w-full h-80 p-4 rounded-lg" style={{ backgroundColor: 'var(--tg-theme-bg-color)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
          <XAxis
            dataKey="x"
            type="number"
            domain={xDomain}
            stroke={textColor}
            tick={{ fill: textColor }}
          />
          <YAxis
            type="number"
            domain={yDomain}
            stroke={textColor}
            tick={{ fill: textColor }}
          />
          <ReferenceLine x={0} stroke={textColor} strokeWidth={1} />
          <ReferenceLine y={0} stroke={textColor} strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="y"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
