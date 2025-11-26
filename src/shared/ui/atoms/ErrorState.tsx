import React from 'react';

interface ErrorStateProps {
  message: string;
  className?: string;
}

const ErrorState = ({ message, className = '' }: ErrorStateProps) => (
  <div className={`flex h-full items-center justify-center min-h-[calc(100vh-100px)] ${className}`}>
    <div className="text-accentRed dark:text-accentRed">{message}</div>
  </div>
);

export default ErrorState;


