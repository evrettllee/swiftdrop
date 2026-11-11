import { SearchField } from '@/shared/ui/search-field';
import { Switch } from '@/shared/ui/switch';
import { MANAGER_ZONES_TEXTS as TEXTS } from '../config/texts';

const SEARCH_MAX_LENGTH = 80;

type ZonesToolbarProps = {
  search: string;
  isDisabledShown: boolean;
  onSearchChange: (search: string) => void;
  onDisabledShownChange: (isShown: boolean) => void;
};

export function ZonesToolbar({
  search,
  isDisabledShown,
  onSearchChange,
  onDisabledShownChange,
}: ZonesToolbarProps) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
      <div role="search" className="lg:w-110">
        <SearchField
          value={search}
          label={TEXTS.SEARCH_LABEL}
          placeholder={TEXTS.SEARCH_PLACEHOLDER}
          clearLabel={TEXTS.SEARCH_CLEAR}
          maxLength={SEARCH_MAX_LENGTH}
          onChange={onSearchChange}
        />
      </div>
      <Switch
        isOn={isDisabledShown}
        onChange={onDisabledShownChange}
        className="self-start lg:self-auto"
      >
        {TEXTS.SHOW_DISABLED}
      </Switch>
    </div>
  );
}
