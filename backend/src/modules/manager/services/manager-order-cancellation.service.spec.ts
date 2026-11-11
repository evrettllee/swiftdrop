import { type ConflictException, NotFoundException } from '@nestjs/common';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ORDERS_ERROR_MESSAGES } from '@/modules/orders/constants/orders.constants';
import type { CancelOrderService } from '@/modules/orders/services/cancel-order.service';
import type { CancelOrderOutcome } from '@/modules/orders/types/order-cancel.types';
import { cancelOrderSchema } from '../dto/manager-cancellation.dto';
import { ManagerOrderCancellationService } from './manager-order-cancellation.service';

const REQUEST = { managerUserId: 7, orderId: 42, reason: 'Адрес вне зоны доставки' };

function setUp(outcome: CancelOrderOutcome) {
  const cancel = jest.fn().mockResolvedValue(outcome);
  const service = new ManagerOrderCancellationService({ cancel } as unknown as CancelOrderService);

  return { service, cancel };
}

const rejection = async (promise: Promise<unknown>) =>
  (await promise.catch((caught: unknown) => caught)) as ConflictException;

describe('ManagerOrderCancellationService', () => {
  it.each([['refunded'], ['pending'], ['none']] as const)(
    'should cancel as the manager with the reason and give the refund %s',
    async (refund) => {
      const { service, cancel } = setUp({ cancelled: true, refund });

      await expect(service.cancel(REQUEST)).resolves.toEqual({
        orderId: 42,
        status: 'cancelled',
        refund,
      });
      expect(cancel).toHaveBeenCalledWith({ orderId: 42, changedBy: 7, comment: REQUEST.reason });
    },
  );

  it('should answer 404 for a missing order', async () => {
    await expect(setUp({ cancelled: false, status: null }).service.cancel(REQUEST)).rejects.toThrow(
      NotFoundException,
    );
  });

  it.each([
    [ORDER_STATUS.PICKED_UP, ORDERS_ERROR_MESSAGES.CANNOT_CANCEL],
    [ORDER_STATUS.IN_TRANSIT, ORDERS_ERROR_MESSAGES.CANNOT_CANCEL],
    [ORDER_STATUS.DELIVERED, ORDERS_ERROR_MESSAGES.ALREADY_FINISHED],
    [ORDER_STATUS.CANCELLED, ORDERS_ERROR_MESSAGES.ALREADY_FINISHED],
    [ORDER_STATUS.REJECTED, ORDERS_ERROR_MESSAGES.ALREADY_FINISHED],
  ])('should refuse an order in %s with ORDER_NOT_CANCELLABLE', async (status, message) => {
    const error = await rejection(setUp({ cancelled: false, status }).service.cancel(REQUEST));

    expect(error.getResponse()).toEqual({
      statusCode: 409,
      code: 'ORDER_NOT_CANCELLABLE',
      message,
    });
  });
});

describe('cancelOrderSchema', () => {
  it('should take a trimmed reason', () => {
    expect(cancelOrderSchema.parse({ reason: '  Адрес вне зоны  ' })).toEqual({
      reason: 'Адрес вне зоны',
    });
  });

  it.each([
    [undefined],
    [{}],
    [{ reason: '   ' }],
    [{ reason: 'х'.repeat(501) }],
    [{ reason: 'Адрес', refund: false }],
  ])('should refuse %j', (body) => {
    expect(cancelOrderSchema.safeParse(body).success).toBe(false);
  });
});
