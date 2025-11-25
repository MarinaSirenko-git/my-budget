import React from 'react';

interface LoadingStateProps {
  message: string;
  className?: string;
}

const LoadingState = ({ message, className = '' }: LoadingStateProps) => (
  <div className={`flex h-full items-center justify-center min-h-[calc(100vh-100px)] ${className}`}>
    <div className="text-textColor dark:text-textColor">{message}</div>
  </div>
);

export default LoadingState;

