import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const EmptyState = ({ icon, children, className = '' }: EmptyStateProps) => (
  <div className={`flex flex-col gap-6 items-center text-textColor dark:text-white justify-center ${className}`}>
    <div className="text-5xl">
      {icon}
    </div>
    <div className="text-xl text-center font-semibold">
      {children}
    </div>
  </div>
);

export default EmptyState;
