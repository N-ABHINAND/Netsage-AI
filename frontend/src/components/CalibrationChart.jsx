import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function CalibrationChart({ calibrationData = [] }) {
  const getBarColor = (confidence) => {
    switch (confidence.toLowerCase()) {
      case 'high': return '#10b981'; // emerald
      case 'medium': return '#f59e0b'; // amber
      case 'low': return '#ef4444'; // rose
      default: return '#00bceb';
    }
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={calibrationData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="confidence"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            domain={[0, 100]}
            unit="%"
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            formatter={(value, name, props) => [`${value}% Accepted`, `Confidence: ${props.payload.confidence}`]}
          />
          <Bar dataKey="acceptance_rate" radius={[6, 6, 0, 0]} barSize={48}>
            {calibrationData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.confidence)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
