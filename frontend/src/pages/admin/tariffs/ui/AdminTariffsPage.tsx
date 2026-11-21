import { PlusIcon } from '@phosphor-icons/react';
import { DESKTOP_MEDIA_QUERY, ICON_SIZE, ICON_WEIGHT, LIST_STATUS } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { Button } from '@/shared/ui/button';
import { placePrimaryAction, usePrimaryActionPlace } from '@/shared/ui/empty-state';
import { PageTitle } from '@/shared/ui/page-title';
import { ADMIN_TARIFFS_TEXTS as TEXTS } from '../config/texts';
import { useTariffEdit } from '../model/useTariffEdit';
import { useTariffStatus } from '../model/useTariffStatus';
import { useTariffs } from '../model/useTariffs';
import { OffDialog } from './OffDialog';
import { TariffCards } from './TariffCards';
import { TariffSheet } from './TariffSheet';
import { TariffsTable } from './TariffsTable';
import { TariffsEmpty, TariffsFailed, TariffsSkeleton } from './TariffsStates';

const ADD_ICON = <PlusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />;

export function AdminTariffsPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const tariffs = useTariffs();
  const edit = useTariffEdit({
    items: tariffs.items,
    onCreated: tariffs.prepend,
    onSaved: tariffs.replace,
  });
  const status = useTariffStatus(tariffs.replace);
  const isLoading = tariffs.status === LIST_STATUS.LOADING;
  const hasItems = tariffs.items.length > 0;
  const isEmpty = tariffs.status === LIST_STATUS.READY && !hasItems && edit.target === null;
  const place = usePrimaryActionPlace({ isLoading, isEmpty });
  const add = (
    <Button icon={ADD_ICON} disabled={edit.target !== null} onClick={edit.startNew}>
      {TEXTS.NEW}
    </Button>
  );
  const placed = placePrimaryAction(add, place);
  let content = isDesktop ? (
    <TariffsTable items={tariffs.items} edit={edit} status={status} />
  ) : (
    <TariffCards items={tariffs.items} edit={edit} status={status} />
  );

  if (!hasItems && edit.target === null) {
    if (isLoading) {
      content = <TariffsSkeleton />;
    } else if (tariffs.status === LIST_STATUS.ERROR) {
      content = <TariffsFailed onRetry={tariffs.retry} />;
    } else {
      content = <TariffsEmpty action={placed.empty} />;
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3 lg:gap-y-1">
        <PageTitle>{TEXTS.TITLE}</PageTitle>
        <div className="lg:row-span-2 lg:self-center">{placed.header}</div>
        <p className="col-span-2 text-small text-pretty text-fg-secondary lg:col-span-1">
          {TEXTS.SUBTITLE}
        </p>
      </header>
      {content}
      {isDesktop || edit.target === null ? null : <TariffSheet edit={edit} />}
      <OffDialog
        tariff={status.confirming}
        onConfirm={status.confirmOff}
        onCancel={status.cancelOff}
      />
    </div>
  );
}
