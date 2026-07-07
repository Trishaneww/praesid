'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
}

export const Sparkline = ({ data }: SparklineProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart
      data={data.map((value, index) => ({ index, value }))}
      margin={{ top: 3, right: 0, bottom: 0, left: 0 }}
    >
      <defs>
        <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.16} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="value"
        stroke="currentColor"
        strokeWidth={1.75}
        fill="url(#sparklineFill)"
        isAnimationActive={false}
        dot={false}
      />
    </AreaChart>
  </ResponsiveContainer>
);
