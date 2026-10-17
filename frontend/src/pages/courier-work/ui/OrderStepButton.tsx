import { Button } from '@/shared/ui/button';
import { ORDER_ACTION, type OrderStep } from '../config/order-steps';

type OrderStepButtonProps = {
  step: OrderStep;
  isPending: boolean;
  onPress: () => void;
};

// The next step of the order. Entering the code comes with its own screen, until then it waits.
export function OrderStepButton({ step, isPending, onPress }: OrderStepButtonProps) {
  return (
    <Button
      fullWidth
      loading={isPending}
      disabled={step.action === ORDER_ACTION.ENTER_CODE}
      onClick={onPress}
    >
      {step.actionLabel}
    </Button>
  );
}
