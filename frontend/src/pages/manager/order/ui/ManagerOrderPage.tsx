import { useParams } from 'react-router';
import { formatOrderNumber } from '@/entities/order';
import { ORDER_ID_PARAM } from '@/shared/routes';
import { PageTitle } from '@/shared/ui/page-title';
import { MANAGER_ORDER_TEXTS } from '../config/texts';

const ORDER_ID_PATTERN = /^[1-9]\d{0,9}$/;

export function ManagerOrderPage() {
  const rawOrderId = useParams()[ORDER_ID_PARAM] ?? '';
  const title = ORDER_ID_PATTERN.test(rawOrderId)
    ? `${MANAGER_ORDER_TEXTS.TITLE} ${formatOrderNumber(Number(rawOrderId))}`
    : MANAGER_ORDER_TEXTS.TITLE;

  return <PageTitle className="tabular-nums">{title}</PageTitle>;
}
