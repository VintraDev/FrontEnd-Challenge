import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export function DialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-background/75" />
      <DialogPrimitive.Content
        className={cn(
          'dialog-content fixed top-1/2 left-1/2 z-51 max-h-[calc(100dvh-var(--space-8))] w-[min(500px,calc(100vw-var(--space-8)))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-surface text-foreground',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="dialog-close absolute top-4 right-4 cursor-pointer text-primary-hover max-[700px]:top-[calc(var(--space-4)+env(safe-area-inset-top))] max-[700px]:grid max-[700px]:size-11 max-[700px]:place-items-center"
          aria-label="Fechar"
        >
          <X size={20} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
