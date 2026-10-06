import { ADDRESS_FIELD_TEXTS } from '../constants';
import type { AddressSuggestion } from '../types';

type AddressSuggestionsProps = {
  listboxId: string;
  label: string;
  suggestions: AddressSuggestion[];
  activeIndex: number;
  // `false` when the search found nothing: the popup then tells about it instead of the list.
  isListShown: boolean;
  getOptionId: (index: number) => string;
  onSelect: (suggestion: AddressSuggestion) => void;
  onActivate: (index: number) => void;
};

export function AddressSuggestions({
  listboxId,
  label,
  suggestions,
  activeIndex,
  isListShown,
  getOptionId,
  onSelect,
  onActivate,
}: AddressSuggestionsProps) {
  return (
    // The mouse must not take the focus from the field, or the list would close before the click.
    <div
      onMouseDown={(event) => event.preventDefault()}
      className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-auto rounded-md border border-border-elevated bg-surface-elevated py-1 shadow-lg"
    >
      {isListShown ? (
        <ul id={listboxId} role="listbox" aria-label={label}>
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={getOptionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => onActivate(index)}
              className={`flex min-h-11 cursor-pointer flex-col justify-center px-4 py-2 ${
                index === activeIndex ? 'bg-selected' : ''
              }`}
            >
              <span className="text-body">{suggestion.name}</span>
              <span className="text-small text-fg-secondary">{suggestion.details}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-small text-fg-secondary">{ADDRESS_FIELD_TEXTS.NO_RESULTS}</p>
      )}
    </div>
  );
}
