import { useTicket } from '../model/useTicket';
import { TicketPanel } from './TicketPanel';
import { TicketScreen } from './TicketScreen';

type TicketDialogProps = {
  ticketId: number;
  isDesktop: boolean;
  onChanged: () => void;
  onBack: () => void;
};

export function TicketDialog({ ticketId, isDesktop, onChanged, onBack }: TicketDialogProps) {
  const model = useTicket(ticketId, onChanged);

  return isDesktop ? <TicketPanel model={model} /> : <TicketScreen model={model} onBack={onBack} />;
}
