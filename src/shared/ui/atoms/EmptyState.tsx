import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const EmptyState = ({ icon, children, className = '' }: EmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
    <div className="text-5xl opacity-30 text-gray-500 dark:text-gray-400">
      {icon}
    </div>
    <div className="text-xl text-center opacity-60 font-semibold">
      {children}
    </div>
  </div>
);

export default EmptyState;
