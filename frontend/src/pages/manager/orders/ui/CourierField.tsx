import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { FILTER_TEXTS } from '../config/texts';
import { courierOptionId, useCourierCombobox } from '../model/useCourierCombobox';
import { CourierOptions } from './CourierOptions';

type ChosenCourier = { courierId: number; name: string };

type CourierFieldProps = {
  courierId: number | null;
  courierName: string | null;
  onChange: (courier: ChosenCourier | null) => void;
};

export function CourierField({ courierId, courierName, onChange }: CourierFieldProps) {
  const id = useId();
  const listId = `${id}-list`;
  const isSelected = courierId !== null;
  const combobox = useCourierCombobox(isSelected, (item) =>
    onChange({ courierId: item.courierId, name: item.name }),
  );
  const activeOption = combobox.items[combobox.active];

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small font-semibold">
        {FILTER_TEXTS.COURIER}
      </label>
      <div className="relative">
        <MagnifyingGlassIcon
          size={ICON_SIZE.MEDIUM}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-fg-secondary"
        />
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={combobox.isShown}
          aria-controls={listId}
          aria-activedescendant={
            combobox.isShown && activeOption !== undefined
              ? courierOptionId(listId, combobox.active)
              : undefined
          }
          autoComplete="off"
          value={
            isSelected ? (courierName ?? FILTER_TEXTS.courierFallback(courierId)) : combobox.text
          }
          readOnly={isSelected}
          placeholder={FILTER_TEXTS.COURIER_PLACEHOLDER}
          onChange={(event) => combobox.onType(event.target.value)}
          onFocus={combobox.open}
          onBlur={combobox.close}
          onKeyDown={combobox.onKeyDown}
          className={`h-11 w-full rounded-sm border border-border bg-surface ps-10 pe-11 text-body text-fg shadow-sm placeholder:text-fg-muted focus:border-accent ${COLOR_TRANSITION_CLASS}`}
        />
        {isSelected ? (
          <button
            type="button"
            aria-label={FILTER_TEXTS.COURIER_CLEAR}
            onClick={() => onChange(null)}
            className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-sm text-fg-secondary hover:text-fg"
          >
            <XIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          </button>
        ) : null}
        <CourierOptions
          listId={listId}
          items={combobox.items}
          active={combobox.active}
          isShown={combobox.isShown}
          onChoose={combobox.choose}
        />
      </div>
      {combobox.message === null ? null : (
        <p role="status" className="text-small text-fg-secondary">
          {combobox.message}
        </p>
      )}
    </div>
  );
}
