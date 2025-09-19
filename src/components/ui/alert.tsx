import React from 'react';
import clsx from 'classnames';

export const Alert: React.FC<React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' }>
  = ({ className, variant = 'default', ...props }) => (
  <div className={clsx('rounded-md border p-4', variant === 'destructive' ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-300 bg-gray-50', className)} {...props} />
);

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={clsx('text-sm', className)} {...props} />
);

export default Alert;
