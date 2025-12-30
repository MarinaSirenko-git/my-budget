import React from 'react';

interface EmptyStateProps {
  children: React.ReactNode;
  className?: string;
}

const EmptyState = ({ children, className = '' }: EmptyStateProps) => (
  <div className={`flex flex-col gap-8 items-center text-black dark:text-white justify-center ${className}`}>
    <div className="text-base lg:text-lg text-center font-mono uppercase tracking-wide max-w-md">
      {children}
    </div>
  </div>
);

export default EmptyState;
