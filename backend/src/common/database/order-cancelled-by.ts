import { type SQL, sql } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { sqlLiteral } from '@/database/sql-literal';
import { orders, orderStatusHistory } from '@/database/schema';

const CANCELLED = sqlLiteral(ORDER_STATUS.CANCELLED);

export function cancelledByJoin(start: Date, end: Date): SQL {
  return sql`left join (
    select distinct on (last_cancel.order_id) last_cancel.order_id, last_cancel.changed_by
    from ${orderStatusHistory} as last_cancel
    inner join ${orders} as cancelled_order on cancelled_order.order_id = last_cancel.order_id
    where cancelled_order.status = ${CANCELLED}
      and cancelled_order.created_at >= ${start} and cancelled_order.created_at < ${end}
      and last_cancel.status = ${CANCELLED}
    order by last_cancel.order_id, last_cancel.changed_at desc, last_cancel.status_history_id desc
  ) as cancelled on cancelled.order_id = ${orders.orderId}`;
}
