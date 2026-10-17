import { Button } from '@/shared/ui/button';
import type { OrderStep } from '../config/order-steps';

type OrderStepButtonProps = {
  step: OrderStep;
  isPending: boolean;
  onPress: () => void;
};

// The next step of the order; entering the code opens its own screen.
export function OrderStepButton({ step, isPending, onPress }: OrderStepButtonProps) {
  return (
    <Button fullWidth loading={isPending} onClick={onPress}>
      {step.actionLabel}
    </Button>
  );
}
