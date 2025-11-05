import React from 'react';

export interface TableColumn<T = any> {
  /** Unique identifier for the column */
  key: string;
  /** Header label */
  label: string;
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
    <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`
                  px-6 py-3 text-xs font-medium uppercase tracking-wider
                  text-gray-500 dark:text-gray-400
                  ${getAlignClass(column.align)}
                  ${column.width || ''}
                `}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={`
                  transition-colors
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      px-6 py-4 whitespace-nowrap text-sm
                      text-gray-900 dark:text-gray-100
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

