import { FEATURES } from '../../constants/sections';
import { FeatureCard } from './FeatureCard';

const { CHAT } = FEATURES;

// The corner at the side of the author is sharper, as in the chat of the app.
export function ChatCard() {
  return (
    <FeatureCard tone="page" className="lg:col-span-2" title={CHAT.TITLE} text={CHAT.TEXT}>
      <div className="flex flex-col gap-2">
        <p className="self-start rounded-lg rounded-bl-sm border border-border bg-surface px-4 py-2">
          {CHAT.INCOMING}
        </p>
        <p className="self-end rounded-lg rounded-br-sm border border-border bg-selected px-4 py-2">
          {CHAT.OUTGOING}
        </p>
      </div>
    </FeatureCard>
  );
}
