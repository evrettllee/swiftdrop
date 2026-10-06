import { CaretDownIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import { ID_PART } from '../../../shared/constants/dom';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants/styles';

type FaqItemProps = {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
};

export function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  const id = useId();
  const buttonId = `${id}-${ID_PART.BUTTON}`;
  const panelId = `${id}-${ID_PART.PANEL}`;

  return (
    <div className="border-b border-border">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center justify-between gap-4 py-6 text-start text-heading-sm font-semibold text-fg"
        >
          {question}
          <CaretDownIcon
            size={ICON_SIZE.MEDIUM}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className={`shrink-0 text-fg-secondary transition-transform motion-reduce:transition-none ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
        <p className="-mt-4 max-w-prose pb-6 text-body text-fg-secondary">{answer}</p>
      </div>
    </div>
  );
}
