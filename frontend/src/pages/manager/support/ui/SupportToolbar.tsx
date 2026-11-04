import { ArrowsDownUpIcon } from '@phosphor-icons/react';
import { isSearchTooShort, MANAGER_SEARCH_MAX_LENGTH } from '@/shared/staff-api';
import {
  SUPPORT_AUTHOR_ROLE,
  SUPPORT_SORT,
  type SupportAuthorRole,
  type SupportSort,
} from '@/shared/support-api';
import { ToggleChip } from '@/shared/ui/chip';
import { SearchField } from '@/shared/ui/search-field';
import { Select, SELECT_LABEL } from '@/shared/ui/select';
import { MANAGER_SUPPORT_TEXTS as TEXTS, ROLE_CHIPS, SORT_LABELS } from '../config/texts';

const ROLES = [SUPPORT_AUTHOR_ROLE.CLIENT, SUPPORT_AUTHOR_ROLE.COURIER] as const;

const SORT_OPTIONS = Object.values(SUPPORT_SORT).map((sort) => ({
  value: sort,
  label: SORT_LABELS[sort],
}));

type SupportToolbarProps = {
  isDesktop: boolean;
  searchText: string;
  role: SupportAuthorRole | null;
  sort: SupportSort;
  onSearchChange: (text: string) => void;
  onRoleChange: (role: SupportAuthorRole | null) => void;
  onSortChange: (sort: SupportSort) => void;
};

export function SupportToolbar({
  isDesktop,
  searchText,
  role,
  sort,
  onSearchChange,
  onRoleChange,
  onSortChange,
}: SupportToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <SearchField
        value={searchText}
        label={TEXTS.SEARCH_LABEL}
        clearLabel={TEXTS.SEARCH_CLEAR}
        maxLength={MANAGER_SEARCH_MAX_LENGTH}
        hint={isSearchTooShort(searchText) ? TEXTS.SEARCH_TOO_SHORT : null}
        className="lg:max-w-110"
        placeholder={isDesktop ? TEXTS.SEARCH_PLACEHOLDER : TEXTS.SEARCH_PLACEHOLDER_SHORT}
        onChange={onSearchChange}
      />
      <div role="group" aria-label={TEXTS.ROLES} className="flex gap-2 lg:pt-1">
        <ToggleChip
          label={TEXTS.ALL}
          isPressed={role === null}
          onClick={() => onRoleChange(null)}
        />
        {ROLES.map((item) => (
          <ToggleChip
            key={item}
            label={ROLE_CHIPS[item]}
            isPressed={role === item}
            onClick={() => onRoleChange(item)}
          />
        ))}
      </div>
      {isDesktop ? (
        <Select<SupportSort>
          label={TEXTS.SORT}
          labelMode={SELECT_LABEL.HIDDEN}
          icon={ArrowsDownUpIcon}
          options={SORT_OPTIONS}
          value={sort}
          onChange={onSortChange}
          className="lg:ms-auto"
          selectClassName="lg:w-auto lg:field-sizing-content"
        />
      ) : null}
    </div>
  );
}
