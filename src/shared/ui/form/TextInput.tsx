import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(({ className = '', ...props }, ref) => (
  <input ref={ref} type="text" className={`border rounded px-3 py-2 ${className}`} {...props} />
));

export default TextInput;
