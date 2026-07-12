import { createContext, useContext, useId, useMemo, useState } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type CollapsibleContextValue = {
  contentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsible() {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible components must be used inside Collapsible");
  }
  return context;
}

type CollapsibleProps = HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  className,
  ...props
}: CollapsibleProps) {
  const contentId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const value = useMemo<CollapsibleContextValue>(
    () => ({
      contentId,
      open: isOpen,
      setOpen: (nextOpen) => {
        if (open === undefined) setInternalOpen(nextOpen);
        onOpenChange?.(nextOpen);
      },
    }),
    [contentId, isOpen, onOpenChange, open],
  );

  return (
    <CollapsibleContext.Provider value={value}>
      <div className={className} data-state={isOpen ? "open" : "closed"} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

type CollapsibleTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function CollapsibleTrigger({ children, className, onClick, ...props }: CollapsibleTriggerProps) {
  const { contentId, open, setOpen } = useCollapsible();

  return (
    <button
      type="button"
      aria-controls={contentId}
      aria-expanded={open}
      className={className}
      data-state={open ? "open" : "closed"}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(!open);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function CollapsibleContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { contentId, open } = useCollapsible();

  return (
    <div
      id={contentId}
      className={cn(
        "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
      data-state={open ? "open" : "closed"}
      aria-hidden={!open}
      {...props}
    >
      <div className="min-h-0">{children}</div>
    </div>
  );
}
