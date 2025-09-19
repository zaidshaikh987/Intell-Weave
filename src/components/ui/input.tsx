import React from 'react';
import clsx from 'classnames';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={clsx('w-full border border-gray-300 rounded-md px-3 py-2', className)} {...props} />
));
Input.displayName = 'Input';

export default Input;
