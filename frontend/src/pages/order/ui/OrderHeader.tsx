import { ArrowLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { formatOrderNumber, OrderStatusBadge } from '@/entities/order';
import type { OrderDetails } from '@/shared/api';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatFullDateTime, formatShortDateTime } from '@/shared/lib/format';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { PageTitle } from '@/shared/ui/page-title';
import { ORDER_DETAILS_TEXTS } from '../config/texts';

type OrderHeaderProps = {
  order: OrderDetails;
};

// The desktop shows the breadcrumbs and the full date under the title, a phone shows the back
// button above the title and the status with the short date under it.
export function OrderHeader({ order }: OrderHeaderProps) {
  const orderNumber = formatOrderNumber(order.orderId);

  return (
    <header className="flex flex-col gap-2 lg:gap-4">
      <nav
        aria-label={ORDER_DETAILS_TEXTS.BREADCRUMBS_LABEL}
        className="hidden items-center gap-1 text-small lg:flex"
      >
        <Link
          to={APP_ROUTES.ORDERS}
          className={`rounded-sm text-fg-secondary hover:text-fg ${COLOR_TRANSITION_CLASS}`}
        >
          {ORDER_DETAILS_TEXTS.ORDERS}
        </Link>
        <CaretRightIcon
          size={ICON_SIZE.SMALL}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="text-fg-secondary"
        />
        <span aria-current="page" className="tabular-nums">
          {orderNumber}
        </span>
      </nav>
      <div className="-ms-4 self-start lg:hidden">
        <LinkButton
          variant="text"
          to={APP_ROUTES.ORDERS}
          icon={<ArrowLeftIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
        >
          {ORDER_DETAILS_TEXTS.BACK_TO_ORDERS}
        </LinkButton>
      </div>
      <div className="flex flex-wrap items-baseline gap-4">
        <PageTitle className="tabular-nums">{ORDER_DETAILS_TEXTS.title(orderNumber)}</PageTitle>
        <span className="hidden lg:inline-flex">
          <OrderStatusBadge status={order.status} />
        </span>
      </div>
      <p className="hidden text-small text-fg-secondary tabular-nums lg:block">
        {ORDER_DETAILS_TEXTS.createdAt(formatFullDateTime(order.createdAt))}
      </p>
      <div className="flex items-center justify-between gap-4 lg:hidden">
        <OrderStatusBadge status={order.status} />
        <span className="text-small text-fg-secondary tabular-nums">
          {formatShortDateTime(order.createdAt)}
        </span>
      </div>
    </header>
  );
}
