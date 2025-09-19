import React from 'react';
import clsx from 'classnames';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'icon';
  className?: string;
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99]';
  const variants = {
    default: 'bg-black text-white hover:bg-gray-800 focus-visible:ring-black ring-offset-white',
    outline: 'bg-white text-black border border-black hover:bg-gray-50 focus-visible:ring-black ring-offset-white',
    ghost: 'bg-transparent hover:bg-gray-100 focus-visible:ring-gray-300 ring-offset-white'
  } as const;
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    icon: 'h-10 w-10 p-0'
  } as const;
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
};

export default Button;
