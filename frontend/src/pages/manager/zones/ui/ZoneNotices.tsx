import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { ZONE_FAILURE, type ZoneFailure } from '@/entities/zone';
import { EDIT_TEXTS } from '../config/texts';

type ZoneNoticesProps = {
  failure: ZoneFailure | null;
  isChangedElsewhere: boolean;
  onRefresh: () => void;
  onRetry: () => void;
};

export function ZoneNotices({ failure, isChangedElsewhere, onRefresh, onRetry }: ZoneNoticesProps) {
  if (failure?.kind === ZONE_FAILURE.CHANGED) {
    return (
      <Notice
        variant="warning"
        title={failure.title}
        action={EDIT_TEXTS.REFRESH}
        onAction={onRefresh}
      />
    );
  }

  if (failure?.kind === ZONE_FAILURE.RETRY) {
    return (
      <Notice
        variant="error"
        title={failure.title}
        text={failure.text}
        action={EDIT_TEXTS.RETRY}
        onAction={onRetry}
      />
    );
  }

  if (failure?.kind === ZONE_FAILURE.ALERT) {
    return <InlineAlert variant="error" title={failure.title} />;
  }

  return isChangedElsewhere ? (
    <Notice
      variant="info"
      title={EDIT_TEXTS.CHANGED_ELSEWHERE}
      action={EDIT_TEXTS.REFRESH}
      onAction={onRefresh}
    />
  ) : null;
}

type NoticeProps = {
  variant: 'warning' | 'error' | 'info';
  title: string;
  text?: string;
  action: string;
  onAction: () => void;
};

function Notice({ variant, title, text, action, onAction }: NoticeProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <InlineAlert variant={variant} title={title}>
        {text}
      </InlineAlert>
      <Button variant="secondary" onClick={onAction}>
        {action}
      </Button>
    </div>
  );
}
