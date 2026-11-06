import type { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type UnavailableActionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  description?: string;
};

export function UnavailableAction({
  title,
  children,
  className,
  description = 'Este conteúdo ainda não está disponível.',
}: UnavailableActionProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className={className}>
          {children}
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
