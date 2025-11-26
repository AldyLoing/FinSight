'use client';

import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface LineChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  xKey?: string;
  title?: string;
  color?: string;
  height?: number;
}

export const LineChartComponent: React.FC<LineChartProps> = ({ 
  data, 
  dataKey, 
  xKey = 'name',
  title,
  color = '#3b82f6',
  height = 300 
}) => {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface AreaChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  xKey?: string;
  title?: string;
  color?: string;
  height?: number;
}

export const AreaChartComponent: React.FC<AreaChartProps> = ({ 
  data, 
  dataKey, 
  xKey = 'name',
  title,
  color = '#10b981',
  height = 300 
}) => {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface BarChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  xKey?: string;
  title?: string;
  color?: string;
  height?: number;
}

export const BarChartComponent: React.FC<BarChartProps> = ({ 
  data, 
  dataKey, 
  xKey = 'name',
  title,
  color = '#8b5cf6',
  height = 300 
}) => {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={dataKey} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface PieChartProps {
  data: ChartDataPoint[];
  dataKey?: string;
  nameKey?: string;
  title?: string;
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const PieChartComponent: React.FC<PieChartProps> = ({ 
  data, 
  dataKey = 'value',
  nameKey = 'name',
  title,
  height = 300,
  colors = DEFAULT_COLORS 
}) => {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
