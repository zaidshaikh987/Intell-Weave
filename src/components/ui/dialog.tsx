import React from 'react';

export const DialogContext = React.createContext<{open: boolean; setOpen: (v:boolean)=>void} | null>(null);

export const Dialog: React.FC<{ open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }>
  = ({ open, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = React.useState(!!open);
  const isControlled = typeof open === 'boolean';
  const value = {
    open: isControlled ? !!open : internalOpen,
    setOpen: (v: boolean) => {
      if (isControlled) onOpenChange?.(v);
      else setInternalOpen(v);
      onOpenChange?.(v);
    },
  };
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
};

export const DialogTrigger: React.FC<{ asChild?: boolean; children: React.ReactElement }>
  = ({ children }) => {
  const ctx = React.useContext(DialogContext)!;
  return React.cloneElement(children, { onClick: () => ctx.setOpen(true) });
};

export const DialogContent: React.FC<{ className?: string; children: React.ReactNode }>
  = ({ className, children }) => {
  const ctx = React.useContext(DialogContext)!;
  if (!ctx.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`max-h-[90vh] w-[90vw] max-w-2xl overflow-auto rounded-md bg-white p-4 ${className||''}`}>
        {children}
      </div>
      <button aria-label="Close" className="absolute inset-0" onClick={() => ctx.setOpen(false)} />
    </div>
  );
};

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props} />
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => (
  <h3 className="text-lg font-semibold" {...props} />
);
