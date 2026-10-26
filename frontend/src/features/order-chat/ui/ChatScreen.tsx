import { type ReactNode, useEffect, useRef } from 'react';
import { useBodyScrollLock } from '@/shared/lib/dom';
import { ChatHeader, type ChatPerson } from './ChatHeader';
import { ChatBackButton } from './ChatHeaderButtons';

type ChatScreenProps = {
  id: string;
  label: string;
  person: ChatPerson;
  call: ReactNode;
  onBack: () => void;
  children: ReactNode;
};

export function ChatScreen({ id, label, person, call, onBack, children }: ChatScreenProps) {
  const screen = useRef<HTMLElement>(null);

  useBodyScrollLock(true);

  useEffect(() => {
    screen.current?.querySelector('h1')?.focus();
  }, []);

  return (
    <section
      ref={screen}
      id={id}
      aria-label={label}
      className="fixed inset-x-0 top-14 bottom-0 z-20 flex flex-col bg-page"
    >
      <ChatHeader
        person={person}
        titleLevel="h1"
        start={<ChatBackButton onBack={onBack} />}
        end={call}
      />
      {children}
    </section>
  );
}
