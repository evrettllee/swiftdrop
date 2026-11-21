import { MagnifyingGlassIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useParams } from 'react-router';
import { getAdminUsersPath, USER_ID_PARAM } from '@/shared/routes';
import { Button, LinkButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { USER_CARD_TEXTS as TEXTS } from '../config/texts';
import { CARD_LOAD, useAdminUserCard } from '../model/useAdminUserCard';
import { CardSkeleton } from './CardSkeleton';
import { CardView } from './CardView';

const USER_ID_PATTERN = /^[1-9]\d{0,9}$/;

function parseUserId(raw: string | undefined): number | null {
  return raw !== undefined && USER_ID_PATTERN.test(raw) ? Number(raw) : null;
}

export function AdminUserCardPage() {
  const userId = parseUserId(useParams()[USER_ID_PARAM]);
  const { load, card, reload, replace } = useAdminUserCard(userId);

  if (card !== null) {
    return <CardView card={card} onCard={replace} onReload={reload} />;
  }

  if (load === CARD_LOAD.NOT_FOUND) {
    return (
      <EmptyState icon={MagnifyingGlassIcon} title={TEXTS.NOT_FOUND_TITLE} text={TEXTS.NOT_FOUND_TEXT}>
        <LinkButton variant="secondary" to={getAdminUsersPath()}>
          {TEXTS.BACK_TO_USERS}
        </LinkButton>
      </EmptyState>
    );
  }

  if (load === CARD_LOAD.ERROR) {
    return (
      <div className="flex flex-col items-start gap-4">
        <InlineAlert variant="error" icon={WarningCircleIcon} title={TEXTS.LOAD_FAILED_TITLE}>
          {TEXTS.LOAD_FAILED}
        </InlineAlert>
        <Button variant="secondary" onClick={reload}>
          {TEXTS.RETRY}
        </Button>
      </div>
    );
  }

  return <CardSkeleton />;
}
