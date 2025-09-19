import React from 'react';
import clsx from 'classnames';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'secondary' | 'outline';
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className, ...props }) => {
  const variants = {
    default: 'bg-gray-200 text-gray-800',
    secondary: 'bg-gray-100 text-gray-700',
    outline: 'border border-gray-400 text-gray-700'
  };
  return <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs', variants[variant], className)} {...props} />;
};

export default Badge;
