import React from 'react';
import clsx from 'classnames';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={clsx('w-full border border-gray-300 rounded-md px-3 py-2', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export default Textarea;
