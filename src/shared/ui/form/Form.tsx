import React from 'react';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  className?: string;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ children, className = '', ...props }, ref) => (
    <form 
      ref={ref} 
      className={`w-full flex flex-col gap-4 ${className}`}
      {...props}
    >
      {children}
    </form>
  )
);

export default Form;
