import React from 'react';
import clsx from 'classnames';

export const Avatar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={clsx('inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700', className)} {...props}>
    {children}
  </div>
);

export const AvatarFallback: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={clsx('text-sm font-medium', className)} {...props} />
);

export default Avatar;
