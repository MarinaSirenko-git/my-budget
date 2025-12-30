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

  // Mobile card view
  const renderMobileCards = () => {
    if (data.length === 0) {
      return (
        <div className="px-4 py-8 text-sm text-black dark:text-white font-light text-center border border-black dark:border-white">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            onClick={() => onRowClick?.(row, rowIndex)}
            className={`
              border border-black dark:border-white bg-white dark:bg-black p-4
              transition-colors
              ${onRowClick ? 'cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black' : ''}
            `}
          >
            <div className="space-y-2">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={`
                    flex justify-between items-start gap-2
                    ${column.align === 'right' ? 'flex-row-reverse' : ''}
                    ${column.align === 'center' ? 'flex-col items-center text-center' : ''}
                  `}
                >
                  <div className="text-xs font-bold uppercase tracking-wide text-black dark:text-white">
                    {column.label}:
                  </div>
                  <div className={`
                    text-sm font-light text-black dark:text-white
                    ${column.align === 'right' ? 'text-right' : ''}
                    ${column.align === 'center' ? 'text-center' : ''}
                  `}>
                    {getCellValue(column, row)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Mobile Card View */}
      <div className="lg:hidden">
        {renderMobileCards()}
      </div>

      {/* Desktop Table View */}
      <div className={`hidden lg:block overflow-x-auto border border-black dark:border-white`}>
        <table className="min-w-full">
          <thead className="bg-white dark:bg-black border-b border-black dark:border-white">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`
                    px-6 py-3 text-xs font-bold uppercase tracking-wider
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
                <td colSpan={columns.length} className="px-6 py-12 text-sm text-black dark:text-white font-light text-center">
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
                        px-6 py-4 whitespace-nowrap text-sm
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
    </div>
  );
}

export default Table;

