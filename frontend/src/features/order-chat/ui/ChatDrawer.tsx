import { type ReactNode, useEffect, useRef } from 'react';
import { useEscapeKey } from '@/shared/lib/dom';
import { ChatHeader, type ChatPerson } from './ChatHeader';
import { ChatCloseButton } from './ChatHeaderButtons';

type ChatDrawerProps = {
  id: string;
  label: string;
  person: ChatPerson;
  call: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

export function ChatDrawer({ id, label, person, call, onClose, children }: ChatDrawerProps) {
  const drawer = useRef<HTMLElement>(null);

  useEscapeKey(onClose, true);

  useEffect(() => {
    drawer.current?.focus();
  }, []);

  return (
    <aside
      ref={drawer}
      id={id}
      role="dialog"
      aria-modal="false"
      aria-label={label}
      tabIndex={-1}
      className="fixed inset-y-0 end-0 z-30 flex w-100 flex-col bg-surface shadow-lg dark:border-s dark:border-border dark:bg-surface-muted outline-none"
    >
      <ChatHeader
        person={person}
        titleLevel="h2"
        end={
          <>
            {call}
            <ChatCloseButton onClose={onClose} />
          </>
        }
      />
      {children}
    </aside>
  );
}
