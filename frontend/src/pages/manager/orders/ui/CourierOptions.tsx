import type { CourierLookupItem } from '@/shared/staff-api';
import { FILTER_TEXTS } from '../config/texts';
import { courierOptionId } from '../model/useCourierCombobox';

type CourierOptionsProps = {
  listId: string;
  items: readonly CourierLookupItem[];
  active: number;
  isShown: boolean;
  onChoose: (item: CourierLookupItem) => void;
};

export function CourierOptions({ listId, items, active, isShown, onChoose }: CourierOptionsProps) {
  return (
    <ul
      id={listId}
      role="listbox"
      aria-label={FILTER_TEXTS.COURIER}
      hidden={!isShown || items.length === 0}
      className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-border-elevated bg-surface-elevated py-1 shadow-lg"
    >
      {items.map((item, index) => (
        <li
          key={item.courierId}
          id={courierOptionId(listId, index)}
          role="option"
          aria-selected={index === active}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => onChoose(item)}
          className={`flex min-h-11 cursor-pointer items-center px-3 text-body ${index === active ? 'bg-selected text-accent' : 'text-fg hover:bg-surface-muted'}`}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
}
