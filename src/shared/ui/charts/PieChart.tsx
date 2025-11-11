import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  /** Chart data */
  data: PieChartData[];
  /** Chart title */
  title?: string;
  /** Whether to show legend */
  showLegend?: boolean;
  /** Whether to show tooltip */
  showTooltip?: boolean;
  /** Outer radius of the pie (percentage or pixel value) */
  outerRadius?: number | string;
  /** Inner radius for donut chart (percentage or pixel value) */
  innerRadius?: number | string;
  /** Label line */
  labelLine?: boolean;
  /** Label */
  label?: boolean | ((entry: any) => string);
  /** Additional CSS classes */
  className?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  showLegend = true,
  showTooltip = true,
  outerRadius = '80%',
  innerRadius = 0,
  labelLine = false,
  label = false,
  className = '',
}) => {
  // Generate colors for data items that don't have custom colors
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const renderLabel = (entry: PieChartData) => {
    if (typeof label === 'function') {
      return label(entry);
    }
    if (label === true) {
      return entry.name;
    }
    return null;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-cardColor dark:bg-cardColor border border-borderColor dark:border-borderColor rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-mainTextColor dark:text-mainTextColor">
            {data.name}
          </p>
          <p className="text-sm text-textColor dark:text-textColor">
            {typeof data.value === 'number' 
              ? data.value.toLocaleString() 
              : data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor mb-4 text-center">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <RechartsPieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={labelLine}
            label={label ? renderLabel : false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-mainTextColor dark:text-mainTextColor text-sm">
                  {value}
                </span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;

