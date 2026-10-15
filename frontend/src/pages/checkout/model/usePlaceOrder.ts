import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { clearOrderDraft } from '@/features/order-draft';
import { startPayment } from '@/shared/api';
import { getOrderPath } from '@/shared/routes';
import { createOrder, type CreateOrderInput } from '../api/create-order';

// Places the order, starts the payment and leaves for the payment page; if the payment does not
// start, the client goes to the page of the placed order, where it can be paid again.
// `onPlaced`, given to `placeOrder`, runs once the order is placed, before its draft is cleared.
export function usePlaceOrder() {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  // Set at once when the order starts being placed and kept once it is placed: a second press (a
  // double click, Enter, or a click while the browser is still leaving for the payment) is ignored
  // before any render could mark the button busy. Cleared only when the order was not placed.
  const isPlacing = useRef(false);

  async function placeOrder(input: CreateOrderInput, onPlaced: () => void): Promise<void> {
    isPlacing.current = true;
    let order: Awaited<ReturnType<typeof createOrder>>;

    try {
      order = await createOrder(input);
    } catch (error) {
      // Nothing was placed, so the client may send the form again.
      isPlacing.current = false;
      throw error;
    }

    // The order is placed: the draft is not needed any more, whatever happens with the payment.
    onPlaced();
    clearOrderDraft();

    try {
      const { checkoutUrl } = await startPayment(order.orderId);
      setIsLeaving(true);
      window.location.assign(checkoutUrl);
    } catch {
      void navigate(getOrderPath(order.orderId));
    }
  }

  return { placeOrder, isPlacing, isLeaving };
}
