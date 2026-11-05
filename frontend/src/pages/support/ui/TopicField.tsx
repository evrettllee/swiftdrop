import { useId } from 'react';
import type { SupportTopic } from '@/shared/support-api';
import { RadioCard } from '@/shared/ui/radio-card';
import { NEW_TICKET_TEXTS, type TopicOption } from '../config/new-ticket';

type TopicFieldProps = {
  topics: readonly TopicOption[];
  value: SupportTopic;
  onChange: (topic: SupportTopic) => void;
};

export function TopicField({ topics, value, onChange }: TopicFieldProps) {
  const name = useId();

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-caption tracking-caps text-fg-secondary uppercase">
        {NEW_TICKET_TEXTS.TOPIC}
      </legend>
      <div className="grid gap-2 lg:grid-cols-2">
        {topics.map((option) => (
          <RadioCard
            key={option.topic}
            name={name}
            density="centered"
            value={option.topic}
            checked={option.topic === value}
            onChange={() => onChange(option.topic)}
            title={option.title}
            description={option.hint}
          />
        ))}
      </div>
    </fieldset>
  );
}
