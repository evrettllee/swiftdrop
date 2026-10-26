import type { ReactNode } from 'react';
import { Avatar } from '@/shared/ui/avatar';

export type ChatPerson = {
  initials: string;
  name: string;
  details: string;
};

type ChatHeaderProps = {
  person: ChatPerson;
  start?: ReactNode;
  end?: ReactNode;
  titleLevel: 'h1' | 'h2';
};

export function ChatHeader({ person, start, end, titleLevel: Title }: ChatHeaderProps) {
  return (
    <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border bg-surface py-2 ps-1 pe-3 lg:bg-transparent lg:py-3 lg:ps-6">
      {start}
      <Avatar initials={person.initials} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Title tabIndex={-1} className="truncate text-body font-semibold outline-none">
          {person.name}
        </Title>
        <span className="truncate text-small text-fg-secondary tabular-nums">{person.details}</span>
      </div>
      {end}
    </div>
  );
}
