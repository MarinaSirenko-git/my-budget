import React, { useMemo, useState, useEffect } from 'react';
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

// Monochrome colors: soft gray shades
const DEFAULT_COLORS = [
  '#E5E5E5', // very light gray
  '#D0D0D0', // light gray
  '#B0B0B0', // medium-light gray
  '#909090', // medium gray
  '#707070', // medium-dark gray
  '#505050', // dark gray
  '#C5C5C5', // light-medium gray
  '#A5A5A5', // medium-light gray
  '#858585', // medium gray
  '#656565', // medium-dark gray
];

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  showLegend = true,
  showTooltip = true,
  outerRadius = '100%',
  innerRadius = 0,
  labelLine = false,
  label = false,
  className = '',
}) => {
  const [chartHeight, setChartHeight] = useState(300);
  const [legendHeight, setLegendHeight] = useState(36);
  const [legendFontSize, setLegendFontSize] = useState('14px');

  useEffect(() => {
    const updateSizes = () => {
      const isDesktop = window.innerWidth >= 1024;
      setChartHeight(isDesktop ? 300 : 250);
      setLegendHeight(isDesktop ? 36 : 28);
      setLegendFontSize(isDesktop ? '14px' : '12px');
    };
    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  // Generate colors for data items that don't have custom colors
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  // Calculate total for percentage calculation
  const total = useMemo(() => {
    return dataWithColors.reduce((sum, item) => sum + item.value, 0);
  }, [dataWithColors]);

  // Calculate rounded percentages that sum to 100% using Largest Remainder Method
  const percentages = useMemo(() => {
    if (total === 0 || dataWithColors.length === 0) {
      return new Map<string, number>();
    }

    // Calculate exact percentages and floor values
    const items = dataWithColors.map((item, index) => {
      const exactPercent = (item.value / total) * 100;
      const floorPercent = Math.floor(exactPercent);
      const remainder = exactPercent - floorPercent;
      return {
        index,
        name: item.name,
        exactPercent,
        floorPercent,
        remainder,
      };
    });

    // Calculate sum of floor values
    const floorSum = items.reduce((sum, item) => sum + item.floorPercent, 0);
    const difference = 100 - floorSum;

    // Sort by remainder in descending order
    const sortedItems = [...items].sort((a, b) => b.remainder - a.remainder);

    // Add 1 to the items with largest remainders to make sum = 100
    const result = new Map<string, number>();
    items.forEach((item) => {
      const sortedIndex = sortedItems.findIndex((si) => si.index === item.index);
      if (sortedIndex < difference) {
        result.set(item.name, item.floorPercent + 1);
      } else {
        result.set(item.name, item.floorPercent);
      }
    });

    return result;
  }, [dataWithColors, total]);

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
      const percentage = percentages.get(data.name) ?? 0;
      return (
        <div className="bg-white dark:bg-black border border-black dark:border-white p-2 lg:p-3">
          <p className="text-xs lg:text-sm font-bold text-black dark:text-white">
            {data.name}
          </p>
          <p className="text-xs lg:text-sm font-light text-black dark:text-white">
            {typeof data.value === 'number' 
              ? data.value.toLocaleString() 
              : data.value}
          </p>
          <p className="text-xs lg:text-sm font-light text-black dark:text-white">
            {percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-base lg:text-lg font-bold text-black dark:text-white mb-2 lg:mb-4 text-center tracking-tight">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsPieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={labelLine}
            label={label ? (renderLabel as any) : false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#909090"
            dataKey="value"
            stroke="#000000"
            strokeWidth={1}
          >
            {dataWithColors.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                stroke="#000000"
                strokeWidth={1}
              />
            ))}
          </Pie>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={legendHeight}
              wrapperStyle={{ fontSize: legendFontSize }}
              formatter={(value, entry: any) => {
                const percentage = percentages.get(entry.payload.name) ?? 0;
                return (
                  <span className="text-black dark:text-white text-xs lg:text-sm font-light">
                    {value} {percentage}%
                  </span>
                );
              }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;

