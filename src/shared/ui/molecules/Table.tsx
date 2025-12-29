import React from 'react';

export interface TableColumn<T = any> {
  /** Unique identifier for the column */
  key: string;
  /** Header label */
  label: string | React.ReactNode;
  /** Render function for cell content */
  render?: (value: any, row: T, index: number) => React.ReactNode;
  /** Whether column can be sorted */
  sortable?: boolean;
  /** Column width class (e.g., 'w-1/4') */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T = any> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Table data rows */
  data: T[];
  /** Optional empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
  /** Optional row click handler */
  onRowClick?: (row: T, index: number) => void;
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = 'No data available',
  className = '',
  onRowClick,
}: TableProps<T>) {
  const getCellValue = (column: TableColumn<T>, row: T) => {
    if (column.render) {
      return column.render(row[column.key], row, data.indexOf(row));
    }
    return row[column.key] ?? '';
  };

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div className={`overflow-x-auto border border-black dark:border-white ${className}`}>
      <table className="min-w-full">
        <thead className="bg-white dark:bg-black border-b border-black dark:border-white">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`
                  px-2 py-2 lg:px-6 lg:py-3 text-xs font-bold uppercase tracking-wider
                  text-black dark:text-white
                  border-r border-black dark:border-white last:border-r-0
                  ${getAlignClass(column.align)}
                  ${column.width || ''}
                `}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-black">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-2 py-8 lg:px-6 lg:py-12 text-xs lg:text-sm text-black dark:text-white font-light text-center">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={`
                  border-b border-black dark:border-white last:border-b-0
                  transition-colors
                  ${onRowClick ? 'cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black' : ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      px-2 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-xs lg:text-sm
                      text-black dark:text-white font-light
                      border-r border-black dark:border-white last:border-r-0
                      ${getAlignClass(column.align)}
                    `}
                  >
                    {getCellValue(column, row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

