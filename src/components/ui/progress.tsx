import React from 'react';
import clsx from 'classnames';

type ProgressProps = {
  value?: number; // 0-100
  className?: string;
};

export const Progress: React.FC<ProgressProps> = ({ value = 0, className }) => (
  <div className={clsx('w-full h-2 bg-gray-200 rounded-md overflow-hidden', className)}>
    <div
      className="h-full bg-emerald-600 transition-[width] duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export default Progress;
