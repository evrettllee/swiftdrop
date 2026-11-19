import { ADMIN_SEARCH_MAX_LENGTH } from '../config/admin-user';
import { FilterChip } from '@/shared/ui/chip';
import { Button } from '@/shared/ui/button';
import { SearchField } from '@/shared/ui/search-field';
import type { UsersParams } from '../config/list-params';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';
import { type AppliedFilter, FILTERS_RESET } from '../model/users-view';
import { FiltersControl } from './FiltersControl';
import { SortSelect } from './SortSelect';

type UsersToolbarProps = {
  values: UsersParams;
  isDesktop: boolean;
  searchText: string;
  filters: readonly AppliedFilter[];
  onSearchChange: (text: string) => void;
  onChange: (patch: Partial<UsersParams>) => void;
};

export function UsersToolbar({
  values,
  isDesktop,
  searchText,
  filters,
  onSearchChange,
  onChange,
}: UsersToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <SearchField
          value={searchText}
          label={TEXTS.SEARCH_LABEL}
          placeholder={TEXTS.SEARCH}
          clearLabel={TEXTS.SEARCH_CLEAR}
          maxLength={ADMIN_SEARCH_MAX_LENGTH}
          className="lg:max-w-110 lg:grow"
          onChange={onSearchChange}
        />
        <div className="flex gap-3 lg:contents">
          <FiltersControl values={values} isDesktop={isDesktop} onApply={onChange} />
          <SortSelect
            isDesktop={isDesktop}
            value={values.sort}
            onChange={(sort) => onChange({ sort })}
          />
        </div>
      </div>
      {filters.length === 0 ? null : (
        <div
          role="group"
          aria-label={TEXTS.APPLIED_FILTERS}
          className="flex flex-wrap items-center gap-2"
        >
          {filters.map((filter) => (
            <FilterChip
              key={filter.id}
              name={filter.name}
              value={filter.value}
              removeLabel={TEXTS.removeFilter(filter.name, filter.value)}
              onRemove={() => onChange(filter.reset)}
            />
          ))}
          <div className="shrink-0 [&>button]:min-h-11 [&>button]:px-2 [&>button]:text-small lg:[&>button]:min-h-9">
            <Button variant="text" onClick={() => onChange(FILTERS_RESET)}>
              {TEXTS.RESET_ALL}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
