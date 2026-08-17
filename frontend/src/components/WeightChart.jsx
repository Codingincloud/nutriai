import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

const WeightChart = ({ data, goalWeight }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eaecf0" />
          <XAxis dataKey="date" tick={{ fill: '#5a6a7a', fontSize: 11 }} />
          <YAxis tick={{ fill: '#5a6a7a', fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #dde1e9', borderRadius: '6px', fontSize: '12px' }}
            itemStyle={{ color: '#1a2332' }}
          />
          <Legend wrapperStyle={{ color: '#5a6a7a', fontSize: '12px' }} />
          {goalWeight && (
            <ReferenceLine y={goalWeight} stroke="#1a7f4b" strokeDasharray="6 3"
              label={{ value: `Goal: ${goalWeight}kg`, fill: '#1a7f4b', fontSize: 11 }} />
          )}
          <Line type="monotone" dataKey="actual" stroke="#1e3a5f" strokeWidth={2.5}
            dot={{ r: 4, fill: '#1e3a5f' }} connectNulls={false} name="Actual" />
          <Line type="monotone" dataKey="predicted" stroke="#c0392b" strokeWidth={2}
            strokeDasharray="6 3" dot={{ r: 3, fill: '#c0392b' }} connectNulls={false} name="Predicted" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;
