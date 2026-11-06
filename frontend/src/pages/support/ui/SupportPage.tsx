import { ArrowLeftIcon, PlusIcon } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useAppSocket } from '@/shared/realtime';
import { getSupportTicketPath } from '@/shared/routes';
import { SUPPORT_TICKET_STATUS } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { placePrimaryAction, usePrimaryActionPlace } from '@/shared/ui/empty-state';
import { PageTitle } from '@/shared/ui/page-title';
import { TabPanel, Tabs } from '@/shared/ui/tabs';
import { showToast } from '@/shared/ui/toast';
import { NEW_TICKET_TEXTS } from '../config/new-ticket';
import { SUPPORT_TEXTS, TAB_LABELS } from '../config/texts';
import { useMyTickets } from '../model/useMyTickets';
import { useSupportParams } from '../model/useSupportParams';
import { useSupportRole } from '../model/useSupportRole';
import { NewTicketDialog } from './NewTicketDialog';
import { TicketList } from './TicketList';

const TABS_ID = 'support-tabs';
const STATUSES = [SUPPORT_TICKET_STATUS.OPEN, SUPPORT_TICKET_STATUS.CLOSED] as const;
const PLUS = <PlusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />;

export function SupportPage() {
  useAppSocket();
  const role = useSupportRole();
  const params = useSupportParams();
  const tickets = useMyTickets(params.status);
  const navigate = useNavigate();
  const newButton = (fullWidth: boolean) => (
    <Button icon={PLUS} fullWidth={fullWidth} onClick={params.openNew}>
      {SUPPORT_TEXTS.NEW}
    </Button>
  );
  const list = {
    isLoading: tickets.first.data === null,
    isEmpty: tickets.items.length === 0,
    hasEmptyAction: params.status === SUPPORT_TICKET_STATUS.OPEN,
  };
  const newPlace = usePrimaryActionPlace(list);
  const desktopNew = placePrimaryAction(newButton(false), newPlace);
  const phoneNew = placePrimaryAction(newButton(true), newPlace);
  const tabs = STATUSES.map((id) => ({ id, label: TAB_LABELS[id], count: tickets.counts[id] }));
  const goToTicket = (ticketId: number) =>
    void navigate(getSupportTicketPath(role.supportPath, ticketId), { replace: true });

  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      <Link
        to={role.profilePath}
        className={`-ms-1 inline-flex min-h-11 items-center gap-2 self-start rounded-sm px-1 font-semibold text-accent lg:hidden ${COLOR_TRANSITION_CLASS}`}
      >
        <ArrowLeftIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        {SUPPORT_TEXTS.PROFILE}
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <PageTitle>{SUPPORT_TEXTS.TITLE}</PageTitle>
        {desktopNew.header === null ? null : (
          <div className="hidden lg:block">{desktopNew.header}</div>
        )}
      </header>
      {phoneNew.header === null ? null : <div className="lg:hidden">{phoneNew.header}</div>}
      <div className="flex flex-col gap-4 lg:gap-6">
        <Tabs
          layout="fit"
          tabs={tabs}
          value={params.status}
          onChange={params.setStatus}
          label={SUPPORT_TEXTS.TABS}
          idPrefix={TABS_ID}
        />
        {STATUSES.map((id) => (
          <TabPanel key={id} idPrefix={TABS_ID} id={id} activeId={params.status}>
            <TicketList
              status={id}
              tickets={tickets}
              supportPath={role.supportPath}
              newButton={desktopNew.empty}
            />
          </TabPanel>
        ))}
      </div>
      {params.isNewOpen ? (
        <NewTicketDialog
          role={role}
          initialOrderId={params.orderId}
          onClose={params.closeNew}
          onCreated={goToTicket}
          onAlreadyOpen={(ticketId) => {
            showToast({
              key: `support-open:${ticketId}`,
              variant: 'info',
              title: NEW_TICKET_TEXTS.ALREADY_OPEN,
              text: '',
            });
            goToTicket(ticketId);
          }}
        />
      ) : null}
    </div>
  );
}
