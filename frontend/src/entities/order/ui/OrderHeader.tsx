import { ArrowLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { memo } from 'react';
import { Link } from 'react-router';
import type { OrderStatus } from '@/shared/api';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatFullDateTime, formatShortDateTime } from '@/shared/lib/format';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { PageTitle } from '@/shared/ui/page-title';
import { ORDER_HEADER_TEXTS } from '../config/texts';
import { formatOrderNumber } from '../lib/order-number';
import { STATUS_AUDIENCE, type StatusAudience } from '../model/order-status';
import { OrderStatusBadge } from './OrderStatusBadge';

type OrderHeaderProps = {
  orderId: number;
  status: OrderStatus;
  createdAt: Date;
  ordersPath?: string;
  audience?: StatusAudience;
};

export const OrderHeader = memo(function OrderHeader({
  orderId,
  status,
  createdAt,
  ordersPath = APP_ROUTES.ORDERS,
  audience = STATUS_AUDIENCE.CLIENT,
}: OrderHeaderProps) {
  const orderNumber = formatOrderNumber(orderId);

  return (
    <header className="flex flex-col gap-2 lg:gap-4">
      <nav
        aria-label={ORDER_HEADER_TEXTS.BREADCRUMBS_LABEL}
        className="hidden items-center gap-1 text-small lg:flex"
      >
        <Link
          to={ordersPath}
          className={`rounded-sm text-fg-secondary hover:text-fg ${COLOR_TRANSITION_CLASS}`}
        >
          {ORDER_HEADER_TEXTS.ORDERS}
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
          to={ordersPath}
          icon={<ArrowLeftIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
        >
          {ORDER_HEADER_TEXTS.BACK_TO_ORDERS}
        </LinkButton>
      </div>
      <div className="flex flex-wrap items-baseline gap-4">
        <PageTitle className="tabular-nums">{ORDER_HEADER_TEXTS.title(orderNumber)}</PageTitle>
        <span role="status" className="hidden lg:inline-flex">
          <OrderStatusBadge status={status} audience={audience} />
        </span>
      </div>
      <p className="hidden text-small text-fg-secondary tabular-nums lg:block">
        {ORDER_HEADER_TEXTS.createdAt(formatFullDateTime(createdAt))}
      </p>
      <div className="flex items-center justify-between gap-4 lg:hidden">
        <span role="status">
          <OrderStatusBadge status={status} audience={audience} />
        </span>
        <span className="text-small text-fg-secondary tabular-nums">
          {formatShortDateTime(createdAt)}
        </span>
      </div>
    </header>
  );
});
