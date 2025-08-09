import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Dialog: React.FC<DialogProps> = ({ children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange = onOpenChange || setInternalOpen;

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, asChild, ...props }) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogTrigger must be used within Dialog');

  const handleClick = () => {
    context.onOpenChange(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick,
    });
  }

  return (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  );
};

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children, className, ...props }) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogContent must be used within Dialog');

  if (!context.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => context.onOpenChange(false)}
      />
      
      {/* Content */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg mx-4 bg-background rounded-lg border shadow-lg",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0", className)}
    {...props}
  >
    {children}
  </div>
);

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className, ...props }) => (
  <h2
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h2>
);