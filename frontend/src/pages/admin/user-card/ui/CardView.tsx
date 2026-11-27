import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import type { AdminUserCard } from '../api/admin-user-card';
import { managementGroups, stateAlert } from '../lib/card-view';
import { useCardDialog } from '../model/useCardDialog';
import { CardHeader } from './CardHeader';
import { CardStateAlert } from './CardStateAlert';
import { ContactsPanel } from './ContactsPanel';
import { CardDialogs } from './dialogs/CardDialogs';
import { HistoryPanel } from './HistoryPanel';
import { ManagePanel } from './ManagePanel';
import { OrdersPanel } from './OrdersPanel';
import { WorkPanel } from './WorkPanel';

type CardViewProps = {
  card: AdminUserCard;
  onCard: (card: AdminUserCard) => void;
  onReload: () => void;
};

export function CardView({ card, onCard, onReload }: CardViewProps) {
  const [searchParams] = useSearchParams();
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const [now] = useState(() => new Date());
  const dialog = useCardDialog();
  const alert = stateAlert(card);
  const groups = managementGroups(card);

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <CardHeader card={card} listSearch={searchParams.toString()} />
      {alert === null ? null : <CardStateAlert alert={alert} />}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          <ContactsPanel card={card} now={now} />
          {card.courier === null ? null : <WorkPanel courier={card.courier} />}
          <OrdersPanel card={card} isDesktop={isDesktop} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          {groups.length === 0 ? null : <ManagePanel groups={groups} onAction={dialog.open} />}
          <HistoryPanel history={card.history} />
        </div>
      </div>
      <CardDialogs
        card={card}
        shown={dialog.shown}
        isOpen={dialog.isOpen}
        opening={dialog.opening}
        onClose={dialog.close}
        onCard={onCard}
        onReload={onReload}
      />
    </div>
  );
}
